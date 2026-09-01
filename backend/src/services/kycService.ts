import { requireSupabase } from "../config/supabase.js";
import { HttpError } from "../middleware/errorHandler.js";
import { getKYCProvider } from "../providers/kyc/index.js";
import { createNotification } from "./notificationHelper.js";
import { writeAuditLog } from "./auditService.js";
import type { z } from "zod";
import type { submitKycSchema } from "../validators/kycValidator.js";

type SubmitInput = z.infer<typeof submitKycSchema>;

function randomDelayMs(): number {
  return 3000 + Math.floor(Math.random() * 3000);
}

// Fires the async resolution flow without blocking the HTTP response.
// Never awaited by the caller — errors are caught and logged locally.
function scheduleResolution(userId: string, kycId: string, documentNumberHash: string) {
  setTimeout(async () => {
    try {
      const db = requireSupabase();
      await db.from("kyc_verifications").update({ status: "PROCESSING" }).eq("id", kycId);

      const finalStatus = await getKYCProvider().resolve(documentNumberHash);

      if (finalStatus === "VERIFIED") {
        await db
          .from("kyc_verifications")
          .update({ status: "VERIFIED", verified_at: new Date().toISOString() })
          .eq("id", kycId);
        await createNotification(userId, "KYC Verified", "Your identity verification has been approved.", "KYC");
        await writeAuditLog(userId, "KYC_VERIFIED", "kyc_verification", kycId);
      } else {
        await db
          .from("kyc_verifications")
          .update({ status: "FAILED", rejection_reason: "Document could not be verified" })
          .eq("id", kycId);
        await createNotification(
          userId,
          "KYC Verification Failed",
          "We could not verify your identity document. Please try again.",
          "KYC"
        );
        await writeAuditLog(userId, "KYC_FAILED", "kyc_verification", kycId);
      }
    } catch (err) {
      console.error("KYC resolution failed", err);
    }
  }, randomDelayMs());
}

export async function submitKyc(userId: string, input: SubmitInput) {
  const db = requireSupabase();
  const provider = getKYCProvider();

  const { hash } = await provider.submit(input.documentType, input.documentNumber);

  const { data, error } = await db
    .from("kyc_verifications")
    .insert({
      user_id: userId,
      document_type: input.documentType,
      document_number_hash: hash,
      status: "SUBMITTED",
      provider: provider.name,
    })
    .select("*")
    .single();
  if (error) throw new HttpError(500, error.message);

  await writeAuditLog(userId, "KYC_SUBMITTED", "kyc_verification", data.id, { documentType: input.documentType });

  scheduleResolution(userId, data.id, hash);

  return data;
}

export async function getKycStatus(userId: string) {
  const db = requireSupabase();
  const { data, error } = await db
    .from("kyc_verifications")
    .select("*")
    .eq("user_id", userId)
    .order("submitted_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new HttpError(500, error.message);
  return data ?? null;
}

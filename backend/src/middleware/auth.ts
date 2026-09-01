import type { Request, Response, NextFunction } from "express";
import { supabaseAuthClient } from "../config/supabase.js";

export interface AuthedRequest extends Request {
  userId?: string;
  userEmail?: string;
  userRole?: "user" | "admin";
}

// Identity is ALWAYS derived from the verified Supabase JWT — never from a
// user_id in the request body/query, which the client fully controls.
export async function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization ?? "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) return res.status(401).json({ error: "Missing bearer token" });

    if (!supabaseAuthClient) {
      return res.status(503).json({ error: "Auth not configured (Supabase env vars missing)" });
    }

    const { data, error } = await supabaseAuthClient.auth.getUser(token);
    if (error || !data.user) return res.status(401).json({ error: "Invalid or expired session" });

    req.userId = data.user.id;
    req.userEmail = data.user.email ?? undefined;
    next();
  } catch (err) {
    next(err);
  }
}

export async function requireAdmin(req: AuthedRequest, res: Response, next: NextFunction) {
  const { requireSupabase } = await import("../config/supabase.js");
  try {
    const db = requireSupabase();
    const { data } = await db.from("profiles").select("role").eq("id", req.userId).single();
    if (data?.role !== "admin") return res.status(403).json({ error: "Admin access required" });
    req.userRole = "admin";
    next();
  } catch (err) {
    next(err);
  }
}

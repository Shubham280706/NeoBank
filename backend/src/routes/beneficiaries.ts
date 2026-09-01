import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import * as beneficiaryController from "../controllers/beneficiaryController.js";

export const beneficiariesRouter = Router();
beneficiariesRouter.use(requireAuth);
beneficiariesRouter.get("/", beneficiaryController.getBeneficiaries);
beneficiariesRouter.post("/", beneficiaryController.postBeneficiary);
beneficiariesRouter.put("/:id", beneficiaryController.putBeneficiary);
beneficiariesRouter.delete("/:id", beneficiaryController.deleteBeneficiary);

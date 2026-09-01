import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import * as kycController from "../controllers/kycController.js";

export const kycRouter = Router();
kycRouter.use(requireAuth);
kycRouter.post("/submit", kycController.postKycSubmit);
kycRouter.get("/status", kycController.getKycStatus);

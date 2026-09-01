import type { Response, NextFunction } from "express";
import type { AuthedRequest } from "../middleware/auth.js";
import { submitKycSchema } from "../validators/kycValidator.js";
import * as kycService from "../services/kycService.js";

export async function postKycSubmit(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const input = submitKycSchema.parse(req.body);
    res.status(201).json(await kycService.submitKyc(req.userId!, input));
  } catch (err) {
    next(err);
  }
}

export async function getKycStatus(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    res.json(await kycService.getKycStatus(req.userId!));
  } catch (err) {
    next(err);
  }
}

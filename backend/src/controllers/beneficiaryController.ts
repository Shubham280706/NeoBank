import type { Response, NextFunction } from "express";
import type { AuthedRequest } from "../middleware/auth.js";
import { createBeneficiarySchema, updateBeneficiarySchema } from "../validators/beneficiaryValidator.js";
import * as beneficiaryService from "../services/beneficiaryService.js";

export async function getBeneficiaries(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    res.json(await beneficiaryService.listBeneficiaries(req.userId!));
  } catch (err) {
    next(err);
  }
}

export async function postBeneficiary(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const input = createBeneficiarySchema.parse(req.body);
    res.status(201).json(await beneficiaryService.createBeneficiary(req.userId!, input));
  } catch (err) {
    next(err);
  }
}

export async function putBeneficiary(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const input = updateBeneficiarySchema.parse(req.body);
    res.json(await beneficiaryService.updateBeneficiary(req.userId!, String(req.params.id), input));
  } catch (err) {
    next(err);
  }
}

export async function deleteBeneficiary(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    res.json(await beneficiaryService.deleteBeneficiary(req.userId!, String(req.params.id)));
  } catch (err) {
    next(err);
  }
}

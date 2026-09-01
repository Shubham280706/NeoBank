import type { Response, NextFunction } from "express";
import type { AuthedRequest } from "../middleware/auth.js";
import { createTransferSchema } from "../validators/transferValidator.js";
import * as transferService from "../services/transferService.js";

export async function postTransfer(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const input = createTransferSchema.parse(req.body);
    const result = await transferService.createTransfer(req.userId!, input);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

export async function getTransfers(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    res.json(await transferService.listTransfers(req.userId!));
  } catch (err) {
    next(err);
  }
}

export async function getTransferById(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    res.json(await transferService.getTransfer(req.userId!, String(req.params.id)));
  } catch (err) {
    next(err);
  }
}

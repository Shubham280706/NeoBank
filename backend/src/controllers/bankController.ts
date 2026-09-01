import type { Response, NextFunction } from "express";
import type { AuthedRequest } from "../middleware/auth.js";
import { linkBankSchema } from "../validators/bankValidator.js";
import * as bankService from "../services/bankService.js";

export async function postLinkBank(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const input = linkBankSchema.parse(req.body ?? {});
    res.status(201).json(await bankService.linkBank(req.userId!, input));
  } catch (err) {
    next(err);
  }
}

export async function getBanks(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    res.json(await bankService.listLinkedBanks(req.userId!));
  } catch (err) {
    next(err);
  }
}

export async function getBankAccounts(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    res.json(await bankService.getLinkedBankAccounts(req.userId!, String(req.params.id)));
  } catch (err) {
    next(err);
  }
}

export async function getBankTransactions(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    res.json(await bankService.getLinkedBankTransactions(req.userId!, String(req.params.id)));
  } catch (err) {
    next(err);
  }
}

export async function deleteBank(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    res.json(await bankService.unlinkBank(req.userId!, String(req.params.id)));
  } catch (err) {
    next(err);
  }
}

import type { Response, NextFunction } from "express";
import type { AuthedRequest } from "../middleware/auth.js";
import * as accountService from "../services/accountService.js";

export async function getAccounts(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    res.json(await accountService.listAccounts(req.userId!));
  } catch (err) {
    next(err);
  }
}

export async function getAccountById(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    res.json(await accountService.getAccount(req.userId!, String(req.params.id)));
  } catch (err) {
    next(err);
  }
}

export async function getAccountBalance(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    res.json(await accountService.getBalance(req.userId!, String(req.params.id)));
  } catch (err) {
    next(err);
  }
}

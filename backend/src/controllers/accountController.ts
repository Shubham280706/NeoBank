import type { Response, NextFunction } from "express";
import type { AuthedRequest } from "../middleware/auth.js";
import { createAccountSchema, depositSchema } from "../validators/accountValidator.js";
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

export async function postAccount(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const input = createAccountSchema.parse(req.body ?? {});
    res.status(201).json(await accountService.createAccount(req.userId!, input));
  } catch (err) {
    next(err);
  }
}

export async function postDeposit(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const input = depositSchema.parse(req.body);
    res.status(201).json(await accountService.deposit(req.userId!, String(req.params.id), input));
  } catch (err) {
    next(err);
  }
}

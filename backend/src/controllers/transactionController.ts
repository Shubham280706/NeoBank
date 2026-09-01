import type { Response, NextFunction } from "express";
import type { AuthedRequest } from "../middleware/auth.js";
import { listTransactionsQuerySchema } from "../validators/transactionValidator.js";
import * as transactionService from "../services/transactionService.js";

export async function getTransactions(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const query = listTransactionsQuerySchema.parse(req.query);
    res.json(await transactionService.listTransactions(req.userId!, query));
  } catch (err) {
    next(err);
  }
}

export async function getTransactionById(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    res.json(await transactionService.getTransaction(req.userId!, String(req.params.id)));
  } catch (err) {
    next(err);
  }
}

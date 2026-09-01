import type { Response, NextFunction } from "express";
import type { AuthedRequest } from "../middleware/auth.js";
import { createBudgetSchema, updateBudgetSchema } from "../validators/budgetValidator.js";
import * as budgetService from "../services/budgetService.js";

export async function getBudgets(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    res.json(await budgetService.listBudgets(req.userId!));
  } catch (err) {
    next(err);
  }
}

export async function postBudget(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const input = createBudgetSchema.parse(req.body);
    res.status(201).json(await budgetService.createBudget(req.userId!, input));
  } catch (err) {
    next(err);
  }
}

export async function putBudget(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const input = updateBudgetSchema.parse(req.body);
    res.json(await budgetService.updateBudget(req.userId!, String(req.params.id), input));
  } catch (err) {
    next(err);
  }
}

export async function deleteBudget(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    res.json(await budgetService.deleteBudget(req.userId!, String(req.params.id)));
  } catch (err) {
    next(err);
  }
}

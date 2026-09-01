import type { Response, NextFunction } from "express";
import type { AuthedRequest } from "../middleware/auth.js";
import {
  createSavingsGoalSchema,
  updateSavingsGoalSchema,
  contributeSavingsSchema,
} from "../validators/savingsValidator.js";
import * as savingsService from "../services/savingsService.js";

export async function getSavingsGoals(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    res.json(await savingsService.listSavingsGoals(req.userId!));
  } catch (err) {
    next(err);
  }
}

export async function postSavingsGoal(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const input = createSavingsGoalSchema.parse(req.body);
    res.status(201).json(await savingsService.createSavingsGoal(req.userId!, input));
  } catch (err) {
    next(err);
  }
}

export async function putSavingsGoal(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const input = updateSavingsGoalSchema.parse(req.body);
    res.json(await savingsService.updateSavingsGoal(req.userId!, String(req.params.id), input));
  } catch (err) {
    next(err);
  }
}

export async function deleteSavingsGoal(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    res.json(await savingsService.deleteSavingsGoal(req.userId!, String(req.params.id)));
  } catch (err) {
    next(err);
  }
}

export async function postContribute(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const input = contributeSavingsSchema.parse(req.body);
    res.json(await savingsService.contribute(req.userId!, String(req.params.id), input));
  } catch (err) {
    next(err);
  }
}

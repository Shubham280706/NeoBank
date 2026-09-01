import type { Response, NextFunction } from "express";
import type { AuthedRequest } from "../middleware/auth.js";
import { spendingRangeQuerySchema, monthlyQuerySchema } from "../validators/analyticsValidator.js";
import * as analyticsService from "../services/analyticsService.js";

export async function getOverview(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    res.json(await analyticsService.getOverview(req.userId!));
  } catch (err) {
    next(err);
  }
}

export async function getSpending(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const { from, to, groupBy } = spendingRangeQuerySchema.parse(req.query);
    res.json(await analyticsService.getSpending(req.userId!, from, to, groupBy));
  } catch (err) {
    next(err);
  }
}

export async function getCategories(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    res.json(await analyticsService.getCategories(req.userId!));
  } catch (err) {
    next(err);
  }
}

export async function getMonthly(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const { months } = monthlyQuerySchema.parse(req.query);
    res.json(await analyticsService.getMonthly(req.userId!, months));
  } catch (err) {
    next(err);
  }
}

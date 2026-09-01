import type { Response, NextFunction } from "express";
import type { AuthedRequest } from "../middleware/auth.js";
import * as authService from "../services/authService.js";

export async function getMe(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    res.json(await authService.getMe(req.userId!));
  } catch (err) {
    next(err);
  }
}

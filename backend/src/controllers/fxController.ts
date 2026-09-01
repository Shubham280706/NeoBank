import type { Response, NextFunction } from "express";
import type { AuthedRequest } from "../middleware/auth.js";
import { fxRatesQuerySchema, fxConvertQuerySchema } from "../validators/fxValidator.js";
import * as fxService from "../services/fxService.js";

export async function getRates(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const { base } = fxRatesQuerySchema.parse(req.query);
    res.json(await fxService.getRates(base));
  } catch (err) {
    next(err);
  }
}

export async function getConvert(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const { from, to, amount } = fxConvertQuerySchema.parse(req.query);
    res.json(await fxService.convert(from, to, amount));
  } catch (err) {
    next(err);
  }
}

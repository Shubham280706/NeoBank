import type { Response, NextFunction } from "express";
import type { AuthedRequest } from "../middleware/auth.js";
import { createPaymentSchema } from "../validators/paymentValidator.js";
import * as paymentService from "../services/paymentService.js";

export async function postPayment(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const input = createPaymentSchema.parse(req.body);
    res.status(201).json(await paymentService.createPayment(req.userId!, input));
  } catch (err) {
    next(err);
  }
}

export async function getPayment(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    res.json(await paymentService.getPayment(req.userId!, String(req.params.id)));
  } catch (err) {
    next(err);
  }
}

export async function postRefundPayment(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    res.json(await paymentService.refundPayment(req.userId!, String(req.params.id)));
  } catch (err) {
    next(err);
  }
}

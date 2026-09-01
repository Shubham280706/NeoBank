import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import * as paymentController from "../controllers/paymentController.js";

export const paymentsRouter = Router();
paymentsRouter.use(requireAuth);
paymentsRouter.post("/", paymentController.postPayment);
paymentsRouter.get("/:id", paymentController.getPayment);
paymentsRouter.post("/:id/refund", paymentController.postRefundPayment);

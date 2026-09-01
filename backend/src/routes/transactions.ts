import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import * as transactionController from "../controllers/transactionController.js";

export const transactionsRouter = Router();
transactionsRouter.use(requireAuth);
transactionsRouter.get("/", transactionController.getTransactions);
transactionsRouter.get("/:id", transactionController.getTransactionById);
transactionsRouter.patch("/:id/category", transactionController.updateCategory);
transactionsRouter.patch("/:id", transactionController.updateCategory);

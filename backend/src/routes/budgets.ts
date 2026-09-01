import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import * as budgetController from "../controllers/budgetController.js";

export const budgetsRouter = Router();
budgetsRouter.use(requireAuth);
budgetsRouter.get("/", budgetController.getBudgets);
budgetsRouter.post("/", budgetController.postBudget);
budgetsRouter.put("/:id", budgetController.putBudget);
budgetsRouter.delete("/:id", budgetController.deleteBudget);

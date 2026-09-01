import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import * as savingsController from "../controllers/savingsController.js";

export const savingsRouter = Router();
savingsRouter.use(requireAuth);
savingsRouter.get("/", savingsController.getSavingsGoals);
savingsRouter.post("/", savingsController.postSavingsGoal);
savingsRouter.put("/:id", savingsController.putSavingsGoal);
savingsRouter.delete("/:id", savingsController.deleteSavingsGoal);
savingsRouter.post("/:id/contribute", savingsController.postContribute);

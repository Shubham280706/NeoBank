import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import * as analyticsController from "../controllers/analyticsController.js";

export const analyticsRouter = Router();
analyticsRouter.use(requireAuth);
analyticsRouter.get("/overview", analyticsController.getOverview);
analyticsRouter.get("/spending", analyticsController.getSpending);
analyticsRouter.get("/categories", analyticsController.getCategories);
analyticsRouter.get("/monthly", analyticsController.getMonthly);

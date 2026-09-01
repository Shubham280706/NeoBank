import { Router } from "express";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import * as adminController from "../controllers/adminController.js";

export const adminRouter = Router();
adminRouter.use(requireAuth);
adminRouter.use(requireAdmin);
adminRouter.get("/users", adminController.getUsers);
adminRouter.get("/transactions", adminController.getTransactions);
adminRouter.get("/kyc", adminController.getKyc);
adminRouter.get("/analytics", adminController.getAnalytics);
adminRouter.get("/system-health", adminController.getSystemHealth);
adminRouter.get("/audit-logs", adminController.getAuditLogs);

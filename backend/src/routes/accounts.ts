import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import * as accountController from "../controllers/accountController.js";

export const accountsRouter = Router();
accountsRouter.use(requireAuth);
accountsRouter.get("/", accountController.getAccounts);
accountsRouter.get("/:id", accountController.getAccountById);
accountsRouter.get("/:id/balance", accountController.getAccountBalance);

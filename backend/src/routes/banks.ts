import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import * as bankController from "../controllers/bankController.js";

export const banksRouter = Router();
banksRouter.use(requireAuth);
banksRouter.post("/link", bankController.postLinkBank);
banksRouter.get("/", bankController.getBanks);
banksRouter.get("/:id/accounts", bankController.getBankAccounts);
banksRouter.get("/:id/transactions", bankController.getBankTransactions);
banksRouter.delete("/:id", bankController.deleteBank);

import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import * as cardController from "../controllers/cardController.js";

export const cardsRouter = Router();
cardsRouter.use(requireAuth);
cardsRouter.get("/", cardController.getCards);
cardsRouter.post("/", cardController.postCard);
cardsRouter.post("/:id/freeze", cardController.postFreezeCard);
cardsRouter.post("/:id/unfreeze", cardController.postUnfreezeCard);
cardsRouter.put("/:id/limit", cardController.putCardLimit);
cardsRouter.post("/:id/report", cardController.postReportCard);
cardsRouter.get("/:id/transactions", cardController.getCardTransactions);

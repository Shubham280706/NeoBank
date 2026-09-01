import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import * as transferController from "../controllers/transferController.js";

export const transfersRouter = Router();
transfersRouter.use(requireAuth);
transfersRouter.post("/", transferController.postTransfer);
transfersRouter.get("/", transferController.getTransfers);
transfersRouter.get("/:id", transferController.getTransferById);

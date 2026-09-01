import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import * as fxController from "../controllers/fxController.js";

export const fxRouter = Router();
fxRouter.use(requireAuth);
fxRouter.get("/rates", fxController.getRates);
fxRouter.get("/convert", fxController.getConvert);

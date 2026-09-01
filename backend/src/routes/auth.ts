import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import * as authController from "../controllers/authController.js";

export const authRouter = Router();
authRouter.use(requireAuth);
authRouter.get("/me", authController.getMe);

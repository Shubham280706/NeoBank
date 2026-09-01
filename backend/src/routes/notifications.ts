import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import * as notificationController from "../controllers/notificationController.js";

export const notificationsRouter = Router();
notificationsRouter.use(requireAuth);
notificationsRouter.get("/", notificationController.getNotifications);
notificationsRouter.patch("/read-all", notificationController.patchMarkAllRead);
notificationsRouter.patch("/:id/read", notificationController.patchMarkRead);

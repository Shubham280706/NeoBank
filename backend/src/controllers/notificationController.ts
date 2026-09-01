import type { Response, NextFunction } from "express";
import type { AuthedRequest } from "../middleware/auth.js";
import { listNotificationsQuerySchema } from "../validators/notificationValidator.js";
import * as notificationService from "../services/notificationService.js";

export async function getNotifications(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const { page, limit } = listNotificationsQuerySchema.parse(req.query);
    res.json(await notificationService.listNotifications(req.userId!, page, limit));
  } catch (err) {
    next(err);
  }
}

export async function patchMarkRead(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    res.json(await notificationService.markAsRead(req.userId!, String(req.params.id)));
  } catch (err) {
    next(err);
  }
}

export async function patchMarkAllRead(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    res.json(await notificationService.markAllAsRead(req.userId!));
  } catch (err) {
    next(err);
  }
}

import type { Response, NextFunction } from "express";
import type { AuthedRequest } from "../middleware/auth.js";
import { paginationQuerySchema, transactionsQuerySchema, kycQuerySchema } from "../validators/adminValidator.js";
import * as adminService from "../services/adminService.js";

export async function getUsers(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const { page, limit } = paginationQuerySchema.parse(req.query);
    res.json(await adminService.listUsers(page, limit));
  } catch (err) {
    next(err);
  }
}

export async function getTransactions(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const { page, limit, status, type } = transactionsQuerySchema.parse(req.query);
    res.json(await adminService.listTransactions(page, limit, { status, type }));
  } catch (err) {
    next(err);
  }
}

export async function getKyc(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const { page, limit, status } = kycQuerySchema.parse(req.query);
    res.json(await adminService.listKyc(page, limit, status));
  } catch (err) {
    next(err);
  }
}

export async function getAnalytics(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    res.json(await adminService.getPlatformAnalytics());
  } catch (err) {
    next(err);
  }
}

export async function getSystemHealth(_req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    res.json(adminService.getSystemHealth());
  } catch (err) {
    next(err);
  }
}

export async function getAuditLogs(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const { page, limit } = paginationQuerySchema.parse(req.query);
    res.json(await adminService.listAuditLogs(page, limit));
  } catch (err) {
    next(err);
  }
}

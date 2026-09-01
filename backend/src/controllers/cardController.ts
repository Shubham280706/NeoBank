import type { Response, NextFunction } from "express";
import type { AuthedRequest } from "../middleware/auth.js";
import { createCardSchema, updateCardLimitSchema } from "../validators/cardValidator.js";
import * as cardService from "../services/cardService.js";

export async function getCards(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    res.json(await cardService.listCards(req.userId!));
  } catch (err) {
    next(err);
  }
}

export async function postCard(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const input = createCardSchema.parse(req.body ?? {});
    res.status(201).json(await cardService.createCard(req.userId!, input));
  } catch (err) {
    next(err);
  }
}

export async function postFreezeCard(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    res.json(await cardService.freezeCard(req.userId!, String(req.params.id)));
  } catch (err) {
    next(err);
  }
}

export async function postUnfreezeCard(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    res.json(await cardService.unfreezeCard(req.userId!, String(req.params.id)));
  } catch (err) {
    next(err);
  }
}

export async function putCardLimit(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const input = updateCardLimitSchema.parse(req.body);
    res.json(await cardService.updateCardLimit(req.userId!, String(req.params.id), input));
  } catch (err) {
    next(err);
  }
}

export async function postReportCard(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    res.json(await cardService.reportCard(req.userId!, String(req.params.id)));
  } catch (err) {
    next(err);
  }
}

export async function getCardTransactions(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    res.json(await cardService.listCardTransactions(req.userId!, String(req.params.id)));
  } catch (err) {
    next(err);
  }
}

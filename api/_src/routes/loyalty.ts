import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth";
import { LoyaltyPoint } from "../models/LoyaltyPoint";
import { LoyaltyRedemption } from "../models/LoyaltyRedemption";
import { LoyaltyTier } from "../models/LoyaltyTier";
import { ok, badRequest } from "../lib/response";

const POINT_VALUE = 0.5;

export const loyaltyRoutes = Router();

async function getUserTier(balance: number) {
  const tiers = await LoyaltyTier.find({ isActive: true }).sort({ minPoints: -1 });
  const current = tiers.find((t) => balance >= t.minPoints) || tiers[tiers.length - 1];
  const nextTier = tiers.filter((t) => t.minPoints > balance).sort((a, b) => a.minPoints - b.minPoints)[0] || null;
  const progress = nextTier
    ? Math.round(((balance - (current?.minPoints ?? 0)) / (nextTier.minPoints - (current?.minPoints ?? 0))) * 100)
    : 100;
  return { current, nextTier, progress };
}

loyaltyRoutes.get("/mine", requireAuth, async (req, res) => {
  try {
    const [ledger, redemptions] = await Promise.all([
      LoyaltyPoint.find({ userId: req.userId }).sort({ createdAt: -1 }).limit(50),
      LoyaltyRedemption.find({ userId: req.userId }).sort({ createdAt: -1 }).limit(50),
    ]);

    const earned = ledger.reduce((s, e) => s + e.points, 0);
    const spent = redemptions.reduce((s, r) => s + r.points, 0);
    const balance = earned - spent;
    const tier = await getUserTier(balance);

    return ok(res, {
      balance,
      ledger,
      redemptions,
      point_value: POINT_VALUE,
      current_tier: tier.current,
      next_tier: tier.nextTier,
      progress_pct: tier.progress,
    });
  } catch (err: any) {
    return badRequest(res, [], err.message);
  }
});

loyaltyRoutes.post("/redeem", requireAuth, async (req, res) => {
  try {
    const { points } = z.object({ points: z.number().int().positive().max(100000) }).parse(req.body);

    const [earnedResult, spentResult] = await Promise.all([
      LoyaltyPoint.aggregate([{ $match: { userId: req.userId } }, { $group: { _id: null, total: { $sum: "$points" } } }]),
      LoyaltyRedemption.aggregate([{ $match: { userId: req.userId } }, { $group: { _id: null, total: { $sum: "$points" } } }]),
    ]);

    const earned = earnedResult[0]?.total ?? 0;
    const spent = spentResult[0]?.total ?? 0;
    const balance = earned - spent;

    if (points > balance) return badRequest(res, [], "Insufficient points");

    return ok(res, { value: +(points * POINT_VALUE).toFixed(2) }, "Ok");
  } catch (err: any) {
    if (err instanceof z.ZodError) return badRequest(res, err.errors, "Validation error");
    return badRequest(res, [], err.message);
  }
});

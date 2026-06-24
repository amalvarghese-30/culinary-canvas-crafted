import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth";
import { requireStaff } from "../middleware/staff";
import { Promotion } from "../models/Promotion";
import { AuditLog } from "../models/AuditLog";

export const promoRoutes = Router();

promoRoutes.post("/validate", async (req, res) => {
  try {
    const body = z.object({
      code: z.string().trim().min(1).max(50),
      subtotal: z.number().nonnegative(),
    }).parse(req.body);

    const code = body.code.toUpperCase();
    const promo = await Promotion.findOne({ code });

    if (!promo || !promo.isActive) return res.json({ ok: false, reason: "Invalid code" });
    const now = new Date();
    if (promo.startsAt && promo.startsAt > now) return res.json({ ok: false, reason: "Not started" });
    if (promo.endsAt && promo.endsAt < now) return res.json({ ok: false, reason: "Expired" });
    if (promo.maxUses && promo.usedCount >= promo.maxUses) return res.json({ ok: false, reason: "Limit reached" });
    if (body.subtotal < Number(promo.minOrderValue)) return res.json({ ok: false, reason: `Min order ₹${promo.minOrderValue}` });

    const discount =
      promo.discountType === "percentage"
        ? +((body.subtotal * Number(promo.discountValue)) / 100).toFixed(2)
        : Number(promo.discountValue);

    return res.json({
      ok: true,
      code: promo.code,
      description: promo.description,
      discount: Math.min(discount, body.subtotal),
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors });
    return res.status(500).json({ error: err.message });
  }
});

promoRoutes.get("/", requireAuth, requireStaff, async (_req, res) => {
  try {
    const data = await Promotion.find().sort({ createdAt: -1 });
    return res.json(data);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

promoRoutes.post("/", requireAuth, requireStaff, async (req, res) => {
  try {
    const body = z.object({
      code: z.string().trim().min(2).max(50).transform((s) => s.toUpperCase()),
      description: z.string().max(200).default(""),
      discount_type: z.enum(["percent", "flat"]),
      discount_value: z.number().positive().max(100000),
      min_order: z.number().nonnegative().max(100000).default(0),
      max_uses: z.number().int().positive().nullable().optional(),
      active: z.boolean().default(true),
      ends_at: z.string().nullable().optional(),
    }).parse(req.body);

    await Promotion.create({
      code: body.code,
      description: body.description,
      discountType: body.discount_type === "percent" ? "percentage" : "fixed",
      discountValue: body.discount_value,
      minOrderValue: body.min_order,
      maxUses: body.max_uses ?? undefined,
      isActive: body.active,
      endsAt: body.ends_at ? new Date(body.ends_at) : undefined,
    });

    await AuditLog.create({
      userId: req.userId,
      action: "promo.create",
      entity: "promotions",
      details: { code: body.code },
    });
    return res.json({ ok: true });
  } catch (err: any) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors });
    return res.status(500).json({ error: err.message });
  }
});

promoRoutes.put("/:id", requireAuth, requireStaff, async (req, res) => {
  try {
    const { id } = req.params;
    const body = z.object({
      code: z.string().trim().min(2).max(50).transform((s) => s.toUpperCase()),
      description: z.string().max(200).default(""),
      discount_type: z.enum(["percent", "flat"]),
      discount_value: z.number().positive().max(100000),
      min_order: z.number().nonnegative().max(100000).default(0),
      max_uses: z.number().int().positive().nullable().optional(),
      active: z.boolean().default(true),
      ends_at: z.string().nullable().optional(),
    }).parse(req.body);

    await Promotion.findByIdAndUpdate(id, {
      code: body.code,
      description: body.description,
      discountType: body.discount_type === "percent" ? "percentage" : "fixed",
      discountValue: body.discount_value,
      minOrderValue: body.min_order,
      maxUses: body.max_uses ?? undefined,
      isActive: body.active,
      endsAt: body.ends_at ? new Date(body.ends_at) : undefined,
    });

    await AuditLog.create({
      userId: req.userId,
      action: "promo.update",
      entity: "promotions",
      entityId: id,
      details: { code: body.code },
    });
    return res.json({ ok: true });
  } catch (err: any) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors });
    return res.status(500).json({ error: err.message });
  }
});

promoRoutes.delete("/:id", requireAuth, requireStaff, async (req, res) => {
  try {
    const { id } = req.params;
    await Promotion.findByIdAndDelete(id);
    await AuditLog.create({
      userId: req.userId,
      action: "promo.delete",
      entity: "promotions",
      entityId: id,
    });
    return res.json({ ok: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

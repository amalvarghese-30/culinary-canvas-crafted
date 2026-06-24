import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth";
import { requireStaff } from "../middleware/staff";
import { Notification } from "../models/Notification";
import { AuditLog } from "../models/AuditLog";
import { ok, badRequest, forbidden } from "../lib/response";

export const notificationRoutes = Router();

notificationRoutes.get("/", requireAuth, async (req, res) => {
  try {
    const data = await Notification.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .limit(30);
    return ok(res, data);
  } catch (err: any) {
    return badRequest(res, [], err.message);
  }
});

notificationRoutes.get("/system", requireAuth, requireStaff, async (_req, res) => {
  try {
    const data = await Notification.find({ userId: { $exists: false } })
      .sort({ createdAt: -1 })
      .limit(50);
    return ok(res, data);
  } catch (err: any) {
    return badRequest(res, [], err.message);
  }
});

notificationRoutes.patch("/:id/read", requireAuth, async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
    return ok(res, null, "Marked as read");
  } catch (err: any) {
    return badRequest(res, [], err.message);
  }
});

notificationRoutes.post("/read-all", requireAuth, async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.userId, isRead: false },
      { isRead: true }
    );
    return ok(res, null, "All marked as read");
  } catch (err: any) {
    return badRequest(res, [], err.message);
  }
});

notificationRoutes.post("/broadcast", requireAuth, async (req, res) => {
  try {
    const body = z.object({
      audience: z.enum(["all", "staff", "admin"]),
      title: z.string().min(1).max(120),
      body: z.string().max(500).default(""),
      link: z.string().max(300).optional().nullable(),
      kind: z.string().max(30).default("info"),
    }).parse(req.body);

    if (!req.userRoles.includes("admin")) return forbidden(res, "Forbidden");

    await Notification.create({
      title: body.title,
      body: body.body,
      type: "system",
      metadata: { audience: body.audience, link: body.link, kind: body.kind },
    });

    await AuditLog.create({
      userId: req.userId,
      action: "notification.broadcast",
      entity: "notifications",
      details: { audience: body.audience, title: body.title },
    });
    return ok(res, null, "Broadcast sent");
  } catch (err: any) {
    if (err instanceof z.ZodError) return badRequest(res, err.errors, "Validation error");
    return badRequest(res, [], err.message);
  }
});

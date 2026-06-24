import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { requireAdmin } from "../middleware/staff";
import { AuditLog } from "../models/AuditLog";

export const auditRoutes = Router();

auditRoutes.get("/", requireAuth, requireAdmin, async (req, res) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit || 100), 1), 500);
    const data = await AuditLog.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate("userId", "fullName email");
    return res.json(data);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

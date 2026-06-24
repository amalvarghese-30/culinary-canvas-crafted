import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth";
import { Shift } from "../models/Shift";

export const shiftRoutes = Router();

shiftRoutes.get("/active", requireAuth, async (req, res) => {
  try {
    const data = await Shift.findOne({ userId: req.userId, endTime: null })
      .sort({ startTime: -1 });
    return res.json(data);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

shiftRoutes.post("/in", requireAuth, async (req, res) => {
  try {
    const open = await Shift.findOne({ userId: req.userId, endTime: null });
    if (open) return res.json({ ok: true, id: open._id });
    const data = await Shift.create({ userId: req.userId, startTime: new Date() });
    return res.json({ ok: true, id: data._id });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

shiftRoutes.post("/out", requireAuth, async (req, res) => {
  try {
    const body = z.object({ notes: z.string().max(500).optional() }).parse(req.body || {});
    await Shift.updateOne(
      { userId: req.userId, endTime: null },
      { endTime: new Date(), notes: body.notes ?? undefined }
    );
    return res.json({ ok: true });
  } catch (err: any) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors });
    return res.status(500).json({ error: err.message });
  }
});

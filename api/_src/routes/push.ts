import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth";
import { PushSubscription } from "../models/PushSubscription";

export const pushRoutes = Router();

pushRoutes.post("/subscribe", requireAuth, async (req, res) => {
  try {
    const body = z.object({
      endpoint: z.string().url(),
      p256dh: z.string().min(1),
      auth: z.string().min(1),
    }).parse(req.body);

    await PushSubscription.findOneAndUpdate(
      { userId: req.userId, endpoint: body.endpoint },
      { userId: req.userId, endpoint: body.endpoint, keys: { p256dh: body.p256dh, auth: body.auth } },
      { upsert: true, new: true }
    );
    return res.json({ ok: true });
  } catch (err: any) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors });
    return res.status(500).json({ error: err.message });
  }
});

pushRoutes.delete("/unsubscribe", requireAuth, async (req, res) => {
  try {
    const { endpoint } = z.object({ endpoint: z.string().url() }).parse(req.body);
    await PushSubscription.deleteOne({ userId: req.userId, endpoint });
    return res.json({ ok: true });
  } catch (err: any) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors });
    return res.status(500).json({ error: err.message });
  }
});

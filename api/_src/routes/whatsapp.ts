import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth";
import { requireStaff } from "../middleware/staff";

export const whatsappRoutes = Router();

whatsappRoutes.post("/send", requireAuth, requireStaff, async (req, res) => {
  try {
    const body = z.object({
      to: z.string().min(7).max(20),
      body: z.string().min(1).max(1500),
    }).parse(req.body);

    const twilioKey = process.env.TWILIO_API_KEY;
    const lovableKey = process.env.LOVABLE_API_KEY;
    const from = process.env.TWILIO_FROM;
    if (!twilioKey || !lovableKey || !from) return res.json({ ok: false, reason: "not_configured" });

    const twilioRes = await fetch("https://connector-gateway.lovable.dev/twilio/Messages.json", {
      method: "POST",
      headers: { Authorization: `Bearer ${lovableKey}`, "X-Connection-Api-Key": twilioKey, "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ To: `whatsapp:${body.to.startsWith("+") ? body.to : "+" + body.to}`, From: from, Body: body.body }),
    });

    if (!twilioRes.ok) {
      const text = await twilioRes.text().catch(() => "");
      return res.json({ ok: false, reason: `twilio_${twilioRes.status}`, detail: text.slice(0, 200) });
    }
    const j = await twilioRes.json();
    return res.json({ ok: true, sid: j?.sid });
  } catch (err: any) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors });
    return res.status(500).json({ error: err.message });
  }
});

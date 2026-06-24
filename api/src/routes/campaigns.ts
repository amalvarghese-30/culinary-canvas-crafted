import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth";
import { requireStaff } from "../middleware/staff";
import { Campaign } from "../models/Campaign";
import { Notification } from "../models/Notification";
import { User } from "../models/User";
import { Order } from "../models/Order";

const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

export const campaignRoutes = Router();

campaignRoutes.get("/", requireAuth, requireStaff, async (_req, res) => {
  try {
    const data = await Campaign.find().sort({ createdAt: -1 });
    return res.json(data);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

campaignRoutes.post("/", requireAuth, requireStaff, async (req, res) => {
  try {
    const body = z.object({
      id: z.string().optional(),
      name: z.string().min(1).max(80),
      channel: z.enum(["whatsapp", "email", "sms", "inapp"]),
      audience: z.enum(["all", "vip", "lapsed", "new"]),
      subject: z.string().max(200).nullable().optional(),
      body: z.string().min(1).max(2000),
    }).parse(req.body);

    const payload = { name: body.name, type: body.channel as any, audience: { segment: body.audience }, message: body.body };
    let row;
    if (body.id) {
      row = await Campaign.findByIdAndUpdate(body.id, payload, { new: true });
    } else {
      row = await Campaign.create(payload);
    }
    return res.json({ id: row?._id });
  } catch (err: any) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors });
    return res.status(500).json({ error: err.message });
  }
});

campaignRoutes.put("/:id", requireAuth, requireStaff, async (req, res) => {
  try {
    const body = z.object({
      name: z.string().min(1).max(80),
      channel: z.enum(["whatsapp", "email", "sms", "inapp"]),
      audience: z.enum(["all", "vip", "lapsed", "new"]),
      subject: z.string().max(200).nullable().optional(),
      body: z.string().min(1).max(2000),
    }).parse(req.body);

    await Campaign.findByIdAndUpdate(req.params.id, {
      name: body.name,
      type: body.channel as any,
      audience: { segment: body.audience },
      message: body.body,
    });
    return res.json({ ok: true });
  } catch (err: any) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors });
    return res.status(500).json({ error: err.message });
  }
});

campaignRoutes.delete("/:id", requireAuth, requireStaff, async (req, res) => {
  try {
    await Campaign.findByIdAndDelete(req.params.id);
    return res.json({ ok: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

campaignRoutes.post("/generate", requireAuth, requireStaff, async (req, res) => {
  try {
    const body = z.object({
      goal: z.string().min(3).max(300),
      channel: z.enum(["whatsapp", "email", "sms", "inapp"]),
      audience: z.string().max(40),
    }).parse(req.body);

    const key = process.env.LOVABLE_API_KEY;
    if (!key) return res.status(500).json({ error: "AI not configured" });

    const aiRes = await fetch(GATEWAY, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You write short, warm marketing copy for an Indian momo restaurant. Match channel tone (WhatsApp = casual + 1 emoji, email = polished, SMS = under 140 chars, inapp = punchy CTA)." },
          { role: "user", content: `Goal: ${body.goal}\nChannel: ${body.channel}\nAudience: ${body.audience}\nReturn just the message body, no preamble. Avoid placeholder brackets.` },
        ],
        temperature: 0.8,
      }),
    });
    if (!aiRes.ok) return res.status(500).json({ error: `AI error ${aiRes.status}` });
    const j = await aiRes.json();
    return res.json({ body: (j?.choices?.[0]?.message?.content ?? "").trim() });
  } catch (err: any) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors });
    return res.status(500).json({ error: err.message });
  }
});

campaignRoutes.post("/:id/send", requireAuth, requireStaff, async (req, res) => {
  try {
    const camp = await Campaign.findById(req.params.id);
    if (!camp) return res.status(404).json({ error: "Campaign not found" });

    const users = await User.find({ phone: { $ne: null } }, "fullName phone email").limit(500);
    let recipients: any[] = users;

    const audienceSegment = (camp.audience as any)?.segment;

    if (audienceSegment === "vip" || audienceSegment === "lapsed" || audienceSegment === "new") {
      const orders = await Order.find({ status: { $ne: "cancelled" } }, "userId total createdAt");
      const stats = new Map<string, { spend: number; last: string; count: number }>();
      for (const o of orders) {
        const uid = o.userId?.toString();
        if (!uid) continue;
        const cur = stats.get(uid) ?? { spend: 0, last: o.createdAt.toISOString(), count: 0 };
        cur.spend += Number(o.total);
        cur.count += 1;
        if (new Date(o.createdAt) > new Date(cur.last)) cur.last = o.createdAt.toISOString();
        stats.set(uid, cur);
      }
      const now = Date.now();
      recipients = users.filter((p: any) => {
        const s = stats.get(p._id.toString());
        if (audienceSegment === "vip") return s && s.spend >= 2000;
        if (audienceSegment === "new") return s && s.count <= 1;
        if (audienceSegment === "lapsed") return s && (now - new Date(s.last).getTime()) / 86400000 > 30;
        return true;
      });
    }

    const channel = camp.type;
    let sent = 0;

    if (channel === "whatsapp" || channel === "sms") {
      const twilioKey = process.env.TWILIO_API_KEY;
      const lovableKey = process.env.LOVABLE_API_KEY;
      const from = process.env.TWILIO_FROM;
      if (twilioKey && lovableKey && from) {
        const prefix = channel === "whatsapp" ? "whatsapp:" : "";
        for (const p of recipients) {
          if (!p.phone) continue;
          try {
            const resp = await fetch("https://connector-gateway.lovable.dev/twilio/Messages.json", {
              method: "POST",
              headers: { Authorization: `Bearer ${lovableKey}`, "X-Connection-Api-Key": twilioKey, "Content-Type": "application/x-www-form-urlencoded" },
              body: new URLSearchParams({ To: prefix + p.phone, From: from, Body: camp.message }),
            });
            if (resp.ok) sent += 1;
          } catch { /* keep going */ }
        }
      }
    } else if (channel === "email") {
      const resendKey = process.env.RESEND_API_KEY;
      const lovableKey = process.env.LOVABLE_API_KEY;
      const from = process.env.RESEND_FROM || "Mōmo House <onboarding@resend.dev>";
      if (resendKey && lovableKey) {
        for (const p of recipients) {
          if (!p.email) continue;
          try {
            const resp = await fetch("https://connector-gateway.lovable.dev/resend/emails", {
              method: "POST",
              headers: { Authorization: `Bearer ${lovableKey}`, "X-Connection-Api-Key": resendKey, "Content-Type": "application/json" },
              body: JSON.stringify({ from, to: [p.email], subject: camp.name, html: `<div style="font-family:system-ui;line-height:1.6">${camp.message.replace(/\n/g, "<br/>")}</div>` }),
            });
            if (resp.ok) sent += 1;
          } catch { /* keep going */ }
        }
      }
    } else if (channel === "inapp") {
      const rows = recipients.map((p: any) => ({
        userId: p._id,
        title: camp.name,
        body: camp.message,
        type: "promo",
      }));
      if (rows.length > 0) {
        await Notification.insertMany(rows);
        sent = rows.length;
      }
    }

    await Campaign.findByIdAndUpdate(camp._id, { sentAt: new Date(), sentCount: sent });
    return res.json({ ok: true, sent, attempted: recipients.length });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

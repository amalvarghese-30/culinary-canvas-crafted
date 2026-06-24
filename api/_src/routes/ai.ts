import { Router } from "express";
import { z } from "zod";
import { MenuItem } from "../models/MenuItem";

const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-2.5-flash";

export const aiRoutes = Router();

aiRoutes.post("/recommend", async (req, res) => {
  try {
    const body = z.object({
      cart: z.array(z.string()).max(20).default([]),
      recentItem: z.string().optional(),
    }).parse(req.body);

    const items = await MenuItem.find({ isAvailable: true }, "name style variant description price spice badges").limit(60);
    if (!items.length) return res.json({ picks: [] as { id: string; reason: string }[] });

    const catalog = items.map((m) => ({
      id: m._id.toString(),
      label: `${m.get("style") ?? m.name} ${m.get("variant") ?? ""}`,
      desc: m.description?.slice(0, 80) ?? "",
      spice: m.get("spice"),
      tags: m.get("badges") ?? [],
    }));

    const key = process.env.LOVABLE_API_KEY;
    if (!key) return res.json({ picks: [] as { id: string; reason: string }[] });

    const aiRes = await fetch(GATEWAY, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: `You are the head chef at Mōmo House recommending dishes. Given the user's current cart and recently viewed item, pick 3 items from the catalog that pair well or expand the meal. Avoid duplicates of cart items. Reply with strict JSON: {"picks":[{"id":"<menu_item_id>","reason":"<one short sentence, <80 chars>"}]}.` },
          { role: "user", content: JSON.stringify({ cart: body.cart, recentItem: body.recentItem ?? null, catalog }) },
        ],
        temperature: 0.5,
        response_format: { type: "json_object" },
      }),
    });
    const j = await aiRes.json();
    const content = (j?.choices?.[0]?.message?.content ?? "{}") as string;
    const parsed = JSON.parse(content) as { picks?: { id: string; reason: string }[] };
    const validIds = new Set(items.map((i) => i._id.toString()));
    const picks = (parsed.picks ?? []).filter((p) => p && validIds.has(p.id)).slice(0, 3);
    return res.json({ picks });
  } catch {
    return res.json({ picks: [] as { id: string; reason: string }[] });
  }
});

aiRoutes.post("/chat", async (req, res) => {
  try {
    const body = z.object({
      messages: z.array(z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(2000),
      })).min(1).max(20),
    }).parse(req.body);

    const key = process.env.LOVABLE_API_KEY;
    const items = await MenuItem.find(
      { isAvailable: true },
      "name style variant price spice description badges"
    ).limit(80);

    const menuSummary = items.map((m) =>
      `- ${m.get("style") ?? m.name} ${m.get("variant") ?? ""} (₹${m.price}, spice ${m.get("spice") ?? "?"}/5)`
    ).join("\n");

    const sys = `You are Momo, the friendly concierge for Mōmo House restaurant. Help guests choose dishes, explain styles, suggest pairings, and answer questions about hours, delivery, and reservations.

Restaurant info:
- Address: 12 Lake Road, Khan Market, New Delhi
- Hours: Daily 11:00 AM – 11:30 PM
- Delivery in Delhi NCR (free over ₹500), pickup available
- 12 momo styles × 3 fillings (Veg, Paneer, Chicken)

Live menu:
${menuSummary}

Keep replies under 80 words, warm and concise. Use bullet points only when listing items. Never make up items not on the menu. Encourage the user to add items to cart or open /menu and /reservation when relevant.`;

    if (!key) return res.json({ reply: "AI assistant is not configured. Please set up your Lovable API key." });

    const aiRes = await fetch(GATEWAY, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: "system", content: sys }, ...body.messages.map((m) => ({ role: m.role, content: m.content }))],
        temperature: 0.7,
      }),
    });
    if (!aiRes.ok) return res.json({ reply: "Sorry, I'm having trouble connecting. Please try again." });
    const j = await aiRes.json();
    return res.json({ reply: (j?.choices?.[0]?.message?.content ?? "").trim() });
  } catch (err: any) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors });
    return res.status(500).json({ error: err.message });
  }
});

import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth";
import { requireStaff } from "../middleware/staff";
import { Order } from "../models/Order";
import { MenuItem } from "../models/MenuItem";
import { InventoryItem } from "../models/InventoryItem";

export const businessAiRoutes = Router();

businessAiRoutes.post("/ask", requireAuth, requireStaff, async (req, res) => {
  try {
    const { question } = z.object({ question: z.string().min(3).max(500) }).parse(req.body);

    const since = new Date();
    since.setDate(since.getDate() - 30);

    const [orders, items, inv] = await Promise.all([
      Order.find({ createdAt: { $gte: since } }, "total status createdAt items"),
      MenuItem.find({}, "name style variant price isAvailable"),
      InventoryItem.find({}, "name quantity unit minQuantity"),
    ]);

    const revenue = orders.filter((o) => o.status !== "cancelled").reduce((s, o) => s + Number(o.total ?? 0), 0);
    const orderCount = orders.length;
    const itemCounts = new Map<string, number>();
    for (const o of orders) {
      for (const li of o.items) {
        itemCounts.set(li.name, (itemCounts.get(li.name) ?? 0) + li.quantity);
      }
    }
    const topItems = Array.from(itemCounts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([n, q]) => `${n}: ${q} sold`);
    const lowStock = inv.filter((i) => i.quantity <= i.minQuantity).map((i) => `${i.name} (${i.quantity} ${i.unit})`);

    const ctx = `Last 30 days:\nRevenue: ₹${revenue.toFixed(0)}\nOrders: ${orderCount}\nTop items: ${topItems.join(", ") || "n/a"}\nLow stock: ${lowStock.join(", ") || "none"}\nMenu size: ${items.length}`;

    const key = process.env.LOVABLE_API_KEY;
    if (!key) return res.json({ reply: "AI not configured" });

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        temperature: 0.4,
        messages: [
          { role: "system", content: `You are the AI business analyst for Mōmo House restaurant. Use ONLY the provided data to answer. Be concise (<120 words), actionable, and use bullets when helpful. If asked about something not in the data, say what you'd need.\n\n${ctx}` },
          { role: "user", content: question },
        ],
      }),
    });
    if (aiRes.status === 429) return res.json({ reply: "AI is busy, retry in a moment" });
    if (aiRes.status === 402) return res.json({ reply: "AI credits exhausted" });
    if (!aiRes.ok) return res.json({ reply: `AI error ${aiRes.status}` });
    const json = await aiRes.json();
    return res.json({ reply: (json?.choices?.[0]?.message?.content ?? "").trim() });
  } catch (err: any) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors });
    return res.status(500).json({ error: err.message });
  }
});

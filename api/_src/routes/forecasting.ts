import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { requireStaff } from "../middleware/staff";
import { Order } from "../models/Order";
import { InventoryItem } from "../models/InventoryItem";

const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-2.5-flash";

export const forecastRoutes = Router();

forecastRoutes.post("/demand", requireAuth, requireStaff, async (req, res) => {
  try {
    const since = new Date();
    since.setDate(since.getDate() - 30);

    const orders = await Order.find(
      { createdAt: { $gte: since }, status: { $ne: "cancelled" } },
      "createdAt total items"
    );

    const byDay = new Map<string, { date: string; revenue: number; orders: number }>();
    const itemCounts = new Map<string, number>();
    for (const o of orders) {
      const d = o.createdAt.toISOString().slice(0, 10);
      const row = byDay.get(d) ?? { date: d, revenue: 0, orders: 0 };
      row.revenue += Number(o.total);
      row.orders += 1;
      byDay.set(d, row);
      for (const it of o.items) {
        itemCounts.set(it.name, (itemCounts.get(it.name) ?? 0) + it.quantity);
      }
    }
    const series = Array.from(byDay.values()).sort((a, b) => a.date.localeCompare(b.date));
    const topItems = Array.from(itemCounts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 10);

    const inv = await InventoryItem.find({}, "name quantity minQuantity unit");

    const key = process.env.LOVABLE_API_KEY;
    if (!key) return res.json({ series, topItems, inventory: inv, ai: "AI not configured" });

    const prompt = `You are a restaurant operations analyst. Based on these last-30-day metrics for a momo restaurant in India, predict the next 7 days of demand and flag inventory risks.

Daily series (date, revenue ₹, orders):
${series.map((s) => `${s.date}: ₹${s.revenue.toFixed(0)} / ${s.orders} orders`).join("\n")}

Top items sold (name, qty):
${topItems.map(([n, q]) => `${n}: ${q}`).join("\n")}

Current inventory (name, stock, low-at, unit):
${inv.map((i) => `${i.name}: ${i.quantity} (low @ ${i.minQuantity} ${i.unit})`).join("\n")}

Respond with concise markdown:
- **7-day forecast**: Expected revenue range + order volume.
- **Demand drivers**: Day-of-week / item trends you spotted.
- **Reorder now**: List inventory items at risk in the next 7 days.
- **Recommendations**: 3 short actions.`;

    const aiRes = await fetch(GATEWAY, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: "You are a sharp restaurant analyst. Be concrete and brief." },
          { role: "user", content: prompt },
        ],
        temperature: 0.4,
      }),
    });
    if (!aiRes.ok) return res.json({ series, topItems, inventory: inv, ai: `AI error ${aiRes.status}` });
    const j = await aiRes.json();
    return res.json({ series, topItems, inventory: inv, ai: j?.choices?.[0]?.message?.content ?? "" });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

import { Router } from "express";
import { z } from "zod";
import { Order } from "../models/Order";
import { Counter } from "../models/Counter";
import { PlatformOrder } from "../models/PlatformOrder";
import { requireAuth } from "../middleware/auth";
import { requireStaff } from "../middleware/staff";
import { ok, created, badRequest, notFound, conflict } from "../lib/response";

export const integrationRoutes = Router();

async function getNextOrderNumber(): Promise<number> {
  const counter = await Counter.findOneAndUpdate(
    { name: "orderNumber" },
    { $inc: { seq: 1 } },
    { upsert: true, new: true }
  );
  return counter.seq;
}

// Swiggy webhook receiver
integrationRoutes.post("/swiggy/orders", async (req, res) => {
  try {
    const payload = req.body;
    const externalId = payload.order_id || payload.orderId;
    if (!externalId) return badRequest(res, [], "Missing order_id");

    const existing = await PlatformOrder.findOne({ platform: "swiggy", externalOrderId: externalId });
    if (existing) return conflict(res, "Order already received");

    const items = (payload.items || []).map((item: any) => ({
      menuItemId: null as any,
      name: item.name || "Swiggy item",
      price: Number(item.price) || 0,
      quantity: Number(item.quantity) || 1,
    }));

    const subtotal = items.reduce((s: number, i: any) => s + i.price * i.quantity, 0);
    const orderNumber = await getNextOrderNumber();

    const order = await Order.create({
      orderNumber,
      items,
      subtotal,
      tax: Number(payload.tax) || +(subtotal * 0.05).toFixed(2),
      discount: Number(payload.discount) || 0,
      total: Number(payload.order_total || payload.total) || subtotal,
      status: "confirmed",
      type: "delivery",
      paymentMethod: "online",
      paymentStatus: "paid",
      customerName: payload.customer?.name || "Swiggy Customer",
      customerPhone: payload.customer?.phone || "",
      deliveryAddress: payload.delivery_address || payload.customer?.address || "",
      source: "swiggy",
    });

    await PlatformOrder.create({
      platform: "swiggy",
      externalOrderId: externalId,
      internalOrderId: order._id,
      rawPayload: payload,
      status: "received",
    });

    return created(res, { order_id: order._id, order_number: orderNumber, status: "acknowledged" }, "Order received");
  } catch (err: any) {
    return badRequest(res, [], err.message);
  }
});

// Zomato webhook receiver
integrationRoutes.post("/zomato/orders", async (req, res) => {
  try {
    const payload = req.body;
    const externalId = payload.order_id || payload.orderId;
    if (!externalId) return badRequest(res, [], "Missing order_id");

    const existing = await PlatformOrder.findOne({ platform: "zomato", externalOrderId: externalId });
    if (existing) return conflict(res, "Order already received");

    const items = (payload.items || payload.order_items || []).map((item: any) => ({
      menuItemId: null as any,
      name: item.name || item.dish_name || "Zomato item",
      price: Number(item.price) || 0,
      quantity: Number(item.quantity) || 1,
    }));

    const subtotal = items.reduce((s: number, i: any) => s + i.price * i.quantity, 0);
    const orderNumber = await getNextOrderNumber();

    const order = await Order.create({
      orderNumber,
      items,
      subtotal,
      tax: Number(payload.tax) || +(subtotal * 0.05).toFixed(2),
      discount: Number(payload.discount) || 0,
      total: Number(payload.order_total || payload.total) || subtotal,
      status: "confirmed",
      type: "delivery",
      paymentMethod: "online",
      paymentStatus: "paid",
      customerName: payload.customer?.name || payload.user?.name || "Zomato Customer",
      customerPhone: payload.customer?.phone || payload.user?.phone || "",
      deliveryAddress: payload.delivery_address || payload.customer?.address || "",
      source: "zomato",
    });

    await PlatformOrder.create({
      platform: "zomato",
      externalOrderId: externalId,
      internalOrderId: order._id,
      rawPayload: payload,
      status: "received",
    });

    return created(res, { order_id: order._id, order_number: orderNumber, status: "acknowledged" }, "Order received");
  } catch (err: any) {
    return badRequest(res, [], err.message);
  }
});

// Acknowledge / Reject platform orders
integrationRoutes.post("/swiggy/orders/:id/acknowledge", requireAuth, requireStaff, async (req, res) => {
  try {
    const po = await PlatformOrder.findById(req.params.id);
    if (!po || po.platform !== "swiggy") return notFound(res, "Not found");
    po.status = "acknowledged";
    await po.save();
    return ok(res, po, "Acknowledged");
  } catch (err: any) {
    return badRequest(res, [], err.message);
  }
});

integrationRoutes.post("/swiggy/orders/:id/reject", requireAuth, requireStaff, async (req, res) => {
  try {
    const body = z.object({ reason: z.string().max(300).optional() }).parse(req.body);
    const po = await PlatformOrder.findById(req.params.id);
    if (!po || po.platform !== "swiggy") return notFound(res, "Not found");
    po.status = "rejected";
    await po.save();
    await Order.findByIdAndUpdate(po.internalOrderId, { status: "cancelled" });
    return ok(res, po, "Rejected");
  } catch (err: any) {
    if (err instanceof z.ZodError) return badRequest(res, err.errors, "Validation error");
    return badRequest(res, [], err.message);
  }
});

integrationRoutes.post("/zomato/orders/:id/acknowledge", requireAuth, requireStaff, async (req, res) => {
  try {
    const po = await PlatformOrder.findById(req.params.id);
    if (!po || po.platform !== "zomato") return notFound(res, "Not found");
    po.status = "acknowledged";
    await po.save();
    return ok(res, po, "Acknowledged");
  } catch (err: any) {
    return badRequest(res, [], err.message);
  }
});

integrationRoutes.post("/zomato/orders/:id/reject", requireAuth, requireStaff, async (req, res) => {
  try {
    const body = z.object({ reason: z.string().max(300).optional() }).parse(req.body);
    const po = await PlatformOrder.findById(req.params.id);
    if (!po || po.platform !== "zomato") return notFound(res, "Not found");
    po.status = "rejected";
    await po.save();
    await Order.findByIdAndUpdate(po.internalOrderId, { status: "cancelled" });
    return ok(res, po, "Rejected");
  } catch (err: any) {
    if (err instanceof z.ZodError) return badRequest(res, err.errors, "Validation error");
    return badRequest(res, [], err.message);
  }
});

// List platform orders
integrationRoutes.get("/swiggy/orders", requireAuth, requireStaff, async (_req, res) => {
  try {
    const data = await PlatformOrder.find({ platform: "swiggy" }).sort({ createdAt: -1 }).limit(50);
    return ok(res, data);
  } catch (err: any) {
    return badRequest(res, [], err.message);
  }
});

integrationRoutes.get("/zomato/orders", requireAuth, requireStaff, async (_req, res) => {
  try {
    const data = await PlatformOrder.find({ platform: "zomato" }).sort({ createdAt: -1 }).limit(50);
    return ok(res, data);
  } catch (err: any) {
    return badRequest(res, [], err.message);
  }
});

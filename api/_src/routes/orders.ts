import { Router } from "express";
import { z } from "zod";
import mongoose from "mongoose";
import { requireAuth } from "../middleware/auth";
import { Order } from "../models/Order";
import { Counter } from "../models/Counter";
import { Promotion } from "../models/Promotion";
import { LoyaltyPoint } from "../models/LoyaltyPoint";
import { LoyaltyRedemption } from "../models/LoyaltyRedemption";
import { Notification } from "../models/Notification";
import { AuditLog } from "../models/AuditLog";
import { Recipe } from "../models/Recipe";
import { InventoryItem } from "../models/InventoryItem";
import { LoyaltyTier } from "../models/LoyaltyTier";
import { ok, created, badRequest, notFound, forbidden } from "../lib/response";

export const orderRoutes = Router();

const AddonSchema = z.object({
  id: z.string(),
  name: z.string().max(60),
  price: z.number().nonnegative().max(10000),
});

const OrderItemSchema = z.object({
  item_id: z.string().min(1).max(100),
  name: z.string().min(1).max(200),
  price: z.number().nonnegative().max(100000),
  quantity: z.number().int().positive().max(50),
  notes: z.string().max(300).optional(),
  addons: z.array(AddonSchema).max(20).optional(),
});

const PlaceOrderSchema = z.object({
  items: z.array(OrderItemSchema).min(1).max(50),
  fulfillment: z.enum(["delivery", "pickup", "dine_in"]),
  customer_name: z.string().trim().min(1).max(120),
  customer_phone: z.string().trim().min(7).max(20),
  address_line: z.string().trim().max(300).optional().nullable(),
  city: z.string().trim().max(80).optional().nullable(),
  pincode: z.string().trim().max(12).optional().nullable(),
  notes: z.string().trim().max(500).optional().nullable(),
  promo_code: z.string().trim().max(50).optional().nullable(),
  points_redeemed: z.number().int().nonnegative().max(100000).optional(),
  table_id: z.string().min(1).nullable().optional(),
  branch_id: z.string().min(1).nullable().optional(),
  source: z.enum(["web", "pos", "kiosk", "qr", "swiggy", "zomato"]).optional(),
  split_count: z.number().int().min(1).max(20).optional(),
  razorpay_order_id: z.string().optional(),
  razorpay_payment_id: z.string().optional(),
  razorpay_signature: z.string().optional(),
  payment_status: z.enum(["pending", "paid"]).optional(),
  payment_method: z.enum(["cash", "card", "upi", "online"]).optional(),
});

const POINT_VALUE = 0.5;

function lineTotal(i: z.infer<typeof OrderItemSchema>) {
  const addOn = (i.addons ?? []).reduce((s, a) => s + a.price, 0);
  return (i.price + addOn) * i.quantity;
}

async function getNextOrderNumber(): Promise<number> {
  const counter = await Counter.findOneAndUpdate(
    { name: "orderNumber" },
    { $inc: { seq: 1 } },
    { upsert: true, new: true }
  );
  return counter.seq;
}

orderRoutes.post("/", requireAuth, async (req, res) => {
  const session = await mongoose.startSession();
  try {
    const data = PlaceOrderSchema.parse(req.body);
    const subtotal = data.items.reduce((s, i) => s + lineTotal(i), 0);

    let discount = 0;
    let appliedCode: string | null = null;
    let promoUses = 0;
    if (data.promo_code) {
      const code = data.promo_code.toUpperCase();
      const promo = await Promotion.findOne({ code });
      const now = new Date();
      if (
        promo &&
        promo.isActive &&
        (!promo.startsAt || promo.startsAt <= now) &&
        (!promo.endsAt || promo.endsAt >= now) &&
        (!promo.maxUses || promo.usedCount < promo.maxUses) &&
        subtotal >= Number(promo.minOrderValue)
      ) {
        discount =
          promo.discountType === "percentage"
            ? +((subtotal * Number(promo.discountValue)) / 100).toFixed(2)
            : Number(promo.discountValue);
        discount = Math.min(discount, subtotal);
        appliedCode = promo.code;
        promoUses = promo.usedCount;
      }
    }

    let pointsUsed = 0;
    let pointsValue = 0;
    if (data.points_redeemed && data.points_redeemed > 0) {
      const [earnedResult, spentResult] = await Promise.all([
        LoyaltyPoint.aggregate([
          { $match: { userId: new mongoose.Types.ObjectId(req.userId) } },
          { $group: { _id: null, total: { $sum: "$points" } } },
        ]),
        LoyaltyRedemption.aggregate([
          { $match: { userId: new mongoose.Types.ObjectId(req.userId) } },
          { $group: { _id: null, total: { $sum: "$points" } } },
        ]),
      ]);
      const balance = (earnedResult[0]?.total ?? 0) - (spentResult[0]?.total ?? 0);
      pointsUsed = Math.min(data.points_redeemed, Math.max(0, balance));
      pointsValue = +(pointsUsed * POINT_VALUE).toFixed(2);
    }

    // Tier-based delivery waiver
    const tiers = await LoyaltyTier.find({ isActive: true }).sort({ minPoints: -1 });
    const [earnedAgg, spentAgg] = await Promise.all([
      LoyaltyPoint.aggregate([{ $match: { userId: new mongoose.Types.ObjectId(req.userId) } }, { $group: { _id: null, total: { $sum: "$points" } } }]),
      LoyaltyRedemption.aggregate([{ $match: { userId: new mongoose.Types.ObjectId(req.userId) } }, { $group: { _id: null, total: { $sum: "$points" } } }]),
    ]);
    const currentBalance = (earnedAgg[0]?.total ?? 0) - (spentAgg[0]?.total ?? 0);
    const currentTier = tiers.find((t) => currentBalance >= t.minPoints) || tiers[tiers.length - 1];
    const tierMultiplier = currentTier?.multiplier ?? 1;

    const discounted = Math.max(0, subtotal - discount - pointsValue);
    const tax = +(discounted * 0.05).toFixed(2);
    let deliveryFee = data.fulfillment === "delivery" && discounted < 500 ? 40 : 0;
    if (currentTier?.benefits?.freeDelivery && data.fulfillment === "delivery") {
      deliveryFee = 0;
    }
    const total = +(discounted + tax + deliveryFee).toFixed(2);

    session.startTransaction();

    const orderNumber = await getNextOrderNumber();

    const order = await Order.create(
      [{
        orderNumber,
        userId: req.userId,
        branchId: data.branch_id ?? undefined,
        tableId: data.table_id ?? undefined,
        items: data.items.map((i) => ({
          menuItemId: i.item_id,
          name: i.name,
          price: i.price,
          quantity: i.quantity,
          addons: i.addons ?? undefined,
          notes: i.notes ?? undefined,
        })),
        subtotal,
        tax,
        discount,
        total,
        promoCode: appliedCode,
        status: "confirmed",
        type: data.fulfillment === "dine_in" ? "dine-in" : data.fulfillment === "delivery" ? "delivery" : "takeaway",
        paymentStatus: data.payment_status ?? "pending",
        paymentMethod: data.payment_method ?? undefined,
        customerName: data.customer_name,
        customerPhone: data.customer_phone,
        deliveryAddress: data.fulfillment === "delivery" ? data.address_line ?? undefined : undefined,
        notes: data.notes ?? undefined,
        pointsEarned: 0,
        pointsRedeemed: pointsUsed,
        razorpayOrderId: data.razorpay_order_id,
        razorpayPaymentId: data.razorpay_payment_id,
        razorpaySignature: data.razorpay_signature,
        source: data.source ?? "web",
      }],
      { session }
    );

    if (appliedCode) {
      await Promotion.updateOne({ code: appliedCode }, { $inc: { usedCount: 1 } }, { session });
    }
    if (pointsUsed > 0) {
      await LoyaltyRedemption.create(
        [{ userId: req.userId, orderId: order[0]._id, points: pointsUsed, value: pointsValue }],
        { session }
      );
    }
    await Notification.create(
      [{
        userId: req.userId,
        title: `Order ${orderNumber} placed`,
        body: `Your ${data.fulfillment} order is being prepared.`,
        type: "order",
        metadata: { orderId: order[0]._id.toString() },
      }],
      { session }
    );

    // Earn loyalty points (1 pt per ₹10 spend, multiplied by tier)
    const spendForPoints = Math.floor((subtotal - discount) / 10);
    const earnedPoints = Math.floor(spendForPoints * tierMultiplier);
    if (earnedPoints > 0) {
      await LoyaltyPoint.create(
        [{
          userId: req.userId,
          orderId: order[0]._id,
          points: earnedPoints,
          reason: `Order #${orderNumber} (${tierMultiplier}x ${currentTier?.name ?? "Silver"} multiplier)`,
        }],
        { session }
      );
      await Order.findByIdAndUpdate(order[0]._id, { pointsEarned: earnedPoints }, { session });
    }

    // Priority prep for Platinum tier
    if (currentTier?.benefits?.prioritySupport) {
      await Order.findByIdAndUpdate(order[0]._id, {
        estimatedReadyAt: new Date(Date.now() + 10 * 60 * 1000),
      }, { session });
    }

    // Inventory auto-deduction
    const itemIds = data.items.map((i) => i.item_id);
    const recipes = await Recipe.find({ menuItemId: { $in: itemIds } }).session(session);
    const invDeductions = new Map<string, number>();
    for (const recipe of recipes) {
      const orderItem = data.items.find((i) => i.item_id === recipe.menuItemId.toString());
      if (!orderItem) continue;
      const totalQty = recipe.quantity * orderItem.quantity;
      const invId = recipe.inventoryItemId.toString();
      invDeductions.set(invId, (invDeductions.get(invId) ?? 0) + totalQty);
    }

    const lowStockAlerts: { name: string; stock: number; min: number }[] = [];
    for (const [invId, deduction] of invDeductions) {
      const inv = await InventoryItem.findById(invId).session(session);
      if (!inv) continue;
      inv.quantity = Math.max(0, inv.quantity - deduction);
      await inv.save({ session });
      if (inv.quantity <= inv.minQuantity) {
        lowStockAlerts.push({ name: inv.name, stock: inv.quantity, min: inv.minQuantity });
      }
    }

    // Low-stock alerts for all staff
    if (lowStockAlerts.length > 0) {
      for (const alert of lowStockAlerts) {
        await Notification.create(
          [{
            title: `Low stock: ${alert.name}`,
            body: `${alert.name} is at ${alert.stock} ${alert.min > 0 ? `(min: ${alert.min})` : ""}. Reorder now.`,
            type: "system",
            metadata: { kind: "low_stock", item: alert.name, stock: alert.stock },
          }],
          { session }
        );
      }
    }

    await session.commitTransaction();
    return created(res, { id: order[0]._id, order_number: orderNumber }, "Order placed");
  } catch (err: any) {
    await session.abortTransaction();
    if (err instanceof z.ZodError) return badRequest(res, err.errors, "Validation error");
    return forbidden(res, err.message);
  } finally {
    session.endSession();
  }
});

orderRoutes.get("/mine", requireAuth, async (req, res) => {
  try {
    const data = await Order.find({ userId: req.userId })
      .select("orderNumber status total type createdAt")
      .sort({ createdAt: -1 })
      .limit(50);
    return ok(res, data);
  } catch (err: any) {
    return forbidden(res, err.message);
  }
});

orderRoutes.get("/:id", requireAuth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return notFound(res, "Order not found");
    return ok(res, order);
  } catch (err: any) {
    return forbidden(res, err.message);
  }
});

orderRoutes.post("/:id/refund", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const body = z.object({
      amount: z.number().positive().max(1000000),
      reason: z.string().max(300).optional(),
    }).parse(req.body);

    if (!req.userRoles.includes("staff") && !req.userRoles.includes("admin")) {
      return forbidden(res, "Forbidden");
    }

    const order = await Order.findById(id);
    if (!order) return notFound(res, "Order not found");

    const newRefunded = order.refundedAmount ? order.refundedAmount + body.amount : body.amount;
    if (newRefunded > order.total) return badRequest(res, [], "Refund exceeds order total");

    const fullRefund = newRefunded >= order.total;
    order.refundedAmount = newRefunded;
    order.paymentStatus = fullRefund ? "refunded" : "partial";
    if (fullRefund) order.status = "cancelled";
    await order.save();

    await AuditLog.create({
      userId: req.userId,
      action: "order.refund",
      entity: "orders",
      entityId: id,
      details: { amount: body.amount, reason: body.reason },
    });

    await Notification.create({
      userId: order.userId,
      title: `Refund processed for ${order.orderNumber}`,
      body: `₹${body.amount.toFixed(2)} has been refunded${body.reason ? ` - ${body.reason}` : ""}.`,
      type: "order",
      metadata: { orderId: id },
    });

    return ok(res, { refundedAmount: newRefunded }, "Refund processed");
  } catch (err: any) {
    if (err instanceof z.ZodError) return badRequest(res, err.errors, "Validation error");
    return forbidden(res, err.message);
  }
});

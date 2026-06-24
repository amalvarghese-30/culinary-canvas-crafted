import { Router } from "express";
import { z } from "zod";
import mongoose from "mongoose";
import { requireAuth } from "../middleware/auth";
import { requireStaff, requireAdmin } from "../middleware/staff";
import { User } from "../models/User";
import { Order } from "../models/Order";
import { MenuItem } from "../models/MenuItem";
import { MenuAddon } from "../models/MenuAddon";
import { Reservation } from "../models/Reservation";
import { Review } from "../models/Review";
import { RestaurantTable } from "../models/RestaurantTable";
import { InventoryItem } from "../models/InventoryItem";
import { Recipe } from "../models/Recipe";
import { Branch } from "../models/Branch";
import QRCode from "qrcode";
import { Shift } from "../models/Shift";
import { Supplier } from "../models/Supplier";
import { PurchaseOrder } from "../models/PurchaseOrder";
import { AuditLog } from "../models/AuditLog";
import { MenuCategory } from "../models/MenuCategory";
import { LoyaltyTier } from "../models/LoyaltyTier";
import { ok, okPaginated, badRequest, notFound, created, serverError } from "../lib/response";

export const adminRoutes = Router();

function paginationFromQuery(q: any) {
  const page = Math.max(1, Number(q.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(q.limit) || 50));
  return { page, limit, skip: (page - 1) * limit };
}

const ORDER_STATUSES = ["pending", "confirmed", "preparing", "ready", "served", "completed", "cancelled"] as const;
const RESERVATION_STATUSES = ["pending", "confirmed", "cancelled", "completed", "no-show"] as const;

// Roles
adminRoutes.get("/roles", requireAuth, async (req, res) => {
  try {
    return res.json(req.userRoles);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Claim admin
adminRoutes.post("/claim", requireAuth, async (req, res) => {
  try {
    const count = await User.countDocuments({ roles: "admin" });
    if (count > 0) return res.status(400).json({ error: "An admin already exists" });
    await User.findByIdAndUpdate(req.userId, { $addToSet: { roles: "admin" } });
    return res.json({ ok: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Dashboard
adminRoutes.get("/dashboard", requireAuth, requireStaff, async (_req, res) => {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - 6);

    const todaysOrders = await Order.find(
      { createdAt: { $gte: todayStart } },
      "total status"
    );
    const revenue = todaysOrders
      .filter((o) => o.status !== "cancelled")
      .reduce((s, o) => s + Number(o.total), 0);
    const aov = todaysOrders.filter((o) => o.status !== "cancelled").length
      ? revenue / todaysOrders.filter((o) => o.status !== "cancelled").length
      : 0;
    const active = todaysOrders.filter((o) =>
      ["pending", "confirmed", "preparing"].includes(o.status)
    ).length;

    const pendingReservations = await Reservation.countDocuments({ status: "pending" });

    const menuCount = await MenuItem.countDocuments({ isAvailable: true });
    const totalCustomers = await Order.distinct("userId", { status: { $ne: "cancelled" } });
    const lowStock = await InventoryItem.countDocuments({ $expr: { $lte: ["$quantity", "$minQuantity"] } });

    const thisWeekPaid = await Order.find(
      { createdAt: { $gte: weekStart }, status: { $ne: "cancelled" } },
      "total createdAt"
    );

    const byDay = new Map<string, { date: string; revenue: number; orders: number }>();
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString("en-IN", { weekday: "short" });
      byDay.set(key, { date: label, revenue: 0, orders: 0 });
    }
    for (const o of thisWeekPaid) {
      const key = o.createdAt.toISOString().slice(0, 10);
      const row = byDay.get(key);
      if (row) { row.revenue += Number(o.total); row.orders += 1; }
    }

    return ok(res, {
      ordersToday: todaysOrders.length,
      revenueToday: +revenue.toFixed(2),
      aov: +aov.toFixed(2),
      activeOrders: active,
      pendingReservations,
      menuCount,
      customerCount: totalCustomers.length,
      lowStockCount: lowStock,
      weekSeries: Array.from(byDay.values()),
    });
  } catch (err: any) {
    return serverError(res, err.message);
  }
});

// Orders
adminRoutes.get("/orders", requireAuth, requireStaff, async (req, res) => {
  try {
    const { skip, limit, page } = paginationFromQuery(req.query);
    const search = (req.query.search as string)?.trim() ?? "";
    const status = (req.query.status as string) ?? "";

    const filter: Record<string, any> = {};
    if (status && ORDER_STATUSES.includes(status as any)) filter.status = status;
    if (search) {
      filter.$or = [
        { orderNumber: { $regex: search, $options: "i" } },
        { customerName: { $regex: search, $options: "i" } },
        { customerPhone: { $regex: search, $options: "i" } },
      ];
    }

    const [docs, total] = await Promise.all([
      Order.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Order.countDocuments(filter),
    ]);

    const data = docs.map((o) => ({
      id: o._id.toString(),
      order_number: String(o.orderNumber),
      status: o.status,
      fulfillment: o.type,
      customer_name: o.customerName || "Guest",
      customer_phone: o.customerPhone || "",
      total: o.total,
      created_at: o.createdAt,
      order_items: (o.items || []).map((it: any) => ({
        name: it.name,
        quantity: it.quantity,
        notes: it.notes || null,
      })),
    }));

    return okPaginated(res, data, { page, limit, total });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

adminRoutes.patch("/orders/:id/status", requireAuth, requireStaff, async (req, res) => {
  try {
    const body = z.object({ status: z.enum(ORDER_STATUSES) }).parse(req.body);
    await Order.findByIdAndUpdate(req.params.id, { status: body.status });
    return res.json({ ok: true });
  } catch (err: any) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors });
    return res.status(500).json({ error: err.message });
  }
});

// Reservations
adminRoutes.get("/reservations", requireAuth, requireStaff, async (_req, res) => {
  try {
    const docs = await Reservation.find()
      .sort({ reservationDate: 1, reservationTime: 1 })
      .limit(200);
    const data = docs.map((r) => ({
      id: r._id.toString(),
      reservation_date: r.reservationDate,
      reservation_time: r.reservationTime,
      full_name: r.guestName,
      phone: r.guestPhone,
      email: r.guestEmail,
      party_size: r.partySize,
      status: r.status,
      special_requests: r.notes,
    }));
    return ok(res, data);
  } catch (err: any) {
    return serverError(res, err.message);
  }
});

adminRoutes.patch("/reservations/:id/status", requireAuth, requireStaff, async (req, res) => {
  try {
    const body = z.object({ status: z.enum(RESERVATION_STATUSES) }).parse(req.body);
    await Reservation.findByIdAndUpdate(req.params.id, { status: body.status });
    return res.json({ ok: true });
  } catch (err: any) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors });
    return res.status(500).json({ error: err.message });
  }
});

// Reviews
adminRoutes.get("/reviews", requireAuth, requireStaff, async (_req, res) => {
  try {
    const data = await Review.find()
      .populate("userId", "fullName")
      .populate("menuItemId", "name")
      .sort({ createdAt: -1 })
      .limit(200);
    return res.json(data);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

adminRoutes.patch("/reviews/:id/approval", requireAuth, requireStaff, async (req, res) => {
  try {
    const body = z.object({ approved: z.boolean() }).parse(req.body);
    await Review.findByIdAndUpdate(req.params.id, { isVisible: body.approved });
    return res.json({ ok: true });
  } catch (err: any) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors });
    return res.status(500).json({ error: err.message });
  }
});

// Menu items
const itemSchema = z.object({
  name: z.string().trim().min(1).max(120),
  slug: z.string().trim().min(1).max(150),
  style: z.string().trim().min(1).max(60),
  variant: z.string().trim().min(1).max(60),
  description: z.string().trim().max(500).default(""),
  short_description: z.string().trim().max(200).nullable().optional(),
  price: z.number().min(0).max(100000),
  category: z.string().trim().min(1).max(80),
  sub_category: z.string().trim().max(80).nullable().optional(),
  filling: z.string().trim().max(60).nullable().optional(),
  piece_count: z.number().int().min(0).max(99).nullable().optional(),
  spice: z.number().int().min(1).max(3).default(1),
  image_url: z.string().trim().max(500).nullable().optional(),
  gallery_images: z.array(z.string().trim().max(500)).max(10).default([]),
  badges: z.array(z.string().trim().max(40)).max(5).default([]),
  sort_order: z.number().int().default(0),
  available: z.boolean().default(true),
  is_vegetarian: z.boolean().default(true),
  is_vegan: z.boolean().default(false),
  is_gluten_free: z.boolean().default(false),
  is_featured: z.boolean().default(false),
  is_best_seller: z.boolean().default(false),
  is_chef_special: z.boolean().default(false),
  preparation_time: z.number().int().min(0).max(999).nullable().optional(),
  ingredients: z.string().trim().max(1000).nullable().optional(),
  nutritional_info: z.object({
    calories: z.number().min(0).nullable().optional(),
    protein: z.number().min(0).nullable().optional(),
    carbs: z.number().min(0).nullable().optional(),
    fat: z.number().min(0).nullable().optional(),
  }).nullable().optional(),
  seo_title: z.string().trim().max(120).nullable().optional(),
  seo_description: z.string().trim().max(300).nullable().optional(),
  tags: z.array(z.string().trim().max(40)).max(10).default([]),
});

adminRoutes.get("/menu", requireAuth, requireStaff, async (req, res) => {
  try {
    const lite = req.query.lite === "true";
    const data = await MenuItem.find({}, lite ? "name style variant price" : undefined).sort({ sortOrder: 1 });
    return ok(res, data);
  } catch (err: any) {
    return badRequest(res, [], err.message);
  }
});

adminRoutes.post("/menu", requireAuth, requireStaff, async (req, res) => {
  try {
    const body = itemSchema.parse(req.body);
    const row = await MenuItem.create({
      name: body.name,
      slug: body.slug,
      style: body.style,
      variant: body.variant,
      description: body.description,
      shortDescription: body.short_description ?? undefined,
      price: body.price,
      category: body.category,
      subCategory: body.sub_category ?? undefined,
      filling: body.filling ?? undefined,
      pieceCount: body.piece_count ?? undefined,
      imageUrl: body.image_url ?? undefined,
      galleryImages: body.gallery_images,
      isAvailable: body.available,
      spice: body.spice,
      badges: body.badges,
      sortOrder: body.sort_order,
      isVegetarian: body.is_vegetarian,
      isVegan: body.is_vegan,
      isGlutenFree: body.is_gluten_free,
      isFeatured: body.is_featured,
      isBestSeller: body.is_best_seller,
      isChefSpecial: body.is_chef_special,
      preparationTime: body.preparation_time ?? undefined,
      ingredients: body.ingredients ?? undefined,
      nutritionalInfo: body.nutritional_info ?? undefined,
      seoTitle: body.seo_title ?? undefined,
      seoDescription: body.seo_description ?? undefined,
      tags: body.tags,
    });
    return res.json(row);
  } catch (err: any) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors });
    return res.status(500).json({ error: err.message });
  }
});

adminRoutes.put("/menu/:id", requireAuth, requireStaff, async (req, res) => {
  try {
    const patch = itemSchema.partial().parse(req.body);
    const update: Record<string, any> = {};
    if (patch.name !== undefined) update.name = patch.name;
    if (patch.slug !== undefined) update.slug = patch.slug;
    if (patch.style !== undefined) update.style = patch.style;
    if (patch.variant !== undefined) update.variant = patch.variant;
    if (patch.price !== undefined) update.price = patch.price;
    if (patch.description !== undefined) update.description = patch.description;
    if (patch.short_description !== undefined) update.shortDescription = patch.short_description;
    if (patch.category !== undefined) update.category = patch.category;
    if (patch.sub_category !== undefined) update.subCategory = patch.sub_category;
    if (patch.filling !== undefined) update.filling = patch.filling;
    if (patch.piece_count !== undefined) update.pieceCount = patch.piece_count;
    if (patch.available !== undefined) update.isAvailable = patch.available;
    if (patch.image_url !== undefined) update.imageUrl = patch.image_url;
    if (patch.gallery_images !== undefined) update.galleryImages = patch.gallery_images;
    if (patch.spice !== undefined) update.spice = patch.spice;
    if (patch.badges !== undefined) update.badges = patch.badges;
    if (patch.sort_order !== undefined) update.sortOrder = patch.sort_order;
    if (patch.is_vegetarian !== undefined) update.isVegetarian = patch.is_vegetarian;
    if (patch.is_vegan !== undefined) update.isVegan = patch.is_vegan;
    if (patch.is_gluten_free !== undefined) update.isGlutenFree = patch.is_gluten_free;
    if (patch.is_featured !== undefined) update.isFeatured = patch.is_featured;
    if (patch.is_best_seller !== undefined) update.isBestSeller = patch.is_best_seller;
    if (patch.is_chef_special !== undefined) update.isChefSpecial = patch.is_chef_special;
    if (patch.preparation_time !== undefined) update.preparationTime = patch.preparation_time;
    if (patch.ingredients !== undefined) update.ingredients = patch.ingredients;
    if (patch.nutritional_info !== undefined) update.nutritionalInfo = patch.nutritional_info;
    if (patch.seo_title !== undefined) update.seoTitle = patch.seo_title;
    if (patch.seo_description !== undefined) update.seoDescription = patch.seo_description;
    if (patch.tags !== undefined) update.tags = patch.tags;
    await MenuItem.findByIdAndUpdate(req.params.id, update);
    return res.json({ ok: true });
  } catch (err: any) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors });
    return res.status(500).json({ error: err.message });
  }
});

adminRoutes.delete("/menu/:id", requireAuth, requireStaff, async (req, res) => {
  try {
    await MenuItem.findByIdAndDelete(req.params.id);
    return res.json({ ok: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Categories
const categorySchema = z.object({
  name: z.string().trim().min(1).max(60),
  slug: z.string().trim().min(1).max(80),
  description: z.string().trim().max(300).default(""),
  image_url: z.string().trim().max(500).nullable().optional(),
  sort_order: z.number().int().default(0),
  active: z.boolean().default(true),
  parent_id: z.string().nullable().optional(),
});

adminRoutes.get("/categories", requireAuth, requireStaff, async (_req, res) => {
  try {
    const data = await MenuCategory.find().sort({ sortOrder: 1 });
    return res.json(data);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

adminRoutes.post("/categories", requireAuth, requireStaff, async (req, res) => {
  try {
    const body = categorySchema.parse(req.body);
    const row = await MenuCategory.create({
      name: body.name,
      slug: body.slug,
      description: body.description,
      imageUrl: body.image_url ?? undefined,
      sortOrder: body.sort_order,
      isActive: body.active,
      parentId: body.parent_id ?? undefined,
    });
    return res.json(row);
  } catch (err: any) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors });
    return res.status(500).json({ error: err.message });
  }
});

adminRoutes.put("/categories/:id", requireAuth, requireStaff, async (req, res) => {
  try {
    const body = categorySchema.partial().parse(req.body);
    const update: Record<string, any> = {};
    if (body.name !== undefined) update.name = body.name;
    if (body.slug !== undefined) update.slug = body.slug;
    if (body.description !== undefined) update.description = body.description;
    if (body.image_url !== undefined) update.imageUrl = body.image_url;
    if (body.sort_order !== undefined) update.sortOrder = body.sort_order;
    if (body.active !== undefined) update.isActive = body.active;
    if (body.parent_id !== undefined) update.parentId = body.parent_id;
    await MenuCategory.findByIdAndUpdate(req.params.id, update);
    return res.json({ ok: true });
  } catch (err: any) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors });
    return res.status(500).json({ error: err.message });
  }
});

adminRoutes.delete("/categories/:id", requireAuth, requireStaff, async (req, res) => {
  try {
    await MenuCategory.findByIdAndDelete(req.params.id);
    return res.json({ ok: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// KDS
adminRoutes.get("/kds", requireAuth, requireStaff, async (_req, res) => {
  try {
    const docs = await Order.find(
      { status: { $in: ["confirmed", "preparing", "ready"] } },
    )
      .sort({ createdAt: 1 })
      .limit(80);
    const data = docs.map((o) => ({
      id: o._id.toString(),
      order_number: String(o.orderNumber),
      status: o.status,
      fulfillment: o.type,
      customer_name: o.customerName || "Guest",
      customer_phone: o.customerPhone || "",
      notes: o.notes || null,
      total: o.total,
      created_at: o.createdAt,
      order_items: (o.items || []).map((it: any) => ({
        name: it.name,
        quantity: it.quantity,
        notes: it.notes || null,
      })),
    }));
    return ok(res, data);
  } catch (err: any) {
    return serverError(res, err.message);
  }
});

// Analytics
adminRoutes.get("/analytics", requireAuth, requireStaff, async (req, res) => {
  try {
    const days = Number(req.query.days || 30);
    const since = new Date();
    since.setDate(since.getDate() - (days - 1));
    since.setHours(0, 0, 0, 0);

    const orders = await Order.find(
      { createdAt: { $gte: since } },
      "total status createdAt items"
    );

    const paid = orders.filter((o) => o.status !== "cancelled");

    const byDay = new Map<string, { date: string; revenue: number; orders: number }>();
    for (let i = 0; i < days; i++) {
      const d = new Date(since);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      byDay.set(key, { date: key, revenue: 0, orders: 0 });
    }
    for (const o of paid) {
      const key = o.createdAt.toISOString().slice(0, 10);
      const row = byDay.get(key);
      if (row) { row.revenue += Number(o.total); row.orders += 1; }
    }

    const itemTotals = new Map<string, { name: string; qty: number; revenue: number }>();
    for (const o of paid) {
      for (const it of o.items) {
        const cur = itemTotals.get(it.name) ?? { name: it.name, qty: 0, revenue: 0 };
        cur.qty += it.quantity;
        cur.revenue += it.price * it.quantity;
        itemTotals.set(it.name, cur);
      }
    }
    const topItems = Array.from(itemTotals.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 8);

    const hours = Array.from({ length: 24 }, (_, h) => ({ hour: h, orders: 0 }));
    for (const o of paid) { const h = o.createdAt.getHours(); if (hours[h]) hours[h].orders += 1; }

    const totalRevenue = paid.reduce((s, o) => s + Number(o.total), 0);
    return res.json({
      series: Array.from(byDay.values()),
      topItems,
      hours,
      totals: {
        revenue: +totalRevenue.toFixed(2),
        orders: paid.length,
        aov: paid.length ? +(totalRevenue / paid.length).toFixed(2) : 0,
        cancelled: orders.length - paid.length,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Customers
adminRoutes.get("/customers", requireAuth, requireStaff, async (_req, res) => {
  try {
    const orders = await Order.aggregate([
      { $match: { status: { $ne: "cancelled" } } },
      { $sort: { createdAt: -1 } },
      { $limit: 1500 },
      {
        $group: {
          _id: "$userId",
          name: { $first: "$customerName" },
          phone: { $first: "$customerPhone" },
          orders: { $sum: 1 },
          ltv: { $sum: "$total" },
          last_order: { $max: "$createdAt" },
        },
      },
      { $sort: { ltv: -1 } },
    ]);
    return res.json(orders.map((c: any) => ({ ...c, ltv: +c.ltv.toFixed(2) })));
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Tables
adminRoutes.get("/tables", requireAuth, requireStaff, async (_req, res) => {
  try {
    const tables = await RestaurantTable.find().sort({ name: 1 });
    const data = tables.map((t) => ({
      id: t._id.toString(),
      label: t.name,
      capacity: t.capacity,
      location: null,
      active: !t.isOccupied,
      qr_code: t.qrCode ?? undefined,
    }));
    return ok(res, data);
  } catch (err: any) {
    return serverError(res, err.message);
  }
});

adminRoutes.post("/tables", requireAuth, requireStaff, async (req, res) => {
  try {
    const body = z.object({
      id: z.string().optional(),
      label: z.string().min(1).max(20),
      capacity: z.number().int().min(1).max(40),
      location: z.string().max(40).nullable().optional(),
      active: z.boolean().default(true),
    }).parse(req.body);

    let table;
    if (body.id) {
      table = await RestaurantTable.findByIdAndUpdate(body.id, {
        name: body.label, capacity: body.capacity, isOccupied: false,
      }, { new: true });
    } else {
      table = await RestaurantTable.create({ name: body.label, capacity: body.capacity });
      const qrCode = await generateQRForTable(table);
      table.qrCode = qrCode;
      await table.save();
    }
    const data = {
      id: table!._id.toString(),
      label: table!.name,
      capacity: table!.capacity,
      location: null,
      active: !table!.isOccupied,
      qr_code: table!.qrCode ?? undefined,
    };
    return ok(res, data, "Table saved");
  } catch (err: any) {
    if (err instanceof z.ZodError) return badRequest(res, err.errors, "Validation error");
    return badRequest(res, [], err.message);
  }
});

adminRoutes.put("/tables/:id", requireAuth, requireStaff, async (req, res) => {
  try {
    const body = z.object({
      label: z.string().min(1).max(20),
      capacity: z.number().int().min(1).max(40),
      location: z.string().max(40).nullable().optional(),
      active: z.boolean().default(true),
    }).parse(req.body);
    await RestaurantTable.findByIdAndUpdate(req.params.id, {
      name: body.label, capacity: body.capacity,
    });
    return res.json({ ok: true });
  } catch (err: any) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors });
    return res.status(500).json({ error: err.message });
  }
});

adminRoutes.delete("/tables/:id", requireAuth, requireStaff, async (req, res) => {
  try {
    await RestaurantTable.findByIdAndDelete(req.params.id);
    return res.json({ ok: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

async function generateQRForTable(table: any) {
  const baseUrl = process.env.BASE_URL || "http://localhost:5173";
  const url = `${baseUrl}/t/${table._id}`;
  return QRCode.toDataURL(url, {
    errorCorrectionLevel: "M",
    type: "image/png",
    width: 400,
    margin: 2,
    color: { dark: "#0B0B0B", light: "#FFFFFF" },
  });
}

adminRoutes.post("/tables/:id/generate-qr", requireAuth, requireStaff, async (req, res) => {
  try {
    const table = await RestaurantTable.findById(req.params.id);
    if (!table) return notFound(res, "Table not found");
    table.qrCode = await generateQRForTable(table);
    await table.save();
    return ok(res, { id: table._id.toString(), qr_code: table.qrCode }, "QR generated");
  } catch (err: any) {
    return badRequest(res, [], err.message);
  }
});

adminRoutes.get("/tables/:id/qr", requireAuth, requireStaff, async (req, res) => {
  try {
    const table = await RestaurantTable.findById(req.params.id);
    if (!table) return notFound(res, "Table not found");
    const qr = table.qrCode || (await generateQRForTable(table));
    if (!table.qrCode) {
      table.qrCode = qr;
      await table.save();
    }
    const img = Buffer.from(qr.split(",")[1], "base64");
    res.writeHead(200, {
      "Content-Type": "image/png",
      "Content-Disposition": `attachment; filename="table-${table.name}.png"`,
    });
    res.end(img);
  } catch (err: any) {
    return badRequest(res, [], err.message);
  }
});

// Inventory
adminRoutes.get("/inventory", requireAuth, requireStaff, async (req, res) => {
  try {
    const lite = req.query.lite === "true";
    const data = await InventoryItem.find({}, lite ? "name unit" : undefined).sort({ name: 1 });
    return res.json(data);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

adminRoutes.post("/inventory", requireAuth, requireStaff, async (req, res) => {
  try {
    const body = z.object({
      name: z.string().min(1).max(80),
      unit: z.string().min(1).max(16),
      stock: z.number().min(0),
      low_stock_at: z.number().min(0),
      active: z.boolean().default(true),
      notes: z.string().max(500).nullable().optional(),
    }).parse(req.body);
    await InventoryItem.create({
      name: body.name, unit: body.unit, quantity: body.stock,
      minQuantity: body.low_stock_at, category: "general", costPerUnit: 0,
    });
    return res.json({ ok: true });
  } catch (err: any) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors });
    return res.status(500).json({ error: err.message });
  }
});

adminRoutes.put("/inventory/:id", requireAuth, requireStaff, async (req, res) => {
  try {
    const body = z.object({
      name: z.string().min(1).max(80),
      unit: z.string().min(1).max(16),
      stock: z.number().min(0),
      low_stock_at: z.number().min(0),
      active: z.boolean().default(true),
      notes: z.string().max(500).nullable().optional(),
    }).parse(req.body);
    await InventoryItem.findByIdAndUpdate(req.params.id, {
      name: body.name, unit: body.unit, quantity: body.stock, minQuantity: body.low_stock_at,
    });
    return res.json({ ok: true });
  } catch (err: any) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors });
    return res.status(500).json({ error: err.message });
  }
});

adminRoutes.delete("/inventory/:id", requireAuth, requireStaff, async (req, res) => {
  try {
    await InventoryItem.findByIdAndDelete(req.params.id);
    return res.json({ ok: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Recipes
adminRoutes.get("/recipes", requireAuth, requireStaff, async (_req, res) => {
  try {
    const data = await Recipe.find()
      .populate("menuItemId", "name")
      .populate("inventoryItemId", "name unit")
      .sort({ createdAt: -1 });
    return res.json(data);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

adminRoutes.post("/recipes", requireAuth, requireStaff, async (req, res) => {
  try {
    const body = z.object({
      menu_item_id: z.string().min(1),
      inventory_item_id: z.string().min(1),
      quantity: z.number().min(0.0001),
    }).parse(req.body);
    await Recipe.findOneAndUpdate(
      { menuItemId: body.menu_item_id, inventoryItemId: body.inventory_item_id },
      { menuItemId: body.menu_item_id, inventoryItemId: body.inventory_item_id, quantity: body.quantity, unit: "units" },
      { upsert: true }
    );
    return res.json({ ok: true });
  } catch (err: any) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors });
    return res.status(500).json({ error: err.message });
  }
});

adminRoutes.put("/recipes/:id", requireAuth, requireStaff, async (req, res) => {
  try {
    const body = z.object({
      menu_item_id: z.string().min(1),
      inventory_item_id: z.string().min(1),
      quantity: z.number().min(0.0001),
    }).parse(req.body);
    await Recipe.findByIdAndUpdate(req.params.id, {
      menuItemId: body.menu_item_id, inventoryItemId: body.inventory_item_id, quantity: body.quantity,
    });
    return res.json({ ok: true });
  } catch (err: any) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors });
    return res.status(500).json({ error: err.message });
  }
});

adminRoutes.delete("/recipes/:id", requireAuth, requireStaff, async (req, res) => {
  try {
    await Recipe.findByIdAndDelete(req.params.id);
    return res.json({ ok: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Addons
adminRoutes.get("/addons", requireAuth, requireStaff, async (_req, res) => {
  try {
    const data = await MenuAddon.find()
      .populate("menuItemId", "name")
      .sort({ createdAt: -1 });
    return res.json(data);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

adminRoutes.post("/addons", requireAuth, requireStaff, async (req, res) => {
  try {
    const body = z.object({
      menu_item_id: z.string().min(1),
      name: z.string().min(1).max(60),
      price: z.number().min(0),
      active: z.boolean().default(true),
    }).parse(req.body);
    await MenuAddon.create({
      menuItemId: body.menu_item_id, name: body.name, price: body.price, isAvailable: body.active,
    });
    return res.json({ ok: true });
  } catch (err: any) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors });
    return res.status(500).json({ error: err.message });
  }
});

adminRoutes.put("/addons/:id", requireAuth, requireStaff, async (req, res) => {
  try {
    const body = z.object({
      menu_item_id: z.string().min(1),
      name: z.string().min(1).max(60),
      price: z.number().min(0),
      active: z.boolean().default(true),
    }).parse(req.body);
    await MenuAddon.findByIdAndUpdate(req.params.id, {
      menuItemId: body.menu_item_id, name: body.name, price: body.price, isAvailable: body.active,
    });
    return res.json({ ok: true });
  } catch (err: any) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors });
    return res.status(500).json({ error: err.message });
  }
});

adminRoutes.delete("/addons/:id", requireAuth, requireStaff, async (req, res) => {
  try {
    await MenuAddon.findByIdAndDelete(req.params.id);
    return res.json({ ok: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Audit (admin only)
adminRoutes.get("/audit", requireAuth, requireAdmin, async (req, res) => {
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

// Branches
adminRoutes.get("/branches", requireAuth, requireStaff, async (_req, res) => {
  try {
    const data = await Branch.find().sort({ name: 1 });
    return ok(res, data);
  } catch (err: any) {
    return badRequest(res, [], err.message);
  }
});

adminRoutes.post("/branches", requireAuth, requireStaff, async (req, res) => {
  try {
    const body = z.object({
      name: z.string().min(1).max(80),
      code: z.string().max(20).nullable().optional(),
      address: z.string().max(300).nullable().optional(),
      phone: z.string().max(40).nullable().optional(),
      active: z.boolean().default(true),
    }).parse(req.body);
    const b = await Branch.create({
      name: body.name, addressLine: body.address ?? undefined, phone: body.phone ?? undefined, isActive: body.active,
    });
    return ok(res, b, "Branch created");
  } catch (err: any) {
    if (err instanceof z.ZodError) return badRequest(res, err.errors, "Validation error");
    return badRequest(res, [], err.message);
  }
});

adminRoutes.put("/branches/:id", requireAuth, requireStaff, async (req, res) => {
  try {
    const body = z.object({
      name: z.string().min(1).max(80),
      code: z.string().max(20).nullable().optional(),
      address: z.string().max(300).nullable().optional(),
      phone: z.string().max(40).nullable().optional(),
      active: z.boolean().default(true),
    }).parse(req.body);
    const b = await Branch.findByIdAndUpdate(req.params.id, {
      name: body.name, addressLine: body.address ?? undefined, phone: body.phone ?? undefined, isActive: body.active,
    }, { new: true });
    if (!b) return notFound(res, "Branch not found");
    return ok(res, b, "Branch updated");
  } catch (err: any) {
    if (err instanceof z.ZodError) return badRequest(res, err.errors, "Validation error");
    return badRequest(res, [], err.message);
  }
});

adminRoutes.delete("/branches/:id", requireAuth, requireStaff, async (req, res) => {
  try {
    await Branch.findByIdAndDelete(req.params.id);
    return ok(res, null, "Branch removed");
  } catch (err: any) {
    return badRequest(res, [], err.message);
  }
});

// Shifts
adminRoutes.get("/shifts", requireAuth, requireStaff, async (_req, res) => {
  try {
    const data = await Shift.find()
      .sort({ startTime: -1 })
      .limit(100)
      .populate("userId", "fullName phone");
    return res.json(data);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Suppliers
adminRoutes.get("/suppliers", requireAuth, requireStaff, async (_req, res) => {
  try {
    const data = await Supplier.find().sort({ name: 1 });
    return res.json(data);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

adminRoutes.post("/suppliers", requireAuth, requireStaff, async (req, res) => {
  try {
    const body = z.object({
      name: z.string().min(1).max(80),
      contact_name: z.string().max(80).nullable().optional(),
      phone: z.string().max(40).nullable().optional(),
      email: z.string().email().nullable().or(z.literal("")).optional(),
      address: z.string().max(300).nullable().optional(),
      notes: z.string().max(500).nullable().optional(),
      active: z.boolean().default(true),
    }).parse(req.body);
    await Supplier.create({
      name: body.name, contactPerson: body.contact_name ?? undefined,
      phone: body.phone ?? undefined, email: body.email ?? undefined,
      address: body.address ?? undefined, isActive: body.active,
    });
    return res.json({ ok: true });
  } catch (err: any) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors });
    return res.status(500).json({ error: err.message });
  }
});

adminRoutes.put("/suppliers/:id", requireAuth, requireStaff, async (req, res) => {
  try {
    const body = z.object({
      name: z.string().min(1).max(80),
      contact_name: z.string().max(80).nullable().optional(),
      phone: z.string().max(40).nullable().optional(),
      email: z.string().email().nullable().or(z.literal("")).optional(),
      address: z.string().max(300).nullable().optional(),
      notes: z.string().max(500).nullable().optional(),
      active: z.boolean().default(true),
    }).parse(req.body);
    await Supplier.findByIdAndUpdate(req.params.id, {
      name: body.name, contactPerson: body.contact_name ?? undefined,
      phone: body.phone ?? undefined, email: body.email ?? undefined,
      address: body.address ?? undefined, isActive: body.active,
    });
    return res.json({ ok: true });
  } catch (err: any) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors });
    return res.status(500).json({ error: err.message });
  }
});

adminRoutes.delete("/suppliers/:id", requireAuth, requireStaff, async (req, res) => {
  try {
    await Supplier.findByIdAndDelete(req.params.id);
    return res.json({ ok: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Purchase Orders
adminRoutes.get("/purchase-orders", requireAuth, requireStaff, async (_req, res) => {
  try {
    const data = await PurchaseOrder.find()
      .populate("supplierId", "name")
      .sort({ createdAt: -1 })
      .limit(100);
    return res.json(data);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

adminRoutes.post("/purchase-orders", requireAuth, requireStaff, async (req, res) => {
  try {
    const body = z.object({
      supplier_id: z.string().min(1).nullable(),
      expected_at: z.string().nullable().optional(),
      notes: z.string().max(500).nullable().optional(),
      items: z.array(z.object({
        inventory_item_id: z.string().min(1),
        quantity: z.number().min(0.0001),
        unit_cost: z.number().min(0),
      })).min(1),
    }).parse(req.body);

    const total = body.items.reduce((s, i) => s + i.quantity * i.unit_cost, 0);
    const po = await PurchaseOrder.create({
      supplierId: body.supplier_id ?? undefined,
      items: body.items.map((i) => ({
        inventoryItemId: i.inventory_item_id,
        name: "",
        quantity: i.quantity,
        unit: "units",
        costPerUnit: i.unit_cost,
        totalCost: i.quantity * i.unit_cost,
      })),
      totalCost: total,
      notes: body.notes ?? undefined,
      status: "ordered",
      orderedAt: new Date(),
    });
    return res.json({ ok: true, id: po._id });
  } catch (err: any) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors });
    return res.status(500).json({ error: err.message });
  }
});

adminRoutes.patch("/purchase-orders/:id/status", requireAuth, requireStaff, async (req, res) => {
  try {
    const body = z.object({ status: z.enum(["draft", "ordered", "received", "cancelled"]) }).parse(req.body);
    await PurchaseOrder.findByIdAndUpdate(req.params.id, {
      status: body.status,
      ...(body.status === "received" ? { receivedAt: new Date() } : {}),
    });
    return res.json({ ok: true });
  } catch (err: any) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors });
    return res.status(500).json({ error: err.message });
  }
});

adminRoutes.delete("/purchase-orders/:id", requireAuth, requireStaff, async (req, res) => {
  try {
    await PurchaseOrder.findByIdAndDelete(req.params.id);
    return res.json({ ok: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Forecast
const FORECAST_GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";
const FORECAST_MODEL = "google/gemini-2.5-flash";

adminRoutes.post("/forecast", requireAuth, requireStaff, async (req, res) => {
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

    const aiRes = await fetch(FORECAST_GATEWAY, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: FORECAST_MODEL,
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

// Loyalty Tiers
adminRoutes.get("/loyalty-tiers", requireAuth, requireStaff, async (_req, res) => {
  try {
    const data = await LoyaltyTier.find().sort({ minPoints: 1 });
    return ok(res, data);
  } catch (err: any) {
    return badRequest(res, [], err.message);
  }
});

adminRoutes.put("/loyalty-tiers/:id", requireAuth, requireStaff, async (req, res) => {
  try {
    const body = z.object({
      name: z.string().min(1).max(40).optional(),
      min_points: z.number().int().min(0).optional(),
      multiplier: z.number().min(0.5).max(10).optional(),
      benefits: z.object({
        free_delivery: z.boolean().optional(),
        priority_support: z.boolean().optional(),
        birthday_reward: z.boolean().optional(),
        early_access: z.boolean().optional(),
      }).optional(),
      icon: z.string().max(8).optional(),
      color: z.string().max(7).optional(),
      active: z.boolean().optional(),
    }).parse(req.body);

    const update: Record<string, any> = {};
    if (body.name !== undefined) update.name = body.name;
    if (body.min_points !== undefined) update.minPoints = body.min_points;
    if (body.multiplier !== undefined) update.multiplier = body.multiplier;
    if (body.benefits !== undefined) update.benefits = body.benefits;
    if (body.icon !== undefined) update.icon = body.icon;
    if (body.color !== undefined) update.color = body.color;
    if (body.active !== undefined) update.isActive = body.active;

    const tier = await LoyaltyTier.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!tier) return notFound(res, "Tier not found");
    return ok(res, tier, "Tier updated");
  } catch (err: any) {
    if (err instanceof z.ZodError) return badRequest(res, err.errors, "Validation error");
    return badRequest(res, [], err.message);
  }
});

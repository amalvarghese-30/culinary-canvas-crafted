import { Router } from "express";
import { z } from "zod";
import { MenuItem } from "../models/MenuItem";
import { MenuAddon } from "../models/MenuAddon";
import { MenuCategory } from "../models/MenuCategory";
import { Order } from "../models/Order";
import { Review } from "../models/Review";
import { RestaurantTable } from "../models/RestaurantTable";
import { ok, notFound, badRequest } from "../lib/response";

export const publicRoutes = Router();

publicRoutes.get("/categories", async (_req, res) => {
  try {
    const data = await MenuCategory.find({ isActive: true }).sort({ sortOrder: 1 });
    return ok(res, data);
  } catch (err: any) {
    return notFound(res, err.message);
  }
});

publicRoutes.get("/menu", async (_req, res) => {
  try {
    const data = await MenuItem.find(
      { isAvailable: true },
      "name slug style variant description shortDescription price category subCategory filling pieceCount imageUrl galleryImages isVegetarian isVegan isGlutenFree isFeatured isBestSeller isChefSpecial spice badges sortOrder preparationTime ingredients nutritionalInfo tags"
    ).sort({ sortOrder: 1 });
    return ok(res, data);
  } catch (err: any) {
    return notFound(res, err.message);
  }
});

publicRoutes.get("/menu/addons", async (req, res) => {
  try {
    const ids = (req.query.ids as string)?.split(",").filter(Boolean) ?? [];
    if (ids.length === 0) return ok(res, []);
    const data = await MenuAddon.find(
      { menuItemId: { $in: ids }, isAvailable: true },
      "menuItemId name price"
    );
    return ok(res, data);
  } catch (err: any) {
    return notFound(res, err.message);
  }
});

publicRoutes.get("/menu/:slug", async (req, res) => {
  try {
    const data = await MenuItem.findOne({ slug: req.params.slug, isAvailable: true });
    if (!data) return notFound(res, "Product not found");
    const addons = await MenuAddon.find(
      { menuItemId: data._id, isAvailable: true },
      "name price"
    );
    return ok(res, { ...data.toJSON(), addons });
  } catch (err: any) {
    return notFound(res, err.message);
  }
});

publicRoutes.get("/reviews", async (_req, res) => {
  try {
    const data = await Review.find(
      { isVisible: true },
      "rating comment userId menuItemId createdAt"
    )
      .populate("userId", "fullName")
      .populate("menuItemId", "name style variant")
      .sort({ createdAt: -1 })
      .limit(20);
    return ok(res, data);
  } catch (err: any) {
    return notFound(res, err.message);
  }
});

publicRoutes.post("/contact", async (req, res) => {
  try {
    const body = z.object({
      name: z.string().trim().min(1).max(120),
      email: z.string().trim().email().max(200),
      phone: z.string().trim().max(20).optional(),
      message: z.string().trim().min(1).max(2000),
    }).parse(req.body);

    console.log(`[Contact] From: ${body.name} <${body.email}> — ${body.message.slice(0, 100)}`);
    return ok(res, null, "Message received. We'll get back to you soon.");
  } catch (err: any) {
    if (err instanceof z.ZodError) return badRequest(res, err.errors, "Validation error");
    return badRequest(res, [], err.message);
  }
});

publicRoutes.get("/tables/:id", async (req, res) => {
  try {
    const data = await RestaurantTable.findById(req.params.id, "name capacity isOccupied qrCode");
    return ok(res, data);
  } catch (err: any) {
    return notFound(res, err.message);
  }
});

publicRoutes.get("/orders/track", async (req, res) => {
  try {
    const { order_number, phone } = z.object({
      order_number: z.string().min(1),
      phone: z.string().min(7),
    }).parse(req.query);

    const order = await Order.findOne(
      { orderNumber: order_number, customerPhone: phone },
      "orderNumber status type total items customerName estimatedReadyAt createdAt notes"
    );
    if (!order) return notFound(res, "Order not found. Check the order number and phone number.");

    return ok(res, order);
  } catch (err: any) {
    if (err instanceof z.ZodError) return badRequest(res, err.errors, "Please provide order number and phone");
    return badRequest(res, [], err.message);
  }
});

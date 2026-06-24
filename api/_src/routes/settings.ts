import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth";
import { requireAdmin } from "../middleware/staff";
import { Settings } from "../models/Settings";
import { ok, badRequest, notFound } from "../lib/response";

export const settingsRoutes = Router();

settingsRoutes.get("/public", async (_req, res) => {
  try {
    let settings = await Promise.race([
      Settings.findOne({ isActive: true }),
      new Promise<null>((_, reject) => setTimeout(() => reject(new Error("DB_TIMEOUT")), 4000)),
    ]);
    if (!settings) {
      settings = await Settings.create({});
    }
    return ok(res, settings);
  } catch (err: any) {
    const defaults = {
      restaurantName: "Momo House",
      phone: "911234567890",
      phoneDisplay: "+91 12345 67890",
      address: "12 Lake Road, Khan Market, New Delhi 110003",
      hours: "Daily 11:00 AM – 11:30 PM",
      socialLinks: { instagram: "", facebook: "" },
    };
    return ok(res, defaults, "Defaults served");
  }
});

settingsRoutes.get("/", requireAuth, requireAdmin, async (_req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({});
    }
    return ok(res, settings);
  } catch (err: any) {
    return notFound(res, err.message);
  }
});

const settingsSchema = z.object({
  restaurant_name: z.string().min(1).max(120).optional(),
  tagline: z.string().max(200).nullable().optional(),
  phone: z.string().max(20).optional(),
  phone_display: z.string().max(30).nullable().optional(),
  email: z.string().email().max(200).nullable().optional().or(z.literal("")),
  address: z.string().max(300).optional(),
  city: z.string().max(80).nullable().optional(),
  pincode: z.string().max(12).nullable().optional(),
  hours: z.string().max(120).optional(),
  opening_time: z.string().max(10).nullable().optional(),
  closing_time: z.string().max(10).nullable().optional(),
  gstin: z.string().max(20).nullable().optional(),
  social_links: z.object({
    instagram: z.string().max(200).nullable().optional(),
    facebook: z.string().max(200).nullable().optional(),
    twitter: z.string().max(200).nullable().optional(),
    youtube: z.string().max(200).nullable().optional(),
  }).optional(),
  delivery_config: z.object({
    min_order: z.number().min(0).optional(),
    fee: z.number().min(0).optional(),
    free_threshold: z.number().min(0).optional(),
    estimated_time: z.string().max(50).optional(),
  }).optional(),
  meta: z.object({
    seo_title: z.string().max(120).nullable().optional(),
    seo_description: z.string().max(300).nullable().optional(),
    og_image: z.string().max(500).nullable().optional(),
  }).optional(),
  is_active: z.boolean().optional(),
});

settingsRoutes.put("/", requireAuth, requireAdmin, async (req, res) => {
  try {
    const body = settingsSchema.parse(req.body);
    const update: Record<string, any> = {};

    if (body.restaurant_name !== undefined) update.restaurantName = body.restaurant_name;
    if (body.tagline !== undefined) update.tagline = body.tagline;
    if (body.phone !== undefined) update.phone = body.phone;
    if (body.phone_display !== undefined) update.phoneDisplay = body.phone_display;
    if (body.email !== undefined) update.email = body.email || undefined;
    if (body.address !== undefined) update.address = body.address;
    if (body.city !== undefined) update.city = body.city;
    if (body.pincode !== undefined) update.pincode = body.pincode;
    if (body.hours !== undefined) update.hours = body.hours;
    if (body.opening_time !== undefined) update.openingTime = body.opening_time;
    if (body.closing_time !== undefined) update.closingTime = body.closing_time;
    if (body.gstin !== undefined) update.gstin = body.gstin;

    if (body.social_links) {
      const sl: Record<string, any> = {};
      if (body.social_links.instagram !== undefined) sl.instagram = body.social_links.instagram;
      if (body.social_links.facebook !== undefined) sl.facebook = body.social_links.facebook;
      if (body.social_links.twitter !== undefined) sl.twitter = body.social_links.twitter;
      if (body.social_links.youtube !== undefined) sl.youtube = body.social_links.youtube;
      update.socialLinks = sl;
    }

    if (body.delivery_config) {
      const dc: Record<string, any> = {};
      if (body.delivery_config.min_order !== undefined) dc.minOrderForDelivery = body.delivery_config.min_order;
      if (body.delivery_config.fee !== undefined) dc.deliveryFee = body.delivery_config.fee;
      if (body.delivery_config.free_threshold !== undefined) dc.freeDeliveryThreshold = body.delivery_config.free_threshold;
      if (body.delivery_config.estimated_time !== undefined) dc.estimatedTime = body.delivery_config.estimated_time;
      update.deliveryConfig = dc;
    }

    if (body.meta) {
      const m: Record<string, any> = {};
      if (body.meta.seo_title !== undefined) m.seoTitle = body.meta.seo_title;
      if (body.meta.seo_description !== undefined) m.seoDescription = body.meta.seo_description;
      if (body.meta.og_image !== undefined) m.ogImage = body.meta.og_image;
      update.meta = m;
    }

    if (body.is_active !== undefined) update.isActive = body.is_active;

    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create(update);
    } else {
      await Settings.updateOne({ _id: settings._id }, update);
    }
    return ok(res, null, "Settings updated");
  } catch (err: any) {
    if (err instanceof z.ZodError) return badRequest(res, err.errors, "Validation error");
    return badRequest(res, [], err.message);
  }
});

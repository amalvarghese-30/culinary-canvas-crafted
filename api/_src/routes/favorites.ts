import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth";
import { Favorite } from "../models/Favorite";
import { ok, badRequest } from "../lib/response";

export const favoriteRoutes = Router();

favoriteRoutes.get("/", requireAuth, async (req, res) => {
  try {
    const data = await Favorite.find({ userId: req.userId })
      .populate("menuItemId", "name style variant description price spice image badges")
      .sort({ createdAt: -1 });
    const result = data.map((f: any) => ({
      menu_item_id: f.menuItemId?._id,
      menuItems: f.menuItemId,
      created_at: f.createdAt,
    }));
    return ok(res, result);
  } catch (err: any) {
    return badRequest(res, [], err.message);
  }
});

favoriteRoutes.post("/toggle", requireAuth, async (req, res) => {
  try {
    const { menu_item_id } = z.object({ menu_item_id: z.string().min(1) }).parse(req.body);

    const existing = await Favorite.findOne({ userId: req.userId, menuItemId: menu_item_id });
    if (existing) {
      await Favorite.deleteOne({ userId: req.userId, menuItemId: menu_item_id });
      return ok(res, { favorited: false }, "Removed from favorites");
    }
    await Favorite.create({ userId: req.userId, menuItemId: menu_item_id });
    return ok(res, { favorited: true }, "Added to favorites");
  } catch (err: any) {
    if (err instanceof z.ZodError) return badRequest(res, err.errors, "Validation error");
    return badRequest(res, [], err.message);
  }
});

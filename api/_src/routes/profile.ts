import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth";
import { User } from "../models/User";
import { ok, badRequest, notFound } from "../lib/response";

export const profileRoutes = Router();

profileRoutes.get("/", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.userId, "fullName phone email defaultAddressLine defaultCity defaultPincode");
    if (!user) return notFound(res, "User not found");
    return ok(res, {
      id: user._id,
      full_name: user.fullName,
      phone: user.phone,
      email: user.email,
      default_address_line: user.defaultAddressLine,
      default_city: user.defaultCity,
      default_pincode: user.defaultPincode,
    });
  } catch (err: any) {
    return badRequest(res, [], err.message);
  }
});

profileRoutes.patch("/", requireAuth, async (req, res) => {
  try {
    const body = z.object({
      full_name: z.string().trim().max(120).optional().nullable(),
      phone: z.string().trim().max(20).optional().nullable(),
      email: z.string().trim().email().max(200).optional().nullable().or(z.literal("")),
      default_address_line: z.string().trim().max(300).optional().nullable(),
      default_city: z.string().trim().max(80).optional().nullable(),
      default_pincode: z.string().trim().max(12).optional().nullable(),
    }).parse(req.body);

    const update: Record<string, any> = {};
    if (body.full_name !== undefined) update.fullName = body.full_name;
    if (body.phone !== undefined) update.phone = body.phone;
    if (body.email !== undefined) update.email = body.email || undefined;
    if (body.default_address_line !== undefined) update.defaultAddressLine = body.default_address_line;
    if (body.default_city !== undefined) update.defaultCity = body.default_city;
    if (body.default_pincode !== undefined) update.defaultPincode = body.default_pincode;

    await User.findByIdAndUpdate(req.userId, update);
    return ok(res, null, "Profile updated");
  } catch (err: any) {
    if (err instanceof z.ZodError) return badRequest(res, err.errors, "Validation error");
    return badRequest(res, [], err.message);
  }
});

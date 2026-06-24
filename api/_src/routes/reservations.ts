import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth";
import { Reservation } from "../models/Reservation";
import { ok, created, badRequest, tooMany } from "../lib/response";

export const reservationRoutes = Router();

reservationRoutes.post("/", async (req, res) => {
  try {
    const data = z.object({
      full_name: z.string().trim().min(1).max(120),
      phone: z.string().trim().min(7).max(20),
      email: z.string().trim().email().max(200).optional().nullable(),
      party_size: z.number().int().min(1).max(20),
      reservation_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      reservation_time: z.string().regex(/^\d{2}:\d{2}$/),
      special_requests: z.string().trim().max(500).optional().nullable(),
      website: z.string().max(0).optional().nullable(),
      user_id: z.string().optional().nullable(),
    }).parse(req.body);

    if (data.website) return ok(res, { id: "blocked", status: "pending" }, "Request received");

    const reqDate = new Date(`${data.reservation_date}T${data.reservation_time}:00`);
    if (reqDate.getTime() < Date.now() - 60_000) {
      return badRequest(res, [], "Reservation date/time must be in the future");
    }

    const since = new Date(Date.now() - 24 * 3600_000);
    const count = await Reservation.countDocuments({
      phone: data.phone,
      createdAt: { $gte: since },
    });
    if (count >= 5) {
      return tooMany(res, "Too many reservation requests. Please contact us directly.");
    }

    const row = await Reservation.create({
      userId: data.user_id ?? undefined,
      guestName: data.full_name,
      guestPhone: data.phone,
      guestEmail: data.email ?? undefined,
      partySize: data.party_size,
      reservationDate: new Date(data.reservation_date),
      reservationTime: data.reservation_time,
      notes: data.special_requests ?? undefined,
    });

    return created(res, {
      id: row._id,
      status: row.status,
      reservation_date: data.reservation_date,
      reservation_time: data.reservation_time,
      party_size: row.partySize,
      full_name: row.guestName,
    }, "Reservation request received");
  } catch (err: any) {
    if (err instanceof z.ZodError) return badRequest(res, err.errors, "Validation error");
    return badRequest(res, [], err.message);
  }
});

reservationRoutes.get("/mine", requireAuth, async (req, res) => {
  try {
    const data = await Reservation.find({ userId: req.userId })
      .sort({ reservationDate: -1, reservationTime: -1 });
    return ok(res, data);
  } catch (err: any) {
    return badRequest(res, [], err.message);
  }
});

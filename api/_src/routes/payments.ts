import { Router } from "express";
import { z } from "zod";
import crypto from "crypto";
import Razorpay from "razorpay";
import { requireAuth } from "../middleware/auth";
import { ok, created, badRequest, forbidden, serverError } from "../lib/response";

const KEY_ID = process.env.RAZORPAY_KEY_ID || "";
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || "";

let _razorpay: Razorpay | null = null;
function getRazorpay(): Razorpay {
  if (!_razorpay) {
    if (!KEY_ID || !KEY_SECRET) throw new Error("Razorpay not configured — set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET");
    _razorpay = new Razorpay({ key_id: KEY_ID, key_secret: KEY_SECRET });
  }
  return _razorpay;
}

export const paymentRoutes = Router();

paymentRoutes.post("/create-order", requireAuth, async (req, res) => {
  try {
    const body = z.object({
      amount: z.number().int().positive().max(10_000_00),
      currency: z.string().length(3).default("INR"),
      notes: z.record(z.string()).optional(),
    }).parse(req.body);

    const order = await getRazorpay().orders.create({
      amount: body.amount,
      currency: body.currency,
      receipt: `rcpt_${Date.now()}_${req.userId?.slice(-6)}`,
      notes: body.notes ?? {},
    });

    return created(res, {
      id: order.id,
      amount: Number(order.amount),
      currency: order.currency,
      key_id: KEY_ID,
    }, "Razorpay order created");
  } catch (err: any) {
    if (err instanceof z.ZodError) return badRequest(res, err.errors, "Validation error");
    console.error("[razorpay create]", err);
    return serverError(res, err.description || err.message || "Payment gateway error");
  }
});

paymentRoutes.post("/verify", requireAuth, async (req, res) => {
  try {
    const body = z.object({
      razorpay_order_id: z.string().min(1),
      razorpay_payment_id: z.string().min(1),
      razorpay_signature: z.string().min(1),
    }).parse(req.body);

    const generated = crypto
      .createHmac("sha256", KEY_SECRET)
      .update(`${body.razorpay_order_id}|${body.razorpay_payment_id}`)
      .digest("hex");

    if (generated !== body.razorpay_signature) {
      return badRequest(res, [], "Payment verification failed — signature mismatch");
    }

    return ok(res, {
      order_id: body.razorpay_order_id,
      payment_id: body.razorpay_payment_id,
      verified: true,
    }, "Payment verified");
  } catch (err: any) {
    if (err instanceof z.ZodError) return badRequest(res, err.errors, "Validation error");
    return serverError(res, err.message || "Verification error");
  }
});

paymentRoutes.get("/key", (_req, res) => {
  return ok(res, { key_id: KEY_ID });
});

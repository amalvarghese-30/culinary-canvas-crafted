import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { User } from "../models/User";
import { signAccessToken, signRefreshToken, verifyRefreshToken, hashToken, compareToken, signResetToken, verifyResetToken } from "../lib/jwt";
import { requireAuth } from "../middleware/auth";
import { ok, created, badRequest, unauthorized, notFound, serverError } from "../lib/response";

function sanitizeUser(user: any) {
  const u = user.toObject ? user.toObject() : user;
  const { passwordHash, refreshToken, ...safe } = u;
  return safe;
}

function zodFieldErrors(err: z.ZodError) {
  return err.errors.map((e) => ({
    field: e.path.join("."),
    message: e.message,
  }));
}

export const authRoutes = Router();

authRoutes.post("/signup", async (req, res) => {
  try {
    const { email, password, fullName } = z
      .object({
        email: z.string().email().toLowerCase(),
        password: z.string().min(6),
        fullName: z.string().min(1),
      })
      .parse(req.body);

    const existing = await User.findOne({ email });
    if (existing) return badRequest(res, [{ field: "email", message: "Email already registered" }], "Email already registered");

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ email, passwordHash, fullName, roles: ["customer"] });

    const accessToken = signAccessToken(user._id.toString(), user.roles);
    const refreshToken = signRefreshToken(user._id.toString());
    user.refreshToken = await hashToken(refreshToken);
    await user.save();

    return created(res, { accessToken, refreshToken, user: sanitizeUser(user) }, "Account created");
  } catch (err: any) {
    if (err instanceof z.ZodError) return badRequest(res, zodFieldErrors(err), "Validation error");
    if (err.code === 11000) return badRequest(res, [{ field: "email", message: "Email already registered" }], "Email already registered");
    return serverError(res, err.message);
  }
});

authRoutes.post("/signin", async (req, res) => {
  try {
    const { email, password } = z
      .object({
        email: z.string().email().toLowerCase(),
        password: z.string().min(1),
      })
      .parse(req.body);

    const user = await User.findOne({ email });
    if (!user || !user.passwordHash) return unauthorized(res, "Invalid email or password");

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return unauthorized(res, "Invalid email or password");

    const accessToken = signAccessToken(user._id.toString(), user.roles);
    const refreshToken = signRefreshToken(user._id.toString());
    user.refreshToken = await hashToken(refreshToken);
    await user.save();

    return ok(res, { accessToken, refreshToken, user: sanitizeUser(user) }, "Signed in");
  } catch (err: any) {
    if (err instanceof z.ZodError) return badRequest(res, zodFieldErrors(err), "Validation error");
    return serverError(res, err.message);
  }
});

authRoutes.post("/refresh", async (req, res) => {
  try {
    const { refreshToken } = z.object({ refreshToken: z.string() }).parse(req.body);
    const { userId } = verifyRefreshToken(refreshToken);

    const user = await User.findById(userId);
    if (!user || !user.refreshToken) return unauthorized(res, "Invalid refresh token");

    const valid = await compareToken(refreshToken, user.refreshToken);
    if (!valid) return unauthorized(res, "Invalid refresh token");

    const newAccess = signAccessToken(user._id.toString(), user.roles);
    const newRefresh = signRefreshToken(user._id.toString());
    user.refreshToken = await hashToken(newRefresh);
    await user.save();

    return ok(res, { accessToken: newAccess, refreshToken: newRefresh, user: sanitizeUser(user) }, "Token refreshed");
  } catch (err: any) {
    if (err instanceof z.ZodError) return badRequest(res, zodFieldErrors(err), "Validation error");
    return serverError(res, err.message);
  }
});

authRoutes.post("/google", async (req, res) => {
  try {
    const { googleId, email, fullName, accessToken: googleAccessToken } = z
      .object({
        googleId: z.string(),
        email: z.string().email().toLowerCase(),
        fullName: z.string().optional(),
        accessToken: z.string().optional(),
      })
      .parse(req.body);

    const lovableApiKey = process.env.LOVABLE_API_KEY;
    if (!lovableApiKey) {
      return unauthorized(res, "LOVABLE_API_KEY not configured");
    }

    const verifyRes = await fetch("https://api.lovable.dev/auth/google/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${lovableApiKey}` },
      body: JSON.stringify({ accessToken: googleAccessToken, googleId }),
    });

    if (!verifyRes.ok) {
      return unauthorized(res, "Google token verification failed");
    }

    let user = await User.findOne({ googleId });
    if (!user) {
      user = await User.findOne({ email });
      if (user) {
        user.googleId = googleId;
      } else {
        user = new User({ email, fullName: fullName || email.split("@")[0], googleId, roles: ["customer"] });
      }
    }

    const accessToken = signAccessToken(user._id.toString(), user.roles);
    const refreshToken = signRefreshToken(user._id.toString());
    user.refreshToken = await hashToken(refreshToken);
    await user.save();

    return ok(res, { accessToken, refreshToken, user: sanitizeUser(user) }, "Google sign-in successful");
  } catch (err: any) {
    if (err instanceof z.ZodError) return badRequest(res, zodFieldErrors(err), "Validation error");
    return serverError(res, err.message);
  }
});

authRoutes.post("/signout", requireAuth, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.userId, { $unset: { refreshToken: 1 } });
    return ok(res, null, "Signed out");
  } catch (err: any) {
    return serverError(res, err.message);
  }
});

authRoutes.get("/profile", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return notFound(res, "User not found");
    return ok(res, sanitizeUser(user));
  } catch (err: any) {
    return serverError(res, err.message);
  }
});

authRoutes.post("/forgot-password", async (req, res) => {
  try {
    const { email } = z.object({ email: z.string().email().toLowerCase() }).parse(req.body);
    const user = await User.findOne({ email });
    if (!user) return ok(res, null, "If that email exists, a reset link has been sent");

    const token = signResetToken(user._id.toString());
    user.resetPasswordToken = await hashToken(token);
    user.resetPasswordExpires = new Date(Date.now() + 3600_000);
    await user.save();

    const resetUrl = `${process.env.CLIENT_URL || "http://localhost:5173"}/reset-password?token=${token}`;
    console.log(`[Forgot Password] Reset URL for ${email}: ${resetUrl}`);

    return ok(res, null, "If that email exists, a reset link has been sent");
  } catch (err: any) {
    if (err instanceof z.ZodError) return badRequest(res, zodFieldErrors(err), "Validation error");
    return badRequest(res, [], err.message);
  }
});

authRoutes.post("/reset-password", async (req, res) => {
  try {
    const { token, password } = z.object({
      token: z.string().min(1),
      password: z.string().min(6),
    }).parse(req.body);

    let userId: string;
    try {
      ({ userId } = verifyResetToken(token));
    } catch {
      return badRequest(res, [], "Reset link has expired or is invalid");
    }

    const user = await User.findById(userId);
    if (!user || !user.resetPasswordToken || !user.resetPasswordExpires) {
      return badRequest(res, [], "Reset link has expired or is invalid");
    }

    if (user.resetPasswordExpires.getTime() < Date.now()) {
      return badRequest(res, [], "Reset link has expired");
    }

    const valid = await compareToken(token, user.resetPasswordToken);
    if (!valid) return badRequest(res, [], "Reset link has expired or is invalid");

    user.passwordHash = await bcrypt.hash(password, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    user.refreshToken = undefined;
    await user.save();

    return ok(res, null, "Password has been reset. Please sign in.");
  } catch (err: any) {
    if (err instanceof z.ZodError) return badRequest(res, zodFieldErrors(err), "Validation error");
    return badRequest(res, [], err.message);
  }
});

import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const JWT_SECRET = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET environment variable is required");
  return secret;
};
const JWT_REFRESH_SECRET = () => {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) throw new Error("JWT_REFRESH_SECRET environment variable is required");
  return secret;
};

export function signAccessToken(userId: string, roles: string[]) {
  return jwt.sign({ sub: userId, roles }, JWT_SECRET(), { expiresIn: "15m" });
}

export function signRefreshToken(userId: string) {
  return jwt.sign({ sub: userId }, JWT_REFRESH_SECRET(), { expiresIn: "7d" });
}

export function verifyAccessToken(token: string): { userId: string; roles: string[] } {
  const payload = jwt.verify(token, JWT_SECRET()) as { sub: string; roles: string[] };
  return { userId: payload.sub, roles: payload.roles ?? [] };
}

export function verifyRefreshToken(token: string): { userId: string } {
  const payload = jwt.verify(token, JWT_REFRESH_SECRET()) as { sub: string };
  return { userId: payload.sub };
}

export function signResetToken(userId: string) {
  return jwt.sign({ sub: userId, purpose: "reset" }, JWT_SECRET(), { expiresIn: "1h" });
}

export function verifyResetToken(token: string): { userId: string } {
  const payload = jwt.verify(token, JWT_SECRET()) as { sub: string; purpose: string };
  if (payload.purpose !== "reset") throw new Error("Invalid token purpose");
  return { userId: payload.sub };
}

export async function hashToken(token: string) {
  return bcrypt.hash(token, 10);
}

export async function compareToken(token: string, hash: string) {
  return bcrypt.compare(token, hash);
}

import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../lib/jwt";

declare global {
  namespace Express {
    interface Request {
      userId: string;
      userRoles: string[];
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "Unauthorized: No authorization header" });
  if (!authHeader.startsWith("Bearer ")) return res.status(401).json({ error: "Unauthorized: Only Bearer tokens supported" });

  const token = authHeader.replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "Unauthorized: No token provided" });
  if (token.split(".").length !== 3) return res.status(401).json({ error: "Unauthorized: Invalid token" });

  try {
    const { userId, roles } = verifyAccessToken(token);
    req.userId = userId;
    req.userRoles = roles;
    next();
  } catch {
    return res.status(401).json({ error: "Unauthorized: Invalid or expired token" });
  }
}

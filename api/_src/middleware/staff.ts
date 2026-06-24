import { Request, Response, NextFunction } from "express";
import { forbidden } from "../lib/response";

export function requireStaff(req: Request, res: Response, next: NextFunction) {
  const { userRoles } = req;
  if (!userRoles || (!userRoles.includes("staff") && !userRoles.includes("admin"))) {
    return forbidden(res, "Staff access required");
  }
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const { userRoles } = req;
  if (!userRoles || !userRoles.includes("admin")) {
    return forbidden(res, "Admin access required");
  }
  next();
}

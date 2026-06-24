import { Response } from "express";

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T | null;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  errors?: any[];
  timestamp: string;
}

function base(success: boolean, message: string): Pick<ApiResponse, "success" | "message" | "timestamp"> {
  return { success, message, timestamp: new Date().toISOString() };
}

export function ok<T>(res: Response, data: T, message = "OK", status = 200) {
  return res.status(status).json({ ...base(true, message), data, errors: undefined, pagination: undefined });
}

export function okPaginated<T>(
  res: Response,
  data: T[],
  pagination: { page: number; limit: number; total: number },
  message = "OK",
) {
  const totalPages = Math.ceil(pagination.total / pagination.limit);
  return res.status(200).json({
    ...base(true, message),
    data,
    pagination: { ...pagination, totalPages },
    errors: undefined,
  });
}

export function created<T>(res: Response, data: T, message = "Created") {
  return res.status(201).json({ ...base(true, message), data, errors: undefined, pagination: undefined });
}

export function badRequest(res: Response, errors: any[], message = "Validation error") {
  const normalized = errors.map((e) => {
    if (e.field !== undefined) return e;
    const path = Array.isArray(e.path) ? e.path.join(".") : e.path;
    return { field: path || "", message: e.message };
  });
  return res.status(400).json({ ...base(false, message), data: null, errors: normalized, pagination: undefined });
}

export function unauthorized(res: Response, message = "Unauthorized") {
  return res.status(401).json({ ...base(false, message), data: null, errors: undefined, pagination: undefined });
}

export function forbidden(res: Response, message = "Forbidden") {
  return res.status(403).json({ ...base(false, message), data: null, errors: undefined, pagination: undefined });
}

export function notFound(res: Response, message = "Not found") {
  return res.status(404).json({ ...base(false, message), data: null, errors: undefined, pagination: undefined });
}

export function conflict(res: Response, message = "Conflict") {
  return res.status(409).json({ ...base(false, message), data: null, errors: undefined, pagination: undefined });
}

export function tooMany(res: Response, message = "Too many requests") {
  return res.status(429).json({ ...base(false, message), data: null, errors: undefined, pagination: undefined });
}

export function serverError(res: Response, message = "Internal server error") {
  return res.status(500).json({ ...base(false, message), data: null, errors: undefined, pagination: undefined });
}

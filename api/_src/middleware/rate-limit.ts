import { Request, Response, NextFunction } from "express";

interface Window {
  count: number;
  resetAt: number;
}

function rateLimiter(opts: { windowMs: number; max: number; message?: string }) {
  const store = new Map<string, Window>();

  // Cleanup stale entries every 5 minutes
  const cleanInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, w] of store) {
      if (now > w.resetAt) store.delete(key);
    }
  }, 300_000);
  if (cleanInterval.unref) cleanInterval.unref();

  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.ip || req.socket.remoteAddress || "unknown";
    const now = Date.now();
    let w = store.get(key);

    if (!w || now > w.resetAt) {
      w = { count: 0, resetAt: now + opts.windowMs };
      store.set(key, w);
    }

    w.count++;

    res.setHeader("X-RateLimit-Limit", opts.max);
    res.setHeader("X-RateLimit-Remaining", Math.max(0, opts.max - w.count));
    res.setHeader("X-RateLimit-Reset", Math.ceil(w.resetAt / 1000));

    if (w.count > opts.max) {
      const retryAfter = Math.ceil((w.resetAt - now) / 1000);
      res.setHeader("Retry-After", retryAfter);
      return res.status(429).json({
        success: false,
        message: opts.message || "Too many requests, please try again later.",
        data: null,
        errors: [{ message: `Rate limit exceeded. Retry after ${retryAfter}s.` }],
        timestamp: new Date().toISOString(),
      });
    }

    next();
  };
}

export const authLimiter = rateLimiter({
  windowMs: 60_000,
  max: 10,
  message: "Too many auth attempts. Please wait and try again.",
});

export const generalLimiter = rateLimiter({
  windowMs: 60_000,
  max: 100,
  message: "Too many requests. Please slow down.",
});

export const strictLimiter = rateLimiter({
  windowMs: 60_000,
  max: 5,
  message: "Too many attempts. Please try again later.",
});

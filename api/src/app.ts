import express from "express";
import cors from "cors";
import { authLimiter, generalLimiter, strictLimiter } from "./middleware/rate-limit";
import { adminRoutes } from "./routes/admin";
import { publicRoutes } from "./routes/public";
import { orderRoutes } from "./routes/orders";
import { profileRoutes } from "./routes/profile";
import { notificationRoutes } from "./routes/notifications";
import { reservationRoutes } from "./routes/reservations";
import { favoriteRoutes } from "./routes/favorites";
import { branchRoutes } from "./routes/branches";
import { shiftRoutes } from "./routes/shifts";
import { campaignRoutes } from "./routes/campaigns";
import { promoRoutes } from "./routes/promotions";
import { aiRoutes } from "./routes/ai";
import { businessAiRoutes } from "./routes/business-ai";
import { forecastRoutes } from "./routes/forecasting";
import { whatsappRoutes } from "./routes/whatsapp";
import { pushRoutes } from "./routes/push";
import { auditRoutes } from "./routes/audit";
import { loyaltyRoutes } from "./routes/loyalty";
import { settingsRoutes } from "./routes/settings";
import { paymentRoutes } from "./routes/payments";
import { integrationRoutes } from "./routes/integrations";
import { authRoutes } from "./routes/auth";

export function createApp() {
  const app = express();

  const clientUrl = process.env.CLIENT_URL || process.env.BASE_URL;
  const trustedOrigins = [
    "http://localhost:5173",
    "http://localhost:4173",
    clientUrl,
  ].filter(Boolean) as string[];

  app.use(cors({
    origin(origin, cb) {
      // Allow requests with no origin (server-to-server, curl, mobile apps)
      if (!origin) return cb(null, true);
      // Allow trusted origins + Vercel preview deployments
      if (trustedOrigins.includes(origin) || /\.vercel\.app$/.test(origin)) {
        return cb(null, true);
      }
      cb(new Error("Not allowed by CORS"));
    },
    credentials: true,
  }));
  app.use(express.json());

  app.use("/api/auth", authLimiter, authRoutes);
  app.use("/api/admin", generalLimiter, adminRoutes);
  app.use("/api/public", generalLimiter, publicRoutes);
  app.use("/api/orders", generalLimiter, orderRoutes);
  app.use("/api/profile", generalLimiter, profileRoutes);
  app.use("/api/notifications", generalLimiter, notificationRoutes);
  app.use("/api/reservations", generalLimiter, reservationRoutes);
  app.use("/api/favorites", generalLimiter, favoriteRoutes);
  app.use("/api/branches", generalLimiter, branchRoutes);
  app.use("/api/shifts", generalLimiter, shiftRoutes);
  app.use("/api/campaigns", generalLimiter, campaignRoutes);
  app.use("/api/promotions", generalLimiter, promoRoutes);
  app.use("/api/ai", strictLimiter, aiRoutes);
  app.use("/api/business-ai", strictLimiter, businessAiRoutes);
  app.use("/api/forecasting", generalLimiter, forecastRoutes);
  app.use("/api/whatsapp", generalLimiter, whatsappRoutes);
  app.use("/api/push", generalLimiter, pushRoutes);
  app.use("/api/audit", generalLimiter, auditRoutes);
  app.use("/api/loyalty", generalLimiter, loyaltyRoutes);
  app.use("/api/settings", generalLimiter, settingsRoutes);
  app.use("/api/payments", generalLimiter, paymentRoutes);
  app.use("/api/integrations", generalLimiter, integrationRoutes);

  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error("[api error]", err.message ?? err);
    const status = err.status || err.statusCode || 500;
    const message = err.expose ? err.message : "Internal server error";
    res.status(status).json({ error: message });
  });

  app.use((_req: express.Request, res: express.Response) => {
    res.status(404).json({ error: "Not found" });
  });

  return app;
}

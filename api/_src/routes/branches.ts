import { Router } from "express";
import { Branch } from "../models/Branch";

export const branchRoutes = Router();

branchRoutes.get("/", async (_req, res) => {
  try {
    const data = await Branch.find({ isActive: true }).sort({ name: 1 });
    return res.json(data);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

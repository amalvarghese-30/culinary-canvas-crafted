import { createApp } from "./app";
import { connectDB } from "./lib/db";
import { LoyaltyTier } from "./models/LoyaltyTier";
import { MenuCategory } from "./models/MenuCategory";
import { MenuItem } from "./models/MenuItem";
import { User } from "./models/User";
import bcrypt from "bcryptjs";

// Load .env from api directory (Node 21+)
try { process.loadEnvFile?.("./.env"); } catch {}

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    console.log("[seed] ADMIN_EMAIL or ADMIN_PASSWORD not set — skipping admin seed.");
    return;
  }
  const existing = await User.findOne({ email });
  if (existing) {
    if (!existing.roles.includes("admin")) {
      existing.roles.push("admin");
      await existing.save();
      console.log(`[seed] Admin role added to ${email}`);
    } else {
      console.log(`[seed] Admin ${email} already exists.`);
    }
    return;
  }
  const hash = await bcrypt.hash(password, 10);
  await User.create({ email, passwordHash: hash, fullName: "Admin", roles: ["customer", "admin", "staff"] });
  console.log(`[seed] Admin user created: ${email}`);
}

async function seedLoyaltyTiers() {
  const defaults = [
    { name: "Silver", minPoints: 0, multiplier: 1, benefits: { freeDelivery: false, prioritySupport: false, birthdayReward: false, earlyAccess: false }, icon: "🥈", color: "#C0C0C0" },
    { name: "Gold", minPoints: 500, multiplier: 1.5, benefits: { freeDelivery: true, prioritySupport: false, birthdayReward: true, earlyAccess: false }, icon: "🥇", color: "#C78A2C" },
    { name: "Platinum", minPoints: 2000, multiplier: 2, benefits: { freeDelivery: true, prioritySupport: true, birthdayReward: true, earlyAccess: true }, icon: "💎", color: "#E5E4E2" },
  ];
  for (const t of defaults) {
    await LoyaltyTier.findOneAndUpdate({ name: t.name }, { $setOnInsert: t }, { upsert: true });
  }
}

async function seedMenu() {
  // Always upsert categories so they exist regardless of item state
  const catDefs = [
    { name: "Steam Momos", slug: "steam-momos" },
    { name: "Fried Momos", slug: "fried-momos" },
    { name: "Kurkure Momos", slug: "kurkure-momos" },
    { name: "Peri Peri Momos", slug: "peri-peri-momos" },
    { name: "Pan Fried Momos", slug: "pan-fried-momos" },
  ];
  for (const c of catDefs) {
    await MenuCategory.findOneAndUpdate(
      { slug: c.slug },
      { $setOnInsert: { name: c.name, slug: c.slug, isActive: true, sortOrder: 0 } },
      { upsert: true }
    );
  }
  console.log(`[seed] Categories ready (${catDefs.length}).`);

  const count = await MenuItem.countDocuments({ isAvailable: true });
  if (count > 0) {
    console.log(`[seed] ${count} menu items already available — skipping item seed.`);
    return;
  }

  console.log("[seed] No menu items found — seeding defaults...");

  const fillings = [
    { variant: "Veg", vegetarian: true, vegan: true },
    { variant: "Paneer", vegetarian: true, vegan: false },
    { variant: "Chicken", vegetarian: false, vegan: false },
  ];
  const styles = [
    { style: "Steam", category: "Steam Momos", basePrice: 79 },
    { style: "Fried", category: "Fried Momos", basePrice: 79 },
    { style: "Kurkure", category: "Kurkure Momos", basePrice: 99 },
    { style: "Peri Peri", category: "Peri Peri Momos", basePrice: 109 },
  ];

  let order = 0;
  for (const s of styles) {
    for (const f of fillings) {
      let price = s.basePrice;
      if (f.variant === "Paneer") price += 20;
      if (f.variant === "Chicken") price += 30;
      await MenuItem.create({
        style: s.style, variant: f.variant, category: s.category,
        name: `${f.variant} ${s.style} Momo`,
        slug: `${f.variant.toLowerCase()}-${s.style.toLowerCase()}-momo`,
        price, isAvailable: true, isVegetarian: f.vegetarian, isVegan: f.vegan,
        spice: s.style === "Peri Peri" ? 4 : s.style === "Kurkure" ? 3 : 1,
        description: `Hand-folded ${s.style.toLowerCase()} momos with ${f.variant.toLowerCase()} filling.`,
        sortOrder: order, preparationTime: 10,
        tags: ["momo", s.style.toLowerCase(), f.variant.toLowerCase()],
      });
      order += 10;
    }
  }

  console.log(`[seed] Created ${order / 10} menu items.`);
}

async function main() {
  await connectDB();
  await seedLoyaltyTiers();
  await seedMenu();
  await seedAdmin();
  const app = createApp();
  const port = Number(process.env.PORT) || 8787;
  app.listen(port, () => {
    console.log(`Express API server running on http://localhost:${port}`);
  });
}

main();

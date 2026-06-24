import { connectDB } from "./lib/db";
import { MenuCategory } from "./models/MenuCategory";
import { MenuItem } from "./models/MenuItem";

try { process.loadEnvFile?.("./.env"); } catch {}

type Seeded = { name: string; slug: string; parent?: string };

async function seed() {
  await connectDB();

  // ── Categories (from CLIENT_MENU_STRUCTURE.md) ──
  const categories: Seeded[] = [
    { name: "Steam Momos", slug: "steam-momos" },
    { name: "Fried Momos", slug: "fried-momos" },
    { name: "Kurkure Momos", slug: "kurkure-momos" },
    { name: "Peri Peri Momos", slug: "peri-peri-momos" },
    { name: "Pan Fried Momos", slug: "pan-fried-momos" },
    { name: "Platter Momos", slug: "platter-momos" },
  ];

  const panFriedSubs: Seeded[] = [
    { name: "Jhol Momo", slug: "jhol-momo", parent: "Pan Fried Momos" },
    { name: "Darjeeling Momo", slug: "darjeeling-momo", parent: "Pan Fried Momos" },
    { name: "Chilli Momo", slug: "chilli-momo", parent: "Pan Fried Momos" },
    { name: "Schezwan Momo", slug: "schezwan-momo", parent: "Pan Fried Momos" },
    { name: "Hot Garlic Momo", slug: "hot-garlic-momo", parent: "Pan Fried Momos" },
    { name: "Tandoori Momo", slug: "tandoori-momo", parent: "Pan Fried Momos" },
    { name: "Melted Cheese Momo", slug: "melted-cheese-momo", parent: "Pan Fried Momos" },
  ];

  console.log("Seeding categories...");
  const catMap = new Map<string, string>(); // name -> _id

  for (const c of categories) {
    const existing = await MenuCategory.findOne({ slug: c.slug });
    if (existing) {
      catMap.set(c.name, existing._id.toString());
      console.log(`  ✓ ${c.name} (exists)`);
    } else {
      const created = await MenuCategory.create(c);
      catMap.set(c.name, created._id.toString());
      console.log(`  + ${c.name}`);
    }
  }

  for (const s of panFriedSubs) {
    const parentId = catMap.get(s.parent!);
    const existing = await MenuCategory.findOne({ slug: s.slug });
    if (existing) {
      catMap.set(s.name, existing._id.toString());
      console.log(`  ✓ ${s.name} (exists)`);
    } else {
      const created = await MenuCategory.create({ ...s, parentId });
      catMap.set(s.name, created._id.toString());
      console.log(`  + ${s.name} (sub of ${s.parent})`);
    }
  }

  console.log(`\n${catMap.size} categories total.\n`);

  // ── Products ──
  // Fillings: Veg, Veg Cheese, Paneer, Paneer Cheese, Corn Cheese, Chicken, Chicken Cheese
  type Filling = { variant: string; vegetarian: boolean; vegan: boolean };
  const fillingsStandard: Filling[] = [
    { variant: "Veg", vegetarian: true, vegan: true },
    { variant: "Paneer", vegetarian: true, vegan: false },
    { variant: "Chicken", vegetarian: false, vegan: false },
  ];

  const fillingsExtended: Filling[] = [
    { variant: "Veg", vegetarian: true, vegan: true },
    { variant: "Veg Cheese", vegetarian: true, vegan: false },
    { variant: "Paneer", vegetarian: true, vegan: false },
    { variant: "Paneer Cheese", vegetarian: true, vegan: false },
    { variant: "Corn Cheese", vegetarian: true, vegan: false },
    { variant: "Chicken", vegetarian: false, vegan: false },
    { variant: "Chicken Cheese", vegetarian: false, vegan: false },
  ];

  const spiceMap: Record<string, number> = {
    Steam: 1, "Fried": 1, "Kurkure": 3, "Peri Peri": 4,
    Jhol: 2, Darjeeling: 1, Chilli: 3, Schezwan: 4, "Hot Garlic": 4,
    Tandoori: 3, "Melted Cheese": 1,
  };

  // 4 categories with extended fillings
  const styleFillings: { style: string; category: string; fillings: Filling[] }[] = [
    { style: "Steam", category: "Steam Momos", fillings: fillingsExtended },
    { style: "Fried", category: "Fried Momos", fillings: fillingsExtended },
    { style: "Kurkure", category: "Kurkure Momos", fillings: fillingsExtended },
    { style: "Peri Peri", category: "Peri Peri Momos", fillings: fillingsExtended },
  ];

  // Pan Fried: 7 flavors × 3 fillings
  const panFriedFlavors = ["Jhol", "Darjeeling", "Chilli", "Schezwan", "Hot Garlic", "Tandoori", "Melted Cheese"];

  interface ProductSeed {
    style: string;
    category: string;
    variant: string;
    name: string;
    slug: string;
    price: number;
    vegetarian: boolean;
    vegan: boolean;
    spice: number;
    badges: string[];
    filling: string;
  }

  const products: ProductSeed[] = [];

  for (const sf of styleFillings) {
    for (const f of sf.fillings) {
      let price = 0;
      if (f.variant === "Veg") price = sf.style === "Peri Peri" ? 109 : sf.style === "Kurkure" ? 99 : 79;
      else if (f.variant.includes("Cheese")) price = sf.style === "Peri Peri" ? 149 : sf.style === "Kurkure" ? 139 : 119;
      else if (f.variant === "Paneer") price = sf.style === "Peri Peri" ? 129 : sf.style === "Kurkure" ? 119 : 99;
      else if (f.variant === "Chicken") price = sf.style === "Peri Peri" ? 139 : sf.style === "Kurkure" ? 129 : 109;
      else if (f.variant === "Corn Cheese") price = sf.style === "Peri Peri" ? 139 : sf.style === "Kurkure" ? 129 : 109;

      products.push({
        style: sf.style,
        category: sf.category,
        variant: f.variant,
        name: `${f.variant} ${sf.style} Momo`,
        slug: `${f.variant.toLowerCase().replace(/\s+/g, "-")}-${sf.style.toLowerCase().replace(/\s+/g, "-")}-momo`,
        price,
        vegetarian: f.vegetarian,
        vegan: f.vegan,
        spice: spiceMap[sf.style] ?? 1,
        badges: sf.style === "Peri Peri" ? ["Chef Special"] : [],
        filling: f.variant,
      });
    }
  }

  for (const flavor of panFriedFlavors) {
    for (const f of fillingsStandard) {
      let price = 0;
      if (f.variant === "Veg") price = flavor === "Jhol" ? 109 : flavor === "Melted Cheese" ? 139 : 119;
      else if (f.variant === "Paneer") price = flavor === "Jhol" ? 129 : flavor === "Melted Cheese" ? 159 : 139;
      else if (f.variant === "Chicken") price = flavor === "Jhol" ? 139 : flavor === "Melted Cheese" ? 169 : 149;

      products.push({
        style: `${flavor} Momo`,
        category: `${flavor} Momo`,
        variant: f.variant,
        name: `${f.variant} ${flavor} Momo`,
        slug: `${f.variant.toLowerCase().replace(/\s+/g, "-")}-${flavor.toLowerCase().replace(/\s+/g, "-")}-momo`,
        price,
        vegetarian: f.vegetarian,
        vegan: f.vegan,
        spice: spiceMap[flavor] ?? 1,
        badges: flavor === "Tandoori" ? ["Best Seller"] : flavor === "Melted Cheese" ? ["Chef Special"] : [],
        filling: f.variant,
      });
    }
  }

  // Platter Momos
  const platters: ProductSeed[] = [
    { style: "Platter", category: "Platter Momos", variant: "Veg Dry", name: "Veg Dry Platter", slug: "veg-dry-platter", price: 249, vegetarian: true, vegan: false, spice: 2, badges: [], filling: "Veg" },
    { style: "Platter", category: "Platter Momos", variant: "Veg Gravy", name: "Veg Gravy Platter", slug: "veg-gravy-platter", price: 279, vegetarian: true, vegan: false, spice: 2, badges: [], filling: "Veg" },
    { style: "Platter", category: "Platter Momos", variant: "Chicken Dry", name: "Chicken Dry Platter", slug: "chicken-dry-platter", price: 299, vegetarian: false, vegan: false, spice: 2, badges: ["Best Seller"], filling: "Chicken" },
    { style: "Platter", category: "Platter Momos", variant: "Chicken Gravy", name: "Chicken Gravy Platter", slug: "chicken-gravy-platter", price: 329, vegetarian: false, vegan: false, spice: 2, badges: [], filling: "Chicken" },
  ];
  products.push(...platters);

  console.log(`Seeding ${products.length} products...`);
  let created = 0;
  let skipped = 0;

  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    const sortOrder = i * 10;

    const existing = await MenuItem.findOne({ slug: p.slug });

    if (existing) {
      skipped++;
      continue;
    }

    await MenuItem.create({
      name: p.name,
      slug: p.slug,
      style: p.style,
      variant: p.variant,
      filling: p.filling,
      description: `Hand-folded ${p.style.toLowerCase()} momos with ${p.variant.toLowerCase()} filling. Steamed fresh to order.`,
      price: p.price,
      category: p.category,
      isAvailable: true,
      isVegetarian: p.vegetarian,
      isVegan: p.vegan,
      isGlutenFree: false,
      spice: p.spice,
      badges: p.badges,
      sortOrder,
      preparationTime: 10 + Math.floor(Math.random() * 5),
      tags: ["momo", p.style.toLowerCase().replace(/\s+/g, "-"), p.variant.toLowerCase()],
    });
    created++;
    if (created % 20 === 0) console.log(`  ${created} created...`);
  }

  console.log(`\nDone: ${created} created, ${skipped} already existed (${products.length} total products).`);
  process.exit(0);
}

seed().catch((e) => {
  console.error("Seed failed:", e);
  process.exit(1);
});

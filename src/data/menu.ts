import steam from "@/assets/steam-momos.jpg?w=400";
import fried from "@/assets/fried-momos.jpg?w=400";
import peri from "@/assets/peri-momos.jpg?w=400";
import tandoori from "@/assets/tandoori-momos.jpg?w=400";
import jhol from "@/assets/jhol-momos.jpg?w=400";
import schezwan from "@/assets/schezwan-momos.jpg?w=400";
import cheese from "@/assets/cheese-momos.jpg?w=400";

export type Variant = "Veg" | "Paneer" | "Chicken";
export type Style =
  | "Steam"
  | "Fried"
  | "Kurkure"
  | "Peri Peri"
  | "Pan Fried"
  | "Jhol"
  | "Chilli"
  | "Schezwan"
  | "Hot Garlic"
  | "Darjeeling"
  | "Tandoori"
  | "Melted Cheese";

export interface MenuItem {
  id: string;
  name: string;
  style: Style;
  variant: Variant;
  description: string;
  price: number;
  spice: 1 | 2 | 3;
  image: string;
  badges?: ("Best Seller" | "Chef Special" | "New")[];
}

const img: Record<Style, string> = {
  Steam: steam,
  Fried: fried,
  Kurkure: fried,
  "Peri Peri": peri,
  "Pan Fried": fried,
  Jhol: jhol,
  Chilli: schezwan,
  Schezwan: schezwan,
  "Hot Garlic": schezwan,
  Darjeeling: steam,
  Tandoori: tandoori,
  "Melted Cheese": cheese,
};

const variants: Variant[] = ["Veg", "Paneer", "Chicken"];
const styles: { style: Style; desc: string; spice: 1 | 2 | 3; from: number }[] = [
  { style: "Steam", desc: "Soft hand-folded parcels, slow-steamed till silky.", spice: 1, from: 90 },
  { style: "Fried", desc: "Golden-crisp shells with a juicy, savoury heart.", spice: 1, from: 110 },
  { style: "Kurkure", desc: "Double-crusted, shatteringly crisp coating.", spice: 2, from: 130 },
  { style: "Peri Peri", desc: "Tossed in fiery African peri-peri spice dust.", spice: 3, from: 140 },
  { style: "Pan Fried", desc: "Seared base, steamed top — the best of both.", spice: 1, from: 130 },
  { style: "Jhol", desc: "Bathed in spiced Himalayan tomato-sesame broth.", spice: 2, from: 150 },
  { style: "Chilli", desc: "Indo-Chinese style, glossed in chilli soy.", spice: 3, from: 150 },
  { style: "Schezwan", desc: "Wok-tossed in house-made Schezwan chutney.", spice: 3, from: 150 },
  { style: "Hot Garlic", desc: "Smoky garlic gravy with a slow-building heat.", spice: 2, from: 150 },
  { style: "Darjeeling", desc: "Hill-station classic with toasted sesame.", spice: 1, from: 130 },
  { style: "Tandoori", desc: "Marinated, char-grilled in the clay tandoor.", spice: 2, from: 160 },
  { style: "Melted Cheese", desc: "Molten mozzarella core, golden crust.", spice: 1, from: 170 },
];

export const menu: MenuItem[] = styles.flatMap((s) =>
  variants.map<MenuItem>((v, i) => ({
    id: `${s.style}-${v}`.toLowerCase().replace(/\s+/g, "-"),
    name: `${s.style} Momos`,
    style: s.style,
    variant: v,
    description: s.desc,
    price: s.from + i * 20 + (v === "Chicken" ? 20 : 0),
    spice: s.spice,
    image: img[s.style],
    badges:
      s.style === "Tandoori" || s.style === "Melted Cheese"
        ? ["Chef Special"]
        : s.style === "Steam" || s.style === "Schezwan"
        ? ["Best Seller"]
        : s.style === "Jhol"
        ? ["New"]
        : undefined,
  })),
);

export const styleList: Style[] = styles.map((s) => s.style);
export const variantList: Variant[] = variants;

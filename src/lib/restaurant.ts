// Centralized restaurant contact info + deep-link helpers.
// Fetches from /api/settings/public at runtime; falls back to hardcoded defaults.

const DEFAULTS = {
  name: "Momo House",
  phoneE164: "911234567890",
  phoneDisplay: "+91 12345 67890",
  address: "12 Lake Road, Khan Market, New Delhi 110003",
  hours: "Daily 11:00 AM – 11:30 PM",
  instagram: "https://instagram.com",
  facebook: "https://facebook.com",
  mapsUrl: "https://maps.google.com/?q=Khan+Market+New+Delhi",
} as const;

let cached: typeof DEFAULTS | null = null;
let fetchPromise: Promise<void> | null = null;

async function loadSettings() {
  if (cached) return;
  if (fetchPromise) {
    await fetchPromise;
    return;
  }
  fetchPromise = (async () => {
    try {
      const res = await fetch("/api/settings/public");
      if (!res.ok) throw new Error("Settings not available");
      const json = await res.json();
      const s = json.data ?? json;
      cached = {
        name: s.restaurantName || DEFAULTS.name,
        phoneE164: s.phone || DEFAULTS.phoneE164,
        phoneDisplay: s.phoneDisplay || DEFAULTS.phoneDisplay,
        address: s.address || DEFAULTS.address,
        hours: s.hours || DEFAULTS.hours,
        instagram: s.socialLinks?.instagram || DEFAULTS.instagram,
        facebook: s.socialLinks?.facebook || DEFAULTS.facebook,
        mapsUrl: DEFAULTS.mapsUrl,
      };
    } catch {
      cached = { ...DEFAULTS };
    }
  })();
  await fetchPromise;
}

function getSettings() {
  return cached ?? DEFAULTS;
}

export const RESTAURANT = {
  get name() { return getSettings().name; },
  get phoneE164() { return getSettings().phoneE164; },
  get phoneDisplay() { return getSettings().phoneDisplay; },
  get address() { return getSettings().address; },
  get hours() { return getSettings().hours; },
  get instagram() { return getSettings().instagram; },
  get facebook() { return getSettings().facebook; },
  get mapsUrl() { return getSettings().mapsUrl; },
} as const;

// Preload settings on import
loadSettings();

export function telLink() {
  return `tel:+${RESTAURANT.phoneE164}`;
}

export function waLink(message?: string) {
  const base = `https://wa.me/${RESTAURANT.phoneE164}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

export type OrderForWa = {
  order_number: string;
  customer_name: string;
  fulfillment: "delivery" | "pickup" | "dine_in";
  total: number | string;
  items: { quantity: number; name: string }[];
  address_line?: string | null;
  city?: string | null;
  pincode?: string | null;
};

export function waOrderMessage(order: OrderForWa) {
  const lines = [
    `Hi ${RESTAURANT.name}! 👋`,
    ``,
    `Order *${order.order_number}* — ${order.customer_name}`,
    `Type: ${order.fulfillment === "delivery" ? "Delivery" : order.fulfillment === "dine_in" ? "Dine-in" : "Pickup"}`,
    ``,
    `Items:`,
    ...order.items.map((i) => `• ${i.quantity}× ${i.name}`),
    ``,
    `Total: ₹${Number(order.total).toFixed(0)}`,
  ];
  if (order.fulfillment === "delivery" && order.address_line) {
    lines.push(``, `Deliver to: ${order.address_line}, ${order.city ?? ""} ${order.pincode ?? ""}`.trim());
  }
  lines.push(``, `Please confirm when ready 🥟`);
  return lines.join("\n");
}

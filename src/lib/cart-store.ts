import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartAddon {
  id: string;
  name: string;
  price: number;
}

export interface CartItem {
  id: string;          // composite key when addons differ
  itemId: string;      // original menu_item id
  name: string;
  price: number;       // base price
  image?: string;
  quantity: number;
  notes?: string;
  addons?: CartAddon[];
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  add: (
    item: Omit<CartItem, "quantity" | "id" | "itemId"> & { id: string; addons?: CartAddon[] },
    qty?: number,
  ) => void;
  remove: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  clear: () => void;
  setOpen: (v: boolean) => void;
  subtotal: () => number;
  count: () => number;
}

function lineKey(itemId: string, addons?: CartAddon[]) {
  if (!addons || addons.length === 0) return itemId;
  return itemId + "|" + addons.map((a) => a.id).sort().join(",");
}

function linePrice(it: { price: number; addons?: CartAddon[] }) {
  return it.price + (it.addons ?? []).reduce((s, a) => s + a.price, 0);
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      add: (item, qty = 1) =>
        set((s) => {
          const key = lineKey(item.id, item.addons);
          const found = s.items.find((i) => i.id === key);
          if (found) {
            return {
              items: s.items.map((i) =>
                i.id === key ? { ...i, quantity: i.quantity + qty } : i,
              ),
            };
          }
          return {
            items: [
              ...s.items,
              {
                id: key,
                itemId: item.id,
                name: item.name,
                price: item.price,
                image: item.image,
                notes: item.notes,
                addons: item.addons,
                quantity: qty,
              },
            ],
          };
        }),
      remove: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
      setQty: (id, qty) =>
        set((s) => ({
          items:
            qty <= 0
              ? s.items.filter((i) => i.id !== id)
              : s.items.map((i) => (i.id === id ? { ...i, quantity: qty } : i)),
        })),
      clear: () => set({ items: [] }),
      setOpen: (v) => set({ isOpen: v }),
      subtotal: () => get().items.reduce((sum, i) => sum + linePrice(i) * i.quantity, 0),
      count: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    { name: "momo-cart" },
  ),
);

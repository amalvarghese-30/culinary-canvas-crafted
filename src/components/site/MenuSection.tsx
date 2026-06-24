import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useApiQuery, useApiMutation } from "@/api/hooks";
import { apiFetch } from "@/api/client";
import { Flame, Heart, Leaf, Plus, UtensilsCrossed, X, ExternalLink } from "lucide-react";
import { AiRecommendations } from "./AiRecommendations";
import { VoiceOrderBar } from "./VoiceOrderBar";

import { useCart, type CartAddon } from "@/lib/cart-store";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import steam from "@/assets/steam-momos.jpg?w=400";
import fried from "@/assets/fried-momos.jpg?w=400";
import peri from "@/assets/peri-momos.jpg?w=400";
import tandoori from "@/assets/tandoori-momos.jpg?w=400";
import jhol from "@/assets/jhol-momos.jpg?w=400";
import schezwan from "@/assets/schezwan-momos.jpg?w=400";
import cheese from "@/assets/cheese-momos.jpg?w=400";

type DbItem = {
  id: string;
  name: string;
  slug: string;
  style: string;
  variant: string;
  category: string;
  description: string;
  price: number;
  spice: number;
  image_url: string | null;
  badges: string[];
  is_vegetarian: boolean;
  is_vegan: boolean;
  is_gluten_free: boolean;
  preparation_time: number | null;
};
const FALLBACK_CATEGORIES = [
  "Steam",
  "Fried",
  "Kurkure",
  "Tandoori",
  "Chinese",
  "Beverages",
  "Combos",
] as const;
type Category = string;

const styleImage: Record<string, string> = {
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

type Filter = string;

function categoryOf(style: string): string {
  const s = style.toLowerCase();
  if (s.includes("steam") || s.includes("darjeeling") || s.includes("jhol")) return "Steam";
  if (s.includes("kurkure")) return "Kurkure";
  if (s.includes("tandoori")) return "Tandoori";
  if (
    s.includes("schezwan") ||
    s.includes("chilli") ||
    s.includes("hot garlic") ||
    s.includes("manchurian") ||
    s.includes("hakka")
  )
    return "Chinese";
  if (s.includes("beverage") || s.includes("drink") || s.includes("tea") || s.includes("coffee"))
    return "Beverages";
  if (s.includes("combo") || s.includes("platter")) return "Combos";
  if (s.includes("fried") || s.includes("peri") || s.includes("pan")) return "Fried";
  return "Steam";
}

export function MenuSection() {
  const [active, setActive] = useState<Filter>("All");
  const add = useCart((s) => s.add);
  const { user } = useAuth();

  const { data, loading: isLoading } = useApiQuery("menu-items-public", () =>
    apiFetch("/api/public/menu")
  );

  const { data: favs, refetch: refetchFavs } = useApiQuery(
    "my-favorites",
    () => apiFetch("/api/favorites"),
    { enabled: !!user },
  );
  const favIds = new Set((favs ?? []).map((f: any) => f.menu_item_id));

  const items = (data ?? []) as DbItem[];

  // Derive categories from the items themselves, using the item.category field from the API
  const categories: Category[] = useMemo(() => {
    const seen = new Set<string>();
    for (const it of items) {
      if (it.category) seen.add(it.category);
    }
    if (seen.size > 0) return [...seen];
    // Fallback: derive from categoryOf mapping
    for (const it of items) {
      seen.add(categoryOf(it.style));
    }
    if (seen.size > 0) return [...seen];
    return [...FALLBACK_CATEGORIES];
  }, [items]);

  // Fetch add-ons for every visible menu item in one round-trip
  const { data: addons } = useApiQuery(
    items.length > 0 ? `menu-addons-${items.map((i: any) => i._id || i.id).join(",")}` : "__skip__",
    async () => {
      const ids = items.map((i: any) => i._id || i.id);
      if (ids.length === 0) return [] as { id: string; menu_item_id: string; name: string; price: number }[];
      return apiFetch(`/api/public/menu/addons?ids=${ids.join(",")}`);
    },
    { enabled: items.length > 0 },
  );
  const addonsByItem = useMemo(() => {
    const m = new Map<string, { id: string; name: string; price: number }[]>();
    for (const a of (addons ?? []) as any[]) {
      const arr = m.get(a.menu_item_id) ?? [];
      arr.push({ id: a.id, name: a.name, price: Number(a.price) });
      m.set(a.menu_item_id, arr);
    }
    return m;
  }, [addons]);

  const { mutate: doToggleFav } = useApiMutation(
    (menu_item_id: string) =>
      apiFetch("/api/favorites/toggle", { method: "POST", body: JSON.stringify({ menu_item_id }) }),
    {
      onSuccess: (res) => {
        refetchFavs();
        toast.success((res as any).favorited ? "Saved to favorites" : "Removed");
      },
    },
  );

  const filters = useMemo<Filter[]>(() => {
    return ["All", "Veg", "Paneer", "Chicken", ...categories];
  }, [categories]);

  const filtered = useMemo(() => {
    if (active === "All") return items;
    if (active === "Veg" || active === "Paneer" || active === "Chicken")
      return items.filter((m) => m.variant === active);
    return items.filter((m) => m.category === active);
  }, [active, items]);

  const grouped = useMemo(() => {
    const groups = new Map<string, DbItem[]>();
    for (const it of filtered) {
      const c = it.category || categoryOf(it.style);
      const arr = groups.get(c) ?? [];
      arr.push(it);
      groups.set(c, arr);
    }
    return categories.filter((c) => groups.has(c)).map((c) => ({
      category: c,
      items: groups.get(c)!,
    }));
  }, [filtered, categories]);

  const [picker, setPicker] = useState<DbItem | null>(null);

  function handleAdd(m: DbItem) {
    const itemAddons = addonsByItem.get(m.id) ?? [];
    if (itemAddons.length > 0) {
      setPicker(m);
      return;
    }
    const img = m.image_url || styleImage[m.style] || steam;
    add({ id: m.id, name: `${m.style} ${m.variant}`, price: Number(m.price), image: img });
    toast.success(`Added ${m.style} ${m.variant}`);
  }

  return (
    <section id="menu" className="py-28 md:py-36 relative">
      <div className="absolute inset-0 -z-10 bg-surface/40" />
      <div className="container-luxe">
        <div className="max-w-3xl mb-12">
          <span className="kbd">The Full Menu</span>
          <h2 className="font-display text-4xl md:text-6xl mt-4">
            Twelve styles. Three fillings.{" "}
            <em className="text-gradient-gold not-italic">Endless joy.</em>
          </h2>
          <p className="mt-6 text-muted-foreground leading-relaxed">
            Filter by filling or by style. Every plate is hand-folded to order — expect 10 minutes
            of patience and a lifetime of cravings.
          </p>
        </div>

        {/* Filter chips */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-10 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setActive(f)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-[var(--font-ui)] transition-all ring-1 ${
                active === f
                  ? "bg-primary text-primary-foreground ring-primary shadow-[var(--shadow-luxe)]"
                  : "bg-card/60 text-muted-foreground ring-border hover:text-foreground hover:ring-primary/40"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <VoiceOrderBar
          items={items}
          onAdd={(m) => handleAdd(m as DbItem)}
        />



        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5" aria-busy="true" aria-live="polite">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-2xl ring-1 ring-border overflow-hidden bg-card">
                <div className="skeleton aspect-[5/4]" />
                <div className="p-5 space-y-3">
                  <div className="skeleton h-5 w-2/3 rounded" />
                  <div className="skeleton h-3 w-full rounded" />
                  <div className="skeleton h-3 w-5/6 rounded" />
                  <div className="skeleton h-9 w-full rounded-xl mt-2" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24 rounded-3xl ring-1 ring-border bg-card/40">
            <div className="mx-auto grid place-items-center size-14 rounded-2xl bg-primary/15 ring-1 ring-primary/30 mb-4">
              <UtensilsCrossed className="size-6 text-primary" />
            </div>
            <h3 className="font-display text-2xl">Nothing on this plate yet</h3>
            <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
              No items match this filter. Try another category — every style is folded to order.
            </p>
            <button
              onClick={() => setActive("All")}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary-glow transition"
            >
              Show everything
            </button>
          </div>
        ) : (
          <>
            <AiRecommendations />
            <div className="space-y-16">
            {grouped.map(({ category, items: groupItems }) => (
              <div key={category}>
                <div className="flex items-baseline justify-between mb-6">
                  <h3 className="font-display text-2xl md:text-3xl">
                    <span className="text-gradient-gold">{category}</span>
                  </h3>
                  <span className="kbd text-muted-foreground">{groupItems.length} items</span>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {groupItems.map((m) => {
                    const img = m.image_url || styleImage[m.style] || steam;
                    return (
                      <article
                        key={m.id}
                        className="group rounded-2xl bg-card ring-1 ring-border overflow-hidden hover:ring-primary/40 hover:-translate-y-1 transition-all duration-500"
                      >
                        <div className="relative aspect-[5/4] overflow-hidden">
                          <Link to={`/product/${m.slug}`} className="block size-full">
                            <img
                              src={img}
                              alt={`${m.variant} ${m.name}`}
                              loading="lazy"
                            decoding="async"
                              width={1024}
                              height={820}
                              className="size-full object-cover transition-transform duration-700 group-hover:scale-110"
                            />
                          </Link>
                          <div className="absolute inset-0 bg-gradient-to-t from-card/95 via-transparent to-transparent" />
                          <div className="absolute top-3 left-3 flex gap-1.5">
                            {m.variant === "Veg" && (
                              <span className="inline-flex items-center gap-1 bg-background/70 backdrop-blur kbd px-2 py-1 rounded-full text-success">
                                <Leaf className="size-3" aria-hidden="true" /> Veg
                              </span>
                            )}
                            {m.badges?.map((b) => (
                              <span
                                key={b}
                                className="bg-primary/90 text-primary-foreground kbd px-2 py-1 rounded-full"
                              >
                                {b}
                              </span>
                            ))}
                          </div>
                          <span
                            className="absolute top-3 right-3 inline-flex items-center gap-0.5 bg-background/70 backdrop-blur px-2 py-1 rounded-full"
                            aria-label={`Spice level ${m.spice} of 5`}
                          >
                            {Array.from({ length: m.spice }).map((_, i) => (
                              <Flame key={i} className="size-3 text-primary" aria-hidden="true" />
                            ))}
                          </span>
                          {user && (
                            <button
                              onClick={(e) => { e.stopPropagation(); doToggleFav(m.id); }}
                              aria-label={favIds.has(m.id) ? "Remove favorite" : "Save favorite"}
                              className="absolute bottom-3 right-3 grid place-items-center size-9 rounded-full bg-background/80 backdrop-blur ring-1 ring-border hover:ring-primary transition"
                            >
                              <Heart className={`size-4 ${favIds.has(m.id) ? "fill-primary text-primary" : "text-muted-foreground"}`} />
                            </button>
                          )}
                        </div>
                        <div className="p-5">
                          <div className="flex items-baseline justify-between gap-3">
                            <h4 className="font-display text-xl leading-tight">
                              {m.style}
                              <span className="text-muted-foreground"> · {m.variant}</span>
                            </h4>
                            <span className="font-[var(--font-num)] text-lg shrink-0">
                              ₹{Number(m.price).toFixed(0)}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                            {m.description}
                          </p>
                          <div className="mt-4 flex gap-2">
                            <button
                              onClick={() => handleAdd(m)}
                              aria-label={`Add ${m.style} ${m.variant} to order`}
                              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-white/5 hover:bg-primary hover:text-primary-foreground ring-1 ring-border text-sm font-[var(--font-ui)] py-2.5 transition-all"
                            >
                              <Plus className="size-4" aria-hidden="true" /> Add
                            </button>
                            <Link
                              to={`/product/${m.slug}`}
                              className="shrink-0 inline-flex items-center justify-center size-10 rounded-xl ring-1 ring-border bg-white/5 hover:bg-background/60 text-muted-foreground hover:text-foreground transition"
                              aria-label={`View ${m.style} ${m.variant} details`}
                            >
                              <ExternalLink className="size-4" />
                            </Link>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            ))}
            </div>
          </>
        )}

      </div>

      {picker && (
        <AddonsPicker
          item={picker}
          addons={addonsByItem.get(picker.id) ?? []}
          image={picker.image_url || styleImage[picker.style] || steam}
          onClose={() => setPicker(null)}
          onConfirm={(selected) => {
            const img = picker.image_url || styleImage[picker.style] || steam;
            add({
              id: picker.id,
              name: `${picker.style} ${picker.variant}`,
              price: Number(picker.price),
              image: img,
              addons: selected,
            });
            toast.success(`Added ${picker.style} ${picker.variant}`);
            setPicker(null);
          }}
        />
      )}
    </section>
  );
}

function AddonsPicker({
  item,
  addons,
  image,
  onClose,
  onConfirm,
}: {
  item: DbItem;
  addons: { id: string; name: string; price: number }[];
  image: string;
  onClose: () => void;
  onConfirm: (selected: CartAddon[]) => void;
}) {
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const chosen = addons.filter((a) => selected[a.id]);
  const extra = chosen.reduce((s, a) => s + a.price, 0);
  const total = Number(item.price) + extra;
  return (
    <div
      className="fixed inset-0 z-[80] bg-background/80 backdrop-blur grid place-items-center p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-3xl bg-card ring-1 ring-border overflow-hidden"
      >
        <div className="relative aspect-[5/3] overflow-hidden">
          <img src={image} alt={item.name} className="size-full object-cover" />
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute top-3 right-3 grid place-items-center size-9 rounded-full bg-background/80 backdrop-blur ring-1 ring-border"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="p-5">
          <h3 className="font-display text-2xl">
            {item.style} <span className="text-muted-foreground">· {item.variant}</span>
          </h3>
          <p className="text-sm text-muted-foreground mt-1">{item.description}</p>

          <div className="mt-5">
            <p className="text-xs uppercase tracking-widest text-primary mb-2">Add-ons</p>
            <ul className="space-y-2 max-h-64 overflow-y-auto">
              {addons.map((a) => (
                <li key={a.id}>
                  <label className="flex items-center gap-3 rounded-xl ring-1 ring-border bg-background/40 p-3 cursor-pointer hover:ring-primary/40 transition">
                    <input
                      type="checkbox"
                      checked={!!selected[a.id]}
                      onChange={(e) =>
                        setSelected((s) => ({ ...s, [a.id]: e.target.checked }))
                      }
                      className="size-4"
                    />
                    <span className="flex-1 text-sm">{a.name}</span>
                    <span className="font-[var(--font-num)] text-sm text-primary">
                      +₹{a.price.toFixed(0)}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </div>

          <button
            onClick={() => onConfirm(chosen)}
            className="w-full mt-5 rounded-xl bg-primary text-primary-foreground py-3 font-semibold inline-flex items-center justify-center gap-2 shadow-[var(--shadow-luxe)]"
          >
            <Plus className="size-4" />
            Add to order · ₹{total.toFixed(0)}
          </button>
        </div>
      </div>
    </div>
  );
}

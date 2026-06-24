import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useApiQuery } from "@/api/hooks";
import { apiFetch } from "@/api/client";
import { useCart } from "@/lib/cart-store";
import { toast } from "sonner";
import { Loader2, Plus, ShoppingBag, QrCode, Flame } from "lucide-react";

import { useTranslation } from "react-i18next";

export default function TableOrderPage() {
  const { t } = useTranslation();
  const { tableId } = useParams<{ tableId: string }>();
  const navigate = useNavigate();
  const add = useCart((s) => s.add);
  const setOpen = useCart((s) => s.setOpen);

  const { data: table } = useApiQuery(`table-${tableId}`, () =>
    apiFetch(`/api/public/tables/${tableId}`)
  );
  const { data: items, loading: isLoading } = useApiQuery("public-menu", () =>
    apiFetch("/api/public/menu")
  );
  const { data: addons } = useApiQuery(
    `addons-public-${(items ?? []).map((i: any) => i.id).join(",")}`,
    () => apiFetch(`/api/public/menu/addons?ids=${(items ?? []).map((i: any) => i.id).join(",")}`),
    { enabled: (items ?? []).length > 0 }
  );

  const [search, setSearch] = useState("");
  if (typeof window !== "undefined") {
    sessionStorage.setItem("dine_in_table", tableId ?? "");
  }

  const addonsByItem = new Map<string, { id: string; name: string; price: number }[]>();
  for (const a of (addons ?? []) as any[]) {
    const arr = addonsByItem.get(a.menu_item_id) ?? [];
    arr.push({ id: a.id, name: a.name, price: Number(a.price) });
    addonsByItem.set(a.menu_item_id, arr);
  }

  const filtered = (items ?? []).filter((i: any) =>
    !search || `${i.style} ${i.variant} ${i.name}`.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <main className="min-h-screen pt-24 pb-24 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="rounded-2xl ring-1 ring-primary/30 bg-primary/5 p-4 mb-6 flex items-center gap-3">
          <QrCode className="size-6 text-primary" />
          <div className="flex-1">
            <p className="text-xs uppercase tracking-widest text-primary">{t("checkout.dine_in_badge").split(" · ")[0]}</p>
            <h1 className="font-display text-xl">
              {table ? `Table ${(table as any).label}` : "Loading…"}
            </h1>
          </div>
        </div>

        <input
          placeholder={t("menu.search")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl bg-card ring-1 ring-border px-4 py-3 mb-4"
        />

        {isLoading ? (
          <div className="grid place-items-center py-20">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <ul className="space-y-2">
            {filtered.map((m: any) => {
              const itemAddons = addonsByItem.get(m.id) ?? [];
              return (
                <li
                  key={m.id}
                  className="rounded-2xl ring-1 ring-border bg-card p-3 flex items-center gap-3"
                >
                  {m.image_url && (
                    <img
                      src={m.image_url}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      className="size-16 rounded-xl object-cover"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">
                      {m.style} <span className="text-muted-foreground">· {m.variant}</span>
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      ₹{Number(m.price).toFixed(0)}
                      {Array.from({ length: m.spice }).map((_, i) => (
                        <Flame key={i} className="size-3 text-primary" />
                      ))}
                    </p>
                    {itemAddons.length > 0 && (
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        + {itemAddons.length} add-ons
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      add({
                        id: m.id,
                        name: `${m.style} ${m.variant}`,
                        price: Number(m.price),
                        image: m.image_url,
                      });
                      toast.success("Added");
                    }}
                    aria-label="Add"
                    className="size-10 grid place-items-center rounded-full bg-primary text-primary-foreground"
                  >
                    <Plus className="size-5" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        <button
          onClick={() => {
            setOpen(true);
            navigate("/checkout");
          }}
          className="fixed bottom-4 left-4 right-4 max-w-2xl mx-auto rounded-2xl bg-primary text-primary-foreground py-4 font-semibold shadow-[var(--shadow-luxe)] inline-flex items-center justify-center gap-2"
        >
          <ShoppingBag className="size-5" />
          Review cart & order
        </button>
      </div>
    </main>
  );
}

import { useState } from "react";
import { useApiQuery } from "@/api/hooks";
import { apiFetch } from "@/api/client";
import { useCart } from "@/lib/cart-store";
import { Loader2, ShoppingBag, Flame, X } from "lucide-react";
import { toast } from "sonner";

export default function KioskPage() {
  const { items, setQty, subtotal, clear, count } = useCart();
  const add = useCart((s) => s.add);
  const [active, setActive] = useState<"All" | "Veg" | "Chicken" | "Paneer">("All");

  const { data, loading: isLoading } = useApiQuery("kiosk-menu", () =>
    apiFetch("/api/public/menu")
  );

  const { data: addons } = useApiQuery(
    `kiosk-addons-${(data ?? []).map((d: any) => d.id).join(",")}`,
    () => apiFetch(`/api/public/menu/addons?ids=${(data ?? []).map((d: any) => d.id).join(",")}`),
    { enabled: (data ?? []).length > 0 }
  );

  const filtered = (data ?? []).filter(
    (m: any) => active === "All" || m.variant === active,
  );

  function handlePlace() {
    if (items.length === 0) {
      toast.error("Cart is empty");
      return;
    }
    toast.success("Order sent to counter — pay at till.");
    clear();
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="bg-primary text-primary-foreground px-6 py-4 flex items-center justify-between sticky top-0 z-20 shadow-xl">
        <div>
          <p className="text-xs uppercase tracking-widest opacity-80">Self-service kiosk</p>
          <h1 className="font-display text-2xl">Mōmo House</h1>
        </div>
        <div className="text-right">
          <p className="text-xs opacity-80">Cart</p>
          <p className="font-display text-2xl">{count()} · ₹{subtotal().toFixed(0)}</p>
        </div>
      </div>

      <div className="px-6 py-4 flex gap-2 overflow-x-auto sticky top-[88px] z-10 bg-background/95 backdrop-blur">
        {(["All", "Veg", "Chicken", "Paneer"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setActive(f)}
            className={`shrink-0 px-6 py-3 rounded-2xl text-lg font-semibold ring-1 transition ${
              active === f
                ? "bg-primary text-primary-foreground ring-primary"
                : "bg-card text-muted-foreground ring-border"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 p-6 pb-40">
        {isLoading ? (
          <div className="col-span-full grid place-items-center py-20">
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          filtered.map((m: any) => (
            <button
              key={m.id}
              onClick={() => {
                add({
                  id: m.id,
                  name: `${m.style} ${m.variant}`,
                  price: Number(m.price),
                  image: m.image_url,
                });
                toast.success("Added");
              }}
              className="rounded-3xl ring-1 ring-border bg-card overflow-hidden text-left hover:ring-primary active:scale-[0.98] transition"
            >
              {m.image_url && (
                <div className="aspect-square overflow-hidden">
                  <img src={m.image_url} alt="" loading="lazy" decoding="async" className="size-full object-cover" />
                </div>
              )}
              <div className="p-3">
                <p className="font-display text-lg leading-tight">{m.style}</p>
                <p className="text-sm text-muted-foreground">{m.variant}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="font-display text-xl text-primary">
                    ₹{Number(m.price).toFixed(0)}
                  </span>
                  <span className="inline-flex">
                    {Array.from({ length: m.spice }).map((_, i) => (
                      <Flame key={i} className="size-3 text-primary" />
                    ))}
                  </span>
                </div>
              </div>
            </button>
          ))
        )}
      </div>

      {items.length > 0 && (
        <div className="fixed bottom-0 inset-x-0 bg-card border-t border-border p-4 z-30">
          <div className="max-w-3xl mx-auto">
            <div className="max-h-32 overflow-y-auto mb-3 divide-y divide-border">
              {items.map((i) => (
                <div key={i.id} className="py-2 flex items-center gap-3">
                  <span className="flex-1 truncate text-sm">{i.name}</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setQty(i.id, i.quantity - 1)}
                      className="size-8 rounded-full ring-1 ring-border"
                    >
                      −
                    </button>
                    <span className="w-8 text-center font-[var(--font-num)]">{i.quantity}</span>
                    <button
                      onClick={() => setQty(i.id, i.quantity + 1)}
                      className="size-8 rounded-full ring-1 ring-border"
                    >
                      +
                    </button>
                  </div>
                  <span className="w-20 text-right font-[var(--font-num)]">
                    ₹{(i.price * i.quantity).toFixed(0)}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={clear}
                className="rounded-2xl ring-1 ring-border px-4 py-4 text-sm font-semibold"
              >
                <X className="size-5" />
              </button>
              <button
                onClick={handlePlace}
                className="flex-1 rounded-2xl bg-primary text-primary-foreground py-4 font-bold text-lg inline-flex items-center justify-center gap-2 shadow-[var(--shadow-luxe)]"
              >
                <ShoppingBag className="size-5" />
                Place order · ₹{subtotal().toFixed(0)}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

import { useEffect, useMemo, useState } from "react";
import { useApiQuery } from "@/api/hooks";
import { apiFetch } from "@/api/client";
import { Sparkles, Plus } from "lucide-react";
import { useCart } from "@/lib/cart-store";
import { toast } from "sonner";

type Item = {
  id: string;
  name: string;
  style: string;
  variant: string;
  price: number;
  image_url: string | null;
};

export function AiRecommendations() {
  const items = useCart((s) => s.items);
  const add = useCart((s) => s.add);
  const cartNames = useMemo(() => items.map((i) => i.name), [items]);
  const [trigger, setTrigger] = useState(0);

  const { data, loading: isFetching } = useApiQuery(
    `ai-recs-${cartNames.join("|")}-${trigger}`,
    () =>
      apiFetch("/api/ai/recommend", { method: "POST", body: JSON.stringify({ cart: cartNames }) }),
  );

  const ids = (data as any)?.picks?.map((p: any) => p.id) ?? [];

  const { data: itemData } = useApiQuery(
    ids.length > 0 ? `ai-rec-items-${ids.join(",")}` : "__skip__",
    async () => {
      const all = await apiFetch("/api/public/menu");
      return (all as Item[]).filter((it: Item) => ids.includes(it.id));
    },
    { enabled: ids.length > 0 },
  );

  useEffect(() => {
    // Refresh recommendations when cart contents change meaningfully.
  }, [cartNames.length]);

  const picks = ((data as any)?.picks ?? [])
    .map((p: any) => ({ ...p, item: itemData?.find((it) => it.id === p.id) }))
    .filter((p: any) => p.item);

  if (!isFetching && picks.length === 0) return null;

  return (
    <section className="mb-12 rounded-3xl ring-1 ring-primary/20 bg-gradient-to-br from-primary/5 via-card/40 to-transparent p-6 md:p-8">
      <div className="flex items-center justify-between gap-4 flex-wrap mb-5">
        <div className="flex items-center gap-3">
          <div className="grid place-items-center size-10 rounded-2xl bg-primary/15 ring-1 ring-primary/30">
            <Sparkles className="size-5 text-primary" />
          </div>
          <div>
            <h3 className="font-display text-xl md:text-2xl">
              <span className="text-gradient-gold">Chef's picks</span> for you
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              AI-curated based on what's in your cart
            </p>
          </div>
        </div>
        <button
          onClick={() => setTrigger((t) => t + 1)}
          disabled={isFetching}
          className="kbd rounded-full px-3 py-1.5 ring-1 ring-border hover:ring-primary/40 transition disabled:opacity-50"
        >
          {isFetching ? "Thinking…" : "Refresh"}
        </button>
      </div>

      {isFetching && picks.length === 0 ? (
        <div className="grid sm:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton h-28 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid sm:grid-cols-3 gap-4">
          {picks.map(({ item, reason }: any) =>
            item ? (
              <article
                key={item.id}
                className="group rounded-2xl bg-card ring-1 ring-border overflow-hidden hover:ring-primary/40 transition"
              >
                <div className="flex gap-3 p-3">
                  {item.image_url && (
                    <img
                      src={item.image_url}
                      alt={item.name}
                      loading="lazy" decoding="async"
                      className="size-20 rounded-xl object-cover shrink-0"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <h4 className="font-display text-base leading-tight truncate">
                      {item.style} · {item.variant}
                    </h4>
                    <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2 italic">
                      "{reason}"
                    </p>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <span className="font-[var(--font-num)] text-sm">
                        ₹{Number(item.price).toFixed(0)}
                      </span>
                      <button
                        onClick={() => {
                          add({
                            id: item.id,
                            name: `${item.style} ${item.variant}`,
                            price: Number(item.price),
                            image: item.image_url ?? "",
                          });
                          toast.success(`Added ${item.style} ${item.variant}`);
                        }}
                        className="inline-flex items-center gap-1 rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground ring-1 ring-primary/30 px-2.5 py-1 text-xs transition"
                      >
                        <Plus className="size-3" /> Add
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ) : null,
          )}
        </div>
      )}
    </section>
  );
}

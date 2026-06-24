import { useApiQuery, useApiMutation } from "@/api/hooks";
import { apiFetch } from "@/api/client";
import { Loader2, Clock, ChefHat, Truck, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

type Ticket = {
  id: string;
  order_number: string;
  status: "placed" | "confirmed" | "preparing" | "ready" | "out_for_delivery";
  fulfillment: string;
  customer_name: string;
  customer_phone: string;
  notes: string | null;
  total: number;
  created_at: string;
  order_items: { name: string; quantity: number; notes: string | null }[];
};

const COLUMNS: { key: Ticket["status"][]; title: string; next: Ticket["status"]; icon: any; tone: string }[] = [
  { key: ["placed", "confirmed"], title: "New", next: "preparing", icon: Clock, tone: "text-primary" },
  { key: ["preparing"], title: "Preparing", next: "ready", icon: ChefHat, tone: "text-amber-400" },
  { key: ["ready", "out_for_delivery"], title: "Ready / Out", next: "delivered" as any, icon: Truck, tone: "text-success" },
];

export default function KdsPage() {
  const { data, loading: isLoading, refetch } = useApiQuery(
    "kds-board",
    () => apiFetch("/api/admin/kds"),
    { refetchInterval: 5000 }
  );

  const { mutate: doAdvance, loading: isMutating } = useApiMutation(
    (vars: { id: string; status: string }) =>
      apiFetch(`/api/admin/orders/${vars.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: vars.status }),
      }),
    {
      onSuccess: (_d, vars) => {
        toast.success(`Order → ${vars.status.replace(/_/g, " ")}`);
        refetch();
      },
      onError: (e) => toast.error(e.message || "Update failed"),
    }
  );

  if (isLoading) {
    return (
      <div className="grid place-items-center py-20">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const tickets = (data ?? []) as Ticket[];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-display text-2xl">Kitchen Display</h2>
          <p className="text-sm text-muted-foreground">Live queue · auto-refreshes every 5 s</p>
        </div>
        <span className="kbd text-muted-foreground">{tickets.length} active tickets</span>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {COLUMNS.map((col) => {
          const Icon = col.icon;
          const items = tickets.filter((t) => col.key.includes(t.status));
          return (
            <section key={col.title} className="rounded-2xl bg-card/40 ring-1 ring-border p-3">
              <header className="flex items-center justify-between px-2 py-2 mb-2">
                <h3 className="inline-flex items-center gap-2 font-semibold">
                  <Icon className={`size-4 ${col.tone}`} /> {col.title}
                </h3>
                <span className="kbd">{items.length}</span>
              </header>
              <div className="space-y-3">
                {items.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-6">Nothing here</p>
                )}
                {items.map((t) => (
                  <article
                    key={t.id}
                    className="rounded-xl bg-background ring-1 ring-border p-3 hover:ring-primary/40 transition"
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="font-[var(--font-num)] text-sm font-bold">
                        #{t.order_number.slice(-6)}
                      </span>
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        {formatDistanceToNow(new Date(t.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {t.customer_name} · {t.fulfillment}
                    </p>
                    <ul className="mt-2 space-y-1">
                      {t.order_items.map((it, idx) => (
                        <li key={idx} className="text-sm flex justify-between gap-2">
                          <span className="truncate">{it.name}</span>
                          <span className="font-[var(--font-num)] text-muted-foreground">
                            ×{it.quantity}
                          </span>
                        </li>
                      ))}
                    </ul>
                    {t.notes && (
                      <p className="mt-2 text-xs italic text-primary/90 bg-primary/5 rounded p-2">
                        Note: {t.notes}
                      </p>
                    )}
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {t.status === "ready" && t.fulfillment === "delivery" && (
                        <button
                          onClick={() => doAdvance({ id: t.id, status: "out_for_delivery" })}
                          className="text-xs rounded-md bg-primary/15 text-primary px-2.5 py-1.5 hover:bg-primary/25"
                        >
                          Send out
                        </button>
                      )}
                      <button
                        onClick={() => doAdvance({ id: t.id, status: col.next })}
                        className="text-xs rounded-md bg-primary text-primary-foreground px-2.5 py-1.5 inline-flex items-center gap-1 hover:bg-primary-glow"
                      >
                        <CheckCircle2 className="size-3" />
                        Mark {col.next.replace(/_/g, " ")}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

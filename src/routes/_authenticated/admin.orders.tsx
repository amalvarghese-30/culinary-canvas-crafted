import { useApiQuery, useApiMutation } from "@/api/hooks";
import { apiFetch } from "@/api/client";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const COLUMNS = [
  { id: "placed", label: "New" },
  { id: "confirmed", label: "Confirmed" },
  { id: "preparing", label: "Preparing" },
  { id: "ready", label: "Ready" },
  { id: "out_for_delivery", label: "Out for delivery" },
  { id: "delivered", label: "Delivered" },
] as const;

const NEXT: Record<string, string | null> = {
  placed: "confirmed",
  confirmed: "preparing",
  preparing: "ready",
  ready: "out_for_delivery",
  out_for_delivery: "delivered",
  delivered: null,
  cancelled: null,
};

export default function AdminOrdersPage() {
  const { data, loading: isLoading, refetch } = useApiQuery(
    "admin-orders",
    () => apiFetch("/api/admin/orders"),
    { refetchInterval: 10000 }
  );

  const { mutate: doUpdate, loading: isMutating } = useApiMutation(
    (vars: { id: string; status: string }) =>
      apiFetch(`/api/admin/orders/${vars.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: vars.status }),
      }),
    {
      onSuccess: () => refetch(),
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

  const orders = ((data as any)?.data ?? data ?? []) as any[];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {COLUMNS.map((col) => {
        const list = orders.filter((o) => o.status === col.id);
        return (
          <div key={col.id} className="glass rounded-2xl p-4 min-h-[200px]">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display text-lg">{col.label}</h2>
              <span className="text-xs text-muted-foreground">{list.length}</span>
            </div>
            <div className="space-y-3">
              {list.map((o) => (
                <div key={o.id} className="rounded-xl bg-card/60 ring-1 ring-border/40 p-3">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="font-mono text-xs text-primary">{o.order_number}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(o.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <p className="text-sm font-medium mt-1">{o.customer_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {o.fulfillment} · ₹{Number(o.total).toLocaleString("en-IN")}
                  </p>
                  <ul className="text-xs text-muted-foreground mt-2 space-y-0.5">
                    {(o.order_items ?? []).slice(0, 4).map((it: any, idx: number) => (
                      <li key={idx}>
                        {it.quantity}× {it.name}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-3 flex gap-2">
                    {NEXT[o.status] && (
                      <button
                        onClick={() =>
                          doUpdate({ id: o.id, status: NEXT[o.status] as string })
                        }
                        className="flex-1 text-xs font-semibold rounded-md bg-primary px-2 py-1.5 text-primary-foreground hover:bg-primary-glow transition"
                      >
                        → {NEXT[o.status]?.replace(/_/g, " ")}
                      </button>
                    )}
                    {o.status !== "cancelled" && o.status !== "delivered" && (
                      <button
                        onClick={() => doUpdate({ id: o.id, status: "cancelled" })}
                        className="text-xs rounded-md px-2 py-1.5 ring-1 ring-border/60 text-muted-foreground hover:text-destructive transition"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {list.length === 0 && (
                <p className="text-xs text-muted-foreground italic">None</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

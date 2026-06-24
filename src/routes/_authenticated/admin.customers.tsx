import { useMemo, useState } from "react";
import { useApiQuery } from "@/api/hooks";
import { apiFetch } from "@/api/client";
import { Loader2, Search, Users, Crown } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

type Customer = {
  user_id: string;
  name: string;
  phone: string;
  orders: number;
  ltv: number;
  last_order: string;
};

export default function CustomersPage() {
  const [q, setQ] = useState("");
  const { data, loading: isLoading } = useApiQuery("customers", () =>
    apiFetch("/api/admin/customers")
  );

  const filtered = useMemo(() => {
    const list = (data ?? []) as Customer[];
    if (!q.trim()) return list;
    const needle = q.toLowerCase();
    return list.filter(
      (c) => c.name?.toLowerCase().includes(needle) || c.phone?.includes(needle),
    );
  }, [data, q]);

  if (isLoading) {
    return (
      <div className="grid place-items-center py-20">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const total = filtered.length;
  const ltvSum = filtered.reduce((s, c) => s + c.ltv, 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-display text-2xl">Customers</h2>
          <p className="text-sm text-muted-foreground">
            {total} customers · ₹{ltvSum.toLocaleString("en-IN")} lifetime revenue
          </p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Name or phone…"
            className="rounded-xl bg-card ring-1 ring-border pl-10 pr-4 py-2 text-sm w-64"
          />
        </div>
      </div>

      <div className="rounded-2xl ring-1 ring-border bg-card overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <Users className="mx-auto size-10 text-muted-foreground/40" />
            <p className="mt-3 text-sm text-muted-foreground">No customers found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-background/40">
                <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Orders</th>
                  <th className="px-4 py-3">LTV</th>
                  <th className="px-4 py-3">Last order</th>
                  <th className="px-4 py-3">Tag</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, i) => {
                  const tag =
                    c.ltv > 5000
                      ? { label: "VIP", className: "bg-primary/20 text-primary" }
                      : c.orders >= 3
                        ? { label: "Loyal", className: "bg-success/20 text-success" }
                        : { label: "New", className: "bg-muted text-muted-foreground" };
                  return (
                    <tr
                      key={c.user_id}
                      className={i % 2 ? "bg-background/20" : ""}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {c.ltv > 5000 && <Crown className="size-4 text-primary" />}
                          <div>
                            <p className="font-medium">{c.name || "—"}</p>
                            <p className="text-xs text-muted-foreground">{c.phone || "—"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-[var(--font-num)]">{c.orders}</td>
                      <td className="px-4 py-3 font-[var(--font-num)]">
                        ₹{c.ltv.toLocaleString("en-IN")}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {formatDistanceToNow(new Date(c.last_order), { addSuffix: true })}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full ${tag.className}`}>
                          {tag.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

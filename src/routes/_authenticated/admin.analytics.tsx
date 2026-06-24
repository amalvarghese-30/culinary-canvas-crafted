import { useState } from "react";
import { useApiQuery } from "@/api/hooks";
import { apiFetch } from "@/api/client";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
} from "recharts";
import { Loader2, IndianRupee, ShoppingBag, TrendingUp, XCircle, Download } from "lucide-react";

export default function AnalyticsPage() {
  const [days, setDays] = useState(14);
  const { data, loading: isLoading } = useApiQuery(
    `analytics-${days}`,
    () => apiFetch(`/api/admin/analytics?days=${days}`)
  );

  if (isLoading) {
    return (
      <div className="grid place-items-center py-20">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!data) return null;

  const d = data as any;
  const stats = [
    { label: "Revenue", value: `₹${d.totals.revenue.toLocaleString("en-IN")}`, icon: IndianRupee },
    { label: "Orders", value: d.totals.orders, icon: ShoppingBag },
    { label: "Avg order", value: `₹${d.totals.aov.toLocaleString("en-IN")}`, icon: TrendingUp },
    { label: "Cancelled", value: d.totals.cancelled, icon: XCircle },
  ];

  function exportCsv() {
    const rows = [
      ["Date", "Revenue", "Orders"],
      ...d.series.map((r: any) => [r.date, r.revenue, r.orders]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `momo-analytics-${days}d.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-display text-2xl">Analytics</h2>
          <p className="text-sm text-muted-foreground">Last {days} days</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={exportCsv}
            className="inline-flex items-center gap-2 rounded-lg ring-1 ring-border bg-card/40 px-3 py-1.5 text-xs hover:bg-white/5"
          >
            <Download className="size-3" /> CSV
          </button>
          <div className="flex gap-1 rounded-lg ring-1 ring-border p-1 bg-card/40">
            {[7, 14, 30, 90].map((n) => (
              <button
                key={n}
                onClick={() => setDays(n)}
                className={`px-3 py-1.5 text-xs rounded-md ${
                  days === n ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                }`}
              >
                {n}d
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="rounded-2xl ring-1 ring-border bg-card p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider text-muted-foreground">
                  {s.label}
                </span>
                <Icon className="size-4 text-primary" />
              </div>
              <p className="font-display text-2xl mt-2">{s.value}</p>
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl ring-1 ring-border bg-card p-4">
        <h3 className="font-semibold mb-3">Revenue trend</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={d.series}>
              <defs>
                <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(35 70% 55%)" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="hsl(35 70% 55%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="hsl(0 0% 100% / 0.05)" />
              <XAxis dataKey="date" tick={{ fill: "hsl(0 0% 60%)", fontSize: 11 }} />
              <YAxis tick={{ fill: "hsl(0 0% 60%)", fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  background: "hsl(0 0% 11%)",
                  border: "1px solid hsl(0 0% 100% / 0.1)",
                  borderRadius: 8,
                }}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="hsl(35 70% 55%)"
                fill="url(#gold)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="rounded-2xl ring-1 ring-border bg-card p-4">
          <h3 className="font-semibold mb-3">Top items by revenue</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={d.topItems} layout="vertical">
                <XAxis type="number" tick={{ fill: "hsl(0 0% 60%)", fontSize: 11 }} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={120}
                  tick={{ fill: "hsl(0 0% 70%)", fontSize: 11 }}
                />
                <Tooltip
                  contentStyle={{
                    background: "hsl(0 0% 11%)",
                    border: "1px solid hsl(0 0% 100% / 0.1)",
                    borderRadius: 8,
                  }}
                />
                <Bar dataKey="revenue" fill="hsl(35 70% 55%)" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl ring-1 ring-border bg-card p-4">
          <h3 className="font-semibold mb-3">Hourly order heatmap</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={d.hours}>
                <CartesianGrid stroke="hsl(0 0% 100% / 0.05)" />
                <XAxis dataKey="hour" tick={{ fill: "hsl(0 0% 60%)", fontSize: 11 }} />
                <YAxis tick={{ fill: "hsl(0 0% 60%)", fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(0 0% 11%)",
                    border: "1px solid hsl(0 0% 100% / 0.1)",
                    borderRadius: 8,
                  }}
                />
                <Bar dataKey="orders" fill="hsl(35 70% 55%)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

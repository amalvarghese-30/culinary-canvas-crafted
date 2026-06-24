import { useApiQuery } from "@/api/hooks";
import { apiFetch } from "@/api/client";
import { IndianRupee, ShoppingBag, TrendingUp, Clock, CalendarDays, Loader2, UtensilsCrossed, Users, AlertTriangle } from "lucide-react";
import { BusinessAssistant } from "@/components/admin/BusinessAssistant";

export default function DashboardPage() {
  const { data, loading: isLoading, error } = useApiQuery(
    "admin-dashboard",
    () => apiFetch("/api/admin/dashboard"),
    { refetchInterval: 15000 }
  );

  if (isLoading) {
    return (
      <div className="grid place-items-center py-20">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !data) {
    return <p className="text-destructive">Failed to load stats.</p>;
  }

  const d = data as any;
  const cards = [
    { label: "Revenue today", value: `₹${d.revenueToday.toLocaleString("en-IN")}`, icon: IndianRupee },
    { label: "Orders today", value: d.ordersToday, icon: ShoppingBag },
    { label: "Avg. order value", value: `₹${d.aov.toLocaleString("en-IN")}`, icon: TrendingUp },
    { label: "Active orders", value: d.activeOrders, icon: Clock },
    { label: "Pending reservations", value: d.pendingReservations, icon: CalendarDays },
    { label: "Menu items", value: d.menuCount, icon: UtensilsCrossed },
    { label: "Customers", value: d.customerCount, icon: Users },
    { label: "Low stock alerts", value: d.lowStockCount, icon: AlertTriangle, warn: d.lowStockCount > 0 },
  ];

  const weekSeries = d.weekSeries as { date: string; revenue: number; orders: number }[] | undefined;
  const maxRev = weekSeries?.length ? Math.max(...weekSeries.map((s) => s.revenue), 1) : 1;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.label} className="glass rounded-2xl p-6">
              <div className="flex items-start justify-between">
                <p className="text-sm text-muted-foreground">{c.label}</p>
                <Icon className={`size-5 ${(c as any).warn ? "text-amber-400" : "text-primary"}`} />
              </div>
              <p className={`font-display text-3xl mt-3 ${(c as any).warn ? "text-amber-400" : ""}`}>{c.value}</p>
            </div>
          );
        })}
      </div>

      {weekSeries && weekSeries.length > 0 && (
        <div className="glass rounded-2xl p-6">
          <h3 className="font-display text-xl mb-4">This Week</h3>
          <div className="flex items-end gap-3 h-32">
            {weekSeries.map((day) => (
              <div key={day.date} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                <span className="text-xs font-[var(--font-num)] text-muted-foreground">
                  ₹{(day.revenue / 1000).toFixed(0)}k
                </span>
                <div
                  className="w-full bg-primary/30 rounded-t-md transition-all duration-500 min-h-[4px]"
                  style={{ height: `${Math.max(4, (day.revenue / maxRev) * 100)}%` }}
                />
                <span className="text-[11px] text-muted-foreground">{day.date}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-6 mt-4 text-xs text-muted-foreground">
            <span>Total: ₹{weekSeries.reduce((s, d) => s + d.revenue, 0).toLocaleString("en-IN")}</span>
            <span>{weekSeries.reduce((s, d) => s + d.orders, 0)} orders</span>
          </div>
        </div>
      )}

      <BusinessAssistant />
    </div>
  );
}

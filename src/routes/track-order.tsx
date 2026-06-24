import { useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "@/api/client";
import { toast } from "sonner";
import { Search, Loader2, Clock, MapPin, Package, Phone, XCircle } from "lucide-react";

const STATUS_FLOW = ["pending", "confirmed", "preparing", "ready", "served", "completed"] as const;
const STATUS_LABELS: Record<string, string> = {
  pending: "Order Received",
  confirmed: "Confirmed",
  preparing: "Being Prepared",
  ready: "Ready for Pickup",
  served: "Served",
  completed: "Completed",
  cancelled: "Cancelled",
};

type TrackedOrder = {
  orderNumber: string;
  status: string;
  type: string;
  total: number;
  customerName: string;
  items: { name: string; quantity: number; price: number }[];
  estimatedReadyAt: string | null;
  createdAt: string;
  notes: string | null;
};

export default function TrackOrderPage() {
  const [orderNumber, setOrderNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [error, setError] = useState("");

  async function handleTrack(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setOrder(null);
    setLoading(true);
    try {
      const data = await apiFetch(
        `/api/public/orders/track?order_number=${encodeURIComponent(orderNumber)}&phone=${encodeURIComponent(phone)}`
      );
      setOrder(data as TrackedOrder);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Order not found");
    } finally {
      setLoading(false);
    }
  }

  const statusIndex = order ? STATUS_FLOW.indexOf(order.status as typeof STATUS_FLOW[number]) : -1;
  const isCancelled = order?.status === "cancelled";

  return (
    <main className="min-h-screen pt-32 pb-20">
      <div className="container-luxe max-w-lg">
        <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">Home</Link>
        <h1 className="font-display text-4xl md:text-5xl mt-6">Track your order</h1>
        <p className="text-muted-foreground mt-3">
          Enter your order number and phone to check status.
        </p>

        <form onSubmit={handleTrack} className="mt-8 space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-1">Order Number</label>
            <input
              required
              type="text"
              placeholder="e.g. MOMO-1234"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              className="input-luxe w-full"
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-1">Phone Number</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input
                required
                type="tel"
                placeholder="Same phone used when ordering"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="input-luxe w-full pl-10"
              />
            </div>
          </div>
          <button
            disabled={loading}
            className="w-full rounded-xl bg-primary text-primary-foreground py-3 font-semibold hover:bg-primary-glow transition shadow-[var(--shadow-luxe)] disabled:opacity-60 inline-flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
            {loading ? "Looking up..." : "Track order"}
          </button>
        </form>

        {error && (
          <div className="mt-8 p-6 rounded-2xl bg-destructive/10 ring-1 ring-destructive/30 text-center">
            <XCircle className="size-8 text-destructive mx-auto mb-2" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {order && (
          <div className="mt-8 rounded-2xl bg-card ring-1 ring-border overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-border/40">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Order</p>
                  <p className="font-display text-2xl">{order.orderNumber}</p>
                </div>
                <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${
                  isCancelled
                    ? "bg-destructive/15 text-destructive"
                    : statusIndex >= STATUS_FLOW.indexOf("ready")
                      ? "bg-success/15 text-success"
                      : "bg-primary/15 text-primary"
                }`}>
                  <Clock className="size-3" />
                  {STATUS_LABELS[order.status] ?? order.status}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {order.customerName} · {order.type === "delivery" ? "Delivery" : "Pickup"} · ₹{Number(order.total).toFixed(0)}
              </p>
            </div>

            {/* Progress */}
            {!isCancelled && (
              <div className="px-6 py-5 border-b border-border/40">
                <div className="flex items-center justify-between">
                  {STATUS_FLOW.map((s, i) => (
                    <div key={s} className="flex flex-col items-center gap-1.5 flex-1">
                      <div className={`size-3 rounded-full transition ${
                        i <= statusIndex
                          ? i === STATUS_FLOW.indexOf("completed") && statusIndex >= STATUS_FLOW.indexOf("completed")
                            ? "bg-success"
                            : "bg-primary"
                          : "bg-muted"
                      }`} />
                      <span className="text-[10px] text-muted-foreground text-center leading-tight">
                        {s === "pending" ? "Received" : s === "preparing" ? "Cooking" : s === "ready" ? "Ready" : s === "served" ? "Served" : s === "completed" ? "Done" : s}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="relative mt-2">
                  <div className="absolute top-0 left-0 h-0.5 bg-muted w-full rounded" />
                  <div
                    className="absolute top-0 left-0 h-0.5 bg-primary rounded transition-all duration-700"
                    style={{ width: `${Math.max(0, (statusIndex / (STATUS_FLOW.length - 1)) * 100)}%` }}
                  />
                </div>
              </div>
            )}

            {/* Items */}
            <div className="p-6 border-b border-border/40">
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Items</p>
              <ul className="space-y-2">
                {order.items.map((item, i) => (
                  <li key={i} className="flex justify-between text-sm">
                    <span>{item.quantity}x {item.name}</span>
                    <span className="font-[var(--font-num)] text-muted-foreground">₹{(item.price * item.quantity).toFixed(0)}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Footer */}
            <div className="p-6 space-y-2">
              {order.estimatedReadyAt && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="size-4" />
                  <span>Estimated ready: {new Date(order.estimatedReadyAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="size-4" />
                <span>Ordered at {new Date(order.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })} on {new Date(order.createdAt).toLocaleDateString("en-IN")}</span>
              </div>
              {order.notes && (
                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                  <Package className="size-4 shrink-0 mt-0.5" />
                  <span>{order.notes}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

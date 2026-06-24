import { useParams, Link } from "react-router-dom";
import { useApiQuery } from "@/api/hooks";
import { apiFetch } from "@/api/client";
import { Check, MessageCircle, Phone } from "lucide-react";
import { telLink, waLink, waOrderMessage } from "@/lib/restaurant";

const STAGES = ["placed", "confirmed", "preparing", "ready", "out_for_delivery", "delivered"] as const;
const LABELS: Record<string, string> = {
  placed: "Order placed",
  confirmed: "Confirmed",
  preparing: "In the kitchen",
  ready: "Ready",
  out_for_delivery: "On the way",
  delivered: "Delivered",
};

export default function OrderPage() {
  const { id } = useParams<{ id: string }>();
  const { data: order, loading: isLoading } = useApiQuery(
    `order-${id}`,
    () => apiFetch(`/api/orders/${id}`),
    { refetchInterval: 15000 }
  );

  if (isLoading) return <main className="min-h-screen pt-32 container-luxe"><p className="text-muted-foreground">Loading…</p></main>;
  if (!order) return <main className="min-h-screen pt-32 container-luxe"><p>Order not found.</p></main>;

  const o = order as any;
  const currentIdx = STAGES.indexOf(o.status as typeof STAGES[number]);
  const cancelled = o.status === "cancelled";

  return (
    <main className="min-h-screen pt-32 pb-20">
      <div className="container-luxe max-w-3xl">
        <Link to="/account" className="text-sm text-muted-foreground hover:text-foreground">← All orders</Link>
        <div className="mt-6 flex items-baseline justify-between gap-4 flex-wrap">
          <div>
            <span className="kbd">Order</span>
            <h1 className="font-display text-4xl md:text-5xl mt-2 font-[var(--font-num)]">{o.order_number}</h1>
          </div>
          <span className="kbd text-primary">{LABELS[o.status] ?? o.status}</span>
        </div>

        {!cancelled && (
          <ol className="mt-10 grid grid-cols-3 md:grid-cols-6 gap-2">
            {STAGES.map((s, i) => {
              const done = i <= currentIdx;
              return (
                <li key={s} className="text-center">
                  <div
                    className={`mx-auto grid place-items-center size-10 rounded-full ring-1 transition ${
                      done ? "bg-primary text-primary-foreground ring-primary" : "ring-border text-muted-foreground"
                    }`}
                  >
                    {done ? <Check className="size-5" /> : <span className="text-xs">{i + 1}</span>}
                  </div>
                  <div className={`mt-2 text-[11px] ${done ? "text-foreground" : "text-muted-foreground"}`}>
                    {LABELS[s]}
                  </div>
                </li>
              );
            })}
          </ol>
        )}

        <section className="mt-10 rounded-2xl ring-1 ring-border bg-card/60 p-6">
          <h2 className="font-display text-xl mb-4">Items</h2>
          <ul className="space-y-2 text-sm">
            {o.order_items?.map((i: { id: string; quantity: number; name: string; price: number }) => (
              <li key={i.id} className="flex justify-between gap-3">
                <span>{i.quantity}× {i.name}</span>
                <span className="font-[var(--font-num)]">₹{(i.price * i.quantity).toFixed(0)}</span>
              </li>
            ))}
          </ul>
          <div className="border-t border-border mt-4 pt-4 space-y-1 text-sm">
            <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span className="font-[var(--font-num)]">₹{Number(o.subtotal).toFixed(0)}</span></div>
            <div className="flex justify-between text-muted-foreground"><span>Tax</span><span className="font-[var(--font-num)]">₹{Number(o.tax).toFixed(0)}</span></div>
            <div className="flex justify-between text-muted-foreground"><span>Delivery</span><span className="font-[var(--font-num)]">₹{Number(o.delivery_fee).toFixed(0)}</span></div>
            <div className="flex justify-between text-base pt-2 border-t border-border mt-2"><span className="font-medium">Total</span><span className="font-[var(--font-num)] text-primary">₹{Number(o.total).toFixed(0)}</span></div>
          </div>
        </section>

        <section className="mt-6 rounded-2xl ring-1 ring-border bg-card/60 p-6 text-sm">
          <h2 className="font-display text-xl mb-3">{o.fulfillment === "delivery" ? "Delivering to" : "Pickup details"}</h2>
          <p>{o.customer_name} · {o.customer_phone}</p>
          {o.fulfillment === "delivery" && (
            <p className="text-muted-foreground mt-1">{o.address_line}, {o.city} {o.pincode}</p>
          )}
          {o.notes && <p className="text-muted-foreground mt-2">Notes: {o.notes}</p>}
        </section>

        <div className="mt-6 grid sm:grid-cols-2 gap-3">
          <a
            href={waLink(
              waOrderMessage({
                order_number: o.order_number,
                customer_name: o.customer_name,
                fulfillment: o.fulfillment as "delivery" | "pickup",
                total: o.total,
                items: (o.order_items ?? []).map((i: { quantity: number; name: string }) => ({
                  quantity: i.quantity,
                  name: i.name,
                })),
                address_line: o.address_line,
                city: o.city,
                pincode: o.pincode,
              }),
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground py-3 font-semibold hover:bg-primary-glow transition"
          >
            <MessageCircle className="size-4" /> Send to WhatsApp
          </a>
          <a
            href={telLink()}
            className="inline-flex items-center justify-center gap-2 rounded-xl ring-1 ring-border bg-card/60 py-3 font-semibold hover:ring-primary/40 transition"
          >
            <Phone className="size-4" /> Call restaurant
          </a>
        </div>
      </div>
    </main>
  );
}

import { useNavigate } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import { useApiQuery, useApiMutation } from "@/api/hooks";
import { apiFetch } from "@/api/client";
import { useCart } from "@/lib/cart-store";
import { waLink, waOrderMessage } from "@/lib/restaurant";
import { toast } from "sonner";
import { Tag, X, Gift, ShieldCheck } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function CheckoutPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { items, subtotal, clear } = useCart();
  const [fulfillment, setFulfillment] = useState<"delivery" | "pickup">("delivery");
  const [form, setForm] = useState({
    customer_name: "",
    customer_phone: "",
    address_line: "",
    city: "",
    pincode: "",
    notes: "",
  });
  const [razorpayReady, setRazorpayReady] = useState(false);

  const { data: profile } = useApiQuery("my-profile", () =>
    apiFetch("/api/profile")
  );

  useEffect(() => {
    if (!profile) return;
    const p = profile as any;
    setForm((f) => ({
      customer_name: f.customer_name || p.full_name || "",
      customer_phone: f.customer_phone || p.phone || "",
      address_line: f.address_line || p.default_address_line || "",
      city: f.city || p.default_city || "",
      pincode: f.pincode || p.default_pincode || "",
      notes: f.notes,
    }));
  }, [profile]);

  useEffect(() => {
    if ((window as any).Razorpay) {
      setRazorpayReady(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => setRazorpayReady(true);
    document.body.appendChild(script);
  }, []);

  const sub = subtotal();
  const [promoInput, setPromoInput] = useState("");
  const [promo, setPromo] = useState<{ code: string; discount: number; description: string } | null>(null);
  const { mutate: validatePromo, loading: validating } = useApiMutation(
    () => apiFetch("/api/promotions/validate", { method: "POST", body: JSON.stringify({ code: promoInput, subtotal: sub }) }),
    {
      onSuccess: (res: any) => {
        if (res.ok) {
          setPromo({ code: res.code, discount: res.discount, description: res.description });
          toast.success(`Code ${res.code} applied`);
        } else {
          toast.error(res.reason);
        }
      },
      onError: () => toast.error("Failed to validate promo"),
    }
  );

  // Loyalty
  const { data: loyalty } = useApiQuery("my-loyalty", () =>
    apiFetch("/api/loyalty/mine")
  );
  const [pointsToRedeem, setPointsToRedeem] = useState(0);
  const loy = loyalty as any;
  const pointValue = loy?.point_value ?? 0.5;
  const pointsValue = +(pointsToRedeem * pointValue).toFixed(2);

  const discountAmt = promo?.discount ?? 0;
  const discounted = Math.max(0, sub - discountAmt - pointsValue);
  const tax = +(discounted * 0.05).toFixed(2);
  const delivery_fee = fulfillment === "delivery" && discounted < 500 && discounted > 0 ? 40 : 0;
  const total = +(discounted + tax + delivery_fee).toFixed(2);

  // Detect QR table session
  const tableId = typeof window !== "undefined" ? sessionStorage.getItem("dine_in_table") : null;

  const buildPayload = useCallback((overrides: Record<string, any> = {}) => ({
    items: items.map((i) => ({
      item_id: i.itemId ?? i.id,
      name: i.name + (i.addons && i.addons.length ? ` (+${i.addons.map((a) => a.name).join(", ")})` : ""),
      price: i.price,
      quantity: i.quantity,
      notes: i.notes,
      addons: i.addons,
    })),
    fulfillment: tableId ? "dine_in" : fulfillment,
    customer_name: form.customer_name,
    customer_phone: form.customer_phone,
    address_line: fulfillment === "delivery" ? form.address_line : null,
    city: fulfillment === "delivery" ? form.city : null,
    pincode: fulfillment === "delivery" ? form.pincode : null,
    notes: form.notes || null,
    promo_code: promo?.code ?? null,
    points_redeemed: pointsToRedeem || undefined,
    table_id: tableId,
    source: tableId ? "qr" : "web",
    ...overrides,
  }), [items, fulfillment, form, promo, pointsToRedeem, tableId]);

  const { mutate: placeOrderMut, loading: placing } = useApiMutation(
    (payload: any) => apiFetch("/api/orders", { method: "POST", body: JSON.stringify(payload) }),
    {
      onSuccess: (res: any) => {
        clear();
        toast.success(`Order ${res.order_number} placed!`);
        try {
          const msg = waOrderMessage({
            order_number: res.order_number,
            customer_name: form.customer_name,
            fulfillment: tableId ? "dine_in" : fulfillment,
            total,
            items: items.map((i) => ({ quantity: i.quantity, name: i.name })),
            address_line: fulfillment === "delivery" ? form.address_line : null,
            city: fulfillment === "delivery" ? form.city : null,
            pincode: fulfillment === "delivery" ? form.pincode : null,
          });
          window.open(waLink(msg), "_blank", "noopener,noreferrer");
        } catch {
          /* non-critical */
        }
        navigate(`/order/${res.id}`);
      },
      onError: (err) => toast.error(err.message || "Order failed"),
    }
  );

  function placeOrder(paymentOverrides: Record<string, any> = {}) {
    placeOrderMut(buildPayload(paymentOverrides));
    if (tableId) sessionStorage.removeItem("dine_in_table");
  }

  function openRazorpay() {
    const totalPaise = Math.round(total * 100);
    apiFetch("/api/payments/create-order", {
      method: "POST",
      body: JSON.stringify({ amount: totalPaise, notes: { customer: form.customer_name } }),
    })
      .then((rzpRes: any) => {
        const { id, amount, currency, key_id } = rzpRes.data;
        const rzp = new (window as any).Razorpay({
          key: key_id,
          amount,
          currency,
          name: "Momo House",
          description: `Order payment`,
          image: "/logo.png",
          order_id: id,
          handler: async function (response: any) {
            try {
              await apiFetch("/api/payments/verify", {
                method: "POST",
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                }),
              });
              placeOrder({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                payment_status: "paid",
                payment_method: "online",
              });
            } catch {
              toast.error("Payment verification failed — order placed with pending payment");
              placeOrder({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                payment_status: "pending",
                payment_method: "online",
              });
            }
          },
          modal: {
            ondismiss: () => {
              toast.info("Payment cancelled — order placed with pending payment");
              placeOrder({ payment_status: "pending", payment_method: "online" });
            },
          },
          prefill: {
            name: form.customer_name,
            contact: form.customer_phone,
          },
          theme: { color: "#C78A2C" },
        });
        rzp.open();
      })
      .catch(() => {
        toast.error("Payment gateway unavailable — placing order without payment");
        placeOrder({ payment_status: "pending", payment_method: "online" });
      });
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (razorpayReady) {
      openRazorpay();
    } else {
      // Fallback: place order without online payment
      placeOrder();
    }
  }

  if (items.length === 0) {
    return (
      <main className="min-h-screen pt-32 pb-20">
        <div className="container-luxe max-w-2xl text-center">
          <h1 className="font-display text-4xl">{t("checkout.empty_cart")}</h1>
          <button
            onClick={() => navigate("/menu")}
            className="mt-6 rounded-xl bg-primary text-primary-foreground px-6 py-3 font-semibold"
          >
            {t("checkout.browse_menu")}
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen pt-32 pb-20">
      <div className="container-luxe max-w-5xl">
        <span className="kbd">{t("checkout.eyebrow")}</span>
        <h1 className="font-display text-4xl md:text-5xl mt-3">{t("checkout.title")}</h1>

        <div className="grid lg:grid-cols-[1fr_360px] gap-10 mt-10">
          <form onSubmit={submit} className="space-y-5">
            <div className="inline-flex rounded-xl ring-1 ring-border p-1 bg-card/40">
              {(["delivery", "pickup"] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFulfillment(f)}
                  className={`px-5 py-2 rounded-lg text-sm capitalize transition ${
                    fulfillment === f ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                  }`}
                >
                  {f === "delivery" ? t("checkout.delivery") : t("checkout.pickup")}
                </button>
              ))}
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <input
                required maxLength={120}
                placeholder={t("checkout.full_name")}
                value={form.customer_name}
                onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
                className="input-luxe"
              />
              <input
                required maxLength={20}
                type="tel"
                placeholder={t("checkout.phone")}
                value={form.customer_phone}
                onChange={(e) => setForm({ ...form, customer_phone: e.target.value })}
                className="input-luxe"
              />
            </div>

            {fulfillment === "delivery" && (
              <div className="space-y-4">
                <input
                  required maxLength={300}
                  placeholder={t("checkout.address")}
                  value={form.address_line}
                  onChange={(e) => setForm({ ...form, address_line: e.target.value })}
                  className="input-luxe w-full"
                />
                <div className="grid sm:grid-cols-2 gap-4">
                  <input
                    required maxLength={80}
                    placeholder={t("checkout.city")}
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    className="input-luxe"
                  />
                  <input
                    required maxLength={12}
                    placeholder={t("checkout.pincode")}
                    value={form.pincode}
                    onChange={(e) => setForm({ ...form, pincode: e.target.value })}
                    className="input-luxe"
                  />
                </div>
              </div>
            )}

            <textarea
              maxLength={500}
              placeholder={t("checkout.notes")}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="input-luxe w-full min-h-[100px] resize-none"
            />

            {razorpayReady && (
              <div className="rounded-xl ring-1 ring-success/20 bg-success/5 p-4 text-sm text-muted-foreground flex items-start gap-3">
                <ShieldCheck className="size-5 text-success shrink-0 mt-0.5" />
                <div>
                  <p className="text-foreground font-medium">{t("checkout.secure_payment_title")}</p>
                  <p>{t("checkout.secure_payment_desc")}</p>
                </div>
              </div>
            )}

            <button
              disabled={placing}
              className="w-full rounded-xl bg-primary text-primary-foreground py-4 font-semibold hover:bg-primary-glow transition shadow-[var(--shadow-luxe)] disabled:opacity-60"
            >
              {placing ? t("checkout.placing_order") : razorpayReady ? `${t("checkout.pay")} ₹${total.toFixed(0)}` : `${t("checkout.place_order")} · ₹${total.toFixed(0)}`}
            </button>
          </form>

          <aside className="rounded-2xl ring-1 ring-border bg-card/60 p-5 h-fit sticky top-28">
            <h2 className="font-display text-xl mb-4">{t("checkout.order_summary")}</h2>
            <ul className="space-y-2 text-sm">
              {items.map((i) => (
                <li key={i.id} className="flex justify-between gap-2">
                  <span className="truncate">
                    {i.quantity}× {i.name}
                  </span>
                  <span className="font-[var(--font-num)] shrink-0">₹{(((i.price + ((i.addons ?? []).reduce((s, a) => s + a.price, 0))) * i.quantity)).toFixed(0)}</span>
                </li>
              ))}
            </ul>
            <div className="border-t border-border mt-4 pt-4 space-y-1 text-sm">
              <div className="flex justify-between text-muted-foreground"><span>{t("checkout.subtotal")}</span><span className="font-[var(--font-num)]">₹{sub.toFixed(0)}</span></div>
              {discountAmt > 0 && (
                <div className="flex justify-between text-success">
                  <span className="inline-flex items-center gap-1"><Tag className="size-3" /> {promo?.code}</span>
                  <span className="font-[var(--font-num)]">−₹{discountAmt.toFixed(0)}</span>
                </div>
              )}
              {pointsValue > 0 && (
                <div className="flex justify-between text-success">
                  <span className="inline-flex items-center gap-1"><Gift className="size-3" /> {pointsToRedeem} pts</span>
                  <span className="font-[var(--font-num)]">−₹{pointsValue.toFixed(0)}</span>
                </div>
              )}
              <div className="flex justify-between text-muted-foreground"><span>{t("checkout.gst")}</span><span className="font-[var(--font-num)]">₹{tax.toFixed(0)}</span></div>
              {fulfillment === "delivery" && (
                <div className="flex justify-between text-muted-foreground"><span>{t("checkout.delivery_fee")}</span><span className="font-[var(--font-num)]">{delivery_fee === 0 ? t("checkout.free") : `₹${delivery_fee}`}</span></div>
              )}
              <div className="flex justify-between text-base pt-2 border-t border-border mt-2">
                <span className="font-medium">{t("checkout.total")}</span>
                <span className="font-[var(--font-num)] text-primary">₹{total.toFixed(0)}</span>
              </div>
            </div>

            <div className="border-t border-border mt-4 pt-4">
              {promo ? (
                <div className="flex items-center justify-between rounded-xl ring-1 ring-success/40 bg-success/5 px-3 py-2 text-sm">
                  <span className="inline-flex items-center gap-2 text-success">
                    <Tag className="size-3" /> {promo.code} applied
                  </span>
                  <button onClick={() => setPromo(null)} className="text-muted-foreground hover:text-foreground">
                    <X className="size-4" />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    value={promoInput}
                    onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                    placeholder="Promo code"
                    className="input-luxe text-sm flex-1"
                    maxLength={50}
                  />
                  <button
                    type="button"
                    onClick={() => promoInput && validatePromo(undefined as any)}
                    disabled={validating || !promoInput}
                    className="rounded-xl ring-1 ring-primary/40 text-primary text-sm px-3 hover:bg-primary/10 disabled:opacity-60"
                  >
                    Apply
                  </button>
                </div>
              )}
              <p className="text-[10px] text-muted-foreground mt-2">Try <span className="font-mono">WELCOME10</span> or <span className="font-mono">MOMO50</span></p>
            </div>

            {loy && loy.balance > 0 && (
              <div className="border-t border-border mt-4 pt-4 space-y-2">
                <p className="text-sm font-semibold inline-flex items-center gap-2">
                  <Gift className="size-4 text-primary" /> Redeem loyalty
                </p>
                <p className="text-xs text-muted-foreground">
                  Balance: <span className="text-foreground font-[var(--font-num)]">{loy.balance}</span> pts (₹{(loy.balance * pointValue).toFixed(0)} value)
                </p>
                <input
                  type="range"
                  min={0}
                  max={Math.min(loy.balance, Math.floor(sub / pointValue))}
                  step={10}
                  value={pointsToRedeem}
                  onChange={(e) => setPointsToRedeem(Number(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0</span>
                  <span className="text-foreground">{pointsToRedeem} pts · ₹{pointsValue.toFixed(0)}</span>
                </div>
              </div>
            )}
            {tableId && (
              <div className="border-t border-border mt-4 pt-4 text-xs text-muted-foreground">
                <span className="inline-block bg-primary/15 text-primary px-2 py-1 rounded-full">Dine-in · scanned table</span>
              </div>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}

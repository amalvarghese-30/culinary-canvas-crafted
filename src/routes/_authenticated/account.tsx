import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useApiQuery, useApiMutation } from "@/api/hooks";
import { apiFetch } from "@/api/client";
import { useCart } from "@/lib/cart-store";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { Heart, Sparkles, Trash2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";

type Tab = "orders" | "reservations" | "favorites" | "loyalty" | "profile";

export default function AccountPage() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [tab, setTab] = useState<Tab>("orders");

  async function handleSignOut() {
    await signOut();
    toast.success("Signed out");
    navigate("/");
  }

  return (
    <main className="min-h-screen pt-32 pb-20">
      <div className="container-luxe max-w-4xl">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <span className="kbd">Account</span>
            <h1 className="font-display text-4xl md:text-5xl mt-3">Your dashboard</h1>
          </div>
          <button
            onClick={handleSignOut}
            className="rounded-xl ring-1 ring-border px-4 py-2 text-sm hover:bg-white/5 transition"
          >
            Sign out
          </button>
        </div>

        <div className="mt-8 inline-flex rounded-xl ring-1 ring-border p-1 bg-card/40 overflow-x-auto max-w-full">
          {([
            ["orders", "Orders"],
            ["reservations", "Reservations"],
            ["favorites", "Favorites"],
            ["loyalty", "Loyalty"],
            ["profile", "Profile"],
          ] as const).map(([k, label]) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={`px-4 py-2 rounded-lg text-sm transition whitespace-nowrap ${
                tab === k
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="mt-8">
          {tab === "orders" && <OrdersTab />}
          {tab === "reservations" && <ReservationsTab />}
          {tab === "favorites" && <FavoritesTab />}
          {tab === "loyalty" && <LoyaltyTab />}
          {tab === "profile" && <ProfileTab />}
        </div>
      </div>
    </main>
  );
}

function FavoritesTab() {
  const cart = useCart();
  const { data, loading: isLoading, refetch } = useApiQuery("my-favorites", () =>
    apiFetch("/api/favorites")
  );
  const { mutate: removeMut, loading: removing } = useApiMutation(
    (menu_item_id: string) => apiFetch(`/api/favorites/${menu_item_id}`, { method: "POST" }),
    { onSuccess: () => refetch() }
  );

  if (isLoading) return <p className="text-muted-foreground">Loading…</p>;
  if (!data || (data as any[]).length === 0) {
    return (
      <div className="rounded-2xl ring-1 ring-border bg-card/60 p-10 text-center">
        <Heart className="size-8 text-primary/60 mx-auto mb-3" />
        <p className="text-muted-foreground">No favorites yet. Tap the heart on any dish.</p>
        <Link to="/menu" className="inline-block mt-5 rounded-xl bg-primary text-primary-foreground px-5 py-2.5 font-semibold">
          Browse menu
        </Link>
      </div>
    );
  }
  return (
    <div className="grid sm:grid-cols-2 gap-3">
      {(data as any[]).map((f: any) => {
        const m = f.menu_items;
        if (!m) return null;
        return (
          <div key={f.menu_item_id} className="rounded-2xl ring-1 ring-border bg-card/60 p-4 flex gap-3">
            <div className="flex-1 min-w-0">
              <div className="font-medium">{m.style} <span className="text-muted-foreground">· {m.variant}</span></div>
              <div className="text-xs text-muted-foreground line-clamp-2 mt-1">{m.description}</div>
              <div className="font-[var(--font-num)] text-primary mt-2">₹{Number(m.price).toFixed(0)}</div>
            </div>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => {
                  cart.add({ id: m.id, name: `${m.style} ${m.variant}`, price: Number(m.price) });
                  toast.success("Added");
                }}
                className="text-xs rounded-lg bg-primary text-primary-foreground px-3 py-1.5"
              >
                + Cart
              </button>
              <button
                onClick={() => removeMut(f.menu_item_id)}
                className="text-xs text-destructive inline-flex items-center gap-1 hover:underline"
              >
                <Trash2 className="size-3" /> Remove
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function LoyaltyTab() {
  const { data, loading: isLoading } = useApiQuery("my-loyalty", () =>
    apiFetch("/api/loyalty/mine")
  );
  if (isLoading) return <p className="text-muted-foreground">Loading…</p>;
  const loyalty = data as any;
  const balance = loyalty?.balance ?? 0;
  const ledger = loyalty?.ledger ?? [];
  const tier = loyalty?.current_tier;
  const nextTier = loyalty?.next_tier;
  const progressPct = loyalty?.progress_pct ?? 0;

  return (
    <div className="space-y-5">
      {/* Tier Card */}
      {tier && (
        <div
          className="rounded-2xl ring-1 ring-border bg-card/60 p-6"
          style={{ borderColor: tier.color ? tier.color + "60" : undefined }}
        >
          <div className="flex items-center gap-3">
            <span className="text-3xl">{tier.icon || "⭐"}</span>
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Your tier</p>
              <h3 className="font-display text-2xl" style={{ color: tier.color || undefined }}>
                {tier.name}
              </h3>
            </div>
            <span className="ml-auto text-xs rounded-full bg-primary/15 text-primary px-2.5 py-1">
              {tier.multiplier}x points
            </span>
          </div>

          {/* Benefits */}
          {tier.benefits && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {tier.benefits.free_delivery && (
                <span className="text-[11px] rounded-md bg-primary/10 text-primary px-2 py-0.5">Free delivery</span>
              )}
              {tier.benefits.priority_support && (
                <span className="text-[11px] rounded-md bg-amber-500/10 text-amber-500 px-2 py-0.5">Priority prep</span>
              )}
              {tier.benefits.birthday_reward && (
                <span className="text-[11px] rounded-md bg-pink-500/10 text-pink-500 px-2 py-0.5">Birthday reward</span>
              )}
              {tier.benefits.early_access && (
                <span className="text-[11px] rounded-md bg-violet-500/10 text-violet-500 px-2 py-0.5">Early access</span>
              )}
            </div>
          )}

          {/* Progress to next tier */}
          {nextTier && (
            <div className="mt-5 space-y-1.5">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {balance} / {nextTier.min_points} pts to{" "}
                  <span style={{ color: nextTier.color || undefined }}>{nextTier.name}</span>
                </span>
                <span>{progressPct}%</span>
              </div>
              <Progress value={progressPct} className="h-2" />
            </div>
          )}
          {!nextTier && (
            <p className="mt-4 text-xs text-muted-foreground">You've reached the highest tier!</p>
          )}
        </div>
      )}

      {/* Balance card */}
      <div className="rounded-2xl ring-1 ring-primary/30 bg-gradient-to-br from-primary/10 to-card p-8 text-center">
        <Sparkles className="size-6 text-primary mx-auto" />
        <p className="text-xs uppercase tracking-widest text-primary mt-3">Your balance</p>
        <p className="font-display text-5xl mt-2">{balance}</p>
        <p className="text-sm text-muted-foreground mt-2">
          Worth ₹{(balance * 0.5).toFixed(0)} · 1 pt = ₹0.50
        </p>
      </div>

      {/* Ledger */}
      {ledger.length > 0 ? (
        <div className="rounded-2xl ring-1 ring-border bg-card/60 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase tracking-wider text-muted-foreground border-b border-border">
              <tr><th className="text-left p-3">When</th><th className="text-left p-3">Reason</th><th className="text-right p-3">Points</th></tr>
            </thead>
            <tbody>
              {ledger.map((e: any) => (
                <tr key={e.id || e._id} className="border-b border-border/40">
                  <td className="p-3 text-muted-foreground">{new Date(e.created_at ?? e.createdAt).toLocaleDateString()}</td>
                  <td className="p-3 capitalize">{e.reason}</td>
                  <td className="p-3 text-right font-[var(--font-num)] text-primary">+{e.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center">No points earned yet — place an order to start.</p>
      )}
    </div>
  );
}

function OrdersTab() {
  const cart = useCart();
  const navigate = useNavigate();
  const { data: orders, loading: isLoading } = useApiQuery("my-orders", () =>
    apiFetch("/api/orders/mine")
  );
  const { mutate: reorder, loading: reordering } = useApiMutation(
    (id: string) => apiFetch(`/api/orders/${id}`),
    {
      onSuccess: (order: any) => {
        const items = order?.order_items ?? [];
        if (items.length === 0) {
          toast.error("Nothing to reorder");
          return;
        }
        cart.clear();
        items.forEach((it: any) => {
          cart.add(
            {
              id: it.item_id,
              name: it.name,
              price: Number(it.price),
              notes: it.notes ?? undefined,
            },
            it.quantity,
          );
        });
        toast.success("Items added to cart");
        navigate("/checkout");
      },
      onError: (e) => toast.error(e.message || "Reorder failed"),
    }
  );

  if (isLoading) return <p className="text-muted-foreground">Loading…</p>;
  if (!orders || (orders as any[]).length === 0) {
    return (
      <div className="rounded-2xl ring-1 ring-border bg-card/60 p-10 text-center">
        <p className="text-muted-foreground">No orders yet.</p>
        <Link
          to="/menu"
          className="inline-block mt-5 rounded-xl bg-primary text-primary-foreground px-5 py-2.5 font-semibold"
        >
          Browse menu
        </Link>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {(orders as any[]).map((o) => (
        <div
          key={o.id}
          className="rounded-2xl ring-1 ring-border bg-card/60 p-5 hover:ring-primary/40 transition"
        >
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <Link to={`/order/${o.id}`} className="flex-1 min-w-0">
              <div className="font-[var(--font-num)] text-lg">{o.order_number}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {new Date(o.created_at).toLocaleString()} · {o.fulfillment}
              </div>
            </Link>
            <div className="text-right">
              <div className="font-[var(--font-num)]">₹{Number(o.total).toFixed(0)}</div>
              <span className="kbd mt-1 inline-block text-primary">{o.status}</span>
            </div>
            <button
              onClick={() => reorder(o.id)}
              disabled={reordering}
              className="rounded-xl ring-1 ring-primary/40 text-primary px-4 py-2 text-sm hover:bg-primary/10 transition disabled:opacity-60"
            >
              {reordering ? "Loading…" : "Reorder"}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function ReservationsTab() {
  const { data, loading: isLoading } = useApiQuery("my-reservations", () =>
    apiFetch("/api/reservations/mine")
  );
  if (isLoading) return <p className="text-muted-foreground">Loading…</p>;
  const list = data as any[];
  if (!list || list.length === 0) {
    return (
      <div className="rounded-2xl ring-1 ring-border bg-card/60 p-10 text-center">
        <p className="text-muted-foreground">No reservations yet.</p>
        <Link
          to="/reservation"
          className="inline-block mt-5 rounded-xl bg-primary text-primary-foreground px-5 py-2.5 font-semibold"
        >
          Book a table
        </Link>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {list.map((r) => (
        <div key={r.id} className="rounded-2xl ring-1 ring-border bg-card/60 p-5">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <div className="font-medium">
                {new Date(`${r.reservation_date}T${r.reservation_time}`).toLocaleString([], {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Party of {r.party_size} · {r.full_name}
              </div>
              {r.special_requests && (
                <div className="text-xs text-muted-foreground mt-2 italic">
                  "{r.special_requests}"
                </div>
              )}
            </div>
            <span className="kbd text-primary">{r.status}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function ProfileTab() {
  const { data, loading: isLoading, refetch } = useApiQuery("my-profile", () =>
    apiFetch("/api/profile")
  );
  const { mutate: saveMut, loading: saving } = useApiMutation(
    (form: typeof initForm) => apiFetch("/api/profile", { method: "PATCH", body: JSON.stringify(form) }),
    {
      onSuccess: () => {
        toast.success("Profile saved");
        refetch();
      },
      onError: (e) => toast.error(e.message || "Save failed"),
    }
  );

  const initForm = {
    full_name: "",
    phone: "",
    email: "",
    default_address_line: "",
    default_city: "",
    default_pincode: "",
  };
  const [form, setForm] = useState(initForm);

  useEffect(() => {
    if (data) {
      const d = data as any;
      setForm({
        full_name: d.full_name ?? "",
        phone: d.phone ?? "",
        email: d.email ?? "",
        default_address_line: d.default_address_line ?? "",
        default_city: d.default_city ?? "",
        default_pincode: d.default_pincode ?? "",
      });
    }
  }, [data]);

  if (isLoading) return <p className="text-muted-foreground">Loading…</p>;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        saveMut(form);
      }}
      className="rounded-2xl ring-1 ring-border bg-card/60 p-6 space-y-5"
    >
      <div>
        <h2 className="font-display text-xl">Contact details</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Used to pre-fill checkout and reservations.
        </p>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <input
          maxLength={120}
          placeholder="Full name"
          value={form.full_name}
          onChange={(e) => setForm({ ...form, full_name: e.target.value })}
          className="input-luxe"
        />
        <input
          maxLength={20}
          type="tel"
          placeholder="Phone"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          className="input-luxe"
        />
      </div>
      <input
        maxLength={200}
        type="email"
        placeholder="Email"
        value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
        className="input-luxe w-full"
      />

      <div className="pt-4 border-t border-border">
        <h2 className="font-display text-xl">Saved delivery address</h2>
        <p className="text-sm text-muted-foreground mt-1">
          We'll auto-fill this at checkout.
        </p>
      </div>
      <input
        maxLength={300}
        placeholder="Address line"
        value={form.default_address_line}
        onChange={(e) => setForm({ ...form, default_address_line: e.target.value })}
        className="input-luxe w-full"
      />
      <div className="grid sm:grid-cols-2 gap-4">
        <input
          maxLength={80}
          placeholder="City"
          value={form.default_city}
          onChange={(e) => setForm({ ...form, default_city: e.target.value })}
          className="input-luxe"
        />
        <input
          maxLength={12}
          placeholder="Pincode"
          value={form.default_pincode}
          onChange={(e) => setForm({ ...form, default_pincode: e.target.value })}
          className="input-luxe"
        />
      </div>

      <button
        disabled={saving}
        className="rounded-xl bg-primary text-primary-foreground px-6 py-3 font-semibold hover:bg-primary-glow transition disabled:opacity-60"
      >
        {saving ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}

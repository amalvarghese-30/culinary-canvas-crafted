import { useApiQuery, useApiMutation } from "@/api/hooks";
import { apiFetch } from "@/api/client";
import { useState } from "react";
import { Loader2, Pencil, X } from "lucide-react";
import { toast } from "sonner";

type Tier = {
  _id: string;
  name: string;
  min_points: number;
  multiplier: number;
  benefits: {
    free_delivery: boolean;
    priority_support: boolean;
    birthday_reward: boolean;
    early_access: boolean;
  };
  icon: string;
  color: string;
  is_active: boolean;
};

type EditForm = {
  name: string;
  min_points: number;
  multiplier: number;
  free_delivery: boolean;
  priority_support: boolean;
  birthday_reward: boolean;
  early_access: boolean;
  icon: string;
  color: string;
  active: boolean;
};

export default function LoyaltyTiersPage() {
  const [editing, setEditing] = useState<Tier | null>(null);

  const { data, loading: isLoading, refetch } = useApiQuery("loyalty-tiers", () =>
    apiFetch("/api/admin/loyalty-tiers")
  );

  const { mutate: saveMut, loading: saving } = useApiMutation(
    (payload: { id: string } & EditForm) =>
      apiFetch(`/api/admin/loyalty-tiers/${payload.id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      }),
    {
      onSuccess: () => {
        toast.success("Tier updated");
        setEditing(null);
        refetch();
      },
      onError: (e) => toast.error(e.message || "Save failed"),
    }
  );

  if (isLoading)
    return (
      <div className="grid place-items-center py-20">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );

  const tiers = (data ?? []) as Tier[];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-2xl">Loyalty Tiers</h2>
        <p className="text-sm text-muted-foreground">
          {tiers.length} tiers · Points are earned per ₹10 spent, multiplied by tier rate.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {tiers.map((t) => (
          <article
            key={t._id}
            className="rounded-2xl ring-1 ring-border bg-card p-5"
            style={{ borderColor: t.is_active ? t.color + "60" : undefined }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{t.icon}</span>
                <h3 className="font-display text-xl">{t.name}</h3>
              </div>
              <span
                className={`text-[10px] uppercase tracking-wider px-2 py-1 rounded-full ${
                  t.is_active ? "bg-success/20 text-success" : "bg-muted text-muted-foreground"
                }`}
              >
                {t.is_active ? "Active" : "Off"}
              </span>
            </div>

            <div className="mt-3 space-y-1 text-sm text-muted-foreground">
              <p>
                <span className="text-foreground font-medium">{t.min_points.toLocaleString()}</span> points to unlock
              </p>
              <p>
                <span className="text-foreground font-medium">{t.multiplier}x</span> point multiplier
              </p>
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {t.benefits.free_delivery && (
                <span className="text-[11px] rounded-md bg-primary/10 text-primary px-2 py-0.5">Free delivery</span>
              )}
              {t.benefits.priority_support && (
                <span className="text-[11px] rounded-md bg-amber-500/10 text-amber-500 px-2 py-0.5">Priority prep</span>
              )}
              {t.benefits.birthday_reward && (
                <span className="text-[11px] rounded-md bg-pink-500/10 text-pink-500 px-2 py-0.5">Birthday reward</span>
              )}
              {t.benefits.early_access && (
                <span className="text-[11px] rounded-md bg-violet-500/10 text-violet-500 px-2 py-0.5">Early access</span>
              )}
            </div>

            <button
              onClick={() => setEditing(t)}
              className="mt-4 text-xs rounded-md ring-1 ring-border px-2.5 py-1.5 inline-flex items-center gap-1 hover:bg-white/5"
            >
              <Pencil className="size-3" /> Edit tier
            </button>
          </article>
        ))}
      </div>

      {editing && (
        <div
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur grid place-items-center p-4"
          onClick={() => setEditing(null)}
        >
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              saveMut({
                id: editing._id,
                name: String(fd.get("name")),
                min_points: Number(fd.get("min_points")),
                multiplier: Number(fd.get("multiplier")),
                free_delivery: fd.get("free_delivery") === "on",
                priority_support: fd.get("priority_support") === "on",
                birthday_reward: fd.get("birthday_reward") === "on",
                early_access: fd.get("early_access") === "on",
                icon: String(fd.get("icon") || "⭐"),
                color: String(fd.get("color") || "#C0C0C0"),
                active: fd.get("active") === "on",
              });
            }}
            className="w-full max-w-md rounded-2xl bg-card ring-1 ring-border p-5 space-y-3"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-display text-xl">Edit {editing.name}</h3>
              <button type="button" onClick={() => setEditing(null)}>
                <X className="size-5" />
              </button>
            </div>

            <label className="block text-sm">
              Name
              <input name="name" defaultValue={editing.name} required className="mt-1 w-full input-luxe" />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="block text-sm">
                Min points
                <input name="min_points" type="number" min={0} defaultValue={editing.min_points} required className="mt-1 w-full input-luxe" />
              </label>
              <label className="block text-sm">
                Multiplier
                <input name="multiplier" type="number" min={0.5} step={0.5} defaultValue={editing.multiplier} required className="mt-1 w-full input-luxe" />
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="block text-sm">
                Icon
                <input name="icon" defaultValue={editing.icon} maxLength={8} className="mt-1 w-full input-luxe" />
              </label>
              <label className="block text-sm">
                Color
                <input name="color" defaultValue={editing.color} maxLength={7} className="mt-1 w-full input-luxe" />
              </label>
            </div>

            <fieldset className="space-y-2">
              <legend className="text-sm font-medium">Benefits</legend>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="free_delivery" defaultChecked={editing.benefits.free_delivery} /> Free delivery
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="priority_support" defaultChecked={editing.benefits.priority_support} /> Priority prep
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="birthday_reward" defaultChecked={editing.benefits.birthday_reward} /> Birthday reward
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="early_access" defaultChecked={editing.benefits.early_access} /> Early access
              </label>
            </fieldset>

            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="active" defaultChecked={editing.is_active} /> Active
            </label>

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setEditing(null)} className="text-sm rounded-md px-3 py-2 ring-1 ring-border">
                Cancel
              </button>
              <button type="submit" disabled={saving} className="text-sm rounded-md bg-primary text-primary-foreground px-4 py-2 font-semibold disabled:opacity-50">
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

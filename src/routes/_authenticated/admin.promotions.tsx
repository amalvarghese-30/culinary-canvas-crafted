import { useApiQuery, useApiMutation } from "@/api/hooks";
import { apiFetch } from "@/api/client";
import { useState } from "react";
import { Loader2, Plus, Trash2, Tag } from "lucide-react";
import { toast } from "sonner";

type Promo = {
  id: string;
  code: string;
  description: string;
  discount_type: "percent" | "flat";
  discount_value: number;
  min_order: number;
  max_uses: number | null;
  uses: number;
  active: boolean;
  ends_at: string | null;
};

const empty = {
  code: "",
  description: "",
  discount_type: "percent" as const,
  discount_value: 10,
  min_order: 0,
  max_uses: null as number | null,
  active: true,
  ends_at: null as string | null,
};

export default function PromosPage() {
  const { data, loading: isLoading, refetch } = useApiQuery("promos", () =>
    apiFetch("/api/promotions")
  );
  const [form, setForm] = useState<typeof empty & { id?: string }>(empty);

  const { mutate: doSave, loading: isSaving } = useApiMutation(
    () =>
      form.id
        ? apiFetch(`/api/promotions/${form.id}`, { method: "PUT", body: JSON.stringify(form) })
        : apiFetch("/api/promotions", { method: "POST", body: JSON.stringify(form) }),
    {
      onSuccess: () => {
        toast.success("Saved");
        setForm(empty);
        refetch();
      },
      onError: (e) => toast.error(e.message || "Save failed"),
    }
  );

  const { mutate: doDelete } = useApiMutation(
    (id: string) => apiFetch(`/api/promotions/${id}`, { method: "DELETE" }),
    {
      onSuccess: () => {
        toast.success("Deleted");
        refetch();
      },
    }
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl">Promotions</h2>
        <p className="text-sm text-muted-foreground">Discount codes customers redeem at checkout.</p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          doSave(undefined as any);
        }}
        className="rounded-2xl ring-1 ring-border bg-card p-5 grid gap-3 md:grid-cols-6"
      >
        <input
          required
          placeholder="CODE"
          value={form.code}
          onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
          className="input-luxe md:col-span-2"
        />
        <select
          value={form.discount_type}
          onChange={(e) => setForm({ ...form, discount_type: e.target.value as any })}
          className="input-luxe"
        >
          <option value="percent">% off</option>
          <option value="flat">₹ flat</option>
        </select>
        <input
          required
          type="number"
          min={1}
          step="0.01"
          placeholder="Value"
          value={form.discount_value}
          onChange={(e) => setForm({ ...form, discount_value: Number(e.target.value) })}
          className="input-luxe"
        />
        <input
          type="number"
          min={0}
          placeholder="Min order"
          value={form.min_order}
          onChange={(e) => setForm({ ...form, min_order: Number(e.target.value) })}
          className="input-luxe"
        />
        <input
          type="number"
          min={1}
          placeholder="Max uses"
          value={form.max_uses ?? ""}
          onChange={(e) => setForm({ ...form, max_uses: e.target.value ? Number(e.target.value) : null })}
          className="input-luxe"
        />
        <input
          placeholder="Short description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="input-luxe md:col-span-4"
        />
        <input
          type="date"
          value={form.ends_at ?? ""}
          onChange={(e) => setForm({ ...form, ends_at: e.target.value || null })}
          className="input-luxe md:col-span-1"
        />
        <button
          disabled={isSaving}
          className="rounded-xl bg-primary text-primary-foreground font-semibold py-2.5 px-4 md:col-span-1 inline-flex items-center justify-center gap-2 disabled:opacity-60"
        >
          <Plus className="size-4" /> {form.id ? "Update" : "Add"}
        </button>
      </form>

      {isLoading ? (
        <div className="grid place-items-center py-20">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="rounded-2xl ring-1 ring-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase tracking-wider text-muted-foreground">
              <tr className="border-b border-border">
                <th className="text-left p-3">Code</th>
                <th className="text-left p-3">Discount</th>
                <th className="text-left p-3">Min</th>
                <th className="text-left p-3">Uses</th>
                <th className="text-left p-3">Ends</th>
                <th className="text-left p-3">Status</th>
                <th className="text-right p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {((data ?? []) as Promo[]).map((p) => (
                <tr key={p.id} className="border-b border-border/40 hover:bg-white/5">
                  <td className="p-3 font-mono">
                    <span className="inline-flex items-center gap-2">
                      <Tag className="size-3 text-primary" /> {p.code}
                    </span>
                    {p.description && <div className="text-xs text-muted-foreground">{p.description}</div>}
                  </td>
                  <td className="p-3 font-[var(--font-num)]">
                    {p.discount_type === "percent" ? `${p.discount_value}%` : `₹${p.discount_value}`}
                  </td>
                  <td className="p-3">₹{p.min_order}</td>
                  <td className="p-3">{p.uses}{p.max_uses ? ` / ${p.max_uses}` : ""}</td>
                  <td className="p-3">{p.ends_at ? new Date(p.ends_at).toLocaleDateString() : "—"}</td>
                  <td className="p-3">
                    <span className={`kbd ${p.active ? "text-success" : "text-muted-foreground"}`}>
                      {p.active ? "Active" : "Off"}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => setForm({ ...p, ends_at: p.ends_at ? p.ends_at.slice(0, 10) : null } as any)}
                      className="text-xs text-primary hover:underline mr-3"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => confirm(`Delete ${p.code}?`) && doDelete(p.id)}
                      className="text-xs text-destructive hover:underline inline-flex items-center gap-1"
                    >
                      <Trash2 className="size-3" /> Delete
                    </button>
                  </td>
                </tr>
              ))}
              {(!data || (data as Promo[]).length === 0) && (
                <tr><td colSpan={7} className="p-10 text-center text-muted-foreground">No promotions yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

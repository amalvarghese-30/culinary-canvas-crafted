import { useApiQuery, useApiMutation } from "@/api/hooks";
import { apiFetch } from "@/api/client";
import { useState } from "react";
import { Loader2, Plus, Pencil, Trash2, AlertTriangle, Package } from "lucide-react";
import { toast } from "sonner";

type I = {
  id: string;
  name: string;
  unit: string;
  stock: number;
  low_stock_at: number;
  active: boolean;
  notes: string | null;
};

export default function InventoryPage() {
  const [editing, setEditing] = useState<Partial<I> | null>(null);

  const { data, loading: isLoading, refetch } = useApiQuery("inventory", () =>
    apiFetch("/api/admin/inventory")
  );

  const { mutate: doSave, loading: isSaving } = useApiMutation(
    (p: any) =>
      p.id
        ? apiFetch(`/api/admin/inventory/${p.id}`, { method: "PUT", body: JSON.stringify(p) })
        : apiFetch("/api/admin/inventory", { method: "POST", body: JSON.stringify(p) }),
    {
      onSuccess: () => {
        toast.success("Saved");
        setEditing(null);
        refetch();
      },
      onError: (e) => toast.error(e.message || "Save failed"),
    }
  );
  const { mutate: doDelete } = useApiMutation(
    (id: string) => apiFetch(`/api/admin/inventory/${id}`, { method: "DELETE" }),
    {
      onSuccess: () => {
        toast.success("Removed");
        refetch();
      },
    }
  );

  if (isLoading)
    return (
      <div className="grid place-items-center py-20">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );

  const items = (data ?? []) as I[];
  const lowStock = items.filter((i) => Number(i.stock) <= Number(i.low_stock_at));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-display text-2xl">Inventory</h2>
          <p className="text-sm text-muted-foreground">
            {items.length} items{" "}
            {lowStock.length > 0 && (
              <span className="text-primary">· {lowStock.length} low</span>
            )}
          </p>
        </div>
        <button
          onClick={() =>
            setEditing({ name: "", unit: "pcs", stock: 0, low_stock_at: 10, active: true })
          }
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
        >
          <Plus className="size-4" /> Add item
        </button>
      </div>

      {lowStock.length > 0 && (
        <div className="rounded-2xl ring-1 ring-primary/40 bg-primary/5 p-4 flex items-start gap-3">
          <AlertTriangle className="size-5 text-primary mt-0.5" />
          <div>
            <p className="font-semibold">Low-stock alert</p>
            <p className="text-sm text-muted-foreground">
              {lowStock.map((i) => i.name).join(", ")} — running low.
            </p>
          </div>
        </div>
      )}

      <div className="rounded-2xl ring-1 ring-border bg-card overflow-hidden">
        {items.length === 0 ? (
          <div className="text-center py-16">
            <Package className="mx-auto size-10 text-muted-foreground/40" />
            <p className="mt-3 text-sm text-muted-foreground">No inventory items yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-background/40">
                <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-3">Item</th>
                  <th className="px-4 py-3">Stock</th>
                  <th className="px-4 py-3">Low at</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((i, idx) => {
                  const low = Number(i.stock) <= Number(i.low_stock_at);
                  return (
                    <tr key={i.id} className={idx % 2 ? "bg-background/20" : ""}>
                      <td className="px-4 py-3 font-medium">{i.name}</td>
                      <td className="px-4 py-3 font-[var(--font-num)]">
                        {Number(i.stock)} {i.unit}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {Number(i.low_stock_at)} {i.unit}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            low
                              ? "bg-primary/20 text-primary"
                              : i.active
                                ? "bg-success/20 text-success"
                                : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {low ? "Low" : i.active ? "OK" : "Off"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right space-x-1.5">
                        <button onClick={() => setEditing(i)} aria-label="Edit" className="rounded-md ring-1 ring-border p-1.5 hover:bg-white/5">
                          <Pencil className="size-3.5" />
                        </button>
                        <button
                          onClick={() => { if (confirm(`Delete ${i.name}?`)) doDelete(i.id); }}
                          aria-label="Delete"
                          className="rounded-md ring-1 ring-destructive/40 text-destructive p-1.5 hover:bg-destructive/10"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur grid place-items-center p-4" onClick={() => setEditing(null)}>
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              doSave({
                id: editing.id,
                name: String(fd.get("name")),
                unit: String(fd.get("unit")),
                stock: Number(fd.get("stock")),
                low_stock_at: Number(fd.get("low")),
                active: fd.get("active") === "on",
                notes: String(fd.get("notes") || "") || null,
              });
            }}
            className="w-full max-w-md rounded-2xl bg-card ring-1 ring-border p-5 space-y-3"
          >
            <h3 className="font-display text-xl">{editing.id ? "Edit item" : "New item"}</h3>
            <label className="block text-sm">
              Name
              <input name="name" defaultValue={editing.name ?? ""} required className="mt-1 w-full rounded-lg bg-background ring-1 ring-border px-3 py-2" />
            </label>
            <div className="grid grid-cols-3 gap-2">
              <label className="block text-sm col-span-1">
                Unit
                <input name="unit" defaultValue={editing.unit ?? "pcs"} required className="mt-1 w-full rounded-lg bg-background ring-1 ring-border px-3 py-2" />
              </label>
              <label className="block text-sm col-span-1">
                Stock
                <input name="stock" type="number" step="0.01" defaultValue={Number(editing.stock ?? 0)} required className="mt-1 w-full rounded-lg bg-background ring-1 ring-border px-3 py-2" />
              </label>
              <label className="block text-sm col-span-1">
                Low at
                <input name="low" type="number" step="0.01" defaultValue={Number(editing.low_stock_at ?? 10)} required className="mt-1 w-full rounded-lg bg-background ring-1 ring-border px-3 py-2" />
              </label>
            </div>
            <label className="block text-sm">
              Notes
              <textarea name="notes" defaultValue={editing.notes ?? ""} rows={2} className="mt-1 w-full rounded-lg bg-background ring-1 ring-border px-3 py-2" />
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="active" defaultChecked={editing.active ?? true} />
              Active
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setEditing(null)} className="text-sm rounded-md px-3 py-2 ring-1 ring-border">Cancel</button>
              <button type="submit" disabled={isSaving} className="text-sm rounded-md bg-primary text-primary-foreground px-4 py-2 font-semibold disabled:opacity-50">Save</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

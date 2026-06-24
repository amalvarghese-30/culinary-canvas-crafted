import { useApiQuery, useApiMutation } from "@/api/hooks";
import { apiFetch } from "@/api/client";
import { useState } from "react";
import { Loader2, Plus, Trash2, ChefHat, Sparkles } from "lucide-react";
import { toast } from "sonner";

export default function RecipesPage() {
  const [tab, setTab] = useState<"recipes" | "addons">("recipes");
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-display text-2xl">Recipes & Add-ons</h2>
          <p className="text-sm text-muted-foreground">
            Recipes auto-deduct inventory when kitchen creates an order. Add-ons appear on menu items.
          </p>
        </div>
        <div className="inline-flex rounded-xl ring-1 ring-border bg-card p-1">
          <button
            onClick={() => setTab("recipes")}
            className={`px-4 py-1.5 text-sm rounded-lg ${tab === "recipes" ? "bg-primary text-primary-foreground" : ""}`}
          >
            Recipes
          </button>
          <button
            onClick={() => setTab("addons")}
            className={`px-4 py-1.5 text-sm rounded-lg ${tab === "addons" ? "bg-primary text-primary-foreground" : ""}`}
          >
            Add-ons
          </button>
        </div>
      </div>
      {tab === "recipes" ? <RecipesTab /> : <AddonsTab />}
    </div>
  );
}

function RecipesTab() {
  const [adding, setAdding] = useState(false);

  const { data: list, loading: isLoading, refetch } = useApiQuery("recipes", () =>
    apiFetch("/api/admin/recipes")
  );
  const { data: menu } = useApiQuery("menu-lite-recipes", () =>
    apiFetch("/api/admin/menu?lite=true")
  );
  const { data: inv } = useApiQuery("inv-lite-recipes", () =>
    apiFetch("/api/admin/inventory?lite=true")
  );

  const { mutate: doSave, loading: isSaving } = useApiMutation(
    (p: any) =>
      p.id
        ? apiFetch(`/api/admin/recipes/${p.id}`, { method: "PUT", body: JSON.stringify(p) })
        : apiFetch("/api/admin/recipes", { method: "POST", body: JSON.stringify(p) }),
    {
      onSuccess: () => {
        toast.success("Saved");
        setAdding(false);
        refetch();
      },
      onError: (e) => toast.error(e.message || "Save failed"),
    }
  );
  const { mutate: doDelete } = useApiMutation(
    (id: string) => apiFetch(`/api/admin/recipes/${id}`, { method: "DELETE" }),
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

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={() => setAdding(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
        >
          <Plus className="size-4" /> Add recipe link
        </button>
      </div>
      <div className="rounded-2xl ring-1 ring-border bg-card overflow-hidden">
        {((list ?? []) as any[]).length === 0 ? (
          <div className="text-center py-16">
            <ChefHat className="mx-auto size-10 text-muted-foreground/40" />
            <p className="mt-3 text-sm text-muted-foreground">No recipes mapped.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-background/40">
              <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3">Menu item</th>
                <th className="px-4 py-3">Ingredient</th>
                <th className="px-4 py-3">Qty per serving</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {((list ?? []) as any[]).map((r: any, i: number) => (
                <tr key={r.id} className={i % 2 ? "bg-background/20" : ""}>
                  <td className="px-4 py-3 font-medium">{r.menu_items?.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.inventory_items?.name}</td>
                  <td className="px-4 py-3">
                    {Number(r.quantity)} {r.inventory_items?.unit}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => confirm("Remove this recipe link?") && doDelete(r.id)}
                      className="rounded-md ring-1 ring-destructive/40 text-destructive p-1.5"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {adding && (
        <div
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur grid place-items-center p-4"
          onClick={() => setAdding(false)}
        >
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              doSave({
                menu_item_id: String(fd.get("menu_item_id")),
                inventory_item_id: String(fd.get("inventory_item_id")),
                quantity: Number(fd.get("quantity")),
              });
            }}
            className="w-full max-w-md rounded-2xl bg-card ring-1 ring-border p-5 space-y-3"
          >
            <h3 className="font-display text-xl">New recipe link</h3>
            <label className="block text-sm">
              Menu item
              <select
                name="menu_item_id"
                required
                className="mt-1 w-full rounded-lg bg-background ring-1 ring-border px-3 py-2"
              >
                {((menu ?? []) as any[]).map((m: any) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              Inventory item
              <select
                name="inventory_item_id"
                required
                className="mt-1 w-full rounded-lg bg-background ring-1 ring-border px-3 py-2"
              >
                {((inv ?? []) as any[]).map((it: any) => (
                  <option key={it.id} value={it.id}>{it.name} ({it.unit})</option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              Quantity per serving
              <input
                name="quantity"
                type="number"
                step="0.0001"
                defaultValue={1}
                required
                className="mt-1 w-full rounded-lg bg-background ring-1 ring-border px-3 py-2"
              />
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setAdding(false)} className="text-sm rounded-md px-3 py-2 ring-1 ring-border">Cancel</button>
              <button type="submit" disabled={isSaving} className="text-sm rounded-md bg-primary text-primary-foreground px-4 py-2 font-semibold disabled:opacity-50">Save</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function AddonsTab() {
  const [editing, setEditing] = useState<any | null>(null);

  const { data, loading: isLoading, refetch } = useApiQuery("addons", () =>
    apiFetch("/api/admin/addons")
  );
  const { data: menu } = useApiQuery("menu-lite-addons", () =>
    apiFetch("/api/admin/menu?lite=true")
  );

  const { mutate: doSave, loading: isSaving } = useApiMutation(
    (p: any) =>
      p.id
        ? apiFetch(`/api/admin/addons/${p.id}`, { method: "PUT", body: JSON.stringify(p) })
        : apiFetch("/api/admin/addons", { method: "POST", body: JSON.stringify(p) }),
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
    (id: string) => apiFetch(`/api/admin/addons/${id}`, { method: "DELETE" }),
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

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={() => setEditing({ name: "", price: 0, active: true, menu_item_id: (menu as any[])?.[0]?.id })}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
        >
          <Plus className="size-4" /> Add add-on
        </button>
      </div>
      <div className="rounded-2xl ring-1 ring-border bg-card overflow-hidden">
        {((data ?? []) as any[]).length === 0 ? (
          <div className="text-center py-16">
            <Sparkles className="mx-auto size-10 text-muted-foreground/40" />
            <p className="mt-3 text-sm text-muted-foreground">No add-ons yet.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-background/40">
              <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3">Menu item</th>
                <th className="px-4 py-3">Add-on</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {((data ?? []) as any[]).map((a: any, i: number) => (
                <tr key={a.id} className={i % 2 ? "bg-background/20" : ""}>
                  <td className="px-4 py-3 font-medium">{a.menu_items?.name}</td>
                  <td className="px-4 py-3">{a.name}</td>
                  <td className="px-4 py-3">₹{Number(a.price).toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${a.active ? "bg-success/20 text-success" : "bg-muted text-muted-foreground"}`}>
                      {a.active ? "Active" : "Off"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right space-x-1.5">
                    <button onClick={() => setEditing(a)} className="rounded-md ring-1 ring-border p-1.5">Edit</button>
                    <button
                      onClick={() => confirm(`Delete ${a.name}?`) && doDelete(a.id)}
                      className="rounded-md ring-1 ring-destructive/40 text-destructive p-1.5"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
                menu_item_id: String(fd.get("menu_item_id")),
                name: String(fd.get("name")),
                price: Number(fd.get("price")),
                active: fd.get("active") === "on",
              });
            }}
            className="w-full max-w-md rounded-2xl bg-card ring-1 ring-border p-5 space-y-3"
          >
            <h3 className="font-display text-xl">{editing.id ? "Edit add-on" : "New add-on"}</h3>
            <label className="block text-sm">
              Menu item
              <select name="menu_item_id" required defaultValue={editing.menu_item_id} className="mt-1 w-full rounded-lg bg-background ring-1 ring-border px-3 py-2">
                {((menu ?? []) as any[]).map((m: any) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              Name
              <input name="name" required defaultValue={editing.name ?? ""} className="mt-1 w-full rounded-lg bg-background ring-1 ring-border px-3 py-2" />
            </label>
            <label className="block text-sm">
              Price (₹)
              <input name="price" type="number" step="0.01" defaultValue={Number(editing.price ?? 0)} required className="mt-1 w-full rounded-lg bg-background ring-1 ring-border px-3 py-2" />
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

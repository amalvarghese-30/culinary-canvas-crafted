import { useApiQuery, useApiMutation } from "@/api/hooks";
import { apiFetch } from "@/api/client";
import { useState } from "react";
import { Loader2, Plus, Pencil, Trash2, Truck, PackageCheck, X } from "lucide-react";
import { toast } from "sonner";

export default function SuppliersPage() {
  const [tab, setTab] = useState<"suppliers" | "pos">("suppliers");

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-display text-2xl">Procurement</h2>
          <p className="text-sm text-muted-foreground">Suppliers and purchase orders</p>
        </div>
        <div className="inline-flex rounded-xl ring-1 ring-border bg-card p-1">
          <button
            onClick={() => setTab("suppliers")}
            className={`px-4 py-1.5 text-sm rounded-lg ${tab === "suppliers" ? "bg-primary text-primary-foreground" : ""}`}
          >
            Suppliers
          </button>
          <button
            onClick={() => setTab("pos")}
            className={`px-4 py-1.5 text-sm rounded-lg ${tab === "pos" ? "bg-primary text-primary-foreground" : ""}`}
          >
            Purchase Orders
          </button>
        </div>
      </div>
      {tab === "suppliers" ? <SuppliersTab /> : <POsTab />}
    </div>
  );
}

function SuppliersTab() {
  const [editing, setEditing] = useState<any | null>(null);

  const { data, loading: isLoading, refetch } = useApiQuery("suppliers", () =>
    apiFetch("/api/admin/suppliers")
  );

  const { mutate: doSave, loading: isSaving } = useApiMutation(
    (p: any) =>
      p.id
        ? apiFetch(`/api/admin/suppliers/${p.id}`, { method: "PUT", body: JSON.stringify(p) })
        : apiFetch("/api/admin/suppliers", { method: "POST", body: JSON.stringify(p) }),
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
    (id: string) => apiFetch(`/api/admin/suppliers/${id}`, { method: "DELETE" }),
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

  const items = (data ?? []) as any[];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={() => setEditing({ name: "", active: true })}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
        >
          <Plus className="size-4" /> Add supplier
        </button>
      </div>

      <div className="rounded-2xl ring-1 ring-border bg-card overflow-hidden">
        {items.length === 0 ? (
          <div className="text-center py-16">
            <Truck className="mx-auto size-10 text-muted-foreground/40" />
            <p className="mt-3 text-sm text-muted-foreground">No suppliers yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-background/40">
                <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-3">Supplier</th>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((s: any, idx: number) => (
                  <tr key={s.id} className={idx % 2 ? "bg-background/20" : ""}>
                    <td className="px-4 py-3 font-medium">{s.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{s.contact_name || "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{s.phone || "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{s.email || "—"}</td>
                    <td className="px-4 py-3 text-right space-x-1.5">
                      <button onClick={() => setEditing(s)} className="rounded-md ring-1 ring-border p-1.5 hover:bg-white/5">
                        <Pencil className="size-3.5" />
                      </button>
                      <button
                        onClick={() => confirm(`Delete ${s.name}?`) && doDelete(s.id)}
                        className="rounded-md ring-1 ring-destructive/40 text-destructive p-1.5 hover:bg-destructive/10"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
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
                contact_name: String(fd.get("contact_name") || "") || null,
                phone: String(fd.get("phone") || "") || null,
                email: String(fd.get("email") || "") || null,
                address: String(fd.get("address") || "") || null,
                notes: String(fd.get("notes") || "") || null,
                active: fd.get("active") === "on",
              });
            }}
            className="w-full max-w-md rounded-2xl bg-card ring-1 ring-border p-5 space-y-3"
          >
            <h3 className="font-display text-xl">{editing.id ? "Edit supplier" : "New supplier"}</h3>
            {(["name", "contact_name", "phone", "email", "address"] as const).map((f) => (
              <label key={f} className="block text-sm capitalize">
                {f.replace("_", " ")}
                <input name={f} required={f === "name"} defaultValue={editing[f] ?? ""} className="mt-1 w-full rounded-lg bg-background ring-1 ring-border px-3 py-2" />
              </label>
            ))}
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

function POsTab() {
  const [creating, setCreating] = useState(false);

  const { data: pos, loading: isLoading, refetch: refetchPOs } = useApiQuery("purchase-orders", () =>
    apiFetch("/api/admin/purchase-orders")
  );
  const { data: suppliers } = useApiQuery("suppliers-po", () =>
    apiFetch("/api/admin/suppliers")
  );
  const { data: inv } = useApiQuery("inv-lite-po", () =>
    apiFetch("/api/admin/inventory?lite=true")
  );

  const { mutate: doUpdateStatus } = useApiMutation(
    (p: any) =>
      apiFetch(`/api/admin/purchase-orders/${p.id}/status`, {
        method: "PUT",
        body: JSON.stringify({ status: p.status }),
      }),
    {
      onSuccess: () => {
        toast.success("Updated");
        refetchPOs();
      },
    }
  );

  const { mutate: doDeletePO } = useApiMutation(
    (id: string) => apiFetch(`/api/admin/purchase-orders/${id}`, { method: "DELETE" }),
    {
      onSuccess: () => {
        toast.success("Deleted");
        refetchPOs();
      },
    }
  );

  const { mutate: doCreatePO, loading: isCreating } = useApiMutation(
    (p: any) => apiFetch("/api/admin/purchase-orders", { method: "POST", body: JSON.stringify(p) }),
    {
      onSuccess: () => {
        toast.success("PO created");
        setCreating(false);
        refetchPOs();
      },
      onError: (e) => toast.error(e.message || "Create failed"),
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
          onClick={() => setCreating(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
        >
          <Plus className="size-4" /> New PO
        </button>
      </div>

      <div className="space-y-3">
        {((pos ?? []) as any[]).length === 0 && (
          <div className="rounded-2xl ring-1 ring-border bg-card text-center py-16">
            <PackageCheck className="mx-auto size-10 text-muted-foreground/40" />
            <p className="mt-3 text-sm text-muted-foreground">No purchase orders yet.</p>
          </div>
        )}
        {((pos ?? []) as any[]).map((po: any) => (
          <div key={po.id} className="rounded-2xl ring-1 ring-border bg-card p-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <p className="font-semibold">{po.suppliers?.name ?? "(No supplier)"}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(po.created_at).toLocaleDateString()} · ₹{Number(po.total).toFixed(2)} ·{" "}
                  {po.purchase_order_items?.length ?? 0} items
                  {po.expected_at ? ` · Expected ${po.expected_at}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    po.status === "received"
                      ? "bg-success/20 text-success"
                      : po.status === "cancelled"
                        ? "bg-muted text-muted-foreground"
                        : "bg-primary/20 text-primary"
                  }`}
                >
                  {po.status}
                </span>
                {po.status === "pending" && (
                  <>
                    <button
                      onClick={() => doUpdateStatus({ id: po.id, status: "received" })}
                      className="text-xs rounded-md bg-success/20 text-success px-2 py-1 hover:bg-success/30"
                    >
                      Mark received
                    </button>
                    <button
                      onClick={() => doUpdateStatus({ id: po.id, status: "cancelled" })}
                      className="text-xs rounded-md ring-1 ring-border px-2 py-1"
                    >
                      Cancel
                    </button>
                  </>
                )}
                <button
                  onClick={() => confirm("Delete PO?") && doDeletePO(po.id)}
                  className="rounded-md ring-1 ring-destructive/40 text-destructive p-1.5"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            </div>
            {po.purchase_order_items?.length > 0 && (
              <ul className="mt-3 text-sm text-muted-foreground space-y-1">
                {po.purchase_order_items.map((it: any) => (
                  <li key={it.id} className="flex justify-between">
                    <span>
                      {it.inventory_items?.name} — {Number(it.quantity)} {it.inventory_items?.unit}
                    </span>
                    <span>₹{(Number(it.quantity) * Number(it.unit_cost)).toFixed(2)}</span>
                  </li>
                ))}
              </ul>
            )}
            {po.notes && <p className="mt-2 text-xs text-muted-foreground italic">{po.notes}</p>}
          </div>
        ))}
      </div>

      {creating && (
        <POCreateModal
          suppliers={(suppliers ?? []) as any[]}
          inventory={(inv ?? []) as any[]}
          onClose={() => setCreating(false)}
          onSubmit={(p) => doCreatePO(p)}
          pending={isCreating}
        />
      )}
    </div>
  );
}

function POCreateModal({
  suppliers,
  inventory,
  onClose,
  onSubmit,
  pending,
}: {
  suppliers: any[];
  inventory: any[];
  onClose: () => void;
  onSubmit: (p: any) => void;
  pending: boolean;
}) {
  const [lines, setLines] = useState<{ inventory_item_id: string; quantity: number; unit_cost: number }[]>(
    [{ inventory_item_id: inventory[0]?.id ?? "", quantity: 1, unit_cost: 0 }],
  );
  const [supplierId, setSupplierId] = useState<string>(suppliers[0]?.id ?? "");
  const [expected, setExpected] = useState("");
  const [notes, setNotes] = useState("");

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur grid place-items-center p-4" onClick={onClose}>
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit({
            supplier_id: supplierId || null,
            expected_at: expected || null,
            notes: notes || null,
            items: lines.filter((l) => l.inventory_item_id && l.quantity > 0),
          });
        }}
        className="w-full max-w-2xl rounded-2xl bg-card ring-1 ring-border p-5 space-y-4 max-h-[90vh] overflow-auto"
      >
        <div className="flex items-center justify-between">
          <h3 className="font-display text-xl">New purchase order</h3>
          <button type="button" onClick={onClose} className="text-muted-foreground">
            <X className="size-5" />
          </button>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <label className="block text-sm">
            Supplier
            <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)} className="mt-1 w-full rounded-lg bg-background ring-1 ring-border px-3 py-2">
              <option value="">— None —</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            Expected on
            <input type="date" value={expected} onChange={(e) => setExpected(e.target.value)} className="mt-1 w-full rounded-lg bg-background ring-1 ring-border px-3 py-2" />
          </label>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">Items</p>
            <button
              type="button"
              onClick={() => setLines([...lines, { inventory_item_id: inventory[0]?.id ?? "", quantity: 1, unit_cost: 0 }])}
              className="text-xs inline-flex items-center gap-1 ring-1 ring-border rounded-md px-2 py-1"
            >
              <Plus className="size-3" /> Add line
            </button>
          </div>
          {lines.map((l, i) => (
            <div key={i} className="grid grid-cols-12 gap-2 items-end">
              <select
                value={l.inventory_item_id}
                onChange={(e) => {
                  const copy = [...lines];
                  copy[i].inventory_item_id = e.target.value;
                  setLines(copy);
                }}
                className="col-span-6 rounded-lg bg-background ring-1 ring-border px-2 py-2 text-sm"
              >
                {inventory.map((it) => (
                  <option key={it.id} value={it.id}>{it.name} ({it.unit})</option>
                ))}
              </select>
              <input
                type="number" step="0.01"
                value={l.quantity}
                onChange={(e) => {
                  const copy = [...lines];
                  copy[i].quantity = Number(e.target.value);
                  setLines(copy);
                }}
                placeholder="Qty"
                className="col-span-2 rounded-lg bg-background ring-1 ring-border px-2 py-2 text-sm"
              />
              <input
                type="number" step="0.01"
                value={l.unit_cost}
                onChange={(e) => {
                  const copy = [...lines];
                  copy[i].unit_cost = Number(e.target.value);
                  setLines(copy);
                }}
                placeholder="₹/unit"
                className="col-span-3 rounded-lg bg-background ring-1 ring-border px-2 py-2 text-sm"
              />
              <button
                type="button"
                onClick={() => setLines(lines.filter((_, j) => j !== i))}
                className="col-span-1 rounded-md ring-1 ring-destructive/40 text-destructive p-2"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          ))}
          <p className="text-right text-sm font-semibold">
            Total: ₹{lines.reduce((s, l) => s + l.quantity * l.unit_cost, 0).toFixed(2)}
          </p>
        </div>

        <label className="block text-sm">
          Notes
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="mt-1 w-full rounded-lg bg-background ring-1 ring-border px-3 py-2" />
        </label>

        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="text-sm rounded-md px-3 py-2 ring-1 ring-border">Cancel</button>
          <button type="submit" disabled={pending || lines.length === 0} className="text-sm rounded-md bg-primary text-primary-foreground px-4 py-2 font-semibold disabled:opacity-50">
            Create PO
          </button>
        </div>
      </form>
    </div>
  );
}

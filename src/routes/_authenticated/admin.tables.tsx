import { useApiQuery, useApiMutation } from "@/api/hooks";
import { apiFetch } from "@/api/client";
import { useState } from "react";
import { Loader2, Plus, Pencil, Trash2, QrCode, Download } from "lucide-react";
import { toast } from "sonner";

type T = { id: string; label: string; capacity: number; location: string | null; active: boolean; qr_code?: string };

export default function TablesPage() {
  const [editing, setEditing] = useState<Partial<T> | null>(null);

  const { data, loading: isLoading, refetch } = useApiQuery("restaurant-tables", () =>
    apiFetch("/api/admin/tables")
  );

  const { mutate: doSave, loading: isSaving } = useApiMutation(
    (payload: any) =>
      payload.id
        ? apiFetch(`/api/admin/tables/${payload.id}`, { method: "PUT", body: JSON.stringify(payload) })
        : apiFetch("/api/admin/tables", { method: "POST", body: JSON.stringify(payload) }),
    {
      onSuccess: () => {
        toast.success("Table saved");
        setEditing(null);
        refetch();
      },
      onError: (e) => toast.error(e.message || "Save failed"),
    }
  );

  const { mutate: doDelete } = useApiMutation(
    (id: string) => apiFetch(`/api/admin/tables/${id}`, { method: "DELETE" }),
    {
      onSuccess: () => {
        toast.success("Removed");
        refetch();
      },
      onError: (e) => toast.error(e.message || "Delete failed"),
    }
  );

  const { mutate: generateQR } = useApiMutation(
    (id: string) => apiFetch(`/api/admin/tables/${id}/generate-qr`, { method: "POST" }),
    {
      onSuccess: () => { toast.success("QR generated"); refetch(); },
      onError: (e) => toast.error(e.message || "QR generation failed"),
    }
  );

  async function downloadQR(tableId: string, label: string) {
    try {
      const blob = await apiFetch(`/api/admin/tables/${tableId}/qr`);
      const url = URL.createObjectURL(blob as any);
      const a = document.createElement("a");
      a.href = url;
      a.download = `table-${label}.png`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Download failed");
    }
  }

  if (isLoading)
    return (
      <div className="grid place-items-center py-20">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-display text-2xl">Tables</h2>
          <p className="text-sm text-muted-foreground">
            {(data as T[] | undefined)?.length ?? 0} tables ·{" "}
            {((data ?? []) as T[]).reduce((s, t) => s + t.capacity, 0)} seats total
          </p>
        </div>
        <button
          onClick={() =>
            setEditing({ label: "", capacity: 2, location: "Main floor", active: true })
          }
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
        >
          <Plus className="size-4" /> Add table
        </button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {((data ?? []) as T[]).map((t) => (
          <article key={t.id} className="rounded-2xl ring-1 ring-border bg-card p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-xl">{t.label}</h3>
              <span
                className={`text-[10px] uppercase tracking-wider px-2 py-1 rounded-full ${
                  t.active ? "bg-success/20 text-success" : "bg-muted text-muted-foreground"
                }`}
              >
                {t.active ? "Active" : "Off"}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {t.capacity} seats · {t.location || "—"}
            </p>

            {t.qr_code ? (
              <div className="mt-3 flex items-center gap-3">
                <img src={t.qr_code} alt={`QR for ${t.label}`} className="size-20 rounded-lg bg-white p-1" />
                <button
                  onClick={() => downloadQR(t.id, t.label)}
                  className="text-xs rounded-md ring-1 ring-border px-2.5 py-1.5 inline-flex items-center gap-1 hover:bg-white/5"
                >
                  <Download className="size-3" /> Download QR
                </button>
              </div>
            ) : (
              <button
                onClick={() => generateQR(t.id)}
                className="mt-3 text-xs rounded-md ring-1 ring-primary/40 text-primary px-2.5 py-1.5 inline-flex items-center gap-1 hover:bg-primary/10"
              >
                <QrCode className="size-3" /> Generate QR
              </button>
            )}

            <div className="mt-3 flex gap-2">
              <button
                onClick={() => setEditing(t)}
                className="text-xs rounded-md ring-1 ring-border px-2.5 py-1.5 inline-flex items-center gap-1 hover:bg-white/5"
              >
                <Pencil className="size-3" /> Edit
              </button>
              <button
                onClick={() => {
                  if (confirm(`Delete ${t.label}?`)) doDelete(t.id);
                }}
                className="text-xs rounded-md ring-1 ring-destructive/40 text-destructive px-2.5 py-1.5 inline-flex items-center gap-1 hover:bg-destructive/10"
              >
                <Trash2 className="size-3" /> Delete
              </button>
            </div>
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
              doSave({
                id: editing.id,
                label: String(fd.get("label")),
                capacity: Number(fd.get("capacity")),
                location: String(fd.get("location") || ""),
                active: fd.get("active") === "on",
              });
            }}
            className="w-full max-w-md rounded-2xl bg-card ring-1 ring-border p-5 space-y-3"
          >
            <h3 className="font-display text-xl">{editing.id ? "Edit table" : "New table"}</h3>
            <label className="block text-sm">
              Label
              <input
                name="label"
                defaultValue={editing.label ?? ""}
                required
                className="mt-1 w-full rounded-lg bg-background ring-1 ring-border px-3 py-2"
              />
            </label>
            <label className="block text-sm">
              Capacity
              <input
                name="capacity"
                type="number"
                min={1}
                defaultValue={editing.capacity ?? 2}
                required
                className="mt-1 w-full rounded-lg bg-background ring-1 ring-border px-3 py-2"
              />
            </label>
            <label className="block text-sm">
              Location
              <input
                name="location"
                defaultValue={editing.location ?? ""}
                className="mt-1 w-full rounded-lg bg-background ring-1 ring-border px-3 py-2"
              />
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="active" defaultChecked={editing.active ?? true} />
              Active
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="text-sm rounded-md px-3 py-2 ring-1 ring-border"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="text-sm rounded-md bg-primary text-primary-foreground px-4 py-2 font-semibold disabled:opacity-50"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

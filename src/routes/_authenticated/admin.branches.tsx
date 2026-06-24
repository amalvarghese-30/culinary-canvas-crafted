import { useApiQuery, useApiMutation } from "@/api/hooks";
import { apiFetch } from "@/api/client";
import { useState } from "react";
import { Building2, Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function BranchesPage() {
  const [editing, setEditing] = useState<any | null>(null);

  const { data, loading: isLoading, refetch } = useApiQuery("branches-all", () =>
    apiFetch("/api/admin/branches")
  );

  const { mutate: doSave, loading: isSaving } = useApiMutation(
    (p: any) =>
      p.id
        ? apiFetch(`/api/admin/branches/${p.id}`, { method: "PUT", body: JSON.stringify(p) })
        : apiFetch("/api/admin/branches", { method: "POST", body: JSON.stringify(p) }),
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
    (id: string) => apiFetch(`/api/admin/branches/${id}`, { method: "DELETE" }),
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
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-display text-2xl">Branches</h2>
          <p className="text-sm text-muted-foreground">Multi-location & franchise management</p>
        </div>
        <button
          onClick={() => setEditing({ name: "", active: true })}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
        >
          <Plus className="size-4" /> Add branch
        </button>
      </div>

      <div className="rounded-2xl ring-1 ring-border bg-card overflow-hidden">
        {((data ?? []) as any[]).length === 0 ? (
          <div className="text-center py-16">
            <Building2 className="mx-auto size-10 text-muted-foreground/40" />
            <p className="mt-3 text-sm text-muted-foreground">No branches yet.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-background/40">
              <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3">Branch</th>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Address</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {((data ?? []) as any[]).map((b: any, i: number) => (
                <tr key={b.id} className={i % 2 ? "bg-background/20" : ""}>
                  <td className="px-4 py-3 font-medium">{b.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{b.code || "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{b.address || "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{b.phone || "—"}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        b.active ? "bg-success/20 text-success" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {b.active ? "Active" : "Off"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right space-x-1.5">
                    <button
                      onClick={() => setEditing(b)}
                      className="rounded-md ring-1 ring-border p-1.5 hover:bg-white/5"
                    >
                      <Pencil className="size-3.5" />
                    </button>
                    <button
                      onClick={() => confirm(`Delete ${b.name}?`) && doDelete(b.id)}
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
                name: String(fd.get("name")),
                code: String(fd.get("code") || "") || null,
                address: String(fd.get("address") || "") || null,
                phone: String(fd.get("phone") || "") || null,
                active: fd.get("active") === "on",
              });
            }}
            className="w-full max-w-md rounded-2xl bg-card ring-1 ring-border p-5 space-y-3"
          >
            <h3 className="font-display text-xl">{editing.id ? "Edit branch" : "New branch"}</h3>
            {(["name", "code", "address", "phone"] as const).map((f) => (
              <label key={f} className="block text-sm capitalize">
                {f}
                <input
                  name={f}
                  required={f === "name"}
                  defaultValue={editing[f] ?? ""}
                  className="mt-1 w-full rounded-lg bg-background ring-1 ring-border px-3 py-2"
                />
              </label>
            ))}
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

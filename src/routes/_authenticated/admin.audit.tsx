import { useApiQuery } from "@/api/hooks";
import { apiFetch } from "@/api/client";
import { Loader2, ShieldAlert } from "lucide-react";

export default function AuditPage() {
  const { data, loading: isLoading, error } = useApiQuery("audit-logs", () =>
    apiFetch("/api/admin/audit?limit=200")
  );

  if (isLoading) return (
    <div className="grid place-items-center py-20">
      <Loader2 className="size-6 animate-spin text-muted-foreground" />
    </div>
  );

  if (error) return (
    <div className="rounded-2xl ring-1 ring-destructive/40 bg-destructive/5 p-6 inline-flex items-center gap-3">
      <ShieldAlert className="size-5 text-destructive" />
      <span className="text-sm">Admin-only — {error.message || "forbidden"}</span>
    </div>
  );

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-2xl">Audit log</h2>
        <p className="text-sm text-muted-foreground">All staff/admin actions — append-only.</p>
      </div>
      <div className="rounded-2xl ring-1 ring-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="text-xs uppercase tracking-wider text-muted-foreground border-b border-border">
            <tr>
              <th className="text-left p-3">When</th>
              <th className="text-left p-3">Actor</th>
              <th className="text-left p-3">Action</th>
              <th className="text-left p-3">Entity</th>
              <th className="text-left p-3">Meta</th>
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((row: any) => (
              <tr key={row.id} className="border-b border-border/40">
                <td className="p-3 whitespace-nowrap text-muted-foreground">
                  {new Date(row.created_at).toLocaleString()}
                </td>
                <td className="p-3 font-mono text-xs">{row.actor_id?.slice(0, 8) ?? "—"}</td>
                <td className="p-3"><span className="kbd text-primary">{row.action}</span></td>
                <td className="p-3">{row.entity}{row.entity_id ? ` · ${row.entity_id.slice(0, 8)}` : ""}</td>
                <td className="p-3 text-xs text-muted-foreground font-mono max-w-md truncate">
                  {row.meta && Object.keys(row.meta).length > 0 ? JSON.stringify(row.meta) : "—"}
                </td>
              </tr>
            ))}
            {(!data || (data as any[]).length === 0) && (
              <tr><td colSpan={5} className="p-10 text-center text-muted-foreground">No logs yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

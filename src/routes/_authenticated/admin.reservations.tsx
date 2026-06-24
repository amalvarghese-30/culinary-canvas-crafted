import { useApiQuery, useApiMutation } from "@/api/hooks";
import { apiFetch } from "@/api/client";
import { Loader2, Phone, Mail, Users } from "lucide-react";
import { toast } from "sonner";

const STATUS_OPTIONS = ["pending", "confirmed", "seated", "cancelled", "no_show"] as const;
const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-500/15 text-amber-400 ring-amber-500/30",
  confirmed: "bg-emerald-500/15 text-emerald-400 ring-emerald-500/30",
  seated: "bg-sky-500/15 text-sky-400 ring-sky-500/30",
  cancelled: "bg-destructive/15 text-destructive ring-destructive/30",
  no_show: "bg-muted text-muted-foreground ring-border",
};

export default function AdminReservationsPage() {
  const { data, loading: isLoading, refetch } = useApiQuery(
    "admin-reservations",
    () => apiFetch("/api/admin/reservations"),
    { refetchInterval: 20000 }
  );

  const { mutate: doUpdate, loading: isMutating } = useApiMutation(
    (vars: { id: string; status: string }) =>
      apiFetch(`/api/admin/reservations/${vars.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: vars.status }),
      }),
    {
      onSuccess: () => {
        refetch();
        toast.success("Updated");
      },
      onError: (e) => toast.error(e.message || "Update failed"),
    }
  );

  if (isLoading) {
    return (
      <div className="grid place-items-center py-20">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const rows = (data ?? []) as any[];

  return (
    <div className="glass rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-card/50 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="text-left px-4 py-3">Date / Time</th>
              <th className="text-left px-4 py-3">Guest</th>
              <th className="text-left px-4 py-3">Party</th>
              <th className="text-left px-4 py-3">Contact</th>
              <th className="text-left px-4 py-3">Notes</th>
              <th className="text-left px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-border/40 align-top">
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="font-medium">
                    {new Date(r.reservation_date).toLocaleDateString(undefined, {
                      day: "numeric",
                      month: "short",
                    })}
                  </div>
                  <div className="text-xs text-muted-foreground">{r.reservation_time.slice(0, 5)}</div>
                </td>
                <td className="px-4 py-3">{r.full_name}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1 text-muted-foreground">
                    <Users className="size-3.5" />
                    {r.party_size}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs">
                  <div className="flex items-center gap-1.5">
                    <Phone className="size-3.5 text-muted-foreground" />
                    <a href={`tel:${r.phone}`} className="hover:text-primary">{r.phone}</a>
                  </div>
                  {r.email && (
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Mail className="size-3.5 text-muted-foreground" />
                      <a href={`mailto:${r.email}`} className="hover:text-primary truncate max-w-[180px]">
                        {r.email}
                      </a>
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 max-w-[240px]">
                  <p className="text-xs text-muted-foreground line-clamp-3">
                    {r.special_requests || "—"}
                  </p>
                </td>
                <td className="px-4 py-3">
                  <select
                    value={r.status}
                    onChange={(e) => doUpdate({ id: r.id, status: e.target.value })}
                    className={`text-xs font-medium rounded-md px-2 py-1.5 ring-1 bg-transparent ${
                      STATUS_STYLES[r.status] ?? ""
                    }`}
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s} className="bg-background text-foreground">
                        {s.replace(/_/g, " ")}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                  No reservations yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

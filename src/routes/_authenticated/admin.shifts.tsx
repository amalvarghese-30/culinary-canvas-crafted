import { useApiQuery, useApiMutation } from "@/api/hooks";
import { apiFetch } from "@/api/client";
import { Clock, LogIn, LogOut, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function ShiftsPage() {
  const { data: active, refetch: refetchActive } = useApiQuery(
    "my-shift",
    () => apiFetch("/api/shifts/active"),
    { refetchInterval: 30000 }
  );
  const { data: all, loading: isLoading, refetch: refetchAll } = useApiQuery(
    "all-shifts",
    () => apiFetch("/api/admin/shifts")
  );

  const { mutate: clockInFn, loading: isIn } = useApiMutation(
    () => apiFetch("/api/shifts/in", { method: "POST" }),
    {
      onSuccess: () => {
        toast.success("Clocked in");
        refetchActive();
        refetchAll();
      },
    }
  );
  const { mutate: clockOutFn, loading: isOut } = useApiMutation(
    () => apiFetch("/api/shifts/out", { method: "POST" }),
    {
      onSuccess: () => {
        toast.success("Clocked out");
        refetchActive();
        refetchAll();
      },
    }
  );

  function fmt(s?: string | null) {
    return s ? new Date(s).toLocaleString() : "—";
  }
  function dur(a?: string | null, b?: string | null) {
    if (!a) return "—";
    const ms = (b ? new Date(b).getTime() : Date.now()) - new Date(a).getTime();
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    return `${h}h ${m}m`;
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-2xl">Shifts & attendance</h2>
        <p className="text-sm text-muted-foreground">Clock in when you arrive, clock out before you leave.</p>
      </div>

      <div className="rounded-2xl ring-1 ring-primary/30 bg-primary/5 p-5 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Clock className="size-6 text-primary" />
          <div>
            {active ? (
              <>
                <p className="font-semibold">Currently clocked in</p>
                <p className="text-sm text-muted-foreground">
                  Since {fmt((active as any).clock_in)} · {dur((active as any).clock_in)}
                </p>
              </>
            ) : (
              <p className="font-semibold">Not clocked in</p>
            )}
          </div>
        </div>
        {active ? (
          <button
            onClick={() => clockOutFn(undefined as any)}
            disabled={isOut}
            className="inline-flex items-center gap-2 rounded-xl bg-destructive/20 text-destructive ring-1 ring-destructive/40 px-5 py-2.5 font-semibold"
          >
            <LogOut className="size-4" /> Clock out
          </button>
        ) : (
          <button
            onClick={() => clockInFn(undefined as any)}
            disabled={isIn}
            className="inline-flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-5 py-2.5 font-semibold"
          >
            <LogIn className="size-4" /> Clock in
          </button>
        )}
      </div>

      <div className="rounded-2xl ring-1 ring-border bg-card overflow-hidden">
        <div className="p-4 border-b border-border">
          <h3 className="font-semibold">Recent shifts</h3>
        </div>
        {isLoading ? (
          <div className="grid place-items-center py-16">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : ((all ?? []) as any[]).length === 0 ? (
          <p className="text-center py-12 text-sm text-muted-foreground">No shifts recorded.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-background/40">
                <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-3">Staff</th>
                  <th className="px-4 py-3">Clock in</th>
                  <th className="px-4 py-3">Clock out</th>
                  <th className="px-4 py-3">Duration</th>
                </tr>
              </thead>
              <tbody>
                {((all ?? []) as any[]).map((s: any, i: number) => (
                  <tr key={s.id} className={i % 2 ? "bg-background/20" : ""}>
                    <td className="px-4 py-3 font-medium">
                      {s.profiles?.full_name || s.user_id.slice(0, 8)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{fmt(s.clock_in)}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {s.clock_out ? fmt(s.clock_out) : <span className="text-primary">Active</span>}
                    </td>
                    <td className="px-4 py-3">{dur(s.clock_in, s.clock_out)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

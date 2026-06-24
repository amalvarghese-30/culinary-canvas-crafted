import { useState } from "react";
import { Bell, Check } from "lucide-react";
import { Link } from "react-router-dom";
import { useApiQuery, useApiMutation } from "@/api/hooks";
import { apiFetch } from "@/api/client";
import { useAuth } from "@/hooks/use-auth";

export function NotificationBell() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  const { data, refetch } = useApiQuery(
    "notifications",
    () => apiFetch("/api/notifications"),
    { enabled: !!user, refetchInterval: 60_000 },
  );

  const list = (data ?? []) as any[];
  const unread = list.filter((n) => !n.read_at).length;

  const { mutate: readMut } = useApiMutation(
    (id: string) => apiFetch(`/api/notifications/${id}/read`, { method: "PATCH" }),
    { onSuccess: () => refetch() },
  );
  const { mutate: allMut } = useApiMutation(
    () => apiFetch("/api/notifications/read-all", { method: "POST" }),
    { onSuccess: () => refetch() },
  );

  if (!user) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={`Notifications, ${unread} unread`}
        className="relative grid place-items-center size-10 rounded-xl ring-1 ring-border hover:bg-white/5 transition"
      >
        <Bell className="size-5" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 grid place-items-center min-w-5 h-5 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-[var(--font-num)]">
            {unread}
          </span>
        )}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 max-h-[70vh] overflow-y-auto rounded-2xl ring-1 ring-border bg-card shadow-[var(--shadow-luxe)] z-50">
            <div className="p-3 flex items-center justify-between border-b border-border">
              <span className="font-semibold text-sm">Notifications</span>
              {unread > 0 && (
                <button
                  onClick={() => allMut(undefined)}
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  <Check className="size-3" /> Mark all read
                </button>
              )}
            </div>
            {list.length === 0 ? (
              <p className="p-6 text-sm text-muted-foreground text-center">No notifications yet.</p>
            ) : (
              <ul className="divide-y divide-border">
                {list.map((n) => {
                  const body = (
                    <div className="p-3 hover:bg-white/5 transition">
                      <div className="flex items-start justify-between gap-2">
                        <span className={`text-sm font-medium ${n.read_at ? "text-muted-foreground" : ""}`}>
                          {n.title}
                        </span>
                        {!n.read_at && <span className="mt-1 size-2 rounded-full bg-primary shrink-0" />}
                      </div>
                      {n.body && <p className="text-xs text-muted-foreground mt-1">{n.body}</p>}
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-2">
                        {new Date(n.created_at).toLocaleString()}
                      </p>
                    </div>
                  );
                  return (
                    <li key={n.id}>
                      {n.link ? (
                        <Link
                          to={n.link}
                          onClick={() => {
                            if (!n.read_at) readMut(n.id);
                            setOpen(false);
                          }}
                        >
                          {body}
                        </Link>
                      ) : (
                        <button
                          onClick={() => !n.read_at && readMut(n.id)}
                          className="w-full text-left"
                        >
                          {body}
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
            <div className="p-2 border-t border-border">
              <Link
                to="/notifications"
                onClick={() => setOpen(false)}
                className="block text-center text-xs text-primary hover:underline py-2"
              >
                View all notifications
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

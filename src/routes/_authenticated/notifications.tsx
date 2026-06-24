import { Link } from "react-router-dom";
import { useApiQuery, useApiMutation } from "@/api/hooks";
import { apiFetch } from "@/api/client";
import { Bell, Check, Loader2, BellOff } from "lucide-react";

export default function NotificationsPage() {
  const { data, loading: isLoading, refetch } = useApiQuery(
    "notifications",
    () => apiFetch("/api/notifications"),
    { refetchInterval: 30000 }
  );

  const { mutate: markOne } = useApiMutation(
    (id: string) => apiFetch(`/api/notifications/${id}/read`, { method: "PATCH" }),
    { onSuccess: () => refetch() }
  );
  const { mutate: markAll } = useApiMutation(
    () => apiFetch("/api/notifications/read-all", { method: "PATCH" }),
    { onSuccess: () => refetch() }
  );

  async function enablePush() {
    if (!("Notification" in window)) {
      alert("Browser notifications aren't supported here.");
      return;
    }
    const perm = await Notification.requestPermission();
    if (perm === "granted") {
      new Notification("Mōmo House", {
        body: "You'll get order updates here.",
        icon: "/favicon.ico",
      });
    }
  }

  const list = (data ?? []) as any[];
  const unread = list.filter((n) => !n.read_at).length;

  return (
    <main className="min-h-screen pt-24 pb-20">
      <div className="container-luxe max-w-2xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <span className="kbd">Inbox</span>
            <h1 className="font-display text-4xl mt-2">Notifications</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {unread > 0 ? `${unread} unread` : "All caught up"}
            </p>
          </div>
          <div className="flex flex-col gap-2 items-end">
            <button
              onClick={enablePush}
              className="text-xs inline-flex items-center gap-1.5 rounded-lg ring-1 ring-border px-3 py-1.5 hover:bg-white/5"
            >
              <Bell className="size-3.5" /> Enable browser alerts
            </button>
            {unread > 0 && (
              <button
                onClick={() => markAll(undefined as any)}
                className="text-xs inline-flex items-center gap-1.5 text-primary hover:underline"
              >
                <Check className="size-3.5" /> Mark all read
              </button>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="grid place-items-center py-20">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : list.length === 0 ? (
          <div className="text-center py-20 rounded-2xl ring-1 ring-border bg-card">
            <BellOff className="mx-auto size-10 text-muted-foreground/40" />
            <p className="mt-3 text-sm text-muted-foreground">No notifications yet.</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {list.map((n) => {
              const body = (
                <div
                  className={`rounded-2xl ring-1 p-4 transition ${
                    n.read_at
                      ? "ring-border bg-card/40"
                      : "ring-primary/30 bg-primary/5"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className={`font-semibold ${n.read_at ? "text-muted-foreground" : ""}`}>
                        {n.title}
                      </p>
                      {n.body && (
                        <p className="text-sm text-muted-foreground mt-1">{n.body}</p>
                      )}
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-2">
                        {new Date(n.created_at).toLocaleString()} · {n.kind}
                      </p>
                    </div>
                    {!n.read_at && (
                      <span className="mt-1 size-2 rounded-full bg-primary shrink-0" />
                    )}
                  </div>
                </div>
              );
              return (
                <li key={n.id}>
                  {n.link ? (
                    <Link
                      to={n.link}
                      onClick={() => !n.read_at && markOne(n.id)}
                    >
                      {body}
                    </Link>
                  ) : (
                    <button
                      onClick={() => !n.read_at && markOne(n.id)}
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
      </div>
    </main>
  );
}

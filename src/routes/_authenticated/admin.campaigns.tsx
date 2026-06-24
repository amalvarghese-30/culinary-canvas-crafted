import { useApiQuery, useApiMutation } from "@/api/hooks";
import { apiFetch } from "@/api/client";
import { useState } from "react";
import { Megaphone, Plus, Sparkles, Send, Loader2, Trash2, Pencil } from "lucide-react";
import { toast } from "sonner";

export default function CampaignsPage() {
  const [editing, setEditing] = useState<any | null>(null);
  const [goal, setGoal] = useState("");

  const { data, loading: isLoading, refetch } = useApiQuery("campaigns", () =>
    apiFetch("/api/campaigns")
  );

  const { mutate: doSave, loading: isSaving } = useApiMutation(
    (p: any) =>
      p.id
        ? apiFetch(`/api/campaigns/${p.id}`, { method: "PUT", body: JSON.stringify(p) })
        : apiFetch("/api/campaigns", { method: "POST", body: JSON.stringify(p) }),
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
    (id: string) => apiFetch(`/api/campaigns/${id}`, { method: "DELETE" }),
    {
      onSuccess: () => refetch(),
    }
  );
  const { mutate: doSend, loading: isSending } = useApiMutation(
    (id: string) => apiFetch(`/api/campaigns/${id}/send`, { method: "POST" }),
    {
      onSuccess: (r: any) => {
        toast.success(`Sent ${r.sent} of ${r.attempted}`);
        refetch();
      },
      onError: (e) => toast.error(e.message || "Send failed"),
    }
  );
  const { mutate: doGenerate, loading: isGenerating } = useApiMutation(
    () =>
      apiFetch("/api/campaigns/generate", {
        method: "POST",
        body: JSON.stringify({
          goal,
          channel: editing?.channel ?? "whatsapp",
          audience: editing?.audience ?? "all",
        }),
      }),
    {
      onSuccess: (r: any) => {
        setEditing((e: any) => ({ ...e, body: r.body }));
        toast.success("Generated");
      },
      onError: (e) => toast.error(e.message || "AI failed"),
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
          <h2 className="font-display text-2xl">Marketing campaigns</h2>
          <p className="text-sm text-muted-foreground">
            AI-generated WhatsApp / Email / In-app blasts. Connect Twilio & Resend to send externally.
          </p>
        </div>
        <button
          onClick={() =>
            setEditing({ name: "", channel: "inapp", audience: "all", body: "", subject: "" })
          }
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
        >
          <Plus className="size-4" /> New campaign
        </button>
      </div>

      <div className="rounded-2xl ring-1 ring-border bg-card overflow-hidden">
        {((data ?? []) as any[]).length === 0 ? (
          <div className="text-center py-16">
            <Megaphone className="mx-auto size-10 text-muted-foreground/40" />
            <p className="mt-3 text-sm text-muted-foreground">No campaigns yet.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-background/40">
              <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Channel</th>
                <th className="px-4 py-3">Audience</th>
                <th className="px-4 py-3">Sent</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {((data ?? []) as any[]).map((c: any, i: number) => (
                <tr key={c.id} className={i % 2 ? "bg-background/20" : ""}>
                  <td className="px-4 py-3 font-medium">{c.name}</td>
                  <td className="px-4 py-3 capitalize">{c.channel}</td>
                  <td className="px-4 py-3 capitalize">{c.audience}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {c.sent_at
                      ? `${c.sent_count} on ${new Date(c.sent_at).toLocaleDateString()}`
                      : "Draft"}
                  </td>
                  <td className="px-4 py-3 text-right space-x-1.5">
                    <button
                      onClick={() => doSend(c.id)}
                      disabled={isSending}
                      className="inline-flex items-center gap-1 text-xs rounded-md bg-primary/20 text-primary px-2 py-1 hover:bg-primary/30"
                    >
                      <Send className="size-3" /> Send
                    </button>
                    <button onClick={() => setEditing(c)} className="rounded-md ring-1 ring-border p-1.5">
                      <Pencil className="size-3.5" />
                    </button>
                    <button
                      onClick={() => confirm(`Delete ${c.name}?`) && doDelete(c.id)}
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
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur grid place-items-center p-4 overflow-auto"
          onClick={() => setEditing(null)}
        >
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={(e) => {
              e.preventDefault();
              doSave({
                id: editing.id,
                name: editing.name,
                channel: editing.channel,
                audience: editing.audience,
                subject: editing.subject || null,
                body: editing.body,
              });
            }}
            className="w-full max-w-xl rounded-2xl bg-card ring-1 ring-border p-5 space-y-3"
          >
            <h3 className="font-display text-xl">{editing.id ? "Edit campaign" : "New campaign"}</h3>
            <input
              required
              placeholder="Campaign name"
              value={editing.name}
              onChange={(e) => setEditing({ ...editing, name: e.target.value })}
              className="w-full rounded-lg bg-background ring-1 ring-border px-3 py-2"
            />
            <div className="grid grid-cols-2 gap-2">
              <select value={editing.channel} onChange={(e) => setEditing({ ...editing, channel: e.target.value })} className="rounded-lg bg-background ring-1 ring-border px-3 py-2">
                <option value="inapp">In-app</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="email">Email</option>
                <option value="sms">SMS</option>
              </select>
              <select value={editing.audience} onChange={(e) => setEditing({ ...editing, audience: e.target.value })} className="rounded-lg bg-background ring-1 ring-border px-3 py-2">
                <option value="all">All customers</option>
                <option value="vip">VIPs (₹2000+ LTV)</option>
                <option value="lapsed">Lapsed (30+ days)</option>
                <option value="new">New (≤1 order)</option>
              </select>
            </div>
            {editing.channel === "email" && (
              <input
                placeholder="Email subject"
                value={editing.subject ?? ""}
                onChange={(e) => setEditing({ ...editing, subject: e.target.value })}
                className="w-full rounded-lg bg-background ring-1 ring-border px-3 py-2"
              />
            )}

            <div className="rounded-xl ring-1 ring-primary/30 bg-primary/5 p-3 space-y-2">
              <p className="text-xs font-semibold text-primary inline-flex items-center gap-1">
                <Sparkles className="size-3" /> AI copy generator
              </p>
              <div className="flex gap-2">
                <input
                  placeholder="Goal — e.g. drive lunch traffic on weekdays"
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  className="flex-1 rounded-lg bg-background ring-1 ring-border px-3 py-2 text-sm"
                />
                <button
                  type="button"
                  onClick={() => goal && doGenerate(undefined as any)}
                  disabled={isGenerating || !goal}
                  className="rounded-lg bg-primary text-primary-foreground px-3 text-sm font-semibold disabled:opacity-50"
                >
                  {isGenerating ? "…" : "Generate"}
                </button>
              </div>
            </div>

            <textarea
              required
              rows={6}
              placeholder="Message body"
              value={editing.body}
              onChange={(e) => setEditing({ ...editing, body: e.target.value })}
              className="w-full rounded-lg bg-background ring-1 ring-border px-3 py-2 text-sm"
            />

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

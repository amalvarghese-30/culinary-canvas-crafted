import { useRef, useState } from "react";
import { useApiMutation } from "@/api/hooks";
import { apiFetch } from "@/api/client";
import { Sparkles, Send, Loader2 } from "lucide-react";

const SUGGESTIONS = [
  "What's my best-selling dish this month?",
  "Any inventory I should reorder?",
  "Suggest a promotion to boost weekday lunches.",
];

export function BusinessAssistant() {
  const [q, setQ] = useState("");
  const [history, setHistory] = useState<{ q: string; a: string }[]>([]);
  const lastQ = useRef("");

  const { mutate: ask, loading: isPending, error: mutError } = useApiMutation(
    (question: string) =>
      apiFetch("/api/business-ai/ask", { method: "POST", body: JSON.stringify({ question }) }),
    {
      onSuccess: (res) => {
        setHistory((h) => [{ q: lastQ.current, a: (res as any).reply }, ...h].slice(0, 6));
        setQ("");
      },
    },
  );

  function submit(question: string) {
    if (!question.trim() || isPending) return;
    lastQ.current = question;
    ask(question);
  }

  return (
    <div className="rounded-2xl ring-1 ring-primary/30 bg-gradient-to-br from-primary/5 to-card p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles className="size-5 text-primary" />
        <h3 className="font-display text-lg">AI business assistant</h3>
      </div>
      <form
        onSubmit={(e) => { e.preventDefault(); submit(q); }}
        className="flex gap-2"
      >
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Ask about sales, inventory, top items…"
          className="input-luxe flex-1"
          maxLength={500}
        />
        <button
          disabled={isPending}
          className="rounded-xl bg-primary text-primary-foreground px-4 inline-flex items-center gap-2 hover:bg-primary-glow disabled:opacity-60"
        >
          {isPending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
        </button>
      </form>
      <div className="flex flex-wrap gap-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => submit(s)}
            disabled={isPending}
            className="text-xs rounded-full ring-1 ring-border px-3 py-1.5 text-muted-foreground hover:text-foreground hover:ring-primary/40 transition"
          >
            {s}
          </button>
        ))}
      </div>
      {mutError && (
        <p className="text-sm text-destructive">{mutError instanceof Error ? mutError.message : "Failed"}</p>
      )}
      {history.length > 0 && (
        <div className="space-y-3">
          {history.map((h, i) => (
            <div key={i} className="rounded-xl ring-1 ring-border bg-card/60 p-3">
              <p className="text-xs uppercase tracking-wider text-primary">{h.q}</p>
              <p className="text-sm mt-2 whitespace-pre-wrap">{h.a}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

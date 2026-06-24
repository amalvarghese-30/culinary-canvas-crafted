import { useEffect, useRef, useState } from "react";
import { useApiMutation } from "@/api/hooks";
import { apiFetch } from "@/api/client";
import { Bot, Send, Sparkles, X } from "lucide-react";

type Msg = { role: "user" | "assistant"; content: string };

const STARTERS = [
  "What's your most popular momo?",
  "I want something spicy under ₹300",
  "Suggest a combo for two people",
];

export function AiChat() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([
    {
      role: "assistant",
      content:
        "Hi! I'm Momo 🥟 your concierge at Mōmo House. Ask me anything — pairings, spice levels, reservations, you name it.",
    },
  ]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { mutate: sendMsg, loading: isPending } = useApiMutation(
    (next: Msg[]) =>
      apiFetch("/api/ai/chat", { method: "POST", body: JSON.stringify({ messages: next }) }),
    {
      onSuccess: (res) =>
        setMsgs((m) => [...m, { role: "assistant", content: (res as any).reply || "…" }]),
      onError: (err) =>
        setMsgs((m) => [
          ...m,
          {
            role: "assistant",
            content:
              err instanceof Error ? `Sorry — ${err.message}` : "Sorry, something went wrong.",
          },
        ]),
    },
  );

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 99999, behavior: "smooth" });
  }, [msgs, isPending]);

  function send(text: string) {
    const t = text.trim();
    if (!t || isPending) return;
    const next: Msg[] = [...msgs, { role: "user", content: t }];
    setMsgs(next);
    setInput("");
    sendMsg(next.filter((m) => m.role === "user" || m.role === "assistant").slice(-12));
  }

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close chat" : "Open chat with concierge"}
        className="fixed bottom-24 right-6 z-40 grid place-items-center size-14 rounded-full bg-gradient-to-br from-primary to-primary-glow text-primary-foreground shadow-[var(--shadow-luxe)] hover:scale-105 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        {open ? <X className="size-6" /> : <Bot className="size-6" />}
        {!open && (
          <span className="absolute -top-1 -right-1 size-3 rounded-full bg-success ring-2 ring-background" />
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Momo concierge chat"
          className="fixed bottom-44 right-6 z-40 w-[min(380px,calc(100vw-2rem))] h-[min(560px,calc(100vh-12rem))] rounded-2xl bg-card ring-1 ring-border shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200"
        >
          <header className="px-4 py-3 border-b border-border flex items-center gap-3 bg-gradient-to-r from-primary/10 to-transparent">
            <div className="grid place-items-center size-9 rounded-full bg-primary/15 ring-1 ring-primary/30">
              <Sparkles className="size-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-display text-base leading-tight">Momo Concierge</div>
              <div className="text-[11px] text-muted-foreground">Powered by AI · usually replies instantly</div>
            </div>
          </header>

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3 text-sm">
            {msgs.map((m, i) => (
              <div
                key={i}
                className={`max-w-[85%] rounded-2xl px-3.5 py-2 leading-relaxed whitespace-pre-wrap ${
                  m.role === "user"
                    ? "ml-auto bg-primary text-primary-foreground rounded-br-sm"
                    : "bg-surface ring-1 ring-border rounded-bl-sm"
                }`}
              >
                {m.content}
              </div>
            ))}
            {isPending && (
              <div className="bg-surface ring-1 ring-border rounded-2xl rounded-bl-sm max-w-[60%] px-3.5 py-2 inline-flex gap-1">
                <span className="size-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="size-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="size-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            )}
            {msgs.length === 1 && (
              <div className="pt-2 flex flex-wrap gap-1.5">
                {STARTERS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="kbd rounded-full px-3 py-1.5 ring-1 ring-border hover:ring-primary/40 hover:text-foreground text-muted-foreground transition"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="border-t border-border p-3 flex items-center gap-2 bg-card"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about the menu…"
              maxLength={500}
              className="flex-1 bg-surface rounded-xl px-3 py-2 text-sm ring-1 ring-border focus-visible:outline-none focus-visible:ring-primary"
            />
            <button
              type="submit"
              disabled={!input.trim() || isPending}
              aria-label="Send"
              className="grid place-items-center size-10 rounded-xl bg-primary text-primary-foreground disabled:opacity-50 hover:bg-primary-glow transition"
            >
              <Send className="size-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}

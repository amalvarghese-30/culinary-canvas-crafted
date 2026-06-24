import { useState } from "react";
import { Mic, MicOff } from "lucide-react";
import { useVoiceInput } from "@/hooks/use-voice-input";
import { toast } from "sonner";

type AnyItem = { id: string; name?: string; style?: string; variant?: string; [k: string]: any };

/**
 * Voice ordering bar. Listens for "add 2 chicken steam" / "veg fried"
 * and resolves to a menu item using fuzzy string matching.
 */
export function VoiceOrderBar<T extends AnyItem>({
  items,
  onAdd,
}: {
  items: T[];
  onAdd: (item: T, qty?: number) => void;
}) {
  const [heard, setHeard] = useState("");
  const { listening, supported, start, stop } = useVoiceInput((text) => {
    setHeard(text);
    handle(text);
  });

  function handle(transcript: string) {
    const t = transcript.toLowerCase();
    // Extract quantity
    const numMatch = t.match(/\b(\d+)\b/) || t.match(/\b(one|two|three|four|five|six|seven|eight|nine|ten)\b/);
    const numMap: Record<string, number> = {
      one: 1, two: 2, three: 3, four: 4, five: 5,
      six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
    };
    const qty = numMatch
      ? numMap[numMatch[1]] ?? Number(numMatch[1]) ?? 1
      : 1;

    // Pick best item by token overlap
    const tokens = t
      .replace(/[^a-z0-9 ]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2 && !numMap[w] && w !== "add" && w !== "please");
    let best: T | null = null;
    let bestScore = 0;
    for (const it of items) {
      const hay = `${it.style} ${it.variant} ${it.name}`.toLowerCase();
      const score = tokens.reduce((s, tk) => (hay.includes(tk) ? s + 1 : s), 0);
      if (score > bestScore) {
        bestScore = score;
        best = it;
      }
    }
    if (best && bestScore > 0) {
      onAdd(best, qty);
      toast.success(`Added ${qty} × ${best.style} ${best.variant}`);
    } else {
      toast.error("Didn't catch that — try 'two chicken steam'");
    }
  }

  if (!supported) return null;

  return (
    <div className="rounded-2xl ring-1 ring-primary/30 bg-primary/5 p-4 mb-10 flex items-center gap-3">
      <button
        onClick={listening ? stop : start}
        aria-label={listening ? "Stop voice ordering" : "Start voice ordering"}
        className={`grid place-items-center size-12 rounded-2xl transition ${
          listening
            ? "bg-destructive text-destructive-foreground animate-pulse"
            : "bg-primary text-primary-foreground"
        }`}
      >
        {listening ? <MicOff className="size-5" /> : <Mic className="size-5" />}
      </button>
      <div className="flex-1 min-w-0">
        <p className="text-xs uppercase tracking-widest text-primary">Voice ordering</p>
        <p className="text-sm text-muted-foreground truncate">
          {listening
            ? "Listening… try 'two chicken steam'"
            : heard || "Tap the mic and order by voice"}
        </p>
      </div>
    </div>
  );
}

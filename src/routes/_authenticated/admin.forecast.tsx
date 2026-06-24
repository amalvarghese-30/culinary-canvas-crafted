import { useState } from "react";
import { useApiQuery, useApiMutation } from "@/api/hooks";
import { apiFetch } from "@/api/client";
import { Sparkles, Loader2, TrendingUp, Package } from "lucide-react";

export default function ForecastPage() {
  const [result, setResult] = useState<any>(null);
  const { mutate: runForecast, loading: isMutating } = useApiMutation(
    () => apiFetch("/api/admin/forecast", { method: "POST" }),
    {
      onSuccess: (r) => setResult(r),
      onError: (e) => setResult({ error: e.message }),
    }
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-display text-2xl">AI demand forecast</h2>
          <p className="text-sm text-muted-foreground">
            Reads the last 30 days of sales + current inventory to predict the next 7 days.
          </p>
        </div>
        <button
          onClick={() => runForecast(undefined as any)}
          disabled={isMutating}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
        >
          {isMutating ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Sparkles className="size-4" />
          )}
          {isMutating ? "Forecasting…" : "Run forecast"}
        </button>
      </div>

      {!result && !isMutating && (
        <div className="rounded-2xl ring-1 ring-border bg-card text-center py-20">
          <TrendingUp className="mx-auto size-10 text-muted-foreground/40" />
          <p className="mt-3 text-sm text-muted-foreground">
            Click "Run forecast" to get AI-generated demand predictions.
          </p>
        </div>
      )}

      {result && !result.error && (
        <div className="grid lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 rounded-2xl ring-1 ring-border bg-card p-5 prose prose-invert prose-sm max-w-none">
            <h3 className="font-display text-xl mb-3 inline-flex items-center gap-2">
              <Sparkles className="size-5 text-primary" /> AI brief
            </h3>
            <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">{result.ai}</pre>
          </div>
          <div className="rounded-2xl ring-1 ring-border bg-card p-5">
            <h3 className="font-display text-xl mb-3 inline-flex items-center gap-2">
              <Package className="size-5 text-primary" /> Inventory snapshot
            </h3>
            <ul className="text-sm space-y-2">
              {result.inventory.map((i: any) => {
                const low = Number(i.stock) <= Number(i.low_stock_at);
                return (
                  <li key={i.name} className="flex justify-between">
                    <span className={low ? "text-primary" : ""}>{i.name}</span>
                    <span className="font-[var(--font-num)] text-muted-foreground">
                      {Number(i.stock)} {i.unit}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

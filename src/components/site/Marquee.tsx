const words = [
  "Handmade Daily",
  "Hill Station Recipes",
  "Wood-fired Tandoor",
  "Cold-Pressed Sauces",
  "No Preservatives",
  "Steamed to Order",
  "Chef Curated",
];

export function Marquee() {
  return (
    <div className="border-y border-border bg-surface/50 py-5 overflow-hidden">
      <div className="flex w-max animate-marquee whitespace-nowrap">
        {[...words, ...words].map((w, i) => (
          <span key={i} className="flex items-center gap-10 px-10 kbd text-foreground/60">
            <span className="text-primary">✦</span>
            <span className="font-display italic text-2xl text-foreground tracking-tight">
              {w}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}

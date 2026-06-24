import { Quote, Star } from "lucide-react";
import { useApiQuery } from "@/api/hooks";
import { apiFetch } from "@/api/client";

const FALLBACK = [
  {
    _id: "f1",
    rating: 5,
    comment: "The Jhol Momos are unreal. Warming, complex, perfectly balanced. I drove across town twice this week.",
    userId: { fullName: "Aarav S." },
    menuItemId: { name: "Jhol Momo", style: "Jhol", variant: "Veg" },
  },
  {
    _id: "f2",
    rating: 5,
    comment: "Easily the best plating I've seen at this price point. The Tandoori Chicken Momos are a chef-level dish.",
    userId: { fullName: "Neha K." },
    menuItemId: { name: "Tandoori Momo", style: "Tandoori", variant: "Chicken" },
  },
  {
    _id: "f3",
    rating: 5,
    comment: "Quality has never dropped in seven years. That's rare. Cheese Momos are family ritual on Sundays.",
    userId: { fullName: "Vikram T." },
    menuItemId: { name: "Cheese Momo", style: "Steam", variant: "Veg Cheese" },
  },
  {
    _id: "f4",
    rating: 5,
    comment: "Crispy outside, juicy inside, served hot — the trifecta. The Schezwan sauce is house-made and you can tell.",
    userId: { fullName: "Priya R." },
    menuItemId: { name: "Schezwan Momo", style: "Schezwan", variant: "Chicken" },
  },
];

export function Reviews() {
  const { data } = useApiQuery("public-reviews", () => apiFetch("/api/public/reviews"));

  const reviews = (data && (data as any[]).length > 0 ? data : FALLBACK) as typeof FALLBACK;

  return (
    <section className="py-28 md:py-36 bg-surface/40">
      <div className="container-luxe">
        <div className="max-w-2xl mb-14">
          <span className="kbd">Guest Notes</span>
          <h2 className="font-display text-4xl md:text-6xl mt-4">
            Loved by <em className="text-gradient-gold not-italic">thousands</em>.
          </h2>
        </div>
        <div className="grid md:grid-cols-2 gap-5">
          {reviews.map((r: any) => (
            <figure
              key={r._id}
              className="rounded-3xl bg-card ring-1 ring-border p-8 lg:p-10 relative overflow-hidden"
            >
              <Quote className="absolute -top-2 -right-2 size-28 text-primary/5" />
              <div className="flex items-center gap-1 text-primary">
                {Array.from({ length: r.rating ?? 5 }).map((_, i) => (
                  <Star key={i} className="size-4 fill-primary" />
                ))}
              </div>
              <blockquote className="mt-5 font-display text-2xl leading-snug text-foreground/95">
                "{r.comment}"
              </blockquote>
              <figcaption className="mt-6 flex items-center gap-3">
                <span className="grid place-items-center size-10 rounded-full bg-primary/15 ring-1 ring-primary/30 font-display text-primary">
                  {(r.userId?.fullName ?? r.userId ?? "?")[0]}
                </span>
                <span>
                  <span className="block font-medium">{r.userId?.fullName ?? r.userId}</span>
                  <span className="kbd">{r.menuItemId?.name ?? ""}</span>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

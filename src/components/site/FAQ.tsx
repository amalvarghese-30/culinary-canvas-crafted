import { useState } from "react";
import { Plus } from "lucide-react";

const faqs = [
  { q: "Do you deliver?", a: "Yes — through Swiggy, Zomato, and our own fleet within a 4 km radius. Orders above ₹400 ship free." },
  { q: "Are your momos truly hand-folded?", a: "Every single one. We never use frozen or pre-made wrappers — the dough is rested daily and folded to order." },
  { q: "Do you have Jain / no-onion options?", a: "Yes. Mention 'Jain' in the order notes; our kitchen has a dedicated prep station for it." },
  { q: "Can I book the space for a private dinner?", a: "Absolutely. We host up to 30 guests with a curated chef's tasting menu. Reach out via WhatsApp." },
  { q: "What's the spice scale like?", a: "One flame is gentle warmth, three is serious heat. Our Jhol and Schezwan are crowd favourites at level two." },
];

export function FAQ() {
  const [open, setOpen] = useState(0);
  return (
    <section className="py-28 md:py-36">
      <div className="container-luxe grid lg:grid-cols-12 gap-12">
        <div className="lg:col-span-4">
          <span className="kbd">FAQ</span>
          <h2 className="font-display text-4xl md:text-5xl mt-4">
            Answers, <em className="text-gradient-gold not-italic">briefly</em>.
          </h2>
          <p className="text-muted-foreground mt-4">
            Still curious? WhatsApp us — we usually reply within a few minutes.
          </p>
        </div>
        <ul className="lg:col-span-8 divide-y divide-border border-y border-border">
          {faqs.map((f, i) => {
            const isOpen = open === i;
            return (
              <li key={f.q}>
                <button
                  onClick={() => setOpen(isOpen ? -1 : i)}
                  aria-expanded={isOpen}
                  className="w-full flex items-center justify-between gap-6 py-6 text-left group"
                >
                  <span className="font-display text-xl md:text-2xl">{f.q}</span>
                  <span
                    className={`grid place-items-center size-10 rounded-full ring-1 ring-border transition-all ${
                      isOpen ? "bg-primary text-primary-foreground rotate-45" : "text-primary"
                    }`}
                  >
                    <Plus className="size-4" />
                  </span>
                </button>
                <div
                  className={`grid transition-all duration-500 ease-out ${
                    isOpen ? "grid-rows-[1fr] opacity-100 pb-6" : "grid-rows-[0fr] opacity-0"
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="text-muted-foreground max-w-2xl leading-relaxed">{f.a}</p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

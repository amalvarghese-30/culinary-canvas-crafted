import { Sprout, Hand, Timer, ShieldCheck, ChefHat, Wallet } from "lucide-react";

const items = [
  { icon: Sprout, title: "Fresh Daily", desc: "Vegetables, meat and herbs sourced every morning." },
  { icon: Hand, title: "Hand-folded", desc: "Every pleat shaped by a chef — never machines." },
  { icon: Timer, title: "Steamed to Order", desc: "Nothing sits. Your momo starts when you do." },
  { icon: ShieldCheck, title: "Hygienic Kitchen", desc: "FSSAI certified, open kitchen, weekly audits." },
  { icon: ChefHat, title: "Experienced Chefs", desc: "Hill-station trained, 10+ years on the steamer." },
  { icon: Wallet, title: "Honest Pricing", desc: "Premium ingredients, neighbourhood prices." },
];

export function WhyUs() {
  return (
    <section className="py-28 md:py-36">
      <div className="container-luxe">
        <div className="max-w-2xl mb-14">
          <span className="kbd">Why Mōmo House</span>
          <h2 className="font-display text-4xl md:text-6xl mt-4">
            Six promises on every <em className="text-gradient-gold not-italic">plate</em>.
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-border rounded-3xl overflow-hidden ring-1 ring-border">
          {items.map((it) => (
            <div
              key={it.title}
              className="bg-background p-8 lg:p-10 hover:bg-card transition-colors duration-500 group"
            >
              <div className="grid place-items-center size-12 rounded-xl bg-primary/10 ring-1 ring-primary/30 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition">
                <it.icon className="size-5" />
              </div>
              <h3 className="font-display text-2xl mt-6">{it.title}</h3>
              <p className="text-muted-foreground mt-2 leading-relaxed">{it.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

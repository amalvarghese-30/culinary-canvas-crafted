import chef from "@/assets/chef.jpg?w=400;600;900&format=avif;webp;jpg&as=picture";
import interior from "@/assets/interior.jpg?w=300;500;800&format=avif;webp;jpg&as=picture";
import { Picture } from "./Picture";

export function About() {
  return (
    <section id="about" className="py-28 md:py-36">
      <div className="container-luxe grid lg:grid-cols-12 gap-12 lg:gap-20 items-center">
        <div className="lg:col-span-5 space-y-6 relative">
          <div className="relative">
            <Picture
              source={chef}
              alt="Chef folding fresh momos by hand"
              sizes="(min-width: 1024px) 40vw, 100vw"
              className="rounded-3xl object-cover aspect-[4/5] w-full ring-1 ring-border"
            />
            <div className="hidden md:block absolute -bottom-10 -right-10 w-1/2">
              <Picture
                source={interior}
                alt="Warm restaurant interior"
                sizes="(min-width: 1024px) 20vw, (min-width: 768px) 40vw, 100vw"
                className="rounded-2xl object-cover aspect-[4/3] ring-1 ring-border shadow-[var(--shadow-soft)] w-full"
              />
            </div>
          </div>
        </div>


        <div className="lg:col-span-7">
          <span className="kbd">Our Story</span>
          <h2 className="font-display text-4xl md:text-6xl mt-4">
            A decade of <em className="text-gradient-gold not-italic">folds, fire</em> and family recipes.
          </h2>
          <p className="mt-6 text-muted-foreground text-lg leading-relaxed">
            Mōmo House began as a six-seat kitchen in the hills — a single
            steamer, a sesame chutney passed down three generations, and a
            stubborn rule: <em>nothing leaves the kitchen unless it would be served at our own table.</em>
          </p>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            Today we serve twelve regional styles, but the rule hasn't moved an
            inch. Every wrapper is rolled in-house. Every filling is portioned
            by gram. Every plate is finished by a chef, not a microwave.
          </p>

          <dl className="mt-10 grid sm:grid-cols-3 gap-6">
            {[
              { k: "10+", v: "Years perfecting the fold" },
              { k: "100%", v: "Hand-folded, never frozen" },
              { k: "0", v: "Artificial preservatives" },
            ].map((s) => (
              <div key={s.v} className="rounded-2xl bg-card/60 ring-1 ring-border p-5">
                <dt className="font-[var(--font-num)] text-3xl text-primary">{s.k}</dt>
                <dd className="text-sm text-muted-foreground mt-1">{s.v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}

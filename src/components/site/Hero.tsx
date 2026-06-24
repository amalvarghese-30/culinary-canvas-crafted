import heroPic from "@/assets/hero-momos.jpg?w=600;1200;1800&format=avif;webp;jpg&as=picture";
import { ArrowRight, Flame, Star } from "lucide-react";
import { SteamParticles } from "./SteamParticles";
import { useMagnetic } from "@/hooks/use-magnetic";
import { Picture } from "./Picture";
import { useTranslation } from "react-i18next";


export function Hero() {
  const { t } = useTranslation();
  const magneticRef = useMagnetic<HTMLAnchorElement>(0.18);
  return (
    <section id="home" className="relative min-h-[100dvh] overflow-hidden pt-32 pb-20">

      {/* Backdrop image */}
      <div className="absolute inset-0 -z-10">
        <Picture
          source={heroPic}
          alt="Hand-folded momos with rising steam on a black slate plate"
          eager
          priority
          sizes="100vw"
          className="size-full object-cover object-center opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/85 via-background/55 to-background" />
        <div className="absolute inset-0 bg-grain opacity-60" />
      </div>

      <SteamParticles />



      <div className="container-luxe relative">
        <div className="grid lg:grid-cols-12 gap-12 items-end min-h-[78dvh]">
          <div className="lg:col-span-8">
            <div className="inline-flex items-center gap-2 rounded-full glass px-3 py-1.5 mb-8">
              <span className="kbd">{t("hero.badge")}</span>
              <span className="size-1.5 rounded-full bg-primary animate-pulse" />
            </div>

            <h1 className="font-display text-[clamp(3rem,8.5vw,6.5rem)] leading-[0.95] tracking-tight">
              {t("hero.title_1")}
              <br />
              {t("hero.title_2")}
              <br />
              <span className="text-gradient-gold italic">{t("hero.title_3")}</span>
            </h1>

            <p className="mt-8 max-w-xl text-lg text-muted-foreground leading-relaxed">
              {t("hero.subtitle")}
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-4">
              <a
                ref={magneticRef}
                href="#menu"
                className="group inline-flex items-center gap-2 rounded-2xl bg-primary px-7 py-4 text-sm font-semibold uppercase tracking-wider text-primary-foreground hover:bg-primary-glow transition-all shadow-[var(--shadow-luxe)] hover:-translate-y-0.5 will-change-transform"
              >
                {t("hero.order_now")}
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </a>

              <a
                href="#signature"
                className="inline-flex items-center gap-2 rounded-2xl px-7 py-4 text-sm font-semibold uppercase tracking-wider ring-1 ring-border glass hover:bg-white/10 transition-all"
              >
                {t("hero.explore_menu")}
              </a>
            </div>

            <dl className="mt-14 grid grid-cols-3 max-w-md gap-6">
              {[
                { k: "12+", v: "Momo Styles" },
                { k: "4.9", v: "Avg Rating" },
                { k: "50k", v: "Orders Served" },
              ].map((s) => (
                <div key={s.v}>
                  <dt className="font-[var(--font-num)] text-3xl md:text-4xl text-foreground">
                    {s.k}
                  </dt>
                  <dd className="kbd mt-1">{s.v}</dd>
                </div>
              ))}
            </dl>
          </div>

          <aside className="lg:col-span-4 flex lg:justify-end">
            <div className="glass rounded-3xl p-6 max-w-sm w-full animate-float-slow">
              <div className="flex items-center gap-2 text-primary">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="size-4 fill-primary" />
                ))}
                <span className="kbd">Today's Pick</span>
              </div>
              <h3 className="font-display text-2xl mt-4">Tandoori Chicken Momos</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Yogurt-marinated, charred in the clay oven, finished with smoked butter.
              </p>
              <div className="mt-5 flex items-center justify-between">
                <span className="font-[var(--font-num)] text-2xl">₹220</span>
                <span className="inline-flex items-center gap-1 text-xs text-primary">
                  <Flame className="size-3.5" /> <Flame className="size-3.5" />
                </span>
              </div>
            </div>
          </aside>
        </div>

        {/* Scroll indicator */}
        <div className="absolute left-1/2 -translate-x-1/2 bottom-6 flex flex-col items-center gap-2 text-muted-foreground">
          <span className="kbd">Scroll</span>
          <span className="block h-10 w-px bg-gradient-to-b from-primary to-transparent" />
        </div>
      </div>
    </section>
  );
}

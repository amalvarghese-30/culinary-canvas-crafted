import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Hero } from "@/components/site/Hero";
import { Marquee } from "@/components/site/Marquee";
import { About } from "@/components/site/About";
import { Signature } from "@/components/site/Signature";
import { WhyUs } from "@/components/site/WhyUs";
import { Reviews } from "@/components/site/Reviews";

export default function Home() {
  const { t } = useTranslation();
  return (
    <>
      <Hero />
      <Marquee />
      <About />
      <Signature />
      <WhyUs />
      <Reviews />
      <section className="py-24 border-t border-border/50">
        <div className="container-luxe text-center">
          <span className="kbd">{t("home.hungry")}</span>
          <h2 className="font-display text-4xl md:text-6xl mt-4 text-gradient-gold">
            {t("home.see_menu")}
          </h2>
          <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
            {t("home.menu_desc")}
          </p>
          <Link
            to="/menu"
            className="inline-flex mt-8 items-center gap-2 rounded-xl bg-primary px-7 py-4 text-base font-semibold text-primary-foreground hover:bg-primary-glow transition shadow-[var(--shadow-luxe)]"
          >
            {t("home.explore_menu_btn")}
          </Link>
        </div>
      </section>
    </>
  );
}

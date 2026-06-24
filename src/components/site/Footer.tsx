import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export function Footer() {
  const { t } = useTranslation();
  return (
    <footer className="border-t border-border bg-surface/40">
      <div className="container-luxe py-16">
        <div className="grid md:grid-cols-12 gap-10">
          <div className="md:col-span-5">
            <Link to="/" className="flex items-center gap-2">
              <span className="grid place-items-center size-10 rounded-xl bg-primary/15 ring-1 ring-primary/40">
                <span className="font-display text-primary text-xl leading-none">M</span>
              </span>
              <span className="font-display text-2xl">
                Mōmo<span className="text-primary">.</span>House
              </span>
            </Link>
            <p className="text-muted-foreground mt-5 max-w-sm leading-relaxed">
              {t("footer.tagline")}
            </p>
          </div>

          <div className="md:col-span-3">
            <span className="kbd">{t("footer.explore")}</span>
            <ul className="mt-5 space-y-2 text-muted-foreground">
              <li><Link to="/menu" className="hover:text-primary transition">{t("footer.full_menu")}</Link></li>
              <li><Link to="/gallery" className="hover:text-primary transition">{t("footer.gallery")}</Link></li>
              <li><Link to="/about" className="hover:text-primary transition">{t("footer.our_story")}</Link></li>
              <li><Link to="/faq" className="hover:text-primary transition">{t("footer.faq")}</Link></li>
            </ul>
          </div>
          <div className="md:col-span-4">
            <span className="kbd">{t("footer.visit")}</span>
            <ul className="mt-5 space-y-2 text-muted-foreground">
              <li>12 Lake Road, Khan Market, Delhi</li>
              <li>Daily · 11:00 AM – 11:30 PM</li>
              <li><a href="tel:+911234567890" className="hover:text-primary transition">+91 12345 67890</a></li>
              <li className="flex gap-4 pt-2">
                <a href="#" className="hover:text-primary transition">Instagram</a>
                <a href="#" className="hover:text-primary transition">WhatsApp</a>
                <a href="#" className="hover:text-primary transition">Zomato</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="hairline my-10" />
        <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-muted-foreground">
          <span>{t("footer.copyright", { year: new Date().getFullYear() })}</span>
          <span className="kbd">{t("footer.made_in")}</span>
        </div>
      </div>
    </footer>
  );
}

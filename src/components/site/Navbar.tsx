import { useEffect, useState } from "react";
import { Menu, X, Phone, ShoppingBag, User, MessageCircle } from "lucide-react";
import { Link, NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { useCart } from "@/lib/cart-store";
import { useAuth } from "@/hooks/use-auth";
import { useRoles } from "@/hooks/use-roles";
import { NotificationBell } from "./NotificationBell";
import { LanguageSwitcher } from "./LanguageSwitcher";

export function Navbar() {
  const { t } = useTranslation();

  const links = [
    { to: "/", label: t("nav.home") },
    { to: "/menu", label: t("nav.menu") },
    { to: "/gallery", label: t("nav.gallery") },
    { to: "/about", label: t("nav.story") },
    { to: "/reservation", label: t("nav.book") },
    { to: "/contact", label: t("nav.contact") },
  ];
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const cartCount = useCart((s) => s.count());
  const openCart = useCart((s) => s.setOpen);
  const { user } = useAuth();
  const { isStaff } = useRoles();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        scrolled ? "py-3" : "py-6"
      }`}
    >
      <div className="container-luxe">
        <nav
          className={`flex items-center justify-between rounded-2xl px-4 md:px-6 py-3 transition-all duration-500 ${
            scrolled ? "glass shadow-[var(--shadow-soft)]" : "bg-transparent"
          }`}
          aria-label="Primary"
        >
          <Link to="/" className="flex items-center gap-2 group">
            <span className="grid place-items-center size-9 rounded-xl bg-primary/15 ring-1 ring-primary/40">
              <span className="font-display text-primary text-lg leading-none">M</span>
            </span>
            <span className="font-display text-xl tracking-tight">
              Mōmo<span className="text-primary">.</span>House
            </span>
          </Link>

          <ul className="hidden lg:flex items-center gap-1 font-[var(--font-ui)] text-sm">
            {links.map((l) => (
              <li key={l.to}>
                <NavLink
                  to={l.to}
                  end={l.to === "/"}
                  className={({ isActive }) =>
                    `px-4 py-2 rounded-lg transition-colors ${
                      isActive
                        ? "text-primary bg-white/5"
                        : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                    }`
                  }
                >
                  {l.label}
                </NavLink>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-2">
            <a
              href="tel:+911234567890"
              aria-label="Call +91 12345 67890"
              className="hidden sm:inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-foreground/90 ring-1 ring-border hover:bg-white/5 transition"
            >
              <Phone className="size-4" /> Call
            </a>
            <button
              onClick={() => openCart(true)}
              aria-label={`Open cart, ${cartCount} items`}
              className="relative grid place-items-center size-10 rounded-xl ring-1 ring-border hover:bg-white/5 transition"
            >
              <ShoppingBag className="size-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 grid place-items-center min-w-5 h-5 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-[var(--font-num)]">
                  {cartCount}
                </span>
              )}
            </button>
            <NotificationBell />
            <Link
              to={user ? "/account" : "/auth"}
              aria-label={user ? "Account" : "Sign in"}
              className="hidden sm:grid place-items-center size-10 rounded-xl ring-1 ring-border hover:bg-white/5 transition"
            >
              <User className="size-5" />
            </Link>
            {isStaff && (
              <Link
                to="/admin"
                className="hidden md:inline-flex items-center text-xs font-semibold uppercase tracking-wider text-primary hover:underline"
              >
                Admin
              </Link>
            )}
            <LanguageSwitcher />
            <Link
              to="/menu"
              className="hidden sm:inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary-glow transition shadow-[var(--shadow-luxe)]"
            >
              Order Now
            </Link>
            <button
              aria-label={open ? "Close menu" : "Open menu"}
              onClick={() => setOpen(!open)}
              className="lg:hidden grid place-items-center size-10 rounded-xl ring-1 ring-border hover:bg-white/5 transition"
            >
              {open ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </nav>

        {open && (
          <div className="lg:hidden mt-3 glass rounded-2xl p-3 animate-in fade-in slide-in-from-top-2">
            <ul className="flex flex-col">
              {links.map((l) => (
                <li key={l.to}>
                  <Link
                    to={l.to}
                    onClick={() => setOpen(false)}
                    className="block px-4 py-3 rounded-lg text-foreground/90 hover:bg-white/5"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
              <li className="pt-2 grid grid-cols-3 gap-2">
                <a
                  href="tel:+911234567890"
                  onClick={() => setOpen(false)}
                  className="inline-flex flex-col items-center justify-center gap-1 rounded-xl ring-1 ring-border bg-white/5 py-3 text-xs font-[var(--font-ui)]"
                  aria-label="Call Mōmo House"
                >
                  <Phone className="size-4 text-primary" /> Call
                </a>
                <a
                  href="https://wa.me/911234567890"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setOpen(false)}
                  className="inline-flex flex-col items-center justify-center gap-1 rounded-xl ring-1 ring-border bg-white/5 py-3 text-xs font-[var(--font-ui)]"
                  aria-label="Chat on WhatsApp"
                >
                  <MessageCircle className="size-4 text-primary" /> WhatsApp
                </a>
                <Link
                  to="/menu"
                  onClick={() => setOpen(false)}
                  className="inline-flex flex-col items-center justify-center gap-1 rounded-xl bg-primary text-primary-foreground py-3 text-xs font-semibold"
                >
                  <ShoppingBag className="size-4" /> Order
                </Link>
              </li>

              <li className="pt-3 border-t border-border">
                <Link
                  to={user ? "/account" : "/auth"}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-foreground/90 hover:bg-white/5"
                >
                  <User className="size-5 text-muted-foreground" />
                  <span>{user ? "My Account" : "Sign In / Sign Up"}</span>
                </Link>
                {isStaff && (
                  <Link
                    to="/admin"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-primary hover:bg-white/5 font-semibold"
                  >
                    <span className="grid place-items-center size-5 rounded bg-primary/15 text-primary text-[10px] font-bold">A</span>
                    <span>Admin Dashboard</span>
                  </Link>
                )}
                <Link
                  to="/notifications"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-foreground/90 hover:bg-white/5"
                >
                  <NotificationBell />
                  <span>Notifications</span>
                </Link>
              </li>

            </ul>
          </div>
        )}
      </div>
    </header>
  );
}

import { useTranslation } from "react-i18next";
import { Globe } from "lucide-react";

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const toggle = () => {
    const next = i18n.language === "en" ? "hi" : "en";
    i18n.changeLanguage(next);
  };
  return (
    <button
      onClick={toggle}
      className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs ring-1 ring-border hover:bg-white/5 transition"
      aria-label={i18n.language === "en" ? "Switch to Hindi — हिन्दी" : "Switch to English"}
    >
      <Globe className="size-3.5" />
      {i18n.language === "en" ? "हि" : "EN"}
    </button>
  );
}

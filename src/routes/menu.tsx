import { PageHeader } from "@/components/site/PageHeader";
import { MenuSection } from "@/components/site/MenuSection";
import { useTranslation } from "react-i18next";

export default function MenuPage() {
  const { t } = useTranslation();
  return (
    <>
      <PageHeader
        eyebrow={t("menu.eyebrow")}
        title={t("menu.title")}
        subtitle={t("menu.subtitle")}
      />
      <MenuSection />
    </>
  );
}

import { PageHeader } from "@/components/site/PageHeader";
import { FAQ } from "@/components/site/FAQ";

export default function FAQPage() {
  return (
    <>
      <PageHeader
        eyebrow="FAQ"
        title="Good Questions, Honest Answers."
      />
      <FAQ />
    </>
  );
}

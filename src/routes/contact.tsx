import { PageHeader } from "@/components/site/PageHeader";
import { Contact } from "@/components/site/Contact";

export default function ContactPage() {
  return (
    <>
      <PageHeader
        eyebrow="Visit · Call · Message"
        title="Come Say Hello."
        subtitle="Walk in, ring us, or message on WhatsApp — we'll save you a table."
      />
      <Contact />
    </>
  );
}

import { PageHeader } from "@/components/site/PageHeader";
import { About } from "@/components/site/About";
import { WhyUs } from "@/components/site/WhyUs";

export default function AboutPage() {
  return (
    <>
      <PageHeader
        eyebrow="Our Story"
        title="Recipes from a Hill, Folded in the City."
        subtitle="A short walk through where we came from, who we cook for, and what we refuse to compromise on."
      />
      <About />
      <WhyUs />
    </>
  );
}

import { PageHeader } from "@/components/site/PageHeader";
import { Gallery } from "@/components/site/Gallery";

export default function GalleryPage() {
  return (
    <>
      <PageHeader
        eyebrow="Gallery"
        title="Folded, Steamed, Served."
        subtitle="The kitchen, the craft, the room — captured in a few honest frames."
      />
      <Gallery />
    </>
  );
}

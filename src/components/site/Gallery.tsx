import steam from "@/assets/steam-momos.jpg?w=400;700;1000&format=avif;webp;jpg&as=picture";
import fried from "@/assets/fried-momos.jpg?w=400;700;1000&format=avif;webp;jpg&as=picture";
import tandoori from "@/assets/tandoori-momos.jpg?w=400;700;1000&format=avif;webp;jpg&as=picture";
import jhol from "@/assets/jhol-momos.jpg?w=400;700;1000&format=avif;webp;jpg&as=picture";
import schezwan from "@/assets/schezwan-momos.jpg?w=400;700;1000&format=avif;webp;jpg&as=picture";
import cheese from "@/assets/cheese-momos.jpg?w=400;700;1000&format=avif;webp;jpg&as=picture";
import peri from "@/assets/peri-momos.jpg?w=400;700;1000&format=avif;webp;jpg&as=picture";
import chef from "@/assets/chef.jpg?w=300;500;800&format=avif;webp;jpg&as=picture";
import interior from "@/assets/interior.jpg?w=500;900;1400&format=avif;webp;jpg&as=picture";
import { Picture } from "./Picture";

const tiles = [
  { src: steam, span: "row-span-2", alt: "Steam momos with chilli sauce" },
  { src: tandoori, span: "", alt: "Tandoori momos" },
  { src: cheese, span: "", alt: "Cheese momos" },
  { src: jhol, span: "row-span-2", alt: "Jhol momos in broth" },
  { src: fried, span: "", alt: "Fried momos" },
  { src: schezwan, span: "", alt: "Schezwan momos" },
  { src: peri, span: "", alt: "Peri peri momos" },
  { src: chef, span: "row-span-2", alt: "Chef folding momos" },
  { src: interior, span: "col-span-2", alt: "Restaurant interior" },
];

export function Gallery() {
  return (
    <section id="gallery" className="py-28 md:py-36">
      <div className="container-luxe">
        <div className="flex items-end justify-between gap-8 mb-14">
          <div>
            <span className="kbd">The Gallery</span>
            <h2 className="font-display text-4xl md:text-6xl mt-4 max-w-2xl">
              Moments from the <em className="text-gradient-gold not-italic">kitchen</em>.
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 auto-rows-[180px] md:auto-rows-[220px] gap-3">
          {tiles.map((t, i) => (
            <figure
              key={i}
              className={`group relative overflow-hidden rounded-2xl ring-1 ring-border ${t.span}`}
            >
              <Picture
                source={t.src}
                alt={t.alt}
                sizes="(min-width: 768px) 25vw, 50vw"
                className="size-full object-cover transition-transform duration-700 group-hover:scale-110"
                decoding="async"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition" />
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

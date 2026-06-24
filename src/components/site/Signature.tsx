import { ArrowUpRight, Flame } from "lucide-react";
import tandoori from "@/assets/tandoori-momos.jpg?w=400;600;900&format=avif;webp;jpg&as=picture";
import jhol from "@/assets/jhol-momos.jpg?w=400;600;900&format=avif;webp;jpg&as=picture";
import cheese from "@/assets/cheese-momos.jpg?w=400;600;900&format=avif;webp;jpg&as=picture";
import schezwan from "@/assets/schezwan-momos.jpg?w=400;600;900&format=avif;webp;jpg&as=picture";
import { Picture } from "./Picture";


const dishes = [
  {
    name: "Tandoori Momos",
    desc: "Charred in the clay oven, finished with smoked butter and chaat masala.",
    price: 220,
    img: tandoori,
    tag: "Chef Special",
    spice: 2,
  },
  {
    name: "Jhol Momos",
    desc: "Bathed in spiced Himalayan tomato-sesame broth. Soulful, slow, warming.",
    price: 200,
    img: jhol,
    tag: "House Classic",
    spice: 2,
  },
  {
    name: "Melted Cheese Momos",
    desc: "Golden crust, molten mozzarella core. The viral one — for good reason.",
    price: 240,
    img: cheese,
    tag: "Best Seller",
    spice: 1,
  },
  {
    name: "Schezwan Momos",
    desc: "Wok-tossed in our house-made Schezwan chutney, layered with garlic oil.",
    price: 210,
    img: schezwan,
    tag: "Spice Lover",
    spice: 3,
  },
];

export function Signature() {
  return (
    <section id="signature" className="py-28 md:py-36">
      <div className="container-luxe">
        <div className="flex items-end justify-between gap-8 mb-14">
          <div>
            <span className="kbd">Signature Plates</span>
            <h2 className="font-display text-4xl md:text-6xl mt-4 max-w-2xl">
              The four that built the <em className="text-gradient-gold not-italic">house</em>.
            </h2>
          </div>
          <a
            href="#menu"
            className="hidden md:inline-flex items-center gap-2 text-sm kbd hover:text-primary transition"
          >
            See Full Menu <ArrowUpRight className="size-4" />
          </a>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {dishes.map((d) => (
            <article
              key={d.name}
              className="group rounded-3xl bg-card ring-1 ring-border overflow-hidden hover:-translate-y-1 hover:ring-primary/40 transition-all duration-500"
            >
              <div className="relative aspect-[4/5] overflow-hidden">
                <Picture
                  source={d.img}
                  alt={d.name}
                  sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                  className="size-full object-cover transition-transform duration-700 group-hover:scale-110"
                  decoding="async"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-card via-card/20 to-transparent" />
                <span className="absolute top-4 left-4 kbd bg-background/60 backdrop-blur px-3 py-1 rounded-full">
                  {d.tag}
                </span>
                <span className="absolute top-4 right-4 inline-flex items-center gap-0.5 bg-background/60 backdrop-blur px-2.5 py-1 rounded-full">
                  {Array.from({ length: d.spice }).map((_, i) => (
                    <Flame key={i} className="size-3 text-primary" />
                  ))}
                </span>
              </div>
              <div className="p-6">
                <h3 className="font-display text-2xl">{d.name}</h3>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed line-clamp-2">
                  {d.desc}
                </p>
                <div className="mt-5 flex items-center justify-between">
                  <span className="font-[var(--font-num)] text-xl">₹{d.price}</span>
                  <button className="inline-flex items-center gap-1.5 text-xs kbd text-primary hover:text-primary-glow transition">
                    Order <ArrowUpRight className="size-3.5" />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

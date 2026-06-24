import { Clock, MapPin, Phone, Instagram, MessageCircle } from "lucide-react";
import { RESTAURANT, waLink } from "@/lib/restaurant";

export function Contact() {
  return (
    <section id="contact" className="py-28 md:py-36">
      <div className="container-luxe">
        <div className="rounded-3xl ring-1 ring-border bg-card overflow-hidden grid lg:grid-cols-2">
          <div className="p-10 md:p-14">
            <span className="kbd">Visit Us</span>
            <h2 className="font-display text-4xl md:text-5xl mt-4">
              Come for one. <em className="text-gradient-gold not-italic">Stay for twelve.</em>
            </h2>
            <p className="text-muted-foreground mt-4 max-w-md">
              Walk-ins welcome. Reservations recommended on weekends.
            </p>

            <ul className="mt-10 space-y-5">
              <li className="flex items-start gap-4">
                <span className="grid place-items-center size-10 rounded-xl bg-primary/10 ring-1 ring-primary/30 text-primary shrink-0">
                  <MapPin className="size-4" />
                </span>
                <span className="text-foreground/90 leading-relaxed">{RESTAURANT.address}</span>
              </li>
              <li className="flex items-start gap-4">
                <span className="grid place-items-center size-10 rounded-xl bg-primary/10 ring-1 ring-primary/30 text-primary shrink-0">
                  <Clock className="size-4" />
                </span>
                <span className="text-foreground/90 leading-relaxed">{RESTAURANT.hours}</span>
              </li>
              <li className="flex items-start gap-4">
                <span className="grid place-items-center size-10 rounded-xl bg-primary/10 ring-1 ring-primary/30 text-primary shrink-0">
                  <Phone className="size-4" />
                </span>
                <span className="text-foreground/90 leading-relaxed">{RESTAURANT.phoneDisplay}</span>
              </li>
            </ul>

            <div className="mt-10 flex flex-wrap gap-3">
              <a
                href={waLink("Hi! I'd like to know more about Momo House.")}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary-glow transition"
              >
                <MessageCircle className="size-4" /> WhatsApp
              </a>
              <a
                href={RESTAURANT.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl ring-1 ring-border px-5 py-3 text-sm font-semibold hover:bg-white/5 transition"
              >
                <Instagram className="size-4" /> Instagram
              </a>
              <a
                href={RESTAURANT.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl ring-1 ring-border px-5 py-3 text-sm font-semibold hover:bg-white/5 transition"
              >
                <MapPin className="size-4" /> Get Directions
              </a>
            </div>
          </div>

          <div className="relative min-h-[420px] bg-surface">
            <iframe
              title={`${RESTAURANT.name} location`}
              src={`https://www.google.com/maps?q=${encodeURIComponent(RESTAURANT.address)}&output=embed`}
              className="absolute inset-0 size-full grayscale-[20%] opacity-95"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
            <div className="absolute inset-0 bg-gradient-to-r from-card/70 via-transparent to-transparent pointer-events-none" />
          </div>
        </div>
      </div>
    </section>
  );
}

import { MessageCircle } from "lucide-react";
import { waLink } from "@/lib/restaurant";

export function FloatingWhatsApp() {
  return (
    <a
      href={waLink("Hi Mōmo House! I'd like to know more.")}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      className="fixed bottom-6 right-6 z-40 grid place-items-center size-14 rounded-full bg-primary text-primary-foreground shadow-[var(--shadow-luxe)] hover:bg-primary-glow hover:scale-105 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      <span className="absolute inset-0 rounded-full bg-primary animate-ping opacity-25" />
      <MessageCircle className="size-6 relative" />
    </a>
  );
}

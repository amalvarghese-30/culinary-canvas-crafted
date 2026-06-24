import { Outlet } from "react-router-dom";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { FloatingWhatsApp } from "./FloatingWhatsApp";
import { CartDrawer } from "./CartDrawer";
import { ScrollProgress } from "./ScrollProgress";
import { AiChat } from "./AiChat";

export function SiteLayout() {
  return (
    <main className="bg-background text-foreground min-h-screen overflow-x-hidden">
      <ScrollProgress />
      <Navbar />
      <Outlet />
      <Footer />
      <FloatingWhatsApp />
      <AiChat />
      <CartDrawer />
    </main>
  );
}


import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { X, Minus, Plus, ShoppingBag } from "lucide-react";
import { useCart } from "@/lib/cart-store";

export function CartDrawer() {
  const { items, isOpen, setOpen, setQty, remove, subtotal, count } = useCart();
  const sub = subtotal();
  const location = useLocation();

  // Close cart on route change
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  const itemCount = count();

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/60 z-[60] transition-opacity duration-500 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setOpen(false)}
        aria-hidden={!isOpen}
      />

      {/* Drawer — bottom sheet on mobile, side panel on desktop */}
      <aside
        className={`fixed z-[70] flex flex-col bg-card ring-1 ring-border transition-all duration-500
          bottom-0 left-0 right-0 max-h-[85vh] rounded-t-2xl
          sm:top-0 sm:left-auto sm:h-full sm:w-[420px] sm:max-h-none sm:rounded-none
          sm:right-0
          ${isOpen
            ? "translate-y-0 sm:translate-x-0 opacity-100"
            : "translate-y-full sm:translate-x-full opacity-0 pointer-events-none"
          }
        `}
        aria-label="Your cart"
        aria-hidden={!isOpen}
      >
        {/* Drag handle — mobile only */}
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>

        <header className="flex items-center justify-between p-5 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <ShoppingBag className="size-5 text-primary" />
            <h2 className="font-display text-xl">Your Order</h2>
            {itemCount > 0 && (
              <span className="text-xs rounded-full bg-primary/15 text-primary px-2 py-0.5 font-[var(--font-num)]">
                {itemCount}
              </span>
            )}
          </div>
          <button
            onClick={() => setOpen(false)}
            aria-label="Close cart"
            className="grid place-items-center size-9 rounded-lg hover:bg-white/5"
          >
            <X className="size-5" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {items.length === 0 && (
            <div className="text-center py-20">
              <ShoppingBag className="size-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-muted-foreground">Your cart is empty.</p>
              <Link
                to="/menu"
                onClick={() => setOpen(false)}
                className="inline-block mt-4 rounded-xl bg-primary text-primary-foreground px-5 py-2.5 text-sm font-semibold"
              >
                Browse menu
              </Link>
            </div>
          )}
          {items.map((i) => {
            const addonsTotal = (i.addons ?? []).reduce((s, a) => s + a.price, 0);
            const linePrice = (i.price + addonsTotal) * i.quantity;
            return (
              <div key={i.id} className="flex gap-3 rounded-xl ring-1 ring-border bg-background/40 p-3">
                {i.image && (
                  <img src={i.image} alt={i.name} className="size-16 rounded-lg object-cover shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between gap-2">
                    <h3 className="font-medium text-sm truncate">{i.name}</h3>
                    <span className="font-[var(--font-num)] text-sm shrink-0">
                      ₹{linePrice.toFixed(0)}
                    </span>
                  </div>
                  {i.addons && i.addons.length > 0 && (
                    <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                      + {i.addons.map((a) => a.name).join(", ")}
                    </p>
                  )}
                  <div className="flex items-center justify-between mt-2">
                    <div className="inline-flex items-center rounded-lg ring-1 ring-border">
                      <button
                        onClick={() => setQty(i.id, i.quantity - 1)}
                        aria-label="Decrease quantity"
                        className="grid place-items-center size-8 hover:bg-white/5"
                      >
                        <Minus className="size-3.5" />
                      </button>
                      <span className="w-8 text-center text-sm font-[var(--font-num)]">{i.quantity}</span>
                      <button
                        onClick={() => setQty(i.id, i.quantity + 1)}
                        aria-label="Increase quantity"
                        className="grid place-items-center size-8 hover:bg-white/5"
                      >
                        <Plus className="size-3.5" />
                      </button>
                    </div>
                    <button
                      onClick={() => remove(i.id)}
                      className="text-xs text-muted-foreground hover:text-destructive"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {items.length > 0 && (
          <footer className="border-t border-border p-5 space-y-3 shrink-0">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-[var(--font-num)]">₹{sub.toFixed(0)}</span>
            </div>
            <Link
              to="/checkout"
              onClick={() => setOpen(false)}
              className="block text-center rounded-xl bg-primary text-primary-foreground py-3 font-semibold hover:bg-primary-glow transition shadow-[var(--shadow-luxe)]"
            >
              Checkout
            </Link>
          </footer>
        )}
      </aside>
    </>
  );
}

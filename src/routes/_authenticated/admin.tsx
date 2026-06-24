import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useRoles } from "@/hooks/use-roles";
import { useAuth } from "@/hooks/use-auth";
import { apiFetch, clearTokens } from "@/api/client";
import {
  LayoutDashboard,
  ShoppingBag,
  CalendarDays,
  Star,
  Loader2,
  ShieldCheck,
  UtensilsCrossed,
  ChefHat,
  BarChart3,
  Users,
  Armchair,
  Package,
  Tag,
  Receipt,
  History,
  Truck,
  Sparkles,
  Clock,
  Building2,
  Megaphone,
  TrendingUp,
  Settings,
  Award,
  LogOut,
} from "lucide-react";
import { toast } from "sonner";

type NavItem = { to: string; label: string; icon: typeof LayoutDashboard; exact?: boolean };
const NAV: NavItem[] = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/kds", label: "KDS", icon: ChefHat },
  { to: "/admin/pos", label: "POS", icon: Receipt },
  { to: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { to: "/admin/reservations", label: "Reservations", icon: CalendarDays },
  { to: "/admin/tables", label: "Tables", icon: Armchair },
  { to: "/admin/menu", label: "Menu", icon: UtensilsCrossed },
  { to: "/admin/recipes", label: "Recipes", icon: Sparkles },
  { to: "/admin/inventory", label: "Inventory", icon: Package },
  { to: "/admin/suppliers", label: "Suppliers", icon: Truck },
  { to: "/admin/promotions", label: "Promotions", icon: Tag },
  { to: "/admin/campaigns", label: "Campaigns", icon: Megaphone },
  { to: "/admin/customers", label: "Customers", icon: Users },
  { to: "/admin/branches", label: "Branches", icon: Building2 },
  { to: "/admin/shifts", label: "Shifts", icon: Clock },
  { to: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/admin/forecast", label: "Forecast", icon: TrendingUp },
  { to: "/admin/reviews", label: "Reviews", icon: Star },
  { to: "/admin/loyalty", label: "Loyalty Tiers", icon: Award },
  { to: "/admin/audit", label: "Audit", icon: History },
  { to: "/admin/settings", label: "Settings", icon: Settings },
];

export default function AdminLayout() {
  const { user, signOut } = useAuth();
  const { isStaff, isAdmin, loading } = useRoles();
  const location = useLocation();
  const navigate = useNavigate();

  async function handleSignOut() {
    await signOut();
    toast.success("Signed out");
    navigate("/");
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] grid place-items-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isStaff) {
    return (
      <div className="container-luxe py-20 max-w-xl text-center">
        <div className="grid place-items-center size-16 rounded-full bg-primary/15 ring-1 ring-primary/30 mx-auto">
          <ShieldCheck className="size-8 text-primary" />
        </div>
        <h1 className="font-display text-4xl mt-6">Staff area</h1>
        <p className="text-muted-foreground mt-3">
          Signed in as <span className="text-foreground">{user?.email}</span>. This account doesn't
          have staff access.
        </p>
        <div className="mt-8 space-y-3">
          <button
            onClick={async () => {
              try {
                await apiFetch("/api/admin/claim", { method: "POST" });
                toast.success("You're the admin now — reloading…");
                setTimeout(() => {
                  window.location.href = "/admin";
                }, 600);
              } catch (e) {
                toast.error(e instanceof Error ? e.message : "Could not claim admin");
              }
            }}
            className="rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground hover:bg-primary-glow transition"
          >
            Claim first admin
          </button>
          <p className="text-xs text-muted-foreground">
            Only works once — for the very first admin in the system.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-luxe pt-28 pb-10">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-primary">
            {isAdmin ? "Admin Portal" : "Staff Portal"}
          </p>
          <h1 className="font-display text-3xl md:text-4xl mt-1">Operations</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">{user?.email}</span>
          <button
            onClick={handleSignOut}
            className="inline-flex items-center gap-2 rounded-xl ring-1 ring-border px-4 py-2 text-sm hover:bg-white/5 transition"
          >
            <LogOut className="size-4" /> Sign out
          </button>
        </div>
      </div>

      <nav className="flex gap-2 overflow-x-auto pb-3 mb-6 border-b border-border/40">
        {NAV.map((n) => {
          const active = n.exact ? location.pathname === n.to : location.pathname.startsWith(n.to);
          const Icon = n.icon;
          return (
            <Link
              key={n.to}
              to={n.to}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-card"
              }`}
            >
              <Icon className="size-4" />
              {n.label}
            </Link>
          );
        })}
      </nav>

      <Outlet />
    </div>
  );
}

import { Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { useRoles } from "@/hooks/use-roles";
import { apiFetch } from "@/api/client";
import { Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export function StaffGuard() {
  const { user } = useAuth();
  const { isStaff, loading } = useRoles();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isStaff) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="max-w-md text-center bg-card border border-border rounded-2xl p-8">
          <ShieldCheck className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h1 className="text-xl font-semibold text-foreground">Staff Area</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            You need staff or admin access to view this area. If you are the first person setting up the restaurant, claim the admin role below.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{user?.email}</p>
          <button
            onClick={async () => {
              try {
                await apiFetch("/api/admin/claim", { method: "POST" });
                toast.success("Admin access granted. Refreshing...");
                window.location.reload();
              } catch (err: any) {
                toast.error(err.message || "Failed to claim admin");
              }
            }}
            className="mt-6 inline-flex items-center justify-center rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary-glow transition"
          >
            <ShieldCheck className="mr-2 h-4 w-4" /> Claim Admin
          </button>
        </div>
      </div>
    );
  }

  return <Outlet />;
}

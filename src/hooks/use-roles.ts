import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { apiFetch } from "@/api/client";

export function useRoles() {
  const { user, loading: authLoading } = useAuth();
  const [roles, setRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setRoles([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    apiFetch<string[]>("/api/admin/roles")
      .then((r) => { if (!cancelled) setRoles(r); })
      .catch(() => { if (!cancelled) setRoles([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [user?._id, authLoading]);

  return {
    roles,
    loading,
    isStaff: roles.includes("staff") || roles.includes("admin"),
    isAdmin: roles.includes("admin"),
    isKitchen: roles.includes("kitchen"),
  };
}

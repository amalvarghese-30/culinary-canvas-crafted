import { useApiQuery, useApiMutation } from "@/api/hooks";
import { apiFetch } from "@/api/client";
import { Loader2, Star, Check, X } from "lucide-react";
import { toast } from "sonner";

export default function AdminReviewsPage() {
  const { data, loading: isLoading, refetch } = useApiQuery("admin-reviews", () =>
    apiFetch("/api/admin/reviews")
  );

  const { mutate: doApprove, loading: isMutating } = useApiMutation(
    (vars: { id: string; approved: boolean }) =>
      apiFetch(`/api/admin/reviews/${vars.id}/approval`, {
        method: "PUT",
        body: JSON.stringify({ approved: vars.approved }),
      }),
    {
      onSuccess: () => refetch(),
      onError: (e) => toast.error(e.message || "Update failed"),
    }
  );

  if (isLoading) {
    return (
      <div className="grid place-items-center py-20">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const reviews = (data ?? []) as any[];

  return (
    <div className="grid sm:grid-cols-2 gap-4">
      {reviews.map((r) => (
        <div key={r.id} className="glass rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{r.author_name}</p>
              <div className="flex items-center gap-0.5 mt-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`size-3.5 ${
                      i < r.rating ? "fill-primary text-primary" : "text-muted-foreground/30"
                    }`}
                  />
                ))}
              </div>
            </div>
            <span
              className={`text-xs px-2 py-1 rounded-md ring-1 ${
                r.approved
                  ? "bg-emerald-500/15 text-emerald-400 ring-emerald-500/30"
                  : "bg-amber-500/15 text-amber-400 ring-amber-500/30"
              }`}
            >
              {r.approved ? "Approved" : "Pending"}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-3">{r.comment}</p>
          <p className="text-xs text-muted-foreground/70 mt-2">
            {new Date(r.created_at).toLocaleDateString()}
          </p>
          <div className="flex gap-2 mt-4">
            {!r.approved ? (
              <button
                onClick={() => doApprove({ id: r.id, approved: true })}
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary-glow transition"
              >
                <Check className="size-3.5" /> Approve
              </button>
            ) : (
              <button
                onClick={() => doApprove({ id: r.id, approved: false })}
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-md ring-1 ring-border/60 px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground transition"
              >
                <X className="size-3.5" /> Hide
              </button>
            )}
          </div>
        </div>
      ))}
      {reviews.length === 0 && (
        <p className="text-muted-foreground italic col-span-full text-center py-10">
          No reviews yet.
        </p>
      )}
    </div>
  );
}

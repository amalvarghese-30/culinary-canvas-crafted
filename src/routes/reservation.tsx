import { useState } from "react";
import { PageHeader } from "@/components/site/PageHeader";
import { Calendar, Clock, Users, Check, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { apiFetch } from "@/api/client";
import { toast } from "sonner";

const TIMES = ["12:00", "13:00", "14:00", "19:00", "19:30", "20:00", "20:30", "21:00", "21:30"];

type Confirmation = {
  id: string;
  full_name: string;
  party_size: number;
  reservation_date: string;
  reservation_time: string;
};

export default function ReservationPage() {
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setSubmitting(true);
    try {
      const res = await apiFetch<Confirmation>("/api/reservations", {
        method: "POST",
        body: JSON.stringify({
          full_name: String(fd.get("full_name") ?? ""),
          phone: String(fd.get("phone") ?? ""),
          email: (fd.get("email") as string) || null,
          party_size: Number(fd.get("party_size") ?? 2),
          reservation_date: String(fd.get("reservation_date") ?? ""),
          reservation_time: String(fd.get("reservation_time") ?? ""),
          special_requests: (fd.get("special_requests") as string) || null,
          website: (fd.get("website") as string) || null,
          user_id: user?._id ?? null,
        }),
      });
      setConfirmation(res);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not book the table.";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Reservations"
        title="Save Your Table."
        subtitle="Weekend evenings fill up. Book ahead so we can fold a fresh batch just for you."
      />
      <section className="py-16">
        <div className="container-luxe max-w-2xl">
          {confirmation ? (
            <div className="glass rounded-3xl p-10 text-center">
              <div className="grid place-items-center size-16 rounded-full bg-primary/20 ring-1 ring-primary/40 mx-auto">
                <Check className="size-8 text-primary" />
              </div>
              <h2 className="font-display text-3xl mt-6">Request received</h2>
              <p className="text-muted-foreground mt-3">
                Thanks {confirmation.full_name.split(" ")[0]} — we have your table for{" "}
                <strong className="text-foreground">{confirmation.party_size}</strong> on{" "}
                <strong className="text-foreground">
                  {new Date(confirmation.reservation_date).toLocaleDateString(undefined, {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                  })}
                </strong>{" "}
                at <strong className="text-foreground">{confirmation.reservation_time}</strong>.
                We'll confirm via WhatsApp shortly.
              </p>
              <button
                onClick={() => setConfirmation(null)}
                className="mt-6 text-sm text-primary hover:underline"
              >
                Make another booking
              </button>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="glass rounded-3xl p-8 md:p-10 space-y-6">
              {/* honeypot */}
              <input
                type="text"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                className="hidden"
                aria-hidden="true"
              />

              <div className="grid md:grid-cols-2 gap-5">
                <Field label="Full name" required>
                  <input required name="full_name" type="text" className="input-luxe" placeholder="Your name" />
                </Field>
                <Field label="Phone" required>
                  <input required name="phone" type="tel" className="input-luxe" placeholder="+91 …" />
                </Field>
              </div>

              <Field label="Email (optional)">
                <input name="email" type="email" className="input-luxe" placeholder="you@example.com" />
              </Field>

              <div className="grid md:grid-cols-3 gap-5">
                <Field label="Date" icon={<Calendar className="size-4" />} required>
                  <input
                    required
                    name="reservation_date"
                    type="date"
                    className="input-luxe"
                    min={new Date().toISOString().slice(0, 10)}
                  />
                </Field>
                <Field label="Party size" icon={<Users className="size-4" />} required>
                  <select required name="party_size" defaultValue={2} className="input-luxe">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 10, 12].map((n) => (
                      <option key={n} value={n}>{n} guests</option>
                    ))}
                  </select>
                </Field>
                <Field label="Time" icon={<Clock className="size-4" />} required>
                  <select required name="reservation_time" defaultValue="19:30" className="input-luxe">
                    {TIMES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </Field>
              </div>

              <Field label="Special requests">
                <textarea
                  name="special_requests"
                  rows={3}
                  className="input-luxe"
                  placeholder="Allergies, occasion, seating preference…"
                />
              </Field>

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl bg-primary px-6 py-4 text-base font-semibold text-primary-foreground hover:bg-primary-glow transition shadow-[var(--shadow-luxe)] disabled:opacity-60 inline-flex items-center justify-center gap-2"
              >
                {submitting && <Loader2 className="size-4 animate-spin" />}
                {submitting ? "Sending…" : "Request Booking"}
              </button>
              <p className="text-xs text-muted-foreground text-center">
                You'll receive a WhatsApp confirmation. No payment required.
              </p>
            </form>
          )}
        </div>
      </section>
    </>
  );
}

function Field({
  label,
  icon,
  required,
  children,
}: {
  label: string;
  icon?: React.ReactNode;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="flex items-center gap-2 text-sm font-medium text-foreground/90 mb-2">
        {icon}
        {label}
        {required && <span className="text-primary">*</span>}
      </span>
      {children}
    </label>
  );
}

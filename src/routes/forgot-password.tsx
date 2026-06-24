import { useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "@/api/client";
import { toast } from "sonner";
import { ArrowLeft, Mail, CheckCircle } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await apiFetch("/api/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      setSent(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <main className="min-h-screen pt-32 pb-20">
        <div className="container-luxe max-w-md text-center">
          <div className="mx-auto grid place-items-center size-16 rounded-2xl bg-success/15 ring-1 ring-success/30 mb-6">
            <CheckCircle className="size-7 text-success" />
          </div>
          <h1 className="font-display text-3xl md:text-4xl">Check your email</h1>
          <p className="text-muted-foreground mt-3">
            If an account exists for <strong>{email}</strong>, we've sent a reset link.
          </p>
          <Link
            to="/auth"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary-glow transition"
          >
            <ArrowLeft className="size-4" /> Back to sign in
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen pt-32 pb-20">
      <div className="container-luxe max-w-md">
        <Link to="/auth" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
          <ArrowLeft className="size-3" /> Back to sign in
        </Link>
        <h1 className="font-display text-4xl md:text-5xl mt-6">Forgot password</h1>
        <p className="text-muted-foreground mt-3">
          Enter your email and we'll send you a link to reset your password.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              required
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-luxe w-full pl-10"
              maxLength={120}
              autoFocus
            />
          </div>
          <button
            disabled={loading}
            className="w-full rounded-xl bg-primary text-primary-foreground py-3 font-semibold hover:bg-primary-glow transition shadow-[var(--shadow-luxe)] disabled:opacity-60"
          >
            {loading ? "Sending..." : "Send reset link"}
          </button>
        </form>
      </div>
    </main>
  );
}

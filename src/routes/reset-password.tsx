import { useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { apiFetch } from "@/api/client";
import { toast } from "sonner";
import { ArrowLeft, Lock, CheckCircle, XCircle } from "lucide-react";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  if (!token) {
    return (
      <main className="min-h-screen pt-32 pb-20">
        <div className="container-luxe max-w-md text-center">
          <div className="mx-auto grid place-items-center size-16 rounded-2xl bg-destructive/15 ring-1 ring-destructive/30 mb-6">
            <XCircle className="size-7 text-destructive" />
          </div>
          <h1 className="font-display text-3xl">Invalid reset link</h1>
          <p className="text-muted-foreground mt-3">
            This reset link is missing or malformed. Please request a new one.
          </p>
          <Link
            to="/forgot-password"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary-glow transition"
          >
            Request new link
          </Link>
        </div>
      </main>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      toast.error("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      await apiFetch("/api/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, password }),
      });
      setDone(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Reset failed");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <main className="min-h-screen pt-32 pb-20">
        <div className="container-luxe max-w-md text-center">
          <div className="mx-auto grid place-items-center size-16 rounded-2xl bg-success/15 ring-1 ring-success/30 mb-6">
            <CheckCircle className="size-7 text-success" />
          </div>
          <h1 className="font-display text-3xl md:text-4xl">Password reset</h1>
          <p className="text-muted-foreground mt-3">
            Your password has been changed. Sign in with your new password.
          </p>
          <Link
            to="/auth"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary-glow transition"
          >
            Sign in
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
        <h1 className="font-display text-4xl md:text-5xl mt-6">Reset password</h1>
        <p className="text-muted-foreground mt-3">
          Choose a new password for your account.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              required
              minLength={6}
              type="password"
              placeholder="New password (min 6 chars)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-luxe w-full pl-10"
              autoFocus
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              required
              minLength={6}
              type="password"
              placeholder="Confirm new password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="input-luxe w-full pl-10"
            />
          </div>
          <button
            disabled={loading}
            className="w-full rounded-xl bg-primary text-primary-foreground py-3 font-semibold hover:bg-primary-glow transition shadow-[var(--shadow-luxe)] disabled:opacity-60"
          >
            {loading ? "Resetting..." : "Reset password"}
          </button>
        </form>
      </div>
    </main>
  );
}

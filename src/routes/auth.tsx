import { useNavigate, Link } from "react-router-dom";
import { useState } from "react";
import { apiFetch, setTokens } from "@/api/client";
import { useAuth } from "@/hooks/use-auth";
import { lovable } from "@/integrations/lovable/index";
import { toast } from "sonner";

type FieldErrors = Record<string, string>;

function getFieldErrors(err: unknown): FieldErrors {
  if (err && typeof err === "object" && "fieldErrors" in err) {
    const list = (err as any).fieldErrors;
    const map: FieldErrors = {};
    for (const e of list) {
      const key = e.field || (Array.isArray(e.path) ? e.path.join(".") : e.path) || "";
      if (key && e.message) map[key] = e.message;
    }
    return map;
  }
  return {};
}

function validate(form: { email: string; password: string; name?: string }, mode: "signin" | "signup"): FieldErrors {
  const errors: FieldErrors = {};
  if (!form.email.trim()) {
    errors.email = "Email is required";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = "Enter a valid email address";
  }
  if (!form.password) {
    errors.password = "Password is required";
  } else if (form.password.length < 6) {
    errors.password = "Password must be at least 6 characters";
  }
  if (mode === "signup" && !form.name?.trim()) {
    errors.fullName = "Full name is required";
  }
  return errors;
}

export default function AuthPage() {
  const { refreshUser } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [generalError, setGeneralError] = useState("");
  const [isRegistered, setIsRegistered] = useState(false);

  function switchMode(m: "signin" | "signup") {
    setMode(m);
    setFieldErrors({});
    setGeneralError("");
    setIsRegistered(false);
  }

  function clearFieldError(field: string) {
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
    if (generalError) setGeneralError("");
    if (isRegistered) setIsRegistered(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const clientErrors = validate({ email, password, name }, mode);
    if (Object.keys(clientErrors).length) {
      setFieldErrors(clientErrors);
      return;
    }
    setFieldErrors({});
    setGeneralError("");
    setIsRegistered(false);
    setLoading(true);

    try {
      const endpoint = mode === "signup" ? "/api/auth/signup" : "/api/auth/signin";
      const body = mode === "signup"
        ? { email: email.trim(), password, fullName: name.trim() }
        : { email: email.trim(), password };

      const data = await apiFetch(endpoint, { method: "POST", body: JSON.stringify(body) });
      setTokens(data.accessToken, data.refreshToken);
      await refreshUser();
      toast.success(mode === "signup" ? "Account created — you're signed in." : "Welcome back.");
      navigate("/account");
    } catch (err) {
      const serverErrors = getFieldErrors(err);
      if (Object.keys(serverErrors).length) {
        const isEmailTaken =
          mode === "signup" &&
          serverErrors.email &&
          /already|registered|exists|taken/i.test(serverErrors.email);
        if (isEmailTaken) {
          setIsRegistered(true);
        } else {
          setFieldErrors(serverErrors);
        }
      } else {
        const msg = err instanceof Error ? err.message : "Something went wrong";
        setGeneralError(msg);
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error("Google sign-in failed");
      return;
    }
    if (result.redirected) return;
    navigate("/account");
  }

  return (
    <main className="min-h-screen pt-32 pb-20">
      <div className="container-luxe max-w-md">
        <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition">
          ← Back
        </Link>
        <h1 className="font-display text-4xl md:text-5xl mt-6">
          {mode === "signin" ? "Welcome back" : "Create account"}
        </h1>
        <p className="text-muted-foreground mt-3">
          {mode === "signin"
            ? "Sign in to order and track."
            : "Join to save favourites and reorder fast."}
        </p>

        <button
          onClick={handleGoogle}
          className="mt-8 w-full inline-flex items-center justify-center gap-3 rounded-xl bg-white text-black px-5 py-3 font-medium hover:bg-white/90 transition"
        >
          <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
            <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.4 29.2 35.5 24 35.5c-6.4 0-11.5-5.1-11.5-11.5S17.6 12.5 24 12.5c3 0 5.7 1.1 7.7 2.9l5.7-5.7C33.9 6.5 29.2 4.5 24 4.5 13.2 4.5 4.5 13.2 4.5 24S13.2 43.5 24 43.5c10.8 0 19.5-8.7 19.5-19.5 0-1.2-.1-2.4-.4-3.5z"/>
            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 12.5 24 12.5c3 0 5.7 1.1 7.7 2.9l5.7-5.7C33.9 6.5 29.2 4.5 24 4.5 16.3 4.5 9.7 8.9 6.3 14.7z"/>
            <path fill="#4CAF50" d="M24 43.5c5.1 0 9.7-1.9 13.2-5l-6.1-5c-2 1.4-4.5 2.2-7.1 2.2-5.2 0-9.6-3.1-11.3-7.5l-6.5 5C9.5 39 16.2 43.5 24 43.5z"/>
            <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.3 5.5l6.1 5c-.4.4 6.4-4.7 6.4-14.5 0-1.2-.1-2.4-.5-3.5z"/>
          </svg>
          Continue with Google
        </button>

        <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
          <div className="h-px flex-1 bg-border" /> or {mode} with email <div className="h-px flex-1 bg-border" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {mode === "signup" && (
            <label className="block">
              <span className="text-sm text-muted-foreground">Full name</span>
              <input
                type="text"
                placeholder="Jane Smith"
                value={name}
                onChange={(e) => { setName(e.target.value); clearFieldError("fullName"); }}
                className={`mt-1 w-full rounded-lg bg-background ring-1 px-3 py-2.5 outline-none transition focus:ring-2 focus:ring-primary ${
                  fieldErrors.fullName ? "ring-destructive" : "ring-border"
                }`}
                maxLength={80}
                autoComplete="name"
              />
              {fieldErrors.fullName && (
                <p className="mt-1 text-xs text-destructive">{fieldErrors.fullName}</p>
              )}
            </label>
          )}

          {isRegistered ? (
            <div className="rounded-xl bg-amber-500/10 ring-1 ring-amber-500/30 px-4 py-3 space-y-2">
              <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
                This email is already registered.
              </p>
              <button
                type="button"
                onClick={() => { setMode("signin"); setIsRegistered(false); }}
                className="w-full rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold hover:bg-primary-glow transition"
              >
                Sign in instead
              </button>
            </div>
          ) : (
            <>
              <label className="block">
                <span className="text-sm text-muted-foreground">Email</span>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); clearFieldError("email"); }}
                  className={`mt-1 w-full rounded-lg bg-background ring-1 px-3 py-2.5 outline-none transition focus:ring-2 focus:ring-primary ${
                    fieldErrors.email ? "ring-destructive" : "ring-border"
                  }`}
                  maxLength={120}
                  autoComplete="email"
                />
                {fieldErrors.email && (
                  <p className="mt-1 text-xs text-destructive">{fieldErrors.email}</p>
                )}
              </label>

              <label className="block">
                <span className="text-sm text-muted-foreground">Password</span>
                <input
                  type="password"
                  placeholder={mode === "signup" ? "Min 6 characters" : "Your password"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); clearFieldError("password"); }}
                  className={`mt-1 w-full rounded-lg bg-background ring-1 px-3 py-2.5 outline-none transition focus:ring-2 focus:ring-primary ${
                    fieldErrors.password ? "ring-destructive" : "ring-border"
                  }`}
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                />
                {fieldErrors.password && (
                  <p className="mt-1 text-xs text-destructive">{fieldErrors.password}</p>
                )}
              </label>

              {mode === "signin" && (
                <div className="text-right">
                  <Link to="/forgot-password" className="text-xs text-muted-foreground hover:text-primary transition">
                    Forgot password?
                  </Link>
                </div>
              )}

              {generalError && (
                <div className="rounded-lg bg-destructive/10 ring-1 ring-destructive/30 px-3 py-2 text-sm text-destructive">
                  {generalError}
                </div>
              )}

              <button
                disabled={loading}
                className="w-full rounded-xl bg-primary text-primary-foreground py-3 font-semibold hover:bg-primary-glow transition shadow-[var(--shadow-luxe)] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading
                  ? "Please wait…"
                  : mode === "signin"
                    ? "Sign in"
                    : "Create account"}
              </button>
            </>
          )}
        </form>

        <p className="text-sm text-muted-foreground text-center mt-6">
          {mode === "signin" ? "New here?" : "Already have an account?"}{" "}
          <button
            type="button"
            onClick={() => switchMode(mode === "signin" ? "signup" : "signin")}
            className="text-primary hover:underline font-medium"
          >
            {mode === "signin" ? "Create one" : "Sign in"}
          </button>
        </p>
      </div>
    </main>
  );
}

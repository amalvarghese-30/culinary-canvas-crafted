// Lovable OAuth bridge — handles Google consent flow and exchanges tokens for our JWT pair
import { createLovableAuth } from "@lovable.dev/cloud-auth-js";
import { setTokens } from "@/api/client";

const lovableAuth = createLovableAuth();

type SignInOptions = {
  redirect_uri?: string;
  extraParams?: Record<string, string>;
};

export const lovable = {
  auth: {
    signInWithOAuth: async (provider: "google" | "apple" | "microsoft" | "lovable", opts?: SignInOptions) => {
      const result = await lovableAuth.signInWithOAuth(provider, {
        redirect_uri: opts?.redirect_uri,
        extraParams: { ...opts?.extraParams },
      });

      if (result.redirected) return result;
      if (result.error) return result;

      try {
        // Exchange Google tokens for our JWT pair
        const res = await fetch(`${import.meta.env.VITE_API_URL || ""}/api/auth/google`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            googleId: (result.tokens as any)?.user?.id,
            email: (result.tokens as any)?.user?.email,
            fullName: (result.tokens as any)?.user?.user_metadata?.full_name,
            accessToken: (result.tokens as any)?.access_token,
          }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          return { error: new Error(body.error || "Google auth failed") };
        }
        const data = await res.json();
        setTokens(data.accessToken, data.refreshToken);
        return result;
      } catch (e) {
        return { error: e instanceof Error ? e : new Error(String(e)) };
      }
    },
  },
};

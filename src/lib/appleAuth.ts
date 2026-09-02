import { SocialLogin } from "@capgo/capacitor-social-login";
import { supabase } from "@/integrations/supabase/client";

// iOS only — the plugin's Android support needs a server-side redirect flow
// we don't have, and Apple's Sign In requirement (App Store review guideline
// 4.8) only applies to the iOS app anyway.
const APPLE_CLIENT_ID = "com.filmeja.app";

let initialized: Promise<void> | null = null;

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function ensureAppleAuthInitialized() {
  if (!initialized) {
    initialized = SocialLogin.initialize({
      apple: {
        clientId: APPLE_CLIENT_ID,
      },
    });
  }
  return initialized;
}

export async function loginWithApple() {
  await ensureAppleAuthInitialized();

  // Same root cause and fix as Google (see googleAuth.ts): without an
  // explicit nonce, ASAuthorizationAppleIDProvider still embeds one in the
  // identity token, but never hands it back to us, so Supabase rejects the
  // token with "Passed nonce and nonce in id_token should either both exist
  // or not." Apple echoes whatever nonce we pass verbatim into the token's
  // claim, while Supabase hashes whatever nonce *we* give *it* — so Apple
  // needs the hash, Supabase needs the raw value.
  const rawNonce = crypto.randomUUID();
  const hashedNonce = await sha256Hex(rawNonce);

  const { result } = await SocialLogin.login({
    provider: "apple",
    options: { scopes: ["email", "name"], nonce: hashedNonce },
  });

  const idToken = "idToken" in result ? result.idToken : undefined;
  if (!idToken) {
    throw new Error("Não foi possível obter o token da Apple.");
  }

  const { error } = await supabase.auth.signInWithIdToken({
    provider: "apple",
    token: idToken,
    nonce: rawNonce,
  });

  if (error) throw error;
}

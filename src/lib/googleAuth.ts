import { Capacitor } from "@capacitor/core";
import { SocialLogin } from "@capgo/capacitor-social-login";
import { supabase } from "@/integrations/supabase/client";

const GOOGLE_WEB_CLIENT_ID = import.meta.env.VITE_GOOGLE_WEB_CLIENT_ID as string | undefined;
const GOOGLE_IOS_CLIENT_ID = import.meta.env.VITE_GOOGLE_IOS_CLIENT_ID as string | undefined;

let initialized: Promise<void> | null = null;

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function ensureGoogleAuthInitialized() {
  if (!initialized) {
    initialized = SocialLogin.initialize({
      google: {
        webClientId: GOOGLE_WEB_CLIENT_ID,
        iOSClientId: GOOGLE_IOS_CLIENT_ID,
        iOSServerClientId: GOOGLE_WEB_CLIENT_ID,
        mode: "online",
      },
    });
  }
  return initialized;
}

async function loginWithGoogleNative() {
  await ensureGoogleAuthInitialized();

  // Without an explicit nonce, the native SDKs (GIDSignIn on iOS in
  // particular) generate their own and embed it in the id_token's `nonce`
  // claim — but never hand that value back to us, so Supabase has no way to
  // confirm it and rejects the token with "Passed nonce and nonce in
  // id_token should either both exist or not."
  //
  // Google's SDK embeds whatever nonce we give it verbatim (no hashing of
  // its own), while Supabase hashes whatever nonce *we* give *it* and
  // compares that against the token's claim — the same rawNonce/hashedNonce
  // split Sign in with Apple requires natively. So Google gets the hash,
  // Supabase gets the raw value.
  const rawNonce = crypto.randomUUID();
  const hashedNonce = await sha256Hex(rawNonce);

  // Don't pass custom `scopes` here: the Android provider rejects any custom
  // scope unless MainActivity implements ModifiedMainActivityForSocialLoginPlugin.
  // The default scopes (openid, email, profile) are enough for Supabase's idToken sign-in.
  const { result } = await SocialLogin.login({
    provider: "google",
    options: { nonce: hashedNonce },
  });

  const idToken = "idToken" in result ? result.idToken : undefined;
  if (!idToken) {
    throw new Error("Não foi possível obter o token do Google.");
  }

  const { error } = await supabase.auth.signInWithIdToken({
    provider: "google",
    token: idToken,
    nonce: rawNonce,
  });

  if (error) throw error;
}

async function loginWithGoogleWeb() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
      redirectTo: `${window.location.origin}/dashboard`,
    },
  });

  if (error) throw error;
}

// Uses the native Google Sign-In SDK (via Credential Manager / iOS SDK) inside
// the Capacitor app, and falls back to Supabase's browser OAuth redirect on the web.
export async function loginWithGoogle() {
  if (Capacitor.isNativePlatform()) {
    return loginWithGoogleNative();
  }
  return loginWithGoogleWeb();
}

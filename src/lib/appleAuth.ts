import { SocialLogin } from "@capgo/capacitor-social-login";
import { supabase } from "@/integrations/supabase/client";

// iOS only — the plugin's Android support needs a server-side redirect flow
// we don't have, and Apple's Sign In requirement (App Store review guideline
// 4.8) only applies to the iOS app anyway.
const APPLE_CLIENT_ID = "com.filmeja.app";

let initialized: Promise<void> | null = null;

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

  const { result } = await SocialLogin.login({
    provider: "apple",
    options: { scopes: ["email", "name"] },
  });

  const idToken = "idToken" in result ? result.idToken : undefined;
  if (!idToken) {
    throw new Error("Não foi possível obter o token da Apple.");
  }

  const { error } = await supabase.auth.signInWithIdToken({
    provider: "apple",
    token: idToken,
  });

  if (error) throw error;
}

import i18n from "@/i18n";

// Supabase Auth (and the native Google/Apple SDKs underneath it) always
// throw English error messages — there's no server-side localization for
// these. Toasts across the app used to show `error.message` directly
// whenever it existed, which is how things like "Nonces mismatch" or
// "Invalid login credentials" ended up on screen in English.
//
// This maps the messages we actually see in practice to a translation key
// (resolved in the app's current language via i18n.t), and — importantly —
// never lets an *unmapped* English message slip through: if nothing
// matches, the caller's own already-localized fallback is used instead of
// the raw error text.
const KNOWN_AUTH_ERRORS: Array<[match: string, key: string]> = [
  ["invalid login credentials", "invalidCredentials"],
  ["email not confirmed", "emailNotConfirmed"],
  ["user already registered", "alreadyRegistered"],
  ["already registered", "alreadyRegistered"],
  ["password should be at least", "passwordTooShort"],
  ["unable to validate email address", "invalidEmail"],
  ["user not found", "userNotFound"],
  ["email rate limit exceeded", "rateLimitExceeded"],
  ["nonce", "nonceError"],
  ["load failed", "connectionFailed"],
  ["network request failed", "networkFailed"],
  ["network connection was lost", "networkFailed"],
  ["the internet connection appears to be offline", "offline"],
  ["timed out", "timedOut"],
  ["cancelled", "loginCancelled"],
  ["canceled", "loginCancelled"],
];

export function translateAuthError(error: unknown, fallback: string): string {
  const message =
    error instanceof Error ? error.message : typeof error === "string" ? error : "";
  if (!message) return fallback;

  const lower = message.toLowerCase();
  for (const [match, key] of KNOWN_AUTH_ERRORS) {
    if (lower.includes(match)) return i18n.t(`authErrors.${key}`);
  }

  // Not a message we recognize — could be anything, including raw English
  // from the SDK, so never show it as-is.
  return fallback;
}

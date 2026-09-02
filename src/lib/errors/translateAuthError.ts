// Supabase Auth (and the native Google/Apple SDKs underneath it) always
// throw English error messages — there's no server-side localization for
// these. Toasts across the app used to show `error.message` directly
// whenever it existed, which is how things like "Nonces mismatch" or
// "Invalid login credentials" ended up on screen in English.
//
// This maps the messages we actually see in practice to Portuguese, and —
// importantly — never lets an *unmapped* English message slip through: if
// nothing matches, the caller's own Portuguese fallback is used instead of
// the raw error text.
const KNOWN_AUTH_ERRORS: Array<[match: string, translated: string]> = [
  ["invalid login credentials", "E-mail ou senha incorretos."],
  ["email not confirmed", "Confirme seu e-mail antes de entrar."],
  ["user already registered", "Esse e-mail já está cadastrado. Tente entrar em vez de criar uma conta."],
  ["already registered", "Esse e-mail já está cadastrado. Tente entrar em vez de criar uma conta."],
  ["password should be at least", "A senha precisa ter pelo menos 6 caracteres."],
  ["unable to validate email address", "E-mail inválido."],
  ["user not found", "Usuário não encontrado."],
  ["email rate limit exceeded", "Muitas tentativas. Aguarde um instante antes de tentar de novo."],
  ["nonce", "Não foi possível confirmar o login. Feche e tente novamente."],
  ["load failed", "Falha de conexão. Tente novamente."],
  ["network request failed", "Falha de conexão. Verifique sua internet e tente novamente."],
  ["network connection was lost", "Falha de conexão. Verifique sua internet e tente novamente."],
  ["the internet connection appears to be offline", "Você está sem conexão com a internet."],
  ["timed out", "A operação demorou demais. Tente novamente."],
  ["cancelled", "Login cancelado."],
  ["canceled", "Login cancelado."],
];

export function translateAuthError(error: unknown, fallback: string): string {
  const message =
    error instanceof Error ? error.message : typeof error === "string" ? error : "";
  if (!message) return fallback;

  const lower = message.toLowerCase();
  for (const [match, translated] of KNOWN_AUTH_ERRORS) {
    if (lower.includes(match)) return translated;
  }

  // Not a message we recognize — could be anything, including raw English
  // from the SDK, so never show it as-is.
  return fallback;
}

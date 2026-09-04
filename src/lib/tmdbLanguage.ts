import i18n from "@/i18n";

// TMDB's `language` query param accepts locale codes. pt-BR and en-US match
// TMDB's own codes exactly; es-419 (a UN region code, not an ISO country) is
// not a TMDB-recognized language, so it's mapped to es-MX — TMDB's Spanish
// variant for the same Mexico catalog getTmdbRegion() below picks. Falls
// back to pt-BR (the app's default) for any other/unrecognized i18next state.
export function getTmdbLanguage(): string {
  if (i18n.language === "en-US") return "en-US";
  if (i18n.language === "es-419") return "es-MX";
  return "pt-BR";
}

// Which country's streaming availability (TMDB's `watch/providers` region
// key, and the `region` param on discover/now_playing-style endpoints) to
// check content against. Tied 1:1 to the app language rather than an
// independent setting — en-US means the US catalog, es-419 means Mexico
// (the largest Spanish-speaking LATAM streaming market), everything else
// means Brazil.
export function getTmdbRegion(): "BR" | "US" | "MX" {
  if (i18n.language === "en-US") return "US";
  if (i18n.language === "es-419") return "MX";
  return "BR";
}

import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import ptBR from "@/locales/pt-BR.json";
import enUS from "@/locales/en-US.json";
import es419 from "@/locales/es-419.json";

export const SUPPORTED_LANGUAGES = ["pt-BR", "en-US", "es-419"] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const LANGUAGE_STORAGE_KEY = "filmeja_language";

// Collapses any browser/OS locale down to one of our supported languages —
// pt* -> pt-BR, en* -> en-US, es* -> es-419, everything else falls back to
// pt-BR (the app's default audience). Applied to every candidate the
// detector finds (a saved preference in localStorage first, then
// navigator.language), so a raw "pt", "pt-PT", "en-GB" or "es-ES" all
// resolve sensibly instead of missing a resource bundle.
function normalizeLanguage(lng: string): SupportedLanguage {
  const base = lng.toLowerCase().split("-")[0];
  if (base === "pt") return "pt-BR";
  if (base === "en") return "en-US";
  if (base === "es") return "es-419";
  return "pt-BR";
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      "pt-BR": { translation: ptBR },
      "en-US": { translation: enUS },
      "es-419": { translation: es419 },
    },
    fallbackLng: "pt-BR",
    supportedLngs: SUPPORTED_LANGUAGES,
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
      lookupLocalStorage: LANGUAGE_STORAGE_KEY,
      convertDetectedLanguage: normalizeLanguage,
    },
    interpolation: {
      // React already escapes interpolated values.
      escapeValue: false,
    },
  });

export default i18n;

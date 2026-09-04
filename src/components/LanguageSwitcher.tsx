import { useTranslation } from "react-i18next";
import { Languages } from "lucide-react";
import type { SupportedLanguage } from "@/i18n";

const LANGUAGES: { code: SupportedLanguage; label: string; short: string }[] = [
  { code: "pt-BR", label: "Português (Brasil)", short: "PT" },
  { code: "en-US", label: "English (United States)", short: "EN" },
  { code: "es-419", label: "Español (Latinoamérica)", short: "ES" },
];

interface LanguageSwitcherProps {
  className?: string;
  // Sidebar passes its expanded/collapsed state so the label can hide the
  // same way the other nav items already do.
  showLabel?: boolean;
}

export function LanguageSwitcher({ className, showLabel = true }: LanguageSwitcherProps) {
  const { i18n } = useTranslation();
  const currentIndex = Math.max(
    LANGUAGES.findIndex((l) => l.code === i18n.language),
    0
  );
  const current = LANGUAGES[currentIndex];
  const target = LANGUAGES[(currentIndex + 1) % LANGUAGES.length];

  const handleToggle = () => {
    i18n.changeLanguage(target.code);
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      title={target.label}
      className={
        className ??
        "w-full flex items-center justify-center gap-2 py-3 text-gray-300 hover:bg-white/10 hover:text-white transition-colors rounded-md"
      }
    >
      <Languages className="w-5 h-5 flex-shrink-0" />
      {showLabel && (
        <span className="text-sm font-medium">
          {current.short} · {target.short}
        </span>
      )}
    </button>
  );
}

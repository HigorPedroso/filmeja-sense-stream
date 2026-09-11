import { useTranslation } from "react-i18next";

interface AppNameLabelProps {
  className?: string;
  accentClassName?: string;
}

// The app's wordmark, with a language-specific word/segment colored in the
// brand purple — "Filme" for pt-BR, "AI" for en-US, "Ver" for es-419 —
// matching the original two-tone "FilmeJá" logo instead of a flat single
// color. Falls back to the plain name if the current language's accent
// isn't defined or doesn't literally appear in it.
export function AppNameLabel({ className, accentClassName }: AppNameLabelProps) {
  const { t } = useTranslation();
  const appName = t("common.appName");
  const accent = t("common.appNameAccent", { defaultValue: "" });
  const idx = accent ? appName.indexOf(accent) : -1;

  if (idx === -1) {
    return <span className={className}>{appName}</span>;
  }

  return (
    <span className={className}>
      {appName.slice(0, idx)}
      <span className={accentClassName ?? "text-filmeja-purple"}>{accent}</span>
      {appName.slice(idx + accent.length)}
    </span>
  );
}

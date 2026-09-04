import { useEffect } from "react";
import i18n from "@/i18n";
import { useAuth } from "./useAuth";
import { supabase } from "@/integrations/supabase/client";

// Mirrors the device's i18next language onto profiles.language so
// server-side jobs (the push-notification cron Edge Functions) know which
// language to send in — they run in Deno with no access to the client's
// i18next runtime, so this column is their only source of truth.
export function useSyncProfileLanguage() {
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading || !user) return;

    const syncLanguage = (lng: string) => {
      supabase
        .from("profiles")
        .update({ language: lng })
        .eq("id", user.id)
        .then(({ error }) => {
          if (error) console.error("[profile] language sync failed: " + error.message);
        });
    };

    syncLanguage(i18n.language);
    i18n.on("languageChanged", syncLanguage);
    return () => i18n.off("languageChanged", syncLanguage);
  }, [user, isLoading]);
}

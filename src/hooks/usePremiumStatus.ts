import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

// Single source of truth for premium status. Stripe checkout is no longer
// wired up (moving to Google Play Billing later) — `profiles.is_premium` is
// a plain boolean you can flip directly in Supabase Studio (on your user's
// row) to test premium features. Stays live via a realtime subscription.
export function usePremiumStatus() {
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    const checkPremiumStatus = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          setIsPremium(false);
          return;
        }

        const { data: profile, error } = await supabase
          .from("profiles")
          .select("is_premium")
          .eq("id", user.id)
          .single();

        if (error) {
          setIsPremium(false);
          return;
        }

        setIsPremium(!!profile?.is_premium);
      } catch (error) {
        console.error("Error checking premium status:", error);
        setIsPremium(false);
      }
    };

    checkPremiumStatus();

    const subscription = supabase
      .channel("profile-premium-status")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
        },
        checkPremiumStatus
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return isPremium;
}

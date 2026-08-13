import { useEffect } from "react";
import { useAuth } from "./useAuth";
import { loginPurchases, logoutPurchases } from "@/lib/purchases";

// Keeps the RevenueCat subscriber identity in lockstep with the Supabase
// session, so a purchase always lands on the correct `profiles` row
// regardless of which device/login it happened on.
export function useSyncPurchasesAuth() {
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (user) {
      loginPurchases(user.id).catch((error) => console.error("[purchases] login failed", error));
    } else {
      logoutPurchases().catch(() => {});
    }
  }, [user, isLoading]);
}

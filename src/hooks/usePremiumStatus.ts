import { useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";

// Single source of truth for premium status. Stripe checkout is no longer
// wired up (moving to Google Play Billing later) — `profiles.is_premium` is
// a plain boolean you can flip directly in Supabase Studio (on your user's
// row) to test premium features.
//
// Shared module-level cache: Dashboard, HeaderDashboard, Sidebar and
// MobileSidebar all call this hook, and Dashboard remounts every time the
// user navigates back to it — with a plain per-component useState, that
// meant a fresh Supabase round-trip (and a flash back to "not premium")
// every single time. Now the fetch happens once per app session; every
// later mount just reads the cached value instantly, and a realtime
// subscription (opened once, shared) keeps it live if the row changes.
let isPremiumCache = false;
const listeners = new Set<() => void>();
let realtimeChannel: ReturnType<typeof supabase.channel> | null = null;
let subscriberCount = 0;

function notify() {
  listeners.forEach((listener) => listener());
}

async function fetchPremiumStatus() {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      isPremiumCache = false;
      notify();
      return;
    }

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("is_premium")
      .eq("id", user.id)
      .single();

    isPremiumCache = error ? false : !!profile?.is_premium;
  } catch (error) {
    console.error("Error checking premium status:", error);
    isPremiumCache = false;
  }
  notify();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  subscriberCount++;

  if (subscriberCount === 1) {
    // First consumer in the app: kick off the one fetch and open the one
    // realtime channel that every future consumer will just piggyback on.
    fetchPremiumStatus();
    realtimeChannel = supabase
      .channel("profile-premium-status")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "profiles" }, fetchPremiumStatus)
      .subscribe();
  }

  return () => {
    listeners.delete(listener);
    subscriberCount--;
    if (subscriberCount === 0 && realtimeChannel) {
      realtimeChannel.unsubscribe();
      realtimeChannel = null;
    }
  };
}

function getSnapshot() {
  return isPremiumCache;
}

export function usePremiumStatus() {
  return useSyncExternalStore(subscribe, getSnapshot);
}

// Flips every subscriber (Dashboard, Sidebar, ad hooks, ...) to premium the
// instant a purchase/restore is confirmed, instead of waiting on the
// `profiles` write to round-trip back through the realtime subscription.
export function setPremiumStatusLocally(isPremium: boolean) {
  isPremiumCache = isPremium;
  notify();
}

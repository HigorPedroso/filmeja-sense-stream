import { Purchases, INTRO_ELIGIBILITY_STATUS } from "@revenuecat/purchases-capacitor";
import type { CustomerInfo, PurchasesOffering, PurchasesPackage } from "@revenuecat/purchases-capacitor";
import { Capacitor } from "@capacitor/core";

// Must match the entitlement identifier configured in the RevenueCat
// dashboard (Entitlements > premium), which in turn must be attached to
// the Google Play subscription products.
export const PREMIUM_ENTITLEMENT_ID = "premium";

const REVENUECAT_ANDROID_API_KEY = import.meta.env.VITE_REVENUECAT_ANDROID_API_KEY as string | undefined;
const REVENUECAT_IOS_API_KEY = import.meta.env.VITE_REVENUECAT_IOS_API_KEY as string | undefined;

// A promise, not a boolean — callers need to wait for Purchases.configure()
// to actually finish, not just for it to have been kicked off. It used to
// be a `configured` flag set true synchronously before the await, so any
// getCurrentOffering() call that raced ahead of native configuration
// (e.g. paywall opened right after cold start) would call getOfferings()
// before the SDK was actually ready and silently come back with nothing —
// no error shown, just an empty "Planos indisponíveis".
let configurePromise: Promise<void> | null = null;

// RevenueCat only backs the native Play Store / App Store billing flows —
// the web build keeps showing the "em breve" messaging in
// PremiumPaywallContent. Each store has its own RevenueCat API key (Android
// keys start with "goog_", iOS/Apple keys start with "appl_") — configuring
// with the wrong one silently fails to resolve any offering.
export async function initializePurchases() {
  if (!Capacitor.isNativePlatform()) return;
  if (!configurePromise) {
    const apiKey = Capacitor.getPlatform() === "ios" ? REVENUECAT_IOS_API_KEY : REVENUECAT_ANDROID_API_KEY;
    if (!apiKey) {
      console.warn("[purchases] RevenueCat API key não configurada para esta plataforma, pulando init");
      return;
    }
    configurePromise = Purchases.configure({ apiKey });
  }
  await configurePromise;
}

// Ties the RevenueCat subscriber identity to our Supabase user id, so the
// revenuecat-webhook Edge Function can update the right `profiles` row.
export async function loginPurchases(userId: string) {
  if (!Capacitor.isNativePlatform() || !configurePromise) return;
  await configurePromise;
  await Purchases.logIn({ appUserID: userId });
}

export async function logoutPurchases() {
  if (!Capacitor.isNativePlatform() || !configurePromise) return;
  await configurePromise;
  try {
    await Purchases.logOut();
  } catch {
    // Throws if the subscriber is already anonymous (e.g. logout right
    // after a failed login) — safe to ignore.
  }
}

export async function getCurrentOffering(): Promise<PurchasesOffering | null> {
  if (!Capacitor.isNativePlatform()) return null;
  if (!configurePromise) {
    // Purchases.configure() was never even attempted — the platform's API
    // key came back empty from import.meta.env. Thrown (not returned as
    // null) so callers can tell "SDK never configured" apart from "SDK
    // configured but the store has no current offering".
    throw new Error("RevenueCat API key ausente para esta plataforma (import.meta.env)");
  }
  await configurePromise;
  const offerings = await Purchases.getOfferings();
  return offerings.current;
}

export async function purchasePackage(pkg: PurchasesPackage): Promise<CustomerInfo> {
  const { customerInfo } = await Purchases.purchasePackage({ aPackage: pkg });
  return customerInfo;
}

export async function restorePurchases(): Promise<CustomerInfo> {
  const { customerInfo } = await Purchases.restorePurchases();
  return customerInfo;
}

export function isPremiumEntitlementActive(customerInfo: CustomerInfo): boolean {
  return !!customerInfo.entitlements.active[PREMIUM_ENTITLEMENT_ID];
}

// Whether each product's free/introductory trial can still be granted to
// this subscriber. Apple only allows one trial per Apple ID per
// subscription group, ever — RevenueCat surfaces the product's introPrice
// regardless of whether the user already used it, so the paywall must check
// this separately before advertising "free trial" copy. Android always
// comes back UNKNOWN (no concept of per-user trial eligibility there), and
// on an unknown/errored result callers should fall back to non-trial
// pricing rather than risk a misleading "free trial" claim.
export async function checkTrialEligibility(productIdentifiers: string[]): Promise<Record<string, boolean>> {
  if (!Capacitor.isNativePlatform() || !configurePromise || productIdentifiers.length === 0) return {};
  await configurePromise;
  try {
    const result = await Purchases.checkTrialOrIntroductoryPriceEligibility({ productIdentifiers });
    const eligibility: Record<string, boolean> = {};
    for (const [productId, info] of Object.entries(result)) {
      eligibility[productId] = info.status === INTRO_ELIGIBILITY_STATUS.INTRO_ELIGIBILITY_STATUS_ELIGIBLE;
    }
    return eligibility;
  } catch (error) {
    console.error("[purchases] failed to check trial eligibility: " + (error?.message || String(error)));
    return {};
  }
}

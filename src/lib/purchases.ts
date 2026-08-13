import { Purchases } from "@revenuecat/purchases-capacitor";
import type { CustomerInfo, PurchasesOffering, PurchasesPackage } from "@revenuecat/purchases-capacitor";
import { Capacitor } from "@capacitor/core";

// Must match the entitlement identifier configured in the RevenueCat
// dashboard (Entitlements > premium), which in turn must be attached to
// the Google Play subscription products.
export const PREMIUM_ENTITLEMENT_ID = "premium";

const REVENUECAT_ANDROID_API_KEY = import.meta.env.VITE_REVENUECAT_ANDROID_API_KEY as string | undefined;
const REVENUECAT_IOS_API_KEY = import.meta.env.VITE_REVENUECAT_IOS_API_KEY as string | undefined;

let configured = false;

// RevenueCat only backs the native Play Store / App Store billing flows —
// the web build keeps showing the "em breve" messaging in
// PremiumPaywallContent. Each store has its own RevenueCat API key (Android
// keys start with "goog_", iOS/Apple keys start with "appl_") — configuring
// with the wrong one silently fails to resolve any offering.
export async function initializePurchases() {
  if (!Capacitor.isNativePlatform() || configured) return;

  const apiKey = Capacitor.getPlatform() === "ios" ? REVENUECAT_IOS_API_KEY : REVENUECAT_ANDROID_API_KEY;
  if (!apiKey) {
    console.warn("[purchases] RevenueCat API key não configurada para esta plataforma, pulando init");
    return;
  }
  configured = true;
  await Purchases.configure({ apiKey });
}

// Ties the RevenueCat subscriber identity to our Supabase user id, so the
// revenuecat-webhook Edge Function can update the right `profiles` row.
export async function loginPurchases(userId: string) {
  if (!Capacitor.isNativePlatform() || !configured) return;
  await Purchases.logIn({ appUserID: userId });
}

export async function logoutPurchases() {
  if (!Capacitor.isNativePlatform() || !configured) return;
  try {
    await Purchases.logOut();
  } catch {
    // Throws if the subscriber is already anonymous (e.g. logout right
    // after a failed login) — safe to ignore.
  }
}

export async function getCurrentOffering(): Promise<PurchasesOffering | null> {
  if (!Capacitor.isNativePlatform() || !configured) return null;
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

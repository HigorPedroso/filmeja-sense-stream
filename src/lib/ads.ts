import { Capacitor } from "@capacitor/core";
import { AdMob, InterstitialAdPluginEvents } from "@capacitor-community/admob";

// Google's official AdMob TEST ad unit IDs. Replace with your own real
// interstitial ad unit IDs (one per platform) before shipping to production —
// see android/app/src/main/res/values/strings.xml and ios/App/App/Info.plist
// for the matching App ID placeholders.
const INTERSTITIAL_AD_ID =
  Capacitor.getPlatform() === "ios"
    ? "ca-app-pub-3940256099942544/4411468910"
    : "ca-app-pub-3940256099942544/1033173712";

let initialized: Promise<void> | null = null;

export function initializeAds() {
  if (!Capacitor.isNativePlatform()) return;
  if (!initialized) {
    initialized = AdMob.initialize().catch((error) => {
      console.error("Error initializing AdMob:", error);
    });
  }
  return initialized;
}

// Prepares and shows an interstitial ad, resolving once the user dismisses
// it. Never throws and never blocks the app flow for long: if the ad fails
// to load/show, or no event fires within a few seconds, it just resolves so
// the recommendation the user is waiting for still shows up.
export async function showInterstitialAd(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  await initializeAds();

  return new Promise((resolve) => {
    let settled = false;
    const handles: { remove: () => Promise<void> }[] = [];

    const finish = () => {
      if (settled) return;
      settled = true;
      handles.forEach((h) => h.remove().catch(() => {}));
      resolve();
    };

    const safetyTimeout = setTimeout(finish, 8000);

    Promise.all([
      AdMob.addListener(InterstitialAdPluginEvents.Dismissed, finish),
      AdMob.addListener(InterstitialAdPluginEvents.FailedToShow, finish),
      AdMob.addListener(InterstitialAdPluginEvents.FailedToLoad, finish),
    ])
      .then((listeners) => handles.push(...listeners))
      .catch(() => {});

    AdMob.prepareInterstitial({ adId: INTERSTITIAL_AD_ID })
      .then(() => AdMob.showInterstitial())
      .catch((error) => {
        console.error("Error showing interstitial ad:", error);
        clearTimeout(safetyTimeout);
        finish();
      });
  });
}

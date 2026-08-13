import { Capacitor } from "@capacitor/core";
import { AdMob, BannerAdPluginEvents, BannerAdPosition, BannerAdSize, InterstitialAdPluginEvents } from "@capacitor-community/admob";

// Real Android ad unit ID (AdMob account: ca-app-pub-7861501292446252). No
// real iOS ad unit exists yet, so iOS keeps Google's official TEST
// interstitial ad unit ID — see ios/App/App/Info.plist for the matching
// (still-test) App ID.
const INTERSTITIAL_AD_ID =
  Capacitor.getPlatform() === "ios"
    ? "ca-app-pub-3940256099942544/4411468910"
    : "ca-app-pub-7861501292446252/2765486441";

// Real Android banner ad unit. No real iOS ad unit exists yet, so iOS keeps
// Google's official TEST banner ad unit ID.
const BANNER_AD_ID =
  Capacitor.getPlatform() === "ios"
    ? "ca-app-pub-3940256099942544/2934735716"
    : "ca-app-pub-7861501292446252/8817557773";

// Devices registered here get real ads clearly labeled "Test Ad" instead of
// live ones — lets us verify the real ad unit works without generating
// billable impressions/clicks on our own account (which AdMob can flag as
// invalid traffic). Add your device's ID from the "Use
// RequestConfiguration.Builder().setTestDeviceIds(...)" line in logcat the
// first time a real ad loads on it. Only listed devices are affected; every
// other user still gets real ads.
const TESTING_DEVICES = ["89C27E16C1F8EDBC28D74A13F655A947"];

let initialized: Promise<void> | null = null;

// The banner's height (in dp, ≈ CSS px in this webview) changes once the ad
// actually loads — ADAPTIVE_BANNER doesn't have a fixed size. Content that
// sits above the banner needs to know this to avoid the banner covering it,
// so it's tracked here as a tiny external store (see useBannerAdHeight).
let bannerHeightPx = 0;
const bannerHeightListeners = new Set<() => void>();

function setBannerHeight(px: number) {
  bannerHeightPx = px;
  bannerHeightListeners.forEach((listener) => listener());
}

export function getBannerHeightSnapshot() {
  return bannerHeightPx;
}

export function subscribeBannerHeight(listener: () => void) {
  bannerHeightListeners.add(listener);
  return () => bannerHeightListeners.delete(listener);
}

export function initializeAds() {
  if (!Capacitor.isNativePlatform()) return;
  if (!initialized) {
    initialized = AdMob.initialize({
      testingDevices: TESTING_DEVICES,
      initializeForTesting: true,
    }).catch((error) => {
      console.error("Error initializing AdMob:", error);
    });
    AdMob.addListener(BannerAdPluginEvents.SizeChanged, (info) => {
      setBannerHeight(info.height > 0 ? info.height : 0);
    }).catch(() => {});
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

// The native banner is drawn outside the webview, so it doesn't know about
// the app's own CSS safe-area padding — on Android below API 35 the plugin
// doesn't compensate for the system navigation bar at all, and ends up
// drawing the banner underneath it (the "margin" option is the only thing
// that pushes it back up). This reads env(safe-area-inset-bottom) — the same
// value already used for the rest of the app's own bottom padding — and
// converts it from CSS px to dp, which is the unit AdMob's Android plugin
// multiplies by density internally.
//
// iOS-only note: the iOS AdMob SDK already positions BOTTOM_CENTER banners
// above the safe area (home indicator) on its own — adding this same margin
// there double-compensates and pushes the banner up well past where it
// should sit. Callers must only use this on Android (see showBannerAd).
function getSafeAreaInsetBottomDp(): number {
  const probe = document.createElement("div");
  probe.style.position = "fixed";
  probe.style.bottom = "0";
  probe.style.height = "0";
  probe.style.paddingBottom = "env(safe-area-inset-bottom)";
  probe.style.visibility = "hidden";
  document.body.appendChild(probe);
  const inset = parseFloat(getComputedStyle(probe).paddingBottom) || 0;
  document.body.removeChild(probe);
  return inset / (window.visualViewport?.scale || 1);
}

// Shows a banner fixed to the bottom of the screen, on top of the web
// content. Unlike the interstitial/rewarded ads, this doesn't resolve on
// dismiss — it stays up until hideBannerAd() is called (e.g. when the user
// leaves the content details screen).
export async function showBannerAd(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  await initializeAds();

  try {
    await AdMob.showBanner({
      adId: BANNER_AD_ID,
      adSize: BannerAdSize.ADAPTIVE_BANNER,
      position: BannerAdPosition.BOTTOM_CENTER,
      // Android-only: iOS already positions this above the safe area on its
      // own (see the note on getSafeAreaInsetBottomDp above).
      margin: Capacitor.getPlatform() === "android" ? getSafeAreaInsetBottomDp() : 0,
    });
  } catch (error) {
    console.error("Error showing banner ad:", error);
  }
}

export async function hideBannerAd(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  setBannerHeight(0);

  try {
    await AdMob.removeBanner();
  } catch (error) {
    console.error("Error hiding banner ad:", error);
  }
}

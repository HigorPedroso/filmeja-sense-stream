import { useSyncExternalStore } from "react";
import { getBannerHeightSnapshot, subscribeBannerHeight } from "@/lib/ads";

// Current banner ad height in px (0 when no banner is shown). ADAPTIVE_BANNER
// doesn't have a fixed size, so this only settles once the ad actually loads.
export function useBannerAdHeight() {
  return useSyncExternalStore(subscribeBannerHeight, getBannerHeightSnapshot);
}

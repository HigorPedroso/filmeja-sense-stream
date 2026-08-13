import { useEffect } from "react";
import { showBannerAd, hideBannerAd } from "@/lib/ads";
import { useRecommendationResult } from "@/hooks/useRecommendationResult";
import { usePremiumStatus } from "@/hooks/usePremiumStatus";

// Shows the bottom banner ad while the content details screen (mood/genre
// recommendation result) is open, in place of the old Amazon promo card.
// Premium users never see it. Called once, near the app root — like
// useRecommendationNavigation, ContentDetails itself isn't a safe place for
// this: it's rendered by ContentModal, which Dashboard, the desktop Sidebar
// and MobileSidebar all mount simultaneously bound to the same shared
// showRecommendationModal state, so a per-instance effect would fire
// duplicate show/hide calls.
export function useDetailsBannerAd() {
  const { showRecommendationModal } = useRecommendationResult();
  const isPremium = usePremiumStatus();

  useEffect(() => {
    if (showRecommendationModal && !isPremium) {
      showBannerAd();
    } else {
      hideBannerAd();
    }
  }, [showRecommendationModal, isPremium]);

  useEffect(() => {
    return () => {
      hideBannerAd();
    };
  }, []);
}

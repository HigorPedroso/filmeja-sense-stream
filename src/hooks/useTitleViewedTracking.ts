import { useEffect, useRef } from "react";
import { trackEvent } from "@/lib/analytics/trackEvent";
import { useRecommendationResult } from "@/hooks/useRecommendationResult";

// Tracks "title_viewed" once per distinct title shown in the details screen
// — covers recommendations AND browsing Top10/Minha Lista/Assistidos, since
// they all funnel through the same shared moodRecommendation state. Called
// once, near the app root — same reasoning as useDetailsBannerAd:
// ContentDetails/ContentResultView are rendered by ContentModal, which
// Dashboard, the desktop Sidebar and MobileSidebar all mount simultaneously
// bound to the same shared state, so a per-instance effect would fire
// duplicate rows.
export function useTitleViewedTracking() {
  const { showRecommendationModal, moodRecommendation } = useRecommendationResult();
  const lastTrackedId = useRef<number | string | null>(null);

  useEffect(() => {
    if (!showRecommendationModal || !moodRecommendation) return;

    const id = moodRecommendation.id;
    if (!id || id === lastTrackedId.current) return;
    lastTrackedId.current = id;

    trackEvent("title_viewed", {
      tmdbId: id,
      title: moodRecommendation.title || moodRecommendation.name,
      mediaType: moodRecommendation.mediaType,
    });
  }, [showRecommendationModal, moodRecommendation]);
}

import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { useRecommendationResult } from "@/hooks/useRecommendationResult";

// The single, global place that pushes the mobile /recomendacao screen when
// a recommendation opens. This used to live inside ContentModal itself —
// but ContentModal is rendered by Dashboard, the desktop Sidebar AND
// MobileSidebar simultaneously (all three bound to the same shared
// showRecommendationModal state), so a single "open" fired THREE independent
// navigate() calls, one per mounted instance, silently stacking duplicate
// history entries. A later close only ever undid one of those, so after a
// couple of open/close cycles the back navigation landed somewhere with
// nothing on screen. Call this once, near the app root, instead.
export function useRecommendationNavigation() {
  const { showRecommendationModal } = useRecommendationResult();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isMobile && showRecommendationModal && location.pathname !== "/recomendacao") {
      navigate("/recomendacao");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMobile, showRecommendationModal, location.pathname]);
}

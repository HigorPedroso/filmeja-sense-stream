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
//
// Skipped on "/" and "/dashboard": Dashboard's own ContentModal instance
// renders the recommendation inline there (fullScreenOnMobile), so opening
// one while already on the dashboard doesn't need — and shouldn't get — a
// route change at all. Every other entry point (Favorites, Profile,
// Filmin.IA chat, ...) has no ContentModal mounted locally, so those still
// need the dedicated route.
const DASHBOARD_PATHS = ["/", "/dashboard"];

export function useRecommendationNavigation() {
  const { showRecommendationModal } = useRecommendationResult();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (
      isMobile &&
      showRecommendationModal &&
      location.pathname !== "/recomendacao" &&
      !DASHBOARD_PATHS.includes(location.pathname)
    ) {
      navigate("/recomendacao");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMobile, showRecommendationModal, location.pathname]);
}

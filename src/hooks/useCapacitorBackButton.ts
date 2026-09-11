import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { App as CapacitorApp } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { useRecommendationResult } from "@/hooks/useRecommendationResult";

// On Android, closes the app on the home route, otherwise navigates back.
// A recommendation shown inline on the dashboard (see ContentModal's
// fullScreenOnMobile) doesn't change the route at all, so it has to be
// checked first — otherwise back-press on "/" would exit the app instead
// of closing the overlay, right when it's actually open.
export function useCapacitorBackButton() {
  const navigate = useNavigate();
  const location = useLocation();
  const { showRecommendationModal, setShowRecommendationModal } = useRecommendationResult();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const listenerPromise = CapacitorApp.addListener("backButton", () => {
      if (showRecommendationModal) {
        setShowRecommendationModal(false);
      } else if (location.pathname === "/") {
        CapacitorApp.exitApp();
      } else {
        navigate(-1);
      }
    });

    return () => {
      listenerPromise.then((listener) => listener.remove());
    };
  }, [navigate, location.pathname, showRecommendationModal, setShowRecommendationModal]);
}

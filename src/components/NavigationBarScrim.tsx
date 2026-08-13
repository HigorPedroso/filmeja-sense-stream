import { useEffect, useState } from "react";
import { useRecommendationResult } from "@/hooks/useRecommendationResult";

// Mirrors StatusBarScrim, but for the bottom system navigation bar/gesture
// area — same reasoning: position: fixed keeps it pinned to the real
// viewport bottom regardless of which screen's scroll container is active,
// so scrolling content doesn't sit flush (and unreadable) under the system
// back/home/recents buttons.
export const NavigationBarScrim = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  // The details screen shows a banner ad right above this area — blur it in
  // as soon as that screen opens instead of waiting for the user to scroll.
  const { showRecommendationModal } = useRecommendationResult();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 8);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true, capture: true });
    return () => window.removeEventListener("scroll", handleScroll, true);
  }, []);

  const shouldBlur = isScrolled || showRecommendationModal;

  return (
    <div
      aria-hidden
      className={`fixed bottom-0 left-0 right-0 z-40 pointer-events-none transition-all duration-300 ${
        shouldBlur ? "bg-filmeja-dark/70 backdrop-blur-md border-t border-white/5" : "bg-transparent"
      }`}
      style={{ height: "env(safe-area-inset-bottom)" }}
    />
  );
};

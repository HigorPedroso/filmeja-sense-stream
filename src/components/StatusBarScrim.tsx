import { useEffect, useState } from "react";

// A thin, fixed strip behind the status bar that blurs in once the page
// scrolls, so scrolling content doesn't sit flush (and unreadable) under the
// system clock/icons. Rendered once at the app root — position: fixed keeps
// it pinned to the viewport regardless of which screen's scroll container is
// active, unlike a per-page sticky header (which stops sticking once its own
// container scrolls out of view).
export const StatusBarScrim = () => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 8);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true, capture: true });
    return () => window.removeEventListener("scroll", handleScroll, true);
  }, []);

  return (
    <div
      aria-hidden
      className={`fixed top-0 left-0 right-0 z-40 pointer-events-none transition-all duration-300 ${
        isScrolled ? "bg-filmeja-dark/70 backdrop-blur-md border-b border-white/5" : "bg-transparent"
      }`}
      style={{ height: "env(safe-area-inset-top)" }}
    />
  );
};

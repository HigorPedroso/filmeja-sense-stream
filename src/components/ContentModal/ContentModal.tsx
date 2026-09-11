
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ContentModalProps } from "./types";
import { ContentModalSkeleton } from "./ContentModalSkeleton";
import { ContentResultView } from "./ContentResultView";
import { useIsMobile } from "@/hooks/use-mobile";
import { useBannerAdHeight } from "@/hooks/useBannerAdHeight";
import { Capacitor } from "@capacitor/core";

export const ContentModal = ({
  isOpen,
  onOpenChange,
  content,
  isLoading,
  onRequestNew,
  hasReachedLimit,
  fullScreenOnMobile,
}: ContentModalProps) => {
  const isMobile = useIsMobile();
  const bannerHeight = useBannerAdHeight();

  // ContentModal is rendered by several always-mounted components at once
  // (Dashboard, the desktop Sidebar, MobileSidebar), all bound to the same
  // shared isOpen/content — so only ONE instance may render its own UI on
  // mobile, or the same recommendation shows up tripled. Historically that
  // was solved by having every instance render nothing on mobile and
  // instead pushing the dedicated /recomendacao route once, globally, via
  // useRecommendationNavigation — but that meant closing it always
  // navigated back through a route change, which unmounted (and fully
  // re-fetched) whatever page opened it. Dashboard's own instance now
  // passes fullScreenOnMobile to render inline instead, so opening/closing
  // a recommendation from the dashboard never leaves it — Sidebar's and
  // MobileSidebar's instances still return null here and rely on the route
  // for entry points that don't have Dashboard mounted underneath them
  // (Favorites, Profile, Filmin.IA chat, ...).
  //
  // iOS-only exception: rendering inline here caused a visible flicker
  // between this overlay and the dashboard underneath on iOS specifically
  // — a WKWebView paint/compositing quirk, not seen on Android. Until
  // that's root-caused, iOS keeps using the /recomendacao route even from
  // Dashboard (useRecommendationNavigation is kept in sync with this).
  const canRenderInline = fullScreenOnMobile && Capacitor.getPlatform() !== "ios";

  if (isMobile && isOpen && !canRenderInline) return null;

  if (isMobile) {
    if (!isOpen) return null;
    return (
      <div
        className="fixed inset-0 z-50 bg-filmeja-dark overflow-y-auto px-4 native-scroll"
        style={{
          paddingTop: "max(2rem, calc(1rem + env(safe-area-inset-top)))",
          paddingBottom: `calc(max(1.5rem, env(safe-area-inset-bottom)) + ${bannerHeight}px + 1.5rem)`,
        }}
      >
        {isLoading || !content ? (
          <ContentModalSkeleton />
        ) : (
          <ContentResultView
            content={content}
            onClose={() => onOpenChange(false)}
            onRequestNew={onRequestNew}
            hasReachedLimit={hasReachedLimit}
          />
        )}
      </div>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl bg-filmeja-dark/95 border-filmeja-purple/20 h-[90vh] md:h-auto overflow-y-auto">
        {isLoading ? (
          <ContentModalSkeleton />
        ) : (
          content && (
            <ContentResultView
              content={content}
              onClose={() => onOpenChange(false)}
              onRequestNew={onRequestNew}
              hasReachedLimit={hasReachedLimit}
            />
          )
        )}
      </DialogContent>
    </Dialog>
  );
};

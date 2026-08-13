
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ContentModalProps } from "./types";
import { ContentModalSkeleton } from "./ContentModalSkeleton";
import { ContentResultView } from "./ContentResultView";
import { useIsMobile } from "@/hooks/use-mobile";

export const ContentModal = ({
  isOpen,
  onOpenChange,
  content,
  isLoading,
  onRequestNew,
  hasReachedLimit,
}: ContentModalProps) => {
  const isMobile = useIsMobile();

  // On mobile, the dedicated /recomendacao screen is what actually shows
  // this — pushing it there is handled once, globally, by
  // useRecommendationNavigation (see App.tsx). ContentModal is rendered by
  // several always-mounted components at once (Dashboard, the desktop
  // Sidebar, MobileSidebar), all bound to the same shared isOpen/content;
  // if each one pushed the route itself, a single open fired one navigate()
  // per mounted instance, stacking duplicate history entries that a single
  // close could never fully undo. This only decides not to render its own
  // Dialog on mobile — no navigation here.
  const shouldUseFullScreen = isMobile && isOpen;

  if (shouldUseFullScreen) return null;

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

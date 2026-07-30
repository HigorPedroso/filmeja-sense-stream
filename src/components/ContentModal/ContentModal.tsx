
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();

  // On mobile, push the dedicated result screen right away instead of
  // showing a loading dialog first. The screen reads isOpen/isLoading/content
  // from the same shared RecommendationResult context, so it keeps updating
  // live even after this component (and whatever page rendered it) unmounts.
  const shouldUseFullScreen = isMobile && isOpen;

  useEffect(() => {
    if (shouldUseFullScreen) {
      navigate("/recomendacao");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldUseFullScreen]);

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

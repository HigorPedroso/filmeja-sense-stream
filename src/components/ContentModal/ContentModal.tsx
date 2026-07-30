
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

  // On mobile, once the result is ready, push a dedicated screen instead of
  // showing it inside a small dialog. While it's still loading, we keep
  // showing the (small) loading dialog below, same as on desktop.
  const readyToOpenScreen = isMobile && isOpen && !isLoading && !!content;

  useEffect(() => {
    if (readyToOpenScreen) {
      onOpenChange(false);
      navigate("/recomendacao", { state: { content } });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readyToOpenScreen]);

  if (readyToOpenScreen) return null;

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

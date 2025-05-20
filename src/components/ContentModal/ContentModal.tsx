
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useState, useEffect } from "react";
import { ContentModalProps, ContentType } from "./types";
import { ContentModalSkeleton } from "./ContentModalSkeleton";
import { ContentDetails } from "./ContentDetails";
import { TrailerModal } from "./TrailerModal";
import { StreamingModal } from "./StreamingModal";
import { useTrailerHandler } from "./useTrailerHandler";
import { useContentActions } from "./useContentActions";
import { X } from "lucide-react"; // Add this import

export const ContentModal = ({
  isOpen,
  onOpenChange,
  content,
  isLoading,
  onRequestNew,
  selectedMood,
  onMarkAsWatched,
}: ContentModalProps) => {
  const [contentData, setContentData] = useState<ContentType>({
    id: 0,
    title: "",
    mediaType: "movie",
  });
  
  useEffect(() => {
    if (content) {
      setContentData({
        ...content,
        title: content.title || content.name,
        mediaType: content.mediaType,
      });
    }
  }, [content]);
  
  const {
    showTrailerModal,
    trailerUrl,
    isTransitioning,
    handleTrailerClick,
    closeTrailerModal
  } = useTrailerHandler({
    title: contentData.title,
    videos: contentData.videos,
    mediaType: contentData.mediaType
  });
  
  const {
    isWatched,
    isFavorite,
    showStreamingModal,
    setShowStreamingModal,
    handleFavoriteToggle,
    markAsWatched,
    handleWatchClick
  } = useContentActions(contentData);
  
  const handleNextSuggestion = async () => {
    closeTrailerModal();
    if (onRequestNew) {
      await onRequestNew();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl bg-filmeja-dark/95 border-filmeja-purple/20 h-[90vh] md:h-auto overflow-y-auto">
        {isLoading ? (
          <ContentModalSkeleton />
        ) : (
          content && (
            <div className="relative">
              <div
                className="absolute inset-0 opacity-20 blur-md"
                style={{
                  backgroundImage: `url(https://image.tmdb.org/t/p/original${content.backdrop_path})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              />
              
              <ContentDetails 
                content={contentData}
                isFavorite={isFavorite}
                isWatched={isWatched}
                onFavoriteToggle={handleFavoriteToggle}
                onMarkAsWatched={markAsWatched}
                onTrailerClick={handleTrailerClick}
                onWatchClick={handleWatchClick}
                onNextSuggestion={onRequestNew ? handleNextSuggestion : undefined}
                onClose={() => onOpenChange(false)}
              />
              
              <TrailerModal
                isOpen={showTrailerModal}
                onClose={closeTrailerModal}
                content={contentData}
                trailerUrl={trailerUrl}
                isTransitioning={isTransitioning}
              />
              
              <StreamingModal
                isOpen={showStreamingModal}
                onClose={() => setShowStreamingModal(false)}
                content={contentData}
              />
            </div>
          )
        )}
      </DialogContent>
    </Dialog>
  );
};

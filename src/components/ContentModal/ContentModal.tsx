
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
  hasReachedLimit, // Add this prop
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
              
              {hasReachedLimit && (
                <div className="absolute inset-0 bg-black/80 backdrop-blur-xl z-50 flex flex-col items-center justify-center p-6 text-center">
                  <h3 className="text-2xl font-bold text-white mb-4">Limite de Visualizações Atingido</h3>
                  <p className="text-gray-200 mb-6">
                    Assine o plano premium para continuar descobrindo recomendações incríveis!
                  </p>
                  <button
                    onClick={() => {
                      onOpenChange(false);
                      // Trigger premium modal from parent
                      window.dispatchEvent(new CustomEvent('openPremiumModal'));
                    }}
                    className="bg-filmeja-purple hover:bg-filmeja-purple/90 text-white px-6 py-2 rounded-lg"
                  >
                    Assinar Premium
                  </button>
                </div>
              )}
              
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

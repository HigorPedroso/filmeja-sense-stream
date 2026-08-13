import { useState, useEffect } from "react";
import { ContentType } from "./types";
import { ContentDetails } from "./ContentDetails";
import { TrailerModal } from "./TrailerModal";
import { StreamingModal } from "./StreamingModal";
import { useTrailerHandler } from "./useTrailerHandler";
import { useContentActions } from "./useContentActions";
import { trackEvent } from "@/lib/analytics/trackEvent";

interface ContentResultViewProps {
  content: ContentType;
  onClose: () => void;
  onRequestNew?: () => Promise<void>;
  hasReachedLimit?: boolean;
}

// Shared between the desktop dialog (ContentModal) and the dedicated mobile
// result screen (pages/RecommendationResult) so both stay in sync for free.
export const ContentResultView = ({
  content,
  onClose,
  onRequestNew,
  hasReachedLimit,
}: ContentResultViewProps) => {
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
    closeTrailerModal,
  } = useTrailerHandler({
    title: contentData.title,
    videos: contentData.videos,
    mediaType: contentData.mediaType,
  });

  const {
    isWatched,
    isFavorite,
    showStreamingModal,
    setShowStreamingModal,
    handleFavoriteToggle,
    markAsWatched,
    handleWatchClick,
  } = useContentActions(contentData);

  const handleNextSuggestion = async () => {
    closeTrailerModal();
    trackEvent("title_disliked", {
      tmdbId: contentData.id,
      title: contentData.title || contentData.name,
      mediaType: contentData.mediaType,
    });
    if (onRequestNew) {
      await onRequestNew();
    }
  };

  return (
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
              onClose();
              window.dispatchEvent(new CustomEvent("openPremiumModal"));
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
        onClose={onClose}
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
  );
};

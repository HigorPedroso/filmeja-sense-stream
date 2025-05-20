
import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ContentType } from "./types";
import ContentDetails from "./ContentDetails";
import { ContentModalSkeleton } from "./ContentModalSkeleton";
import { TrailerModal } from "./TrailerModal";
import { useTrailerHandler } from "./useTrailerHandler";
import { useContentActions } from "./useContentActions";

export interface ContentModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  content: ContentType | null;
  isLoading: boolean;
  onRequestNew?: () => Promise<void>;
  selectedMood?: string | null;
  onMarkAsWatched?: (content: ContentType) => Promise<void>;
}

export const ContentModal = ({
  isOpen,
  onOpenChange,
  content,
  isLoading,
  onRequestNew,
  selectedMood,
  onMarkAsWatched,
}: ContentModalProps) => {
  const { toast } = useToast();
  const [isFavorite, setIsFavorite] = useState(false);
  const [isWatched, setIsWatched] = useState(false);
  const [showingTrailer, setShowingTrailer] = useState(false);
  
  const { handleTrailerClick, trailerKey } = useTrailerHandler(content);
  const { toggleFavorite, markAsWatched } = useContentActions(content, toast);

  useEffect(() => {
    const checkFavoriteStatus = async () => {
      if (!content) return;

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Check if this content is in favorites
        const { data: favorite } = await supabase
          .from("favorite_content")
          .select("*")
          .eq("user_id", user.id)
          .eq("tmdb_id", content.id)
          .eq("media_type", content.mediaType)
          .maybeSingle();

        setIsFavorite(!!favorite);

        // Check if this content is marked as watched
        const { data: watched } = await supabase
          .from("watched_content")
          .select("*")
          .eq("user_id", user.id)
          .eq("tmdb_id", content.id)
          .eq("media_type", content.mediaType)
          .maybeSingle();

        setIsWatched(!!watched);
      } catch (error) {
        console.error("Error checking favorite/watched status:", error);
      }
    };

    if (isOpen && content) {
      checkFavoriteStatus();
    }
  }, [isOpen, content]);

  const handleFavoriteToggle = async () => {
    const newStatus = await toggleFavorite(isFavorite);
    setIsFavorite(newStatus);
  };

  const handleMarkAsWatched = async () => {
    if (onMarkAsWatched && content) {
      await onMarkAsWatched(content);
      setIsWatched(true);
      return;
    }

    const newStatus = await markAsWatched(isWatched);
    setIsWatched(newStatus);
  };

  const handleWatchClick = () => {
    // Logic for showing streaming options
    toast({
      title: "Plataformas de streaming",
      description: "Veja onde assistir este conteúdo",
    });
  };

  const handleNextSuggestion = async () => {
    if (onRequestNew) {
      await onRequestNew();
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {isLoading ? (
            <ContentModalSkeleton />
          ) : (
            content && (
              <ContentDetails 
                content={content}
                isFavorite={isFavorite}
                isWatched={isWatched}
                onFavoriteToggle={handleFavoriteToggle}
                onMarkAsWatched={handleMarkAsWatched}
                onTrailerClick={async () => {
                  await handleTrailerClick();
                  setShowingTrailer(true);
                }}
                onWatchClick={handleWatchClick}
                onNextSuggestion={handleNextSuggestion}
                onClose={() => onOpenChange(false)}
              />
            )
          )}
        </DialogContent>
      </Dialog>

      <TrailerModal
        isOpen={showingTrailer}
        onClose={() => setShowingTrailer(false)}
        trailerKey={trailerKey}
        title={content?.title || content?.name || ""}
      />
    </>
  );
};

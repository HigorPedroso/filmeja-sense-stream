
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { ContentType } from "./types";
import { trackEvent } from "@/lib/analytics/trackEvent";

export const useContentActions = (content: ContentType) => {
  const { t } = useTranslation();
  const [isWatched, setIsWatched] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showStreamingModal, setShowStreamingModal] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const checkIfFavorite = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("favorite_content")
          .select()
          .eq("user_id", user.id)
          .eq("tmdb_id", String(content.id))
          .single();

        setIsFavorite(!!data);
      }
    };

    checkIfFavorite();
  }, [content.id]);

  useEffect(() => {
    const checkIfWatched = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("watched_content")
          .select()
          .eq("user_id", user.id)
          .eq("tmdb_id", Number(content.id))
          .single();

        setIsWatched(!!data);
      }
    };

    checkIfWatched();
  }, [content.id]);

  const handleFavoriteToggle = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: t("result.toasts.favoriteLoginRequired.title"),
          description: t("result.toasts.favoriteLoginRequired.description"),
          variant: "destructive",
        });
        return;
      }

      if (isFavorite) {
        await supabase
          .from("favorite_content")
          .delete()
          .eq("user_id", user.id)
          .eq("tmdb_id", String(content.id));

        setIsFavorite(false);
        toast({
          title: t("result.toasts.favoriteRemoved.title"),
          description: t("result.toasts.favoriteRemoved.description"),
        });
      } else {
        await supabase.from("favorite_content").insert({
          user_id: user.id,
          tmdb_id: String(content.id),
          media_type: content.mediaType,
          title: content.title || content.name,
        });

        setIsFavorite(true);
        trackEvent("title_saved", {
          tmdbId: content.id,
          title: content.title || content.name,
          mediaType: content.mediaType,
        });
        toast({
          title: t("result.toasts.favoriteAdded.title"),
          description: t("result.toasts.favoriteAdded.description"),
        });
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
      toast({
        title: t("result.toasts.favoriteError.title"),
        description: t("result.toasts.favoriteError.description"),
        variant: "destructive",
      });
    }
  };

  const markAsWatched = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: t("dashboard.toasts.watchedRequiresLogin.title"),
          description: t("dashboard.toasts.watchedRequiresLogin.description"),
          variant: "destructive",
        });
        return;
      }

      if (isWatched) {
        await supabase
          .from("watched_content")
          .delete()
          .eq("user_id", user.id)
          .eq("tmdb_id", Number(content.id));

        setIsWatched(false);
        toast({
          title: t("result.toasts.watchedRemoved.title"),
          description: t("result.toasts.watchedRemoved.description"),
        });
      } else {
        await supabase.from("watched_content").insert({
          user_id: user.id,
          tmdb_id: Number(content.id),
          media_type: content.mediaType,
          title: content.title || content.name || "",
          watched_at: new Date().toISOString(),
        });

        setIsWatched(true);
        toast({
          title: t("result.toasts.watchedAdded.title"),
          description: t("result.toasts.watchedAdded.description"),
        });
      }
    } catch (error) {
      console.error("Error marking content as watched:", error);
      toast({
        title: t("result.toasts.watchedError.title"),
        description: t("result.toasts.watchedError.description"),
        variant: "destructive",
      });
    }
  };

  const handleWatchClick = () => {
    if (content.providers?.flatrate?.length > 0) {
      setShowStreamingModal(true);
      trackEvent("title_liked", {
        tmdbId: content.id,
        title: content.title || content.name,
        mediaType: content.mediaType,
      });
    } else {
      toast({
        title: t("result.toasts.streamingUnavailable.title"),
        description: t("result.toasts.streamingUnavailable.description"),
        variant: "destructive",
      });
    }
  };

  return {
    isWatched,
    isFavorite,
    showStreamingModal,
    setShowStreamingModal,
    handleFavoriteToggle,
    markAsWatched,
    handleWatchClick
  };
};

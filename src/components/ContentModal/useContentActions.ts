
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { ContentType } from "./types";

export const useContentActions = (content: ContentType) => {
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
          title: "Erro",
          description: "Você precisa estar logado para favoritar",
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
          title: "Removido",
          description: "Conteúdo removido dos favoritos",
        });
      } else {
        await supabase.from("favorite_content").insert({
          user_id: user.id,
          tmdb_id: String(content.id),
          media_type: content.mediaType,
          title: content.title || content.name,
        });

        setIsFavorite(true);
        toast({
          title: "Adicionado",
          description: "Conteúdo adicionado aos favoritos",
        });
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar os favoritos",
        variant: "destructive",
      });
    }
  };

  const markAsWatched = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Erro",
          description: "Você precisa estar logado para marcar como assistido",
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
          title: "Removido",
          description: "Conteúdo removido da sua lista de assistidos",
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
          title: "Marcado como assistido",
          description: "Conteúdo adicionado à sua lista de assistidos",
        });
      }
    } catch (error) {
      console.error("Error marking content as watched:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status do conteúdo",
        variant: "destructive",
      });
    }
  };

  const handleWatchClick = () => {
    if (content.providers?.flatrate?.length > 0) {
      setShowStreamingModal(true);
    } else {
      toast({
        title: "Indisponível",
        description:
          "Este conteúdo não está disponível em nenhum serviço de streaming no momento.",
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

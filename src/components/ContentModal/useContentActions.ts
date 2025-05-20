
import { supabase } from "@/integrations/supabase/client";
import { ContentType } from "./types";

export const useContentActions = (content: ContentType | null, toast: any) => {
  const toggleFavorite = async (isFavorite: boolean) => {
    if (!content) return false;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Faça login",
          description: "Você precisa estar logado para favoritar conteúdo.",
          variant: "destructive",
        });
        return false;
      }

      if (isFavorite) {
        // Remove from favorites
        const { error } = await supabase
          .from("favorite_content")
          .delete()
          .eq("user_id", user.id)
          .eq("tmdb_id", content.id)
          .eq("media_type", content.mediaType);

        if (error) throw error;

        toast({
          title: "Removido dos favoritos",
          description: `${content.title || content.name} foi removido dos seus favoritos.`,
        });

        return false;
      } else {
        // Add to favorites
        const { error } = await supabase.from("favorite_content").insert({
          user_id: user.id,
          tmdb_id: content.id,
          media_type: content.mediaType,
          title: content.title || content.name || "Título desconhecido",
        });

        if (error) throw error;

        toast({
          title: "Adicionado aos favoritos",
          description: `${content.title || content.name} foi adicionado aos seus favoritos.`,
        });

        return true;
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar seus favoritos.",
        variant: "destructive",
      });
      return isFavorite;
    }
  };

  const markAsWatched = async (isWatched: boolean) => {
    if (!content) return false;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Faça login",
          description: "Você precisa estar logado para marcar como assistido.",
          variant: "destructive",
        });
        return false;
      }

      if (isWatched) {
        // Remove from watched
        const { error } = await supabase
          .from("watched_content")
          .delete()
          .eq("user_id", user.id)
          .eq("tmdb_id", content.id)
          .eq("media_type", content.mediaType);

        if (error) throw error;

        toast({
          title: "Removido dos assistidos",
          description: `${content.title || content.name} foi removido da sua lista de assistidos.`,
        });

        return false;
      } else {
        // Add to watched
        const { error } = await supabase.from("watched_content").insert({
          user_id: user.id,
          tmdb_id: content.id,
          media_type: content.mediaType,
          title: content.title || content.name || "Título desconhecido",
        });

        if (error) throw error;

        toast({
          title: "Marcado como assistido",
          description: `${content.title || content.name} foi adicionado à sua lista de assistidos.`,
        });

        return true;
      }
    } catch (error) {
      console.error("Error marking as watched:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar sua lista de assistidos.",
        variant: "destructive",
      });
      return isWatched;
    }
  };

  return { toggleFavorite, markAsWatched };
};

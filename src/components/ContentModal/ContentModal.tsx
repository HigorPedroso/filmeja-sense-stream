import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Star, Heart, Play, X, Check, Eye } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ContentModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  content: any;
  isLoading: boolean;
  onRequestNew?: () => void;
  selectedMood?: string;
  onMarkAsWatched: (content: any) => Promise<void>;
}

interface Database {
  public: {
    Tables: {
      watched_content: {
        Row: {
          id: string;
          user_id: string;
          tmdb_id: string; // Changed from content_id to tmdb_id and type to string
          media_type: string; // Changed from content_type to media_type
          title: string;
          watched_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          tmdb_id: string; // Changed type to string
          media_type: string; // Changed from content_type
          title: string;
          watched_at?: string;
        };
      };
    };
  };
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
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl bg-filmeja-dark/95 border-filmeja-purple/20">
        {isLoading ? (
          <ContentModalSkeleton />
        ) : (
          content && (
            <ContentModalContent
              content={content}
              onRequestNew={onRequestNew}
              selectedMood={selectedMood}
              onMarkAsWatched={onMarkAsWatched}
            />
          )
        )}
      </DialogContent>
    </Dialog>
  );
};

const ContentModalSkeleton = () => {
  return (
    <div className="relative">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="md:w-1/3">
          <Skeleton className="w-full aspect-[2/3] rounded-lg" />
          <div className="mt-4 space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>
        </div>

        <div className="md:w-2/3">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>

          <div className="flex items-center gap-2 my-4">
            <div className="flex gap-1">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="w-4 h-4 rounded-full" />
              ))}
            </div>
            <Skeleton className="h-4 w-32" />
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-6 w-20 rounded-full" />
            ))}
          </div>

          <div className="space-y-2 mb-6">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>

          <div className="mb-6">
            <Skeleton className="h-6 w-32 mb-2" />
            <div className="flex flex-wrap gap-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Skeleton className="w-6 h-6 rounded-full" />
                  <Skeleton className="h-6 w-24" />
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-10 w-32" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const ContentModalContent = ({
  content,
  onRequestNew,
  selectedMood,
  onMarkAsWatched,
}) => {
  const [showTrailerModal, setShowTrailerModal] = useState(false);
  const [trailerSource, setTrailerSource] = useState<"tmdb" | "youtube" | null>(
    null
  );
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [trailerUrl, setTrailerUrl] = useState<string>("");
  const [contentData, setContentData] = useState({
    title: content?.title || content?.name,
    videos: content?.videos,
    mediaType: content?.mediaType,
  });
  const { toast } = useToast();
  const [isWatched, setIsWatched] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showStreamingModal, setShowStreamingModal] = useState(false);

  useEffect(() => {
    if (content) {
      setContentData({
        title: content.title || content.name,
        videos: content.videos,
        mediaType: content.mediaType,
      });
    }
  }, [content]);

  useEffect(() => {
    const checkIfFavorite = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
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

  const handleTrailerClick = async () => {
    setShowTrailerModal(true);
    setIsTransitioning(true);

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

    try {
      if (contentData.videos?.length > 0) {
        setTrailerSource("tmdb");
        const url = `https://www.youtube.com/embed/${contentData.videos[0]?.key}?autoplay=1`;
        setTrailerUrl(url);
      } else {
        setTrailerSource("youtube");
        const url = await getTrailerUrl();
        setTrailerUrl(url);
      }
    } catch (error) {
      console.error("Error setting trailer URL:", error);
    }

    setIsTransitioning(false);
  };

  const getTrailerUrl = async () => {
    if (trailerSource === "tmdb") {
      return `https://www.youtube.com/embed/${contentData.videos[0]?.key}?autoplay=1`;
    }

    const apiKey = "AIzaSyB0F3SGk2QWvSg5pBr96a_mTu8SzZ4yAfA";
    const searchQuery = encodeURIComponent(
      `${contentData.title} ${
        contentData.mediaType === "movie" ? "filme" : "série"
      } trailer oficial`
    );
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=1&q=${searchQuery}&key=${apiKey}`;

    try {
      const res = await fetch(url);
      const data = await res.json();

      if (data.items && data.items.length > 0) {
        const videoId = data.items[0].id.videoId;
        return `https://www.youtube.com/embed/${videoId}?autoplay=1`;
      }
    } catch (error) {
      console.error("Error fetching trailer:", error);
    }

    return `https://www.youtube.com/embed?listType=search&list=${searchQuery}&autoplay=1`;
  };

  const markAsWatched = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
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
          .eq("tmdb_id", String(content.id));

        setIsWatched(false);
        toast({
          title: "Removido",
          description: "Conteúdo removido da sua lista de assistidos",
        });
      } else {
        await supabase.from("watched_content").insert({
          user_id: user.id,
          tmdb_id: String(content.id),
          media_type: content.mediaType,
          title: content.title || content.name,
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

  const handleNextSuggestion = async () => {
    setShowTrailerModal(false);
    setTrailerSource(null);
    setTrailerUrl("");
    if (onRequestNew) {
      await onRequestNew();
    }
  };

  const handleFavoriteToggle = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
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

  useEffect(() => {
    const checkIfWatched = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("watched_content")
          .select()
          .eq("user_id", user.id)
          .eq("tmdb_id", String(content.id)) // Convert to string
          .single();

        setIsWatched(!!data);
      }
    };

    checkIfWatched();
  }, [content.id]);

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

      <div className="relative z-10">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="md:w-1/3">
            <div className="relative">
              <div className="absolute -top-2 -right-2 z-10">
                <motion.div
                  initial={{ scale: 0, rotate: -10 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", duration: 0.6 }}
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    content.mediaType === "movie"
                      ? "bg-filmeja-purple text-white"
                      : "bg-filmeja-blue text-white"
                  }`}
                >
                  {content.mediaType === "movie" ? "Filme" : "Série"}
                </motion.div>
              </div>
              <img
                src={`https://image.tmdb.org/t/p/w500${content.poster_path}`}
                alt={content.title}
                className="rounded-lg w-full object-cover shadow-xl"
              />
            </div>

            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-sm text-gray-300">
                <span>Lançamento:</span>
                <span>{new Date(content.release_date).getFullYear()}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-gray-300">
                <span>Duração:</span>
                <span>{content.runtime} minutos</span>
              </div>
              <div className="flex items-center justify-between text-sm text-gray-300">
                <span>Idioma:</span>
                <span>{content.original_language?.toUpperCase()}</span>
              </div>
            </div>
          </div>

          <div className="md:w-2/3">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">
                  {content.title}
                </h2>
                <p className="text-gray-400 text-sm">{content.tagline}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 my-4">
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < Math.round(content.vote_average / 2)
                        ? "text-yellow-400 fill-yellow-400"
                        : "text-gray-600"
                    }`}
                  />
                ))}
              </div>
              <span className="text-gray-400 text-sm">
                ({content.vote_average?.toFixed(1)}/10)
              </span>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              {content.genres?.map((genre: any) => (
                <span
                  key={genre.id}
                  className="px-3 py-1 rounded-full text-sm bg-white/10 text-white"
                >
                  {genre.name}
                </span>
              ))}
            </div>

            <p className="text-gray-300 mb-6">{content.overview}</p>

            {content.providers?.flatrate && (
              <div className="mb-6">
                <h3 className="text-white font-semibold mb-2">
                  Disponível em:
                </h3>
                <div className="flex flex-wrap gap-3">
                  {content.providers.flatrate.map((provider: any) => (
                    <div
                      key={provider.provider_id}
                      className="flex items-center bg-white/10 rounded-full px-3 py-1"
                    >
                      <img
                        src={`https://image.tmdb.org/t/p/original${provider.logo_path}`}
                        alt={provider.provider_name}
                        className="w-6 h-6 rounded-full mr-2"
                      />
                      <span className="text-sm text-white">
                        {provider.provider_name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              <Button
                className="bg-filmeja-purple hover:bg-filmeja-purple/90"
                onClick={handleWatchClick}
                disabled={!content.providers?.flatrate?.length}
              >
                <Play className="w-4 h-4 mr-2" />
                Assistir Agora
              </Button>
              <motion.div whileTap={{ scale: 0.95 }} className="relative">
                <motion.div
                  className="absolute -inset-1 bg-gradient-to-r from-filmeja-purple to-filmeja-blue rounded-lg blur-sm"
                  animate={{
                    opacity: [0.5, 0.8, 0.5],
                    scale: [1, 1.05, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
                <Button
                  variant="outline"
                  className="relative border-2 border-white/20 hover:bg-white/10 group overflow-hidden"
                  onClick={handleTrailerClick}
                >
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-filmeja-purple to-filmeja-blue opacity-0 group-hover:opacity-30 transition-opacity"
                    initial={{ x: "-100%" }}
                    whileHover={{ x: "100%" }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                  />
                  <motion.div
                    className="relative z-10 flex items-center"
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Ver Trailer
                  </motion.div>
                </Button>
              </motion.div>
              <Button
                variant="outline"
                className={`border-white/20 hover:bg-white/10 ${
                  isFavorite ? "bg-filmeja-purple/20" : ""
                }`}
                onClick={handleFavoriteToggle}
              >
                <motion.div
                  className="relative z-10 flex items-center"
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  <Heart
                    className={`w-4 h-4 mr-2 ${
                      isFavorite ? "fill-filmeja-purple" : ""
                    }`}
                  />
                  {isFavorite ? "Remover dos Favoritos" : "Adicionar à Lista"}
                </motion.div>
              </Button>
              <Button
                variant="outline"
                className={`border-white/20 hover:bg-white/10 ${
                  isWatched ? "bg-filmeja-purple/20" : ""
                }`}
                onClick={markAsWatched}
              >
                <motion.div
                  className="relative z-10 flex items-center"
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  {isWatched ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                  <span className="ml-2">
                    {isWatched
                      ? content?.mediaType === "tv"
                        ? "Já assisti todas as temporadas"
                        : "Já assisti este filme"
                      : content?.mediaType === "tv"
                      ? "Marcar todas temporadas como vistas"
                      : "Marcar filme como visto"}
                  </span>
                </motion.div>
              </Button>
              {onRequestNew && (
                <Button
                  variant="outline"
                  className="border-white/20 hover:bg-white/10"
                  onClick={handleNextSuggestion}
                >
                  Próxima Sugestão
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
      <AnimatePresence>
        {showTrailerModal && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          >
            <div className="relative w-full max-w-4xl aspect-video">
              <Button
                variant="ghost"
                size="icon"
                className="absolute -top-10 right-0 text-white hover:bg-white/10"
                onClick={() => {
                  setShowTrailerModal(false);
                  setTrailerSource(null);
                }}
              >
                <X className="w-6 h-6" />
              </Button>

              <AnimatePresence mode="wait">
                {isTransitioning ? (
                  <motion.div
                    key="transition"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <div className="text-white text-xl">
                      Buscando trailer alternativo...
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="player"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="w-full h-full"
                  >
                    <iframe
                      className="w-full h-full rounded-lg"
                      src={trailerUrl}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {showStreamingModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="bg-filmeja-dark/95 rounded-xl p-6 max-w-lg w-full relative border border-filmeja-purple/20"
          >
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-2 text-white/60 hover:text-white"
              onClick={() => setShowStreamingModal(false)}
            >
              <X className="w-5 h-5" />
            </Button>

            <h3 className="text-xl font-semibold text-white mb-4">
              Onde Assistir
            </h3>

            <div className="space-y-3">
              {content.providers?.flatrate?.map(
                (provider: any, index: number) => (
                  <motion.div
                    key={provider.provider_id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Button
                      variant="outline"
                      className="w-full bg-white/5 hover:bg-white/10 border-white/10 group"
                      onClick={() =>
                        window.open(provider.provider_url, "_blank")
                      }
                    >
                      <div className="flex items-center w-full">
                        <img
                          src={`https://image.tmdb.org/t/p/original${provider.logo_path}`}
                          alt={provider.provider_name}
                          className="w-8 h-8 rounded-full mr-3"
                        />
                        <span className="flex-1 text-left text-white group-hover:text-filmeja-purple transition-colors">
                          {provider.provider_name}
                        </span>
                        <Play className="w-4 h-4 text-white/60 group-hover:text-filmeja-purple transition-colors" />
                      </div>
                    </Button>
                  </motion.div>
                )
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

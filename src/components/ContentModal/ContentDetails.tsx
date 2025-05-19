
import { useState } from "react";
import { motion } from "framer-motion";
import { Star, Heart, Check, Eye, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ContentType } from "./types";

interface ContentDetailsProps {
  content: ContentType;
  isFavorite: boolean;
  isWatched: boolean;
  onFavoriteToggle: () => Promise<void>;
  onMarkAsWatched: () => Promise<void>;
  onTrailerClick: () => void;
  onWatchClick: () => void;
  onNextSuggestion: (() => Promise<void>) | undefined;
}

export const ContentDetails = ({
  content,
  isFavorite,
  isWatched,
  onFavoriteToggle,
  onMarkAsWatched,
  onTrailerClick,
  onWatchClick,
  onNextSuggestion
}: ContentDetailsProps) => {
  return (
    <div className="relative z-10">
      <div className="flex flex-col md:flex-row gap-4 md:gap-6">
        {/* Poster Section */}
        <div className="md:w-1/3">
          <div className="relative max-w-[300px] mx-auto md:max-w-none">
            <div className="absolute -top-2 -right-2 z-10">
              <motion.div
                initial={{ scale: 0, rotate: -10 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", duration: 0.6 }}
                className={`px-2 md:px-3 py-1 rounded-full text-xs md:text-sm font-medium ${
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
              alt={content.title || content.name}
              className="rounded-lg w-full object-cover shadow-xl"
            />
          </div>

          {/* Mobile-only quick action buttons */}
          <div className="flex justify-center gap-3 mt-4 md:hidden">
            <Button
              variant="outline"
              size="icon"
              className="w-12 h-12 rounded-full border-white/20 hover:bg-white/10"
              onClick={onTrailerClick}
            >
              <Play className="w-5 h-5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className={`w-12 h-12 rounded-full border-white/20 hover:bg-white/10 ${
                isFavorite ? "bg-filmeja-purple/20" : ""
              }`}
              onClick={onFavoriteToggle}
            >
              <Heart
                className={`w-5 h-5 ${
                  isFavorite ? "fill-filmeja-purple" : ""
                }`}
              />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className={`w-12 h-12 rounded-full border-white/20 hover:bg-white/10 ${
                isWatched ? "bg-filmeja-purple/20" : ""
              }`}
              onClick={onMarkAsWatched}
            >
              {isWatched ? (
                <Check className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </Button>
          </div>

          <div className="mt-4 space-y-2 text-xs md:text-sm">
            <div className="flex items-center justify-between text-sm text-gray-300">
              <span>Lançamento:</span>
              <span>{content.release_date ? new Date(content.release_date).getFullYear() : 'N/A'}</span>
            </div>
            <div className="flex items-center justify-between text-sm text-gray-300">
              <span>Duração:</span>
              <span>{content.runtime ? `${content.runtime} minutos` : 'N/A'}</span>
            </div>
            <div className="flex items-center justify-between text-sm text-gray-300">
              <span>Idioma:</span>
              <span>{content.original_language?.toUpperCase() || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="md:w-2/3">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-white mb-1">
                {content.title || content.name}
              </h2>
              <p className="text-gray-400 text-xs md:text-sm">
                {content.tagline}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 my-4">
            <div className="flex gap-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${
                    i < Math.round((content.vote_average || 0) / 2)
                      ? "text-yellow-400 fill-yellow-400"
                      : "text-gray-600"
                  }`}
                />
              ))}
            </div>
            <span className="text-gray-400 text-sm">
              ({content.vote_average?.toFixed(1) || 'N/A'}/10)
            </span>
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            {content.genres?.map((genre) => (
              <span
                key={genre.id}
                className="px-3 py-1 rounded-full text-sm bg-white/10 text-white"
              >
                {genre.name}
              </span>
            ))}
          </div>

          <p className="text-gray-300 mb-6">{content.overview}</p>

          {content.providers?.flatrate && content.providers.flatrate.length > 0 && (
            <div className="mb-6">
              <h3 className="text-white font-semibold mb-2">
                Disponível em:
              </h3>
              <div className="flex flex-wrap gap-3">
                {content.providers.flatrate.map((provider) => (
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
              onClick={onWatchClick}
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
                onClick={onTrailerClick}
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
              onClick={onFavoriteToggle}
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
              onClick={onMarkAsWatched}
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
            {onNextSuggestion && (
              <Button
                variant="outline"
                className="border-white/20 hover:bg-white/10"
                onClick={onNextSuggestion}
              >
                Próxima Sugestão
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

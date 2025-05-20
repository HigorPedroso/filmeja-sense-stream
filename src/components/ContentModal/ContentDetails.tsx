
import React from "react";
import { Button } from "@/components/ui/button";
import { Play, Heart, Check, X, Share2, ArrowRight } from "lucide-react";
import StreamingModal from "./StreamingModal";
import { ContentType } from "./types";

export interface ContentDetailsProps {
  content: ContentType;
  isFavorite: boolean;
  isWatched: boolean;
  onFavoriteToggle: () => Promise<void>;
  onMarkAsWatched: () => Promise<void>;
  onTrailerClick: () => Promise<void>;
  onWatchClick: () => void;
  onNextSuggestion: () => Promise<void>;
  onClose: () => void; // Add onClose prop
}

export function ContentDetails({
  content,
  isFavorite,
  isWatched,
  onFavoriteToggle,
  onMarkAsWatched,
  onTrailerClick,
  onWatchClick,
  onNextSuggestion,
  onClose,
}: ContentDetailsProps) {
  const [showStreamingModal, setShowStreamingModal] = React.useState(false);
  
  return (
    <div className="text-white">
      <div className="absolute top-4 right-4 z-10">
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="rounded-full bg-black/20 backdrop-blur-sm hover:bg-black/40"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Fechar</span>
        </Button>
      </div>

      <div className="relative mb-6">
        <div className="aspect-video overflow-hidden rounded-lg">
          {content.backdrop_path ? (
            <img
              src={`https://image.tmdb.org/t/p/w1280${content.backdrop_path}`}
              alt={content.title || content.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-filmeja-dark/40 flex items-center justify-center">
              <span className="text-gray-400">Imagem não disponível</span>
            </div>
          )}
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 to-transparent">
          <h2 className="text-2xl font-bold">
            {content.title || content.name}
          </h2>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {content.genres?.map((genre) => (
          <span
            key={genre.id}
            className="text-xs px-2 py-1 bg-filmeja-purple/20 rounded-full border border-filmeja-purple/30"
          >
            {genre.name}
          </span>
        ))}
      </div>

      <div className="flex gap-2 flex-wrap mb-6">
        <Button
          size="sm"
          className="bg-filmeja-purple hover:bg-filmeja-purple/90"
          onClick={onTrailerClick}
        >
          <Play className="mr-1 h-4 w-4" /> Trailer
        </Button>

        <Button
          size="sm"
          variant="outline"
          className="border-filmeja-purple text-filmeja-purple hover:bg-filmeja-purple/10"
          onClick={onWatchClick}
        >
          Onde Assistir
        </Button>

        <Button
          size="sm"
          variant={isFavorite ? "default" : "outline"}
          className={
            isFavorite
              ? "bg-pink-600 hover:bg-pink-700 border-pink-600"
              : "border-pink-600 text-pink-600 hover:bg-pink-600/10"
          }
          onClick={onFavoriteToggle}
        >
          <Heart className="mr-1 h-4 w-4" />
          {isFavorite ? "Favorito" : "Favoritar"}
        </Button>

        <Button
          size="sm"
          variant={isWatched ? "default" : "outline"}
          className={
            isWatched
              ? "bg-green-600 hover:bg-green-700 border-green-600"
              : "border-green-600 text-green-600 hover:bg-green-600/10"
          }
          onClick={onMarkAsWatched}
        >
          <Check className="mr-1 h-4 w-4" />
          {isWatched ? "Assistido" : "Marcar como assistido"}
        </Button>

        <Button
          size="sm"
          variant="outline"
          className="border-blue-400 text-blue-400 hover:bg-blue-400/10"
          onClick={() => setShowStreamingModal(true)}
        >
          <Share2 className="mr-1 h-4 w-4" /> Compartilhar
        </Button>

        <Button
          size="sm"
          variant="outline"
          className="border-amber-400 text-amber-400 hover:bg-amber-400/10"
          onClick={onNextSuggestion}
        >
          <ArrowRight className="mr-1 h-4 w-4" /> Próxima Sugestão
        </Button>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Sinopse</h3>
        <p className="text-gray-300">{content.overview || "Sinopse indisponível."}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
        <div>
          <span className="text-gray-400">Lançamento:</span>
          <div className="font-medium">
            {content.release_date
              ? new Date(content.release_date).getFullYear()
              : content.first_air_date
              ? new Date(content.first_air_date).getFullYear()
              : "N/A"}
          </div>
        </div>
        <div>
          <span className="text-gray-400">Avaliação:</span>
          <div className="font-medium flex items-center">
            <span>
              {content.vote_average
                ? `${(content.vote_average / 2).toFixed(1)}/5`
                : "N/A"}
            </span>
          </div>
        </div>
        <div>
          <span className="text-gray-400">
            {content.mediaType === "movie" ? "Duração:" : "Episódios:"}
          </span>
          <div className="font-medium">
            {content.mediaType === "movie"
              ? content.runtime
                ? `${content.runtime} min`
                : "N/A"
              : content.number_of_episodes || "N/A"}
          </div>
        </div>
        <div>
          <span className="text-gray-400">
            {content.mediaType === "movie" ? "Receita:" : "Temporadas:"}
          </span>
          <div className="font-medium">
            {content.mediaType === "movie"
              ? content.revenue
                ? `$${(content.revenue / 1000000).toFixed(1)}M`
                : "N/A"
              : content.number_of_seasons || "N/A"}
          </div>
        </div>
      </div>

      {showStreamingModal && (
        <StreamingModal
          isOpen={showStreamingModal}
          onClose={() => setShowStreamingModal(false)}
          providers={content.providers}
          title={content.title || content.name || ""}
        />
      )}
    </div>
  );
}

export default ContentDetails;

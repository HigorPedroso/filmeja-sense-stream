import { ContentItem } from "@/types/movie";
import { Link } from "react-router-dom";

interface MovieCardProps {
  item: ContentItem;
  size?: "small" | "medium" | "large";
  onSave?: () => void; // Make sure this prop is defined
}

// Add BookmarkPlus to imports
import { BookmarkPlus } from "lucide-react";

const MovieCard: React.FC<MovieCardProps> = ({
  item,
  size = "medium",
  onSave,
}) => {
  const sizeClasses = {
    small: "w-36 sm:w-40",
    medium: "w-44 sm:w-48",
    large: "w-56 sm:w-64",
  };

  const getImageUrl = (path: string) => {
    if (!path) return "/placeholder.svg";
    return `https://image.tmdb.org/t/p/w500${path}`;
  };

  const getMediaType = () => {
    // Check if it's explicitly set as a movie
    if (item.media_type === "movie") {
      return "Filme";
    }
    // Check if it's explicitly set as TV show
    if (item.media_type === "tv") {
      return "Série";
    }
    // Fallback checks based on date properties
    if (item.first_air_date) {
      return "Série";
    }
    if (item.release_date) {
      return "Filme";
    }
    // Default to movie if we can't determine
    return "Filme";
  };

  const mediaTypeLabel = getMediaType();

  return (
    <Link to={`/details/${item.media_type}/${item.id}`}>
      <div className={`content-card group ${sizeClasses[size]} mx-auto`}>
        <div className="aspect-[2/3] relative overflow-hidden rounded-md">
          <img
            src={getImageUrl(item.poster_path)}
            alt={item.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute top-0 right-0 bg-filmeja-purple/90 text-xs font-medium py-1 px-2 rounded-bl-md">
            {mediaTypeLabel}
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center p-2">
            <div className="w-full flex flex-col items-center">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  onSave?.();
                }}
                className="flex items-center gap-2 bg-filmeja-purple/90 px-3 py-2 rounded-full 
        hover:bg-filmeja-purple hover:scale-105 transition-all duration-300 
        animate-bounce-subtle shadow-lg hover:shadow-filmeja-purple/50
        backdrop-blur-sm mb-4"
              >
                <BookmarkPlus className="w-5 h-5 text-white" />
                <span className="text-white text-sm font-medium">Salvar</span>
              </button>

              <div className="w-full text-center">
                <h3 className="text-sm font-medium text-white line-clamp-2 mb-2">
                  {item.title}
                </h3>
                <div className="flex items-center justify-center gap-3">
                  <div className="flex items-center bg-yellow-500/20 px-1.5 py-0.5 rounded text-xs">
                    <span className="text-yellow-400">★</span>
                    <span className="text-white ml-0.5">
                      {item.vote_average.toFixed(1)}
                    </span>
                  </div>
                  <span className="text-xs text-gray-300">
                    {new Date(item.release_date).getFullYear()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default MovieCard;

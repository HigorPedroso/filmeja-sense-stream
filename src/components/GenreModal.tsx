import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ContentItem } from "@/types/movie";
import { Lock, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";

interface GenreModalProps {
  isOpen: boolean;
  onClose: () => void;
  genre: string;
  items: ContentItem[];
  loading?: boolean;
}

const MovieSkeleton = () => (
  <div className="relative">
    <div className="aspect-[2/3] w-full overflow-hidden rounded-lg">
      <Skeleton className="w-full h-full bg-gray-800/50" />
    </div>
    <div className="p-4">
      <Skeleton className="h-6 w-3/4 mb-2 bg-gray-800/50" />
      <div className="flex items-center gap-1 mb-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="w-4 h-4 rounded-full bg-gray-800/50" />
        ))}
        <Skeleton className="w-8 h-4 ml-2 bg-gray-800/50" />
      </div>
      <Skeleton className="h-4 w-full mb-2 bg-gray-800/50" />
      <Skeleton className="h-4 w-3/4 bg-gray-800/50" />
      <div className="flex flex-wrap gap-2 mt-2">
        <Skeleton className="h-6 w-16 rounded-full bg-gray-800/50" />
        <Skeleton className="h-6 w-20 rounded-full bg-gray-800/50" />
      </div>
    </div>
  </div>
);

const GenreModal = ({ isOpen, onClose, genre, items, loading }: GenreModalProps) => {
  const navigate = useNavigate();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-5xl">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <MovieSkeleton key={index} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {items.map((movie, index) => (
              <div key={movie.id} className="relative">
                <div className="aspect-[2/3] w-full overflow-hidden rounded-lg">
                  <div className="absolute inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center flex-col gap-4 z-10">
                    <Lock className="w-8 h-8 text-white/90" />
                    <h3 className="text-lg font-semibold text-white text-center px-2 text-shadow">
                      Recomendação Bloqueada
                    </h3>
                    {index === 1 && (
                      <Button 
                        className="bg-filmeja-purple hover:bg-filmeja-purple/90 shadow-lg"
                        onClick={() => navigate('/signup')}
                      >
                        Desbloquear
                      </Button>
                    )}
                  </div>
                  <img
                    src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                    alt={movie.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-4">
                  <h2 className="text-lg font-bold text-white mb-2 line-clamp-1">
                    {movie.title}
                  </h2>
                  <div className="flex items-center gap-1 mb-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star 
                        key={i} 
                        fill="currentColor"
                        className="w-4 h-4 text-filmeja-purple" 
                      />
                    ))}
                    <span className="text-white text-sm ml-2">5.0</span>
                  </div>
                  <p className="text-gray-300 text-sm line-clamp-2">
                    {movie.overview}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {movie.genres?.map((genre: any) => (
                      <span 
                        key={genre.id} 
                        className="px-2 py-1 bg-white/10 rounded-full text-xs text-white"
                      >
                        {genre.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default GenreModal;
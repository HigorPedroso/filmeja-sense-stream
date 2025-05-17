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
  <div className="relative w-full max-w-sm mx-auto">
    <div className="aspect-[2/3] w-full overflow-hidden rounded-lg max-h-[60vh] sm:max-h-[70vh]">
      <Skeleton className="w-full h-full bg-gray-800/50" />
      <div className="absolute inset-0 flex items-center justify-center flex-col gap-6 z-10">
        <Skeleton className="w-10 h-10 rounded-full bg-gray-800/50" />
        <Skeleton className="w-48 h-7 rounded-lg bg-gray-800/50" />
        <Skeleton className="w-32 h-10 rounded-lg bg-gray-800/50" />
      </div>
    </div>
    <div className="p-4">
      <Skeleton className="h-8 w-4/5 mb-4 bg-gray-800/50" />
      <div className="flex items-center gap-1.5 mb-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="w-5 h-5 rounded-full bg-gray-800/50" />
        ))}
        <Skeleton className="w-12 h-5 ml-2 bg-gray-800/50" />
      </div>
      <Skeleton className="h-20 w-full mb-4 bg-gray-800/50" />
      <div className="flex flex-wrap gap-2">
        <Skeleton className="h-7 w-24 rounded-full bg-gray-800/50" />
        <Skeleton className="h-7 w-32 rounded-full bg-gray-800/50" />
      </div>
    </div>
  </div>
);

const GenreModal = ({ isOpen, onClose, genre, items, loading }: GenreModalProps) => {
  const navigate = useNavigate();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg h-[85vh] sm:h-auto overflow-y-auto flex flex-col items-center justify-center [&>button]:z-[100]">
        {loading ? (
          <MovieSkeleton />
        ) : (
          <div className="w-full max-w-sm mx-auto">
            {items.slice(0, 1).map((movie) => (
              <div key={movie.id} className="relative">
                <div className="aspect-[2/3] w-full overflow-hidden rounded-lg max-h-[60vh] sm:max-h-[70vh]">
                  <div className="absolute inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center flex-col gap-4 z-10">
                    <Lock className="w-10 h-10 text-white/90" />
                    <h3 className="text-xl font-semibold text-white text-center px-4 text-shadow">
                      Recomendação Bloqueada
                    </h3>
                    <Button
                      className="bg-filmeja-purple hover:bg-filmeja-purple/90 shadow-lg px-6 py-2 text-base"
                      onClick={() => navigate("/signup")}
                    >
                      Desbloquear
                    </Button>
                  </div>
                  <img
                    src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                    alt={movie.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-4">
                  <h2 className="text-xl font-bold text-white mb-3">
                    {movie.title}
                  </h2>
                  <div className="flex items-center gap-1.5 mb-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        fill="currentColor"
                        className="w-5 h-5 text-filmeja-purple"
                      />
                    ))}
                    <span className="text-white text-base ml-2">5.0</span>
                  </div>
                  <p className="text-gray-300 text-base mb-3">
                    {movie.overview}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {movie.genres?.map((genre: any) => (
                      <span
                        key={genre.id}
                        className="px-3 py-1.5 bg-white/10 rounded-full text-sm text-white"
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
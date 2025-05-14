import React, { useState } from "react";
import { MOCK_MOOD_OPTIONS } from "@/lib/tmdb";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
// Import the star icon
import { Lock, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { getMoviesByMood } from "@/lib/tmdb";
import { Skeleton } from "@/components/ui/skeleton";

const MoodCarousel: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleMoodClick = async (moodId: string) => {
    setLoading(true);
    setSelectedMood(moodId);
    setShowModal(true); // Show modal immediately

    try {
      // Add delay for smoother UX
      const [movies] = await Promise.all([
        getMoviesByMood(moodId),
        new Promise((resolve) => setTimeout(resolve, 3000)),
      ]);
      setRecommendations(movies.slice(0, 3));
    } catch (error) {
      console.error("Error fetching recommendations:", error);
    }

    setLoading(false);
  };

  const MovieSkeleton = () => (
    <div className="relative">
      <div className="aspect-[2/3] w-full overflow-hidden rounded-lg">
        <Skeleton className="w-full h-full bg-white/5 animate-pulse" />
      </div>
      <div className="p-4">
        <Skeleton className="h-6 w-3/4 mb-2 bg-white/5 animate-pulse" />
        <div className="flex items-center gap-1 mb-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="w-4 h-4 rounded-full bg-white/5 animate-pulse" />
          ))}
          <Skeleton className="w-8 h-4 ml-2 bg-white/5 animate-pulse" />
        </div>
        <Skeleton className="h-4 w-full mb-2 bg-white/5 animate-pulse" />
        <Skeleton className="h-4 w-3/4 bg-white/5 animate-pulse" />
        <div className="flex flex-wrap gap-2 mt-2">
          <Skeleton className="h-6 w-16 rounded-full bg-white/5 animate-pulse" />
          <Skeleton className="h-6 w-20 rounded-full bg-white/5 animate-pulse" />
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className="relative py-5 bg-gradient-to-r from-filmeja-dark/90 via-filmeja-dark to-filmeja-dark/90 border-t border-white/10 overflow-hidden">
        <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-filmeja-dark to-transparent z-10"></div>
        <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-filmeja-dark to-transparent z-10"></div>

        <div className="flex items-center overflow-hidden">
          <div className="flex animate-scroll space-x-6 py-2">
            {[...MOCK_MOOD_OPTIONS, ...MOCK_MOOD_OPTIONS].map((mood, index) => (
              <button
                key={`${mood.id}-${index}`}
                onClick={() => handleMoodClick(mood.id)}
                className="flex items-center space-x-2 px-4 py-2 bg-white/5 hover:bg-filmeja-purple/20 rounded-full transition-all duration-300 hover:scale-105"
              >
                <span className="text-2xl" aria-hidden="true">
                  {mood.icon}
                </span>
                <span className="text-white font-medium whitespace-nowrap">
                  {mood.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-5xl">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <MovieSkeleton key={index} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {recommendations.map((movie, index) => (
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
                          onClick={() => navigate("/signup")}
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
    </>
  );
};

export default MoodCarousel;

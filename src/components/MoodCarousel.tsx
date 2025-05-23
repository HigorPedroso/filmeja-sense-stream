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
    <div className="relative w-full max-w-4xl mx-auto flex flex-col md:flex-row gap-8">
      <div className="aspect-[2/3] w-full md:w-1/2 lg:w-2/5 overflow-hidden rounded-lg max-h-[60vh] sm:max-h-[75vh]">
        <Skeleton className="w-full h-full bg-white/5 animate-pulse" />
        <div className="absolute inset-0 flex items-center justify-center flex-col gap-6 z-10">
          <Skeleton className="w-10 h-10 rounded-full bg-white/5 animate-pulse" />
          <Skeleton className="w-48 h-7 rounded-lg bg-white/5 animate-pulse" />
          <Skeleton className="w-32 h-10 rounded-lg bg-white/5 animate-pulse" />
        </div>
      </div>
      <div className="p-4 md:w-1/2 lg:w-3/5">
        <Skeleton className="h-8 w-4/5 mb-4 bg-white/5 animate-pulse" />
        <div className="flex items-center gap-1.5 mb-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="w-5 h-5 rounded-full bg-white/5 animate-pulse" />
          ))}
          <Skeleton className="w-12 h-5 ml-2 bg-white/5 animate-pulse" />
        </div>
        <Skeleton className="h-20 w-full mb-4 bg-white/5 animate-pulse" />
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-7 w-24 rounded-full bg-white/5 animate-pulse" />
          <Skeleton className="h-7 w-32 rounded-full bg-white/5 animate-pulse" />
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
        <DialogContent className="sm:max-w-5xl h-[85vh] sm:h-auto sm:min-h-[600px] overflow-y-auto flex flex-col items-center justify-center [&>button]:z-[100] p-6 sm:p-8">
          {loading ? (
            <MovieSkeleton />
          ) : (
            <div className="w-full max-w-5xl mx-auto">
              {recommendations.slice(0, 1).map((movie) => (
                <div key={movie.id} className="relative flex flex-col md:flex-row gap-8">
                  <div className="aspect-[2/3] w-full md:w-1/2 lg:w-2/5 overflow-hidden rounded-lg max-h-[60vh] sm:max-h-[75vh]">
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
                  <div className="p-4 md:w-1/2 lg:w-3/5">
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
    </>
  );
};

export default MoodCarousel;

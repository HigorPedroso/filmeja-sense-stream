import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { getRecommendationsFromGemini } from "@/lib/gemini";

interface ContentItem {
  id: number;
  title?: string;
  name?: string;
  poster_path: string;
  vote_average: number;
  release_date?: string;
  first_air_date?: string;
  media_type: "movie" | "tv";
}

interface Props {
  watchedContent: ContentItem[];
  onItemClick?: (item: ContentItem) => void;
}

export function RecommendedByAI({ watchedContent, onItemClick }: Props) {
  const [recommendations, setRecommendations] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const fetchRecommendations = async () => {
      // Skip if no watched content or already has recommendations
      if (watchedContent.length === 0 || recommendations.length > 0) return;
      
      setIsLoading(true);
      try {
        // Get AI recommendations
        const aiRecommendations = await getRecommendationsFromGemini(watchedContent);
        
        // Fetch details from TMDB for each recommendation
        const detailedRecommendations = await Promise.all(
          aiRecommendations.map(async (rec) => {
            const response = await fetch(
              `https://api.themoviedb.org/3/search/${rec.type}?api_key=${
                import.meta.env.VITE_TMDB_API_KEY
              }&query=${encodeURIComponent(rec.title)}&language=pt-BR`
            );
            const data = await response.json();
            return {
              ...data.results[0],
              media_type: rec.type
            };
          })
        );

        setRecommendations(detailedRecommendations);
      } catch (error) {
        console.error("Error fetching AI recommendations:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecommendations();
  // Empty dependency array to run only once on mount
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : 0));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => 
      prev < recommendations.length - 5 ? prev + 1 : prev
    );
  };

  if (isLoading) {
    return (
      <div className="py-8 relative">
        <h2 className="text-2xl font-bold text-white mb-6">
          Recomendações ideias para você
        </h2>
        <div className="flex gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex-none w-[calc(20%-12px)]">
              <Skeleton className="aspect-[2/3] rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="py-8 relative">
      <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
      Recomendações ideias para você
      </h2>
      <div className="relative hover-group">
        <div className="overflow-hidden">
          <div 
            className="flex transition-transform duration-300 ease-out gap-4"
            style={{ transform: `translateX(-${currentIndex * (100 / 5)}%)` }}
          >
            {recommendations.map((item, index) => (
              <div
                key={item.id}
                className="flex-none w-[calc(20%-12px)] relative group/item cursor-pointer"
                onClick={() => onItemClick?.(item)}
              >
                <div className="absolute top-0 right-0 px-2 py-1 bg-filmeja-purple/80 text-white text-xs font-medium rounded-bl-lg z-10">
                  {item.media_type === "movie" ? "Filme" : "Série"}
                </div>
                <div className="relative overflow-hidden rounded-lg aspect-[2/3]">
                  <img
                    src={`https://image.tmdb.org/t/p/w500${item.poster_path}`}
                    alt={item.title || item.name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover/item:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover/item:opacity-100 transition-opacity duration-300">
                    <div className="absolute bottom-0 p-4 text-white">
                      <h3 className="font-semibold">{item.title || item.name}</h3>
                      <p className="text-sm opacity-80">
                        {new Date(item.release_date || item.first_air_date || "").getFullYear()}
                      </p>
                      <div className="flex items-center mt-2">
                        <span className="text-yellow-400">★</span>
                        <span className="ml-1">{item.vote_average.toFixed(1)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Button
          onClick={handlePrevious}
          className="absolute -left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/75 rounded-full p-2 opacity-0 hover-group-hover:opacity-100 transition-opacity disabled:opacity-0"
          disabled={currentIndex === 0}
        >
          <ChevronLeft className="w-6 h-6" />
        </Button>

        <Button
          onClick={handleNext}
          className="absolute -right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/75 rounded-full p-2 opacity-0 hover-group-hover:opacity-100 transition-opacity disabled:opacity-0"
          disabled={currentIndex >= recommendations.length - 5}
        >
          <ChevronRight className="w-6 h-6" />
        </Button>
      </div>
    </div>
  );
}
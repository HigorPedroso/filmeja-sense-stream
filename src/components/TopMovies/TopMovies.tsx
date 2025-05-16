import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface TrendingItem {
  id: number;
  title?: string;
  name?: string;
  poster_path: string;
  vote_average: number;
  release_date?: string;
  first_air_date?: string;
}

interface Props {
  type: "movie" | "tv";
  title: string;
  showWatched?: boolean;
  showFavorites?: boolean;
  watchedContent?: TrendingItem[];
  favoriteContent?: TrendingItem[];
  onItemClick?: (item: TrendingItem) => void;
  onFavoriteUpdate?: () => Promise<void>;  // Add this line
}

export function TopTrendingList({ 
  type, 
  title, 
  showWatched = false,
  showFavorites = false,
  watchedContent = [],
  favoriteContent = [],
  onItemClick,
  onFavoriteUpdate
}: Props) {
  const [items, setItems] = useState<TrendingItem[]>([]);
  
  // Replace multiple useEffects with a single one
  useEffect(() => {
    const fetchItems = async () => {
      // If showing favorites or watched content, use the provided content
      if (showFavorites && favoriteContent.length > 0) {
        setItems(favoriteContent);
        return;
      }
      
      if (showWatched && watchedContent.length > 0) {
        setItems(watchedContent);
        return;
      }

      // Otherwise fetch from TMDB
      try {
        const response = await fetch(
          `https://api.themoviedb.org/3/${type}/popular?api_key=${import.meta.env.VITE_TMDB_API_KEY}&language=pt-BR`
        );
        const data = await response.json();
        setItems(data.results.slice(0, 10));
      } catch (error) {
        console.error("Error fetching trending items:", error);
      }
    };

    fetchItems();
  }, [type, showFavorites]);

  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        if (showWatched && watchedContent.length > 0) {
          setItems(watchedContent.slice(0, 10));
          return;
        }

        const response = await fetch(
          `https://api.themoviedb.org/3/trending/${type}/week?api_key=${
            import.meta.env.VITE_TMDB_API_KEY
          }&language=pt-BR&page=1`
        );

        const data = await response.json();
        setItems(data.results.slice(0, 10));
      } catch (error) {
        console.error("Erro ao buscar conteúdo:", error);
      }
    };

    fetchTrending();
  }, [type, showWatched, watchedContent]);

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : 0));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => 
      prev < items.length - 5 ? prev + 1 : prev
    );
  };

  return (
    <div className="py-8 relative">
      <h2 className="text-2xl font-bold text-white mb-6">{title}</h2>
      <div className="relative hover-group">
        <div className="overflow-hidden">
          <div 
            className="flex transition-transform duration-300 ease-out gap-4"
            style={{ transform: `translateX(-${currentIndex * (100 / 5)}%)` }}
          >
            {items.map((item, index) => (
              <div
                key={item.id}
                className="flex-none w-[calc(20%-12px)] relative group/item cursor-pointer"
                onClick={() => onItemClick?.(item)}
              >
                <div className="absolute top-0 left-0 w-8 h-8 bg-filmeja-purple text-white flex items-center justify-center text-lg font-bold rounded-tl-lg z-10">
                  {index + 1}
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
          disabled={currentIndex >= items.length - 5}
        >
          <ChevronRight className="w-6 h-6" />
        </Button>
      </div>
    </div>
  );
}

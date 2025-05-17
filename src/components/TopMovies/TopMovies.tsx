import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

// Add this to your TrendingItem interface
interface TrendingItem {
  id: number;
  title?: string;
  name?: string;
  poster_path: string;
  vote_average: number;
  release_date?: string;
  first_air_date?: string;
  overview?: string;
  providers?: {
    flatrate?: Array<{
      provider_id: number;
      provider_name: string;
      logo_path: string;
    }>;
    rent?: Array<{
      provider_id: number;
      provider_name: string;
      logo_path: string;
    }>;
    buy?: Array<{
      provider_id: number;
      provider_name: string;
      logo_path: string;
    }>;
    link?: string;
  };
}

interface Props {
  type: "movie" | "tv";
  title: string;
  showWatched?: boolean;
  showFavorites?: boolean;
  watchedContent?: TrendingItem[];
  favoriteContent?: TrendingItem[];
  onItemClick?: (item: TrendingItem) => void;
  onFavoriteUpdate?: () => Promise<void>;
}

export function TopTrendingList({
  type,
  title,
  showWatched = false,
  showFavorites = false,
  watchedContent = [],
  favoriteContent = [],
  onItemClick,
}: Props) {
  const [items, setItems] = useState<TrendingItem[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchItems = async () => {
      if (showFavorites && favoriteContent.length > 0) {
        setItems(favoriteContent);
        return;
      }

      if (showWatched && watchedContent.length > 0) {
        setItems(watchedContent);
        return;
      }

      try {
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

    fetchItems();
  }, [type, showFavorites, favoriteContent, showWatched, watchedContent]);

  const scrollLeft = () => {
    containerRef.current?.scrollBy({
      left: -containerRef.current.offsetWidth,
      behavior: "smooth",
    });
  };

  const scrollRight = () => {
    containerRef.current?.scrollBy({
      left: containerRef.current.offsetWidth,
      behavior: "smooth",
    });
  };

  return (
    <div className="py-8 relative">
      <h2 className="text-2xl font-bold text-white mb-6">{title}</h2>
      <div className="relative group">
        <div
          ref={containerRef}
          className="flex gap-4 overflow-x-auto scroll-smooth scrollbar-none px-1"
        >
          {items.map((item, index) => (
            // Update the onClick handler in your item mapping
            <div
              key={item.id}
              className="relative flex-none w-1/2 sm:w-1/3 md:w-1/4 lg:w-1/5"
              onClick={async () => {
                try {
                  // 1. Fetch content details and videos
                  const contentResponse = await fetch(
                    `https://api.themoviedb.org/3/${type}/${item.id}?api_key=${
                      import.meta.env.VITE_TMDB_API_KEY
                    }&language=pt-BR&append_to_response=videos`
                  );
                  const contentData = await contentResponse.json();

                  // 2. Fetch streaming providers
                  const providerResponse = await fetch(
                    `https://api.themoviedb.org/3/${type}/${item.id}/watch/providers?api_key=${
                      import.meta.env.VITE_TMDB_API_KEY
                    }`
                  );
                  const providerData = await providerResponse.json();
                  const brProviders = providerData.results?.BR || {};

                  const enrichedItem = {
                    ...item,
                    ...contentData,
                    overview: contentData.overview,
                    videos: contentData.videos?.results || [],
                    mediaType: type,
                    providers: {
                      flatrate: brProviders.flatrate || [],
                      rent: brProviders.rent || [],
                      buy: brProviders.buy || [],
                      link: brProviders.link || null
                    }
                  };

                  onItemClick?.(enrichedItem);
                } catch (error) {
                  console.error("Error fetching content details:", error);
                  onItemClick?.(item);
                }
              }}
            >
              <div className="absolute top-0 left-0 w-8 h-8 bg-filmeja-purple text-white flex items-center justify-center text-lg font-bold rounded-tl-lg z-10">
                {index + 1}
              </div>
              <div className="relative overflow-hidden rounded-lg aspect-[2/3] shadow-lg cursor-pointer group/item">
                <img
                  src={`https://image.tmdb.org/t/p/w500${item.poster_path}`}
                  alt={item.title || item.name}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover/item:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover/item:opacity-100 transition-opacity duration-300">
                  <div className="absolute bottom-0 p-4 text-white">
                    <h3 className="font-semibold truncate">
                      {item.title || item.name}
                    </h3>
                    <p className="text-sm opacity-80">
                      {new Date(
                        item.release_date || item.first_air_date || ""
                      ).getFullYear()}
                    </p>
                    <div className="flex items-center mt-2">
                      <span className="text-yellow-400">★</span>
                      <span className="ml-1">
                        {item.vote_average.toFixed(1)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <Button
          onClick={scrollLeft}
          className="hidden sm:flex absolute -left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/75 rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity z-10"
        >
          <ChevronLeft className="w-6 h-6 text-white" />
        </Button>

        <Button
          onClick={scrollRight}
          className="hidden sm:flex absolute -right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/75 rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity z-10"
        >
          <ChevronRight className="w-6 h-6 text-white" />
        </Button>
      </div>
    </div>
  );
}

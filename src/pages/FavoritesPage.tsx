import { motion } from "framer-motion";
import { Star, Film, Tv } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useState, useEffect } from "react";

interface ContentItem {
  id: number;
  title?: string;
  name?: string;
  year?: string;
  rating?: number;
  vote_average?: number;
  poster_path?: string;
  type?: "movie" | "tv";
  release_date?: string;
  first_air_date?: string;
}

interface FavoritesPageProps {
  title: string;
  items: ContentItem[];
}

export function FavoritesPage({ title, items }: FavoritesPageProps) {
    const [currentBgIndex, setCurrentBgIndex] = useState(0);
  const getTitle = (item: ContentItem) => item.title || item.name || "Sem título";
  const getYear = (item: ContentItem) => {
    const date = item.release_date || item.first_air_date;
    return date ? new Date(date).getFullYear() : "";
  };
  const getRating = (item: ContentItem) => {
    const rating = item.rating || item.vote_average;
    return rating ? rating.toFixed(1) : "N/A";
  };

  useEffect(() => {
    if (items.length === 0) return;

    const interval = setInterval(() => {
      setCurrentBgIndex((prev) => (prev + 1) % items.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [items]);

  return (
    <div className="min-h-screen relative">
      {/* Background Layer */}
      {items.length > 0 && (
        <div className="fixed inset-0 w-full h-full overflow-hidden">
          <motion.img
            key={currentBgIndex}
            src={`https://image.tmdb.org/t/p/original${items[currentBgIndex]?.poster_path}`}
            alt=""
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.15 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5 }}
            className="absolute inset-0 w-full h-full object-cover blur-3xl scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-filmeja-dark/90 via-filmeja-dark/95 to-black" />
        </div>
      )}

      {/* Content Layer */}
      <div className="relative z-10 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-8 px-2">
            {title}
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="overflow-hidden bg-filmeja-dark/50 border-white/10 hover:border-filmeja-purple/50 transition-all duration-300">
                  <div className="flex flex-row h-[200px] md:h-[220px]">
                    <div className="w-[140px] md:w-[160px] relative flex-shrink-0">
                      <img
                        src={`https://image.tmdb.org/t/p/w500${item.poster_path}`}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 right-2 bg-black/60 rounded-full p-2">
                        {item.type === "movie" ? (
                          <Film className="w-4 h-4 text-white" />
                        ) : (
                          <Tv className="w-4 h-4 text-white" />
                        )}
                      </div>
                    </div>

                    <div className="flex-1 p-4 flex flex-col justify-between">
                      <div>
                        <h2 className="text-xl font-semibold text-white mb-2 line-clamp-2">
                          {getTitle(item)}
                        </h2>
                        <p className="text-gray-400 text-sm mb-2">{getYear(item)}</p>
                        <div className="flex items-center">
                          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                          <span className="ml-1 text-white">
                            {getRating(item)}
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-2 mt-4">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="px-4 py-2 bg-filmeja-purple/20 hover:bg-filmeja-purple/30 
                          rounded-xl text-white text-sm font-medium transition-colors"
                        >
                          Ver Detalhes
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          {items.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="text-gray-400 text-lg mb-4">
                Nenhum conteúdo encontrado
              </div>
              <p className="text-gray-500 text-center max-w-md">
                Adicione alguns itens à sua lista para vê-los aqui.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
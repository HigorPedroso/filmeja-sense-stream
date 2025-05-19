import { motion } from "framer-motion";
import { Star, Film, Tv } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import { MobileSidebar } from "@/components/MobileSidebar";
import { ContentModal } from "@/components/ContentModal/ContentModal";
// First, make sure fetchContentWithProviders is imported
import { fetchContentWithProviders } from "@/lib/utils/tmdb";
import { toast } from "@/hooks/use-toast";

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
    const [isExpanded, setIsExpanded] = useState(false);
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
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

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) throw error;

      toast({
        title: "Saindo...",
        description: "Você foi desconectado com sucesso",
      });

      Navigate("/");
    } catch (error) {
      toast({
        title: "Erro ao sair",
        description: "Não foi possível fazer logout. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  // Add this near other content rendering
  return (
    <div className="min-h-screen relative">

<Sidebar 
        isExpanded={isExpanded} 
        setIsExpanded={setIsExpanded} 
        onLogout={handleLogout} 
      />

    <MobileSidebar />
      {/* Dynamic Background Layer */}
      {items.length > 0 && (
        <div className="fixed inset-0 w-full h-full overflow-hidden">
          <motion.div
            key={currentBgIndex}
            className="absolute inset-0 w-full h-full"
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2 }}
          >
            <img
              src={`https://image.tmdb.org/t/p/original${items[currentBgIndex]?.poster_path}`}
              alt=""
              className="absolute inset-0 w-full h-full object-cover blur-2xl"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-filmeja-dark/80 via-filmeja-dark to-black" />
          </motion.div>
        </div>
      )}

      {/* Content Layer */}
      <div className="relative z-10 px-4 py-6 md:p-8 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl md:text-4xl font-bold text-white mb-6 md:mb-8 px-2"
          >
            {title}
          </motion.h1>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {items.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                whileHover={{ scale: 1.02, y: -5 }}
                className="h-full"
              >
                <Card className="overflow-hidden bg-filmeja-dark/50 backdrop-blur-sm border-white/10 
                  hover:border-filmeja-purple/50 transition-all duration-300 h-full">
                  <div className="flex flex-row h-[160px] sm:h-[180px] md:h-[220px]">
                    <div className="w-[120px] sm:w-[140px] md:w-[160px] relative flex-shrink-0">
                      <img
                        src={`https://image.tmdb.org/t/p/w500${item.poster_path}`}
                        alt={getTitle(item)}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm rounded-full p-2">
                        {item.type === "movie" ? (
                          <Film className="w-3 h-3 md:w-4 md:h-4 text-white" />
                        ) : (
                          <Tv className="w-3 h-3 md:w-4 md:h-4 text-white" />
                        )}
                      </div>
                    </div>

                    <div className="flex-1 p-3 md:p-4 flex flex-col justify-between">
                      <div>
                        <h2 className="text-lg md:text-xl font-semibold text-white mb-1 md:mb-2 line-clamp-2">
                          {getTitle(item)}
                        </h2>
                        <p className="text-gray-400 text-xs md:text-sm mb-2">{getYear(item)}</p>
                        <div className="flex items-center">
                          <Star className="w-3 h-3 md:w-4 md:h-4 text-yellow-500 fill-yellow-500" />
                          <span className="ml-1 text-white text-xs md:text-sm">
                            {getRating(item)}
                          </span>
                        </div>
                      </div>

                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={async () => {
                          try {
                            const contentDetails = await fetchContentWithProviders(
                              item.id,
                              item.type || 'movie'
                            );
                            setSelectedContent({
                              ...item,
                              ...contentDetails,
                              mediaType: item.type || 'movie'
                            });
                            setIsModalOpen(true);
                          } catch (error) {
                            console.error('Error fetching content details:', error);
                            // Still show modal with basic info if fetch fails
                            setSelectedContent(item);
                            setIsModalOpen(true);
                          }
                        }}
                        className="px-3 py-1.5 md:px-4 md:py-2 bg-filmeja-purple/20 hover:bg-filmeja-purple/30 
                        rounded-xl text-white text-xs md:text-sm font-medium transition-colors
                        hover:shadow-lg hover:shadow-filmeja-purple/20"
                      >
                        Ver Detalhes
                      </motion.button>

                      {/* Add the modal at the end of the component, before the closing div */}
                      {selectedContent && (
                        <ContentModal
                          isOpen={isModalOpen}
                          onClose={() => {
                            setIsModalOpen(false);
                            setSelectedContent(null);
                          }}
                          content={selectedContent}
                        />
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          {items.length === 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-12 md:py-20"
            >
              <div className="text-gray-400 text-base md:text-lg mb-3 md:mb-4">
                Nenhum conteúdo encontrado
              </div>
              <p className="text-gray-500 text-center text-sm md:text-base max-w-md px-4">
                Adicione alguns itens à sua lista para vê-los aqui.
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
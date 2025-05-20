import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ContentType } from "./types";

interface TrailerModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: ContentType;
  trailerUrl: string;
  isTransitioning: boolean;
}

export const TrailerModal = ({ 
  isOpen, 
  onClose, 
  content,
  trailerUrl,
  isTransitioning
}: TrailerModalProps) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 bg-black/95 z-[60] flex flex-col"
    >
      {!isMobile ? (
        <>
          {/* Desktop Layout */}
          <div className="hidden md:flex md:flex-col h-full">
            {/* Top Bar with Blur Effect */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-between items-center px-8 py-6 relative"
            >
              <div className="absolute inset-0 bg-black/40 backdrop-blur-md" />
              <div className="flex items-center gap-6 relative z-10">
                <motion.h2
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-white text-2xl font-medium"
                >
                  {content.title || content.name}
                </motion.h2>
                {content.providers?.flatrate && (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-3 bg-white/5 backdrop-blur-sm px-4 py-2 rounded-full"
                  >
                    {content.providers.flatrate.map((provider) => (
                      <motion.div
                        key={provider.provider_id}
                        whileHover={{ scale: 1.1 }}
                        className="relative group"
                      >
                        <div className="absolute -inset-1 bg-gradient-to-r from-filmeja-purple to-filmeja-blue rounded-full opacity-0 group-hover:opacity-50 blur-sm transition-opacity" />
                        <img
                          src={`https://image.tmdb.org/t/p/original${provider.logo_path}`}
                          alt={provider.provider_name}
                          className="w-8 h-8 rounded-full relative z-10"
                        />
                        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 backdrop-blur-sm text-xs text-white px-3 py-1.5 rounded-full">
                          {provider.provider_name}
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-all duration-200 relative z-10"
                onClick={onClose}
              >
                <X className="w-6 h-6" />
              </Button>
            </motion.div>

            {/* Centered Video Container */}
            <div className="flex-1 flex items-center justify-center px-8">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ type: "spring", damping: 20 }}
                className="w-full max-w-[90%] xl:max-w-[80%] aspect-video relative rounded-xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.3)]"
              >
                <AnimatePresence mode="wait">
                  {isTransitioning ? (
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm"
                    >
                      <div className="text-white text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-filmeja-purple mx-auto mb-2" />
                        <p className="text-sm">Buscando trailer...</p>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="player"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="w-full h-full"
                    >
                      <iframe
                        className="w-full h-full"
                        src={trailerUrl}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Mobile Layout */}
          <div className="md:hidden flex flex-col h-full">
            {/* Mobile Header */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="md:hidden px-4 py-3 flex justify-end"
            >
              <Button
                variant="ghost"
                size="icon"
                className="text-white/80 hover:text-white"
                onClick={onClose}
              >
                <X className="w-5 h-5" />
              </Button>
            </motion.div>

            {/* Mobile Content Info */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="md:hidden flex-1 flex flex-col items-center justify-center px-4 text-center"
            >
              <img
                src={`https://image.tmdb.org/t/p/w92${content.poster_path}`}
                alt={content.title || content.name}
                className="w-20 h-20 rounded-lg object-cover mb-4"
              />
              <h3 className="text-white font-semibold text-xl mb-2">
                {content.title || content.name}
              </h3>
              <p className="text-gray-400 text-sm mb-4">{content.tagline}</p>
              <div className="flex items-center gap-2 mb-2">
                {content.genres?.slice(0, 2).map((genre) => (
                  <span
                    key={genre.id}
                    className="text-xs px-2 py-1 rounded-full bg-white/10 text-white/80"
                  >
                    {genre.name}
                  </span>
                ))}
              </div>
            </motion.div>

            {/* Video Container for Mobile */}
            <div className="relative w-full md:max-w-4xl aspect-video mt-auto">
              <AnimatePresence mode="wait">
                {isTransitioning ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 flex items-center justify-center bg-black/60"
                  >
                    <div className="text-white text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-filmeja-purple mx-auto mb-2" />
                      <p className="text-sm">Buscando trailer...</p>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="player"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="w-full h-full"
                  >
                    <iframe
                      className="w-full h-full"
                      src={trailerUrl}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
};

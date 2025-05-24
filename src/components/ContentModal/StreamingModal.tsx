
import { motion } from "framer-motion";
import { X, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ContentType } from "./types";
import { useState } from "react";

interface StreamingModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: ContentType;
}

const getStreamingAffiliateLink = async (
  contentId: number, 
  providerName: string, 
  title?: string,
  mediaType: string = 'movie'
): Promise<string | null> => {
  try {
    const response = await fetch(
      `https://api.themoviedb.org/3/${mediaType}/${contentId}/watch/providers?api_key=${import.meta.env.VITE_TMDB_API_KEY}`
    );
    const data = await response.json();

    const brProviders = data.results?.BR?.flatrate || [];
    
    if (providerName === "Amazon Prime Video" || providerName === "Prime Video") {
      const hasProvider = brProviders.some(
        (provider: any) => provider.provider_name === "Amazon Prime Video" || 
                          provider.provider_name === "Prime Video"
      );
      return hasProvider ? "https://amzn.to/43dxfa6" : null;
    }
    
    if (providerName === "Disney Plus") {
      const hasProvider = brProviders.some(
        (provider: any) => provider.provider_name === "Disney Plus"
      );
      return hasProvider ? "https://acesse.vc/v2/144fe69bfb2" : null;
    }

    if (providerName === "Max" && title) {
      const hasProvider = brProviders.some(
        (provider: any) => provider.provider_name === "Max"
      );
      return hasProvider ? `https://play.max.com/search/result?q=${encodeURIComponent(title)}` : null;
    }

    if (providerName === "Netflix" && title) {
      const hasProvider = brProviders.some(
        (provider: any) => provider.provider_name === "Netflix"
      );
      return hasProvider ? `https://www.google.com/search?q=site:netflix.com+${encodeURIComponent(title)}` : null;
    }

    if (providerName === "Apple TV+" && title) {
      const hasProvider = brProviders.some(
        (provider: any) => provider.provider_name === "Apple TV+"
      );
      return hasProvider ? `https://tv.apple.com/search?term=${encodeURIComponent(title)}` : null;
    }

    if (providerName.includes("Paramount") && title) {
      const hasProvider = brProviders.some(
        (provider: any) => provider.provider_name.includes("Paramount")
      );
      return hasProvider ? `https://www.paramountplus.com/br/search}` : null;
    }

    return null;
  } catch (error) {
    console.error("Error checking streaming availability:", error);
    return null;
  }
};

export const StreamingModal = ({ isOpen, onClose, content }: StreamingModalProps) => {
  if (!isOpen || !content.providers?.flatrate) return null;
  const [isClicking, setIsClicking] = useState(false);

  const handleProviderClick = async (provider: any) => {
    if (provider.provider_name === "Amazon Prime Video" || 
        provider.provider_name === "Prime Video" ||
        provider.provider_name === "Disney Plus" ||
        provider.provider_name === "Max"||
        provider.provider_name === "Netflix"||
        provider.provider_name === "Apple TV+"||
        provider.provider_name.includes("Paramount")) {
      const affiliateLink = await getStreamingAffiliateLink(
        content.id, 
        provider.provider_name,
        content.title || content.name,
        content.mediaType || 'movie'  // Add mediaType parameter
      );
      if (affiliateLink) {
        window.open(affiliateLink, "_blank");
        return;
      }
    }
    window.open(provider.provider_url, "_blank");
  };

  const handleRentClick = async () => {
    setIsClicking(true);
    const searchUrl = `https://www.amazon.com.br/s?k=prime video ${encodeURIComponent((content.title || content.name))}&tag=filmeja-20`;
    
    await new Promise(resolve => setTimeout(resolve, 800));
    window.open(searchUrl, "_blank");
    setIsClicking(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center px-4 py-6 sm:px-6 md:px-8 overflow-y-auto"
    >
      <motion.div
        initial={{ scale: 0.95, y: 30, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.95, y: 30, opacity: 0 }}
        transition={{ type: "spring", duration: 0.5 }}
        className="bg-filmeja-dark/95 rounded-2xl p-4 sm:p-5 md:p-6 w-full max-w-md md:max-w-lg relative border border-filmeja-purple/20 shadow-xl"
      >
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 top-2 text-white/60 hover:text-white"
          onClick={onClose}
        >
          <X className="w-5 h-5" />
        </Button>

        <h3 className="text-lg sm:text-xl font-semibold text-white mb-4 sm:mb-5">
          Onde Assistir
        </h3>

        <div className="space-y-3">
          
          {content.providers?.flatrate?.map(
            (provider, index) => (
              <motion.div
                key={provider.provider_id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Button
                  variant="outline"
                  className="w-full bg-white/5 hover:bg-white/10 border-white/10 group"
                  onClick={() => handleProviderClick(provider)}
                >
                  <div className="flex items-center w-full">
                    <img
                      src={`https://image.tmdb.org/t/p/original${provider.logo_path}`}
                      alt={provider.provider_name}
                      className="w-8 h-8 rounded-full mr-3"
                    />
                    <span className="flex-1 text-left text-white group-hover:text-filmeja-purple transition-colors text-sm sm:text-base">
                      {provider.provider_name}
                    </span>
                    <Play className="w-4 h-4 text-white/60 group-hover:text-filmeja-purple transition-colors" />
                  </div>
                </Button>
              </motion.div>
            )
          )}
        </div>


        <div className="flex items-center justify-center my-4">
          <span className="text-white/60 text-sm font-medium px-4 py-2 rounded-full border border-white/10 bg-white/5">
            ou
          </span>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full mb-6 bg-gradient-to-r from-filmeja-purple to-filmeja-blue hover:opacity-90 transition-all rounded-lg overflow-hidden"
          onClick={handleRentClick}
          disabled={isClicking}
        >
          <motion.div 
            className="flex items-center justify-center py-3 relative h-[44px]"
            animate={isClicking ? { opacity: 0 } : { opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            <span className="text-lg font-semibold">
              Tente alugar agora mesmo
            </span>
          </motion.div>
          <motion.div
            className="absolute inset-0 flex items-center"
            initial={{ x: -100, opacity: 0 }}
            animate={isClicking ? { 
              x: ["-100%", "200%"],
              opacity: 1,
              scale: [1, 1.2, 1]
            } : { x: -100, opacity: 0 }}
            transition={{ 
              duration: 0.8,
              ease: "easeInOut"
            }}
          >
            <Play className="w-6 h-6" />
          </motion.div>
        </motion.button>
        
      </motion.div>
    </motion.div>
  );
};

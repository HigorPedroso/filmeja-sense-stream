
import { motion } from "framer-motion";
import { X, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ContentType } from "./types";

interface StreamingModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: ContentType;
}

// Add this function before the StreamingModal component
const getAmazonAffiliateLink = async (movieId: number): Promise<string | null> => {
  try {
    const response = await fetch(
      `https://api.themoviedb.org/3/movie/${movieId}/watch/providers?api_key=${import.meta.env.VITE_TMDB_API_KEY}`
    );
    const data = await response.json();

    const brProviders = data.results?.BR?.flatrate || [];
    const hasAmazonPrime = brProviders.some(
      (provider: any) => 
        provider.provider_name === "Amazon Prime Video" || 
        provider.provider_name === "Prime Video"
    );

    return hasAmazonPrime ? "https://amzn.to/43dxfa6" : null;
  } catch (error) {
    console.error("Error checking Amazon Prime availability:", error);
    return null;
  }
};

// Update the StreamingModal component to use the new function
export const StreamingModal = ({ isOpen, onClose, content }: StreamingModalProps) => {
  if (!isOpen || !content.providers?.flatrate) return null;

  const handleProviderClick = async (provider: any) => {
    if (provider.provider_name === "Amazon Prime Video" || provider.provider_name === "Prime Video") {
      const affiliateLink = await getAmazonAffiliateLink(content.id);
      if (affiliateLink) {
        window.open(affiliateLink, "_blank");
        return;
      }
    }
    window.open(provider.provider_url, "_blank");
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
      </motion.div>
    </motion.div>
  );
};

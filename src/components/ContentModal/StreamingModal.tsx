
import { motion } from "framer-motion";
import { X, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ContentType } from "./types";
import { useState } from "react";
import { trackEvent } from "@/lib/analytics/trackEvent";
import { Capacitor } from "@capacitor/core";
import { AppLauncher } from "@capacitor/app-launcher";
import { useToast } from "@/components/ui/use-toast";

interface StreamingModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: ContentType;
}

// Maps a provider that's already confirmed present in content.providers.flatrate
// to where it should actually open. No re-verification against TMDB here —
// the provider being in that list *is* the verification; a second network
// round-trip only added a failure point where any hiccup silently fell
// through to a dead `provider.provider_url` link (TMDB never sends that
// field per-provider).
//
// IMPORTANT: in Brazil, a huge share of TMDB's BR provider names are actual
// third-party services sold as an add-on "channel" through Amazon —
// "HBO Max Amazon Channel", "Paramount+ Amazon Channel", "Telecine Amazon
// Channel", etc. Those all contain the substring "amazon", so the specific
// services below MUST be checked before the generic Amazon/Prime Video
// fallback, or every one of them wrongly resolves to the Amazon link.
function getStreamingLink(providerName: string, title: string): string {
  const name = providerName.toLowerCase();
  const query = encodeURIComponent(title || "");

  if (name.includes("disney")) {
    return "https://acesse.vc/v2/144fe69bfb2";
  }
  if (name.includes("max")) {
    return `https://play.max.com/search/result?q=${query}`;
  }
  if (name.includes("netflix")) {
    return `https://www.google.com/search?q=site:netflix.com+${query}`;
  }
  if (name.includes("apple tv")) {
    return `https://tv.apple.com/search?term=${query}`;
  }
  if (name.includes("paramount")) {
    return "https://www.paramountplus.com/br/";
  }
  if (name.includes("globoplay")) {
    return `https://globoplay.globo.com/busca/?q=${query}`;
  }
  if (name.includes("star+") || name.includes("star plus")) {
    return "https://www.starplus.com/";
  }

  // Generic Amazon/Prime Video fallback — also correctly catches
  // channel-only services (like Telecine) that only exist as an Amazon
  // add-on in Brazil, since no specific mapping above matched them.
  if (name.includes("amazon") || name.includes("prime video")) {
    return "https://amzn.to/43dxfa6";
  }

  // Unknown provider — safe generic fallback instead of a dead link.
  return `https://www.google.com/search?q=${encodeURIComponent(`${providerName} ${title || ""}`)}`;
}

interface StreamingAppTarget {
  appName: string;
  androidPackage: string;
  iosScheme: string;
}

// Native app identifiers for AppLauncher.canOpenUrl()/openUrl() — Android
// takes a package name, iOS a URL scheme (both must also be declared,
// respectively, in AndroidManifest.xml's <queries> and Info.plist's
// LSApplicationQueriesSchemes, or canOpenUrl always reports false).
// Only covers providers with a well-known, stable app identifier; anything
// else (Apple TV, unrecognized providers) falls through to the web link.
// Same provider-name matching/ordering as getStreamingLink above.
function getStreamingAppTarget(providerName: string): StreamingAppTarget | null {
  const name = providerName.toLowerCase();

  if (name.includes("disney")) {
    return { appName: "Disney+", androidPackage: "com.disney.disneyplus", iosScheme: "disneyplus" };
  }
  if (name.includes("max")) {
    return { appName: "Max", androidPackage: "com.wbd.stream", iosScheme: "hbomax" };
  }
  if (name.includes("netflix")) {
    return { appName: "Netflix", androidPackage: "com.netflix.mediaclient", iosScheme: "nflx" };
  }
  if (name.includes("paramount")) {
    return { appName: "Paramount+", androidPackage: "com.cbs.app", iosScheme: "paramountplus" };
  }
  if (name.includes("globoplay")) {
    return { appName: "Globoplay", androidPackage: "com.globo.globotv", iosScheme: "globoplay" };
  }
  if (name.includes("star+") || name.includes("star plus")) {
    return { appName: "Star+", androidPackage: "com.disney.starplus", iosScheme: "starplus" };
  }
  if (name.includes("amazon") || name.includes("prime video")) {
    return { appName: "Prime Video", androidPackage: "com.amazon.avod.thirdpartyclient", iosScheme: "aiv" };
  }

  return null;
}

export const StreamingModal = ({ isOpen, onClose, content }: StreamingModalProps) => {
  const [isClicking, setIsClicking] = useState(false);
  const { toast } = useToast();

  if (!isOpen || !content.providers?.flatrate) return null;

  const handleProviderClick = async (provider: any) => {
    trackEvent("streaming_provider_clicked", {
      provider: provider.provider_name,
      tmdbId: content.id,
      title: content.title || content.name,
    });

    const target = Capacitor.isNativePlatform() ? getStreamingAppTarget(provider.provider_name) : null;

    if (target) {
      const identifier = Capacitor.getPlatform() === "ios" ? `${target.iosScheme}://` : target.androidPackage;
      try {
        const { value: canOpen } = await AppLauncher.canOpenUrl({ url: identifier });
        if (canOpen) {
          await AppLauncher.openUrl({ url: identifier });
          return;
        }
      } catch (error) {
        console.error("canOpenUrl/openUrl threw", error);
      }
      toast({
        title: `Você não tem o ${target.appName} instalado`,
        description: "Instale o app para assistir diretamente por lá.",
      });
      return;
    }

    const fallbackUrl = getStreamingLink(provider.provider_name, content.title || content.name || "");
    window.open(fallbackUrl, "_blank");
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
          className="relative w-full mb-6 bg-gradient-to-r from-filmeja-purple to-filmeja-blue hover:opacity-90 transition-all rounded-lg overflow-hidden"
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

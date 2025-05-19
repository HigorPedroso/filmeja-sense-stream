import { toast } from "@/components/ui/use-toast";

interface ContentItem {
  id: number;
  media_type: string;
  [key: string]: any;
}

interface FetchContentOptions {
  onLoadingChange?: (loading: boolean) => void;
  onContentFetched?: (content: any) => void;
  showToast?: boolean;
}

export async function fetchContentWithProviders(
  item: ContentItem,
  options: FetchContentOptions = {}
) {
  const { onLoadingChange, onContentFetched, showToast = true } = options;

  try {
    onLoadingChange?.(true);

    const [providersData, details, videos, similar] = await Promise.all([
      fetch(
        `https://api.themoviedb.org/3/${item.media_type}/${item.id}/watch/providers?api_key=${
          import.meta.env.VITE_TMDB_API_KEY
        }`
      ).then(r => r.json()),
      fetch(
        `https://api.themoviedb.org/3/${item.media_type}/${item.id}?api_key=${
          import.meta.env.VITE_TMDB_API_KEY
        }&language=pt-BR`
      ).then(r => r.json()),
      fetch(
        `https://api.themoviedb.org/3/${item.media_type}/${item.id}/videos?api_key=${
          import.meta.env.VITE_TMDB_API_KEY
        }&language=pt-BR`
      ).then(r => r.json()),
      fetch(
        `https://api.themoviedb.org/3/${item.media_type}/${item.id}/similar?api_key=${
          import.meta.env.VITE_TMDB_API_KEY
        }&language=pt-BR`
      ).then(r => r.json()),
    ]);

    let providers = null;
    if (providersData?.results) {
      providers = providersData.results?.BR || providersData.results?.US || null;
      
      if (!providers?.flatrate && !providers?.free) {
        const allProviders = {
          ...providersData.results?.BR,
          ...providersData.results?.US
        };
        
        if (allProviders?.rent || allProviders?.buy) {
          providers = allProviders;
        }
      }
    }

    const contentDetails = {
      ...item,
      ...details,
      videos: videos.results,
      providers,
      similar: similar.results,
      mediaType: item.media_type,
    };

    onContentFetched?.(contentDetails);
    return contentDetails;

  } catch (error) {
    console.error("Error fetching content details:", error);
    if (showToast) {
      toast({
        title: "Erro",
        description: "Não foi possível carregar os detalhes do conteúdo",
        variant: "destructive",
      });
    }
    throw error;
  } finally {
    onLoadingChange?.(false);
  }
}
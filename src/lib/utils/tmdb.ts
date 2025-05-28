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
    let isInTheaters = false;

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

    // Check if movie is in theaters when no providers are found
    if (!providers && item.media_type === 'movie') {
      const nowPlayingResponse = await fetch(
        `https://api.themoviedb.org/3/movie/now_playing?api_key=${
          import.meta.env.VITE_TMDB_API_KEY
        }&language=pt-BR&region=BR`
      );
      const nowPlayingData = await nowPlayingResponse.json();
      
      isInTheaters = nowPlayingData.results.some(
        (movie: { id: number }) => movie.id === item.id
      );
    }

    const contentDetails = {
      ...item,
      ...details,
      videos: videos.results,
      providers,
      isInTheaters,
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
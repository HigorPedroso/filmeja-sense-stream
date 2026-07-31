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
  // When true, throws NotAvailableInBrazilError instead of returning content
  // that has no BR streaming provider. Used for AI-suggested titles, where
  // there's no other guarantee the recommendation is actually watchable.
  requireBrAvailability?: boolean;
}

// Thrown by searchContentByTitle when the AI suggested a title that hasn't
// actually released yet — TMDB lists it (upcoming/announced), but there's
// nothing to watch.
export class NotReleasedError extends Error {
  constructor(title: string) {
    super(`"${title}" ainda não foi lançado.`);
    this.name = "NotReleasedError";
  }
}

// Thrown by fetchContentWithProviders (with requireBrAvailability) when a
// released title still isn't on any streaming platform in Brazil — festival
// titles, region-locked releases, theatrical-only, etc.
export class NotAvailableInBrazilError extends Error {
  constructor(title: string) {
    super(`"${title}" não está disponível em nenhuma plataforma de streaming no Brasil no momento.`);
    this.name = "NotAvailableInBrazilError";
  }
}

// Shared toast copy for the two AI-recommendation guards above, so the 3
// "Ver detalhes" call sites (Dashboard, Sidebar, FilminChat) don't each
// duplicate the same if/else.
export function describeAiRecommendationError(error: unknown): { title: string; description: string } {
  if (error instanceof NotReleasedError) {
    return { title: "Ainda não foi lançado", description: error.message };
  }
  if (error instanceof NotAvailableInBrazilError) {
    return { title: "Não disponível no Brasil", description: error.message };
  }
  return {
    title: "Conteúdo não encontrado",
    description: "Não foi possível encontrar o título especificado",
  };
}

function normalizeTitle(value?: string): string {
  return (value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip accents
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

// Search results often include sequels, remakes or unrelated titles that
// happen to be more "popular" than the one actually being looked for —
// sorting by popularity alone can silently swap in the wrong movie/show.
// Prefer an exact (or near-exact) title match first, and only fall back to
// "most popular" when nothing actually matches the requested title.
export function pickBestTitleMatch<
  T extends { id: number; title?: string; name?: string; popularity?: number }
>(results: T[], wantedTitle: string): T | undefined {
  if (!results.length) return undefined;

  const target = normalizeTitle(wantedTitle);
  if (!target) return [...results].sort((a, b) => (b.popularity || 0) - (a.popularity || 0))[0];

  const exact = results.find((r) => normalizeTitle(r.title || r.name) === target);
  if (exact) return exact;

  const closeMatch = results.find((r) => {
    const candidate = normalizeTitle(r.title || r.name);
    return candidate && (candidate.startsWith(target) || target.startsWith(candidate));
  });
  if (closeMatch) return closeMatch;

  return [...results].sort((a, b) => (b.popularity || 0) - (a.popularity || 0))[0];
}

// Resolves a free-text title (e.g. suggested by the AI chat) to a TMDB item
// shaped like what fetchContentWithProviders expects.
export async function searchContentByTitle(title: string, type?: "movie" | "tv") {
  const cleanTitle = title
    .replace(/^("|'|`)|("|'|`)$/g, "")
    .replace(/^.*?recomendo\s+/i, "")
    .replace(/^.*?sugiro\s+/i, "")
    .split(".")[0]
    .split("(")[0]
    .trim();

  let searchResults: any[] = [];

  if (!type) {
    const [movieSearch, tvSearch] = await Promise.all([
      fetch(
        `https://api.themoviedb.org/3/search/movie?api_key=${
          import.meta.env.VITE_TMDB_API_KEY
        }&query=${encodeURIComponent(cleanTitle)}&language=pt-BR`
      ).then((r) => r.json()),
      fetch(
        `https://api.themoviedb.org/3/search/tv?api_key=${
          import.meta.env.VITE_TMDB_API_KEY
        }&query=${encodeURIComponent(cleanTitle)}&language=pt-BR`
      ).then((r) => r.json()),
    ]);
    searchResults = [
      ...(movieSearch.results || []).map((r: any) => ({ ...r, media_type: "movie" })),
      ...(tvSearch.results || []).map((r: any) => ({ ...r, media_type: "tv" })),
    ];
  } else {
    const searchResponse = await fetch(
      `https://api.themoviedb.org/3/search/${type}?api_key=${
        import.meta.env.VITE_TMDB_API_KEY
      }&query=${encodeURIComponent(cleanTitle)}&language=pt-BR`
    );
    const searchData = await searchResponse.json();
    searchResults = (searchData.results || []).map((r: any) => ({ ...r, media_type: type }));
  }

  const content = pickBestTitleMatch(searchResults, cleanTitle);
  if (!content) {
    throw new Error(`No results found for: ${title}`);
  }

  // Only block on a confirmed future date — missing/empty dates are common
  // for obscure-but-real titles and shouldn't be treated as "not released".
  const releaseDateStr = content.media_type === "tv" ? content.first_air_date : content.release_date;
  if (releaseDateStr && new Date(releaseDateStr).getTime() > Date.now()) {
    throw new NotReleasedError(content.title || content.name || title);
  }

  return { ...content, media_type: content.media_type || type || "movie" } as ContentItem;
}

export async function fetchContentWithProviders(
  item: ContentItem,
  options: FetchContentOptions = {}
) {
  const { onLoadingChange, onContentFetched, showToast = true, requireBrAvailability = false } = options;

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

    if (requireBrAvailability) {
      const brProviders = providersData?.results?.BR;
      const hasBrStreaming = !!(brProviders?.flatrate || brProviders?.free);
      if (!hasBrStreaming) {
        throw new NotAvailableInBrazilError(details?.title || details?.name || item.title || item.name || "Este título");
      }
    }

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
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

function releaseYearOf(item: { release_date?: string; first_air_date?: string }): number | undefined {
  const dateStr = item.release_date || item.first_air_date;
  return dateStr ? new Date(dateStr).getFullYear() : undefined;
}

// Among several candidates that already tied on title, prefer the one whose
// release year matches what was asked for — this is what actually
// disambiguates remakes, sequels reusing the base title, and any title that
// got released more than once (e.g. "Duna" 2021 vs 1984). Falls back to the
// closest year, then to the first candidate (original order) when no year
// was given at all.
function pickByYear<T extends { release_date?: string; first_air_date?: string }>(
  candidates: T[],
  wantedYear?: number
): T {
  if (!wantedYear) return candidates[0];

  const exactYear = candidates.find((r) => releaseYearOf(r) === wantedYear);
  if (exactYear) return exactYear;

  return [...candidates].sort((a, b) => {
    const yearA = releaseYearOf(a);
    const yearB = releaseYearOf(b);
    if (yearA === undefined) return 1;
    if (yearB === undefined) return -1;
    return Math.abs(yearA - wantedYear) - Math.abs(yearB - wantedYear);
  })[0];
}

// Search results often include sequels, remakes or unrelated titles that
// happen to be more "popular" than the one actually being looked for —
// sorting by popularity alone can silently swap in the wrong movie/show.
// Prefer an exact (or near-exact) title match first, using the release year
// (when known) to pick between same-titled results, and only fall back to
// "most popular" when nothing actually matches the requested title.
export function pickBestTitleMatch<
  T extends {
    id: number;
    title?: string;
    name?: string;
    popularity?: number;
    release_date?: string;
    first_air_date?: string;
  }
>(results: T[], wantedTitle: string, wantedYear?: number): T | undefined {
  if (!results.length) return undefined;

  const target = normalizeTitle(wantedTitle);
  if (!target) {
    return pickByYear([...results].sort((a, b) => (b.popularity || 0) - (a.popularity || 0)), wantedYear);
  }

  const exactMatches = results.filter((r) => normalizeTitle(r.title || r.name) === target);
  if (exactMatches.length) return pickByYear(exactMatches, wantedYear);

  const closeMatches = results.filter((r) => {
    const candidate = normalizeTitle(r.title || r.name);
    return candidate && (candidate.startsWith(target) || target.startsWith(candidate));
  });
  if (closeMatches.length) return pickByYear(closeMatches, wantedYear);

  return pickByYear([...results].sort((a, b) => (b.popularity || 0) - (a.popularity || 0)), wantedYear);
}

// Resolves a free-text title (e.g. suggested by the AI chat) to a TMDB item
// shaped like what fetchContentWithProviders expects. Passing the release
// year the AI gave us lets pickBestTitleMatch tell apart same-titled results
// (remakes, sequels, re-releases) instead of guessing from popularity alone.
//
// Always searches BOTH movie and tv, regardless of the `type` the caller
// passed in. That param is what the AI claims it's recommending, and the AI
// gets it wrong often enough (e.g. labelling a series "movie") that trusting
// it to pick the search category caused completely unrelated titles to show
// up — searching "Outer Banks" (a series) as a movie finds nothing named
// that and falls back to some random low-relevance movie by popularity.
// Searching both and letting the exact-title(+year) match decide is immune
// to that mislabeling.
export async function searchContentByTitle(title: string, type?: "movie" | "tv", year?: number) {
  const cleanTitle = title
    .replace(/^("|'|`)|("|'|`)$/g, "")
    .replace(/^.*?recomendo\s+/i, "")
    .replace(/^.*?sugiro\s+/i, "")
    .split(".")[0]
    .split("(")[0]
    .trim();

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
  const searchResults = [
    ...(movieSearch.results || []).map((r: any) => ({ ...r, media_type: "movie" })),
    ...(tvSearch.results || []).map((r: any) => ({ ...r, media_type: "tv" })),
  ];

  const content = pickBestTitleMatch(searchResults, cleanTitle, year);
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
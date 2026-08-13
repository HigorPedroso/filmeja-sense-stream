import { supabase } from "@/integrations/supabase/client";
import { MoodType } from "@/types/movie";
import { extractJsonFromResponse } from "@/utils/jsonParser";
import { pickBestTitleMatch } from "@/lib/utils/tmdb";
import { showInterstitialAd } from "@/lib/ads";
import { refundDailyView } from "@/lib/recommendations/refundDailyView";
import { getLocalDateString } from "@/lib/utils/date";
import { trackEvent } from "@/lib/analytics/trackEvent";

// Combined daily cap for free (non-premium) users across mood + genre
// recommendations. Query 1 is ad-free; queries 2 and 3 show an interstitial.
export const DAILY_FREE_LIMIT = 3;

export interface WatchedContent {
  tmdb_id: number;
  media_type: "movie" | "tv";
}

export interface ContentSuggestion {
  title: string;
  tmdbId: number;
  description: string;
  imgUrl?: string;
  tipo: "movie" | "tv";
  releaseYear?: number;
}

export interface MoodRecommendationParams {
  mood: string;
  moodNames: Record<MoodType, string>;
  moodToGenres: Record<string, number[]>;
  moodToGenresTV: Record<string, number[]>;
  genreCategories: Array<{
    name: string;
    genres: Array<{
      id: number;
      name: string;
    }>;
  }>;
  userContentPreference: "movies" | "series" | "both" | null;
  recommendationCount: number;
  setIsLoadingRecommendation: (value: boolean) => void;
  setShowRecommendationModal: (value: boolean) => void;
  setMoodRecommendation: (value: any) => void;
}

export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export async function fetchMoodRecommendation(params: MoodRecommendationParams): Promise<void> {
  const {
    mood,
    moodNames,
    moodToGenres,
    moodToGenresTV,
    genreCategories,
    userContentPreference,
    recommendationCount,
    setIsLoadingRecommendation,
    setShowRecommendationModal,
    setMoodRecommendation,
  } = params;

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    // Same source of truth as usePremiumStatus: profiles.is_premium.
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, is_premium")
      .eq("id", user.id)
      .single();

    if (!profile?.id) throw new Error("Profile not found");

    const isPremium = !!profile.is_premium;

    // Coin bookkeeping: if a coin is spent below but the fetch fails
    // afterward, we refund it in the catch block so the user doesn't lose a
    // free query for a recommendation that never loaded.
    const today = getLocalDateString();
    let coinSpent = false;
    let dailyViewsBeforeSpend = 0;
    let monthlyViewsBeforeSpend = 0;

    if (!isPremium) {
      // Free users get DAILY_FREE_LIMIT combined mood+genre recommendations
      // per day (shared with fetchGenreRecommendation via the same table).
      const { data: viewStats } = await supabase
        .from('user_recommendation_views')
        .select('daily_views, monthly_views, view_date')
        .eq('user_id', user.id)
        .order('view_date', { ascending: false })
        .limit(1)
        .single();

      // Only carry the count over if the last recorded view was today —
      // otherwise it's a new day and the free quota resets.
      const dailyViews = viewStats?.view_date === today ? (viewStats?.daily_views || 0) : 0;
      const monthlyViews = viewStats?.monthly_views || 0;

      if (dailyViews >= DAILY_FREE_LIMIT) {
        // Nothing opened yet at this point (the loading UI only opens
        // below, once we know the user isn't blocked) — the caller shows
        // the paywall directly, with nothing to navigate away from first.
        throw {
          type: 'PREMIUM_REQUIRED',
          message: `Você atingiu o limite de ${DAILY_FREE_LIMIT} recomendações gratuitas por dia. Assine o plano premium para continuar recebendo recomendações ilimitadas!`,
          dailyViews,
          monthlyViews,
        };
      }

      dailyViewsBeforeSpend = dailyViews;
      monthlyViewsBeforeSpend = monthlyViews;
      const newDailyViews = dailyViews + 1;

      // Update view counts
      await supabase.from("user_recommendation_views").upsert(
        {
          user_id: user.id,
          view_date: today,
          daily_views: newDailyViews,
          monthly_views: monthlyViews + 1,
        },
        {
          onConflict: ["user_id", "view_date"], // <- define os campos únicos
        }
      );
      coinSpent = true;

      // Now that the user is confirmed not blocked, open the loading UI —
      // before the interstitial ad and the recommendation fetch below,
      // which together can take a while, so neither happens behind an
      // unresponsive-looking screen. (Opening this any earlier, before the
      // limit check above, meant navigating to the recommendation screen
      // and then immediately back out to the paywall on the blocked path —
      // those two navigations could race and drop the paywall entirely.)
      setIsLoadingRecommendation(true);
      setShowRecommendationModal(true);

      // 1st free query of the day is ad-free; 2nd and 3rd show an
      // interstitial ad before the recommendation loads.
      if (newDailyViews >= 2) {
        await showInterstitialAd();
      }
    } else {
      setIsLoadingRecommendation(true);
      setShowRecommendationModal(true);
    }

    try {
      await fetchAndDeliverRecommendation();
    } catch (fetchError) {
      if (coinSpent) {
        await refundDailyView(user.id, today, dailyViewsBeforeSpend, monthlyViewsBeforeSpend);
      }
      throw fetchError;
    }

    async function fetchAndDeliverRecommendation() {
    // Continue with existing recommendation logic
    const { data: recentRecommendations, error: historyError } = await supabase
    .from('watch_history')
    .select('title')
    .eq('user_id', user?.id)
    .order('created_at', { ascending: false })
    .limit(10);

  if (historyError) {
    console.error("Error fetching watch history:", historyError);
  }

  const recentTitles = recentRecommendations?.map(item => item.title) || [];

    const { data: watchedContent } = await supabase
      .from("watched_content")
      .select("tmdb_id, media_type")
      .eq("user_id", user?.id);

    const watchedDetails = await Promise.all(
      (watchedContent || []).map(async (item: WatchedContent) => {
        try {
          const response = await fetch(
            `https://api.themoviedb.org/3/${item.media_type}/${item.tmdb_id}?api_key=${
              import.meta.env.VITE_TMDB_API_KEY
            }&language=pt-BR`
          );
          const data = await response.json();
          return {
            title: data.title || data.name,
            tmdbId: data.id,
            type: item.media_type
          };
        } catch (error) {
          console.error("Error fetching TMDB details:", error);
          return null;
        }
      })
    );

    const validWatchedContent = watchedDetails.filter(Boolean);
    const shouldFetchMovies = userContentPreference === "movies" ? recommendationCount < 2 : recommendationCount >= 2;
    const mediaType = shouldFetchMovies ? "movie" : "tv";

    const genres = mediaType === "movie" ? moodToGenres[mood] : moodToGenresTV[mood];
    const genreNames = genres.map(id => 
      genreCategories.flatMap(cat => cat.genres).find(g => g.id === id)?.name
    ).filter(Boolean);

    const currentYear = new Date().getFullYear();
    const minReleaseYear = currentYear - 5;

    const prompt = `
      Você é um assistente que responde apenas em JSON válido.
      O usuário está se sentindo "${moodNames[mood as MoodType]}" e gosta dos seguintes gêneros: ${genreNames.join(", ")}.
      O usuário já assistiu os seguintes títulos:
      ${JSON.stringify(validWatchedContent)}

      Últimas recomendações (não recomendar estes títulos também):
      ${JSON.stringify(recentTitles)}

      Forneça uma lista de 10 ${mediaType === "movie" ? "filmes" : "séries"} bem avaliados que correspondem ao humor do usuário.
      IMPORTANTE: priorize lançamentos recentes — de ${minReleaseYear} até ${currentYear}. Evite indicar clássicos antigos ou títulos muito batidos; a lista deve parecer atual, não uma seleção de "os mais famosos de sempre".
      NÃO INCLUA os títulos que o usuário já assistiu ou que foram recomendados recentemente.
      Tem que estar presente nos principais streamings: Netflix, Max, Amazon Prime Video, Disney, etc.

      Responda no seguinte formato JSON:
      [
        { "title": "Título", "tmdbId": 12345, "description": "Descrição do filme ou série", "imgUrl": "url da imagem", "tipo": "movie ou tv", "releaseYear": 2024 }
      ]
    `;

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${
        import.meta.env.VITE_GEMINI_API_KEY
      }`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ 
            parts: [{ 
              text: prompt + "\nResponda apenas com o JSON, sem texto adicional." 
            }] 
          }],
          tools: [{ google_search: {} }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
            thinkingConfig: { thinkingBudget: 0 },
          },
        }),
      }
    );

    const geminiData = await geminiResponse.json();
    const raw = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!raw) throw new Error("Resposta vazia do Gemini");

    const parsedSuggestions = extractJsonFromResponse(raw) || [];
    // Ensure we're working with a properly typed array of ContentSuggestion objects
    const suggestions: ContentSuggestion[] = Array.isArray(parsedSuggestions) ?
      parsedSuggestions.map(suggestion => ({
        title: String(suggestion.title || ""),
        tmdbId: Number(suggestion.tmdbId || 0),
        description: String(suggestion.description || ""),
        imgUrl: suggestion.imgUrl ? String(suggestion.imgUrl) : undefined,
        tipo: (suggestion.tipo === "tv" ? "tv" : "movie") as "movie" | "tv",
        releaseYear: Number(suggestion.releaseYear) || undefined,
      })) : [];

    const shuffledSuggestions = shuffleArray(suggestions);

    const suggestionsWithCorrectIds = await Promise.all(
      shuffledSuggestions.map(async (suggestion) => {
        try {
          const searchType = suggestion.tipo === "movie" ? "movie" : "tv";
          const searchResponse = await fetch(
            `https://api.themoviedb.org/3/search/${searchType}?api_key=${
              import.meta.env.VITE_TMDB_API_KEY
            }&query=${encodeURIComponent(suggestion.title)}&language=pt-BR`
          );
          const searchData = await searchResponse.json();

          const bestMatch = pickBestTitleMatch(searchData.results || [], suggestion.title, suggestion.releaseYear);
          if (bestMatch) {
            return {
              ...suggestion,
              tmdbId: bestMatch.id,
            };
          }
          return suggestion;
        } catch (error) {
          console.error("Error searching TMDB:", error);
          return suggestion;
        }
      })
    );

    const availableContent = [];
    for (const suggestion of suggestionsWithCorrectIds) {
      try {
        const [details, videos, similar, providers] = await Promise.all([
          fetch(
            `https://api.themoviedb.org/3/${suggestion.tipo}/${suggestion.tmdbId}?api_key=${
              import.meta.env.VITE_TMDB_API_KEY
            }&language=pt-BR`
          ).then(r => r.json()),
          fetch(
            `https://api.themoviedb.org/3/${suggestion.tipo}/${suggestion.tmdbId}/videos?api_key=${
              import.meta.env.VITE_TMDB_API_KEY
            }&language=pt-BR`
          ).then(r => r.json()),
          fetch(
            `https://api.themoviedb.org/3/${suggestion.tipo}/${suggestion.tmdbId}/similar?api_key=${
              import.meta.env.VITE_TMDB_API_KEY
            }&language=pt-BR`
          ).then(r => r.json()),
          fetch(
            `https://api.themoviedb.org/3/${suggestion.tipo}/${suggestion.tmdbId}/watch/providers?api_key=${
              import.meta.env.VITE_TMDB_API_KEY
            }`
          ).then(r => r.json()),
        ]);

        if (providers.results?.BR?.flatrate) {
          availableContent.push({
            ...details,
            videos: videos.results,
            providers: providers.results?.BR,
            similar: similar.results,
            mediaType: suggestion.tipo,
          });
          
          if (availableContent.length >= 3) {
            const randomIndex = Math.floor(Math.random() * availableContent.length);
            setMoodRecommendation(availableContent[randomIndex]);
            break;
          }
        }
      } catch (error) {
        console.error("Error fetching content details:", error);
        continue;
      }
    }

    if (availableContent.length === 0) {
      throw new Error("Nenhum conteúdo disponível encontrado");
    }

    // Select a random recommendation
    const randomIndex = Math.floor(Math.random() * availableContent.length);
    const selectedContent = availableContent[randomIndex];

    // Save to watch history
    try {
      const { error: historyError } = await supabase
        .from('watch_history')
        .insert({
          user_id: user?.id,
          content_type: selectedContent.mediaType,
          content_id: 0,
          title: selectedContent.title || selectedContent.name,
          poster_path: selectedContent.poster_path,
          created_at: new Date().toISOString()
        });

      if (historyError) {
        console.error('Error saving to watch history:', historyError);
      }
    } catch (error) {
      console.error('Error saving to watch history:', error);
    }

    // Set the recommendation
    setMoodRecommendation(selectedContent);
    trackEvent("recommendation_generated", {
      source: "mood",
      mood,
      tmdbId: selectedContent.id,
      title: selectedContent.title || selectedContent.name,
    });
    }

  } catch (error) {
    console.error("Error fetching recommendation:", error);
    throw error;
  } finally {
    setIsLoadingRecommendation(false);
  }
}

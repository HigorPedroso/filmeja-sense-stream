
import { supabase } from "@/integrations/supabase/client";
import { MoodType } from "@/types/movie";
import { extractJsonFromResponse } from "@/utils/jsonParser";

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
  userContentPreference: "movies" | "series" | null;
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
  
  setIsLoadingRecommendation(true);
  setShowRecommendationModal(true);

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    // Check user subscription status
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('is_premium')
      .eq('id', user.id)
      .single();

    if (!userProfile?.is_premium) {
      // Check view limits for free users
      const today = new Date().toISOString().split('T')[0];
      const monthStart = new Date(today.slice(0, 7) + '-01').toISOString();

      const { data: viewStats } = await supabase
        .from('user_recommendation_views')
        .select('daily_views, monthly_views')
        .eq('user_id', user.id)
        .gte('view_date', monthStart)
        .order('view_date', { ascending: false })
        .limit(1)
        .single();

      const dailyViews = viewStats?.daily_views || 0;
      const monthlyViews = viewStats?.monthly_views || 0;

      if (dailyViews >= 1 || monthlyViews >= 5) {
        setShowRecommendationModal(false);
        throw {
          type: 'PREMIUM_REQUIRED',
          message: 'Você atingiu o limite de recomendações gratuitas. Assine o plano premium para continuar recebendo recomendações ilimitadas!'
        };
      }

      // Update view counts
      await supabase.from('user_recommendation_views').upsert({
        user_id: user.id,
        view_date: today,
        daily_views: dailyViews + 1,
        monthly_views: monthlyViews + 1
      });
    }

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

    const prompt = `
      Você é um assistente que responde apenas em JSON válido. 
      O usuário está se sentindo "${moodNames[mood as MoodType]}" e gosta dos seguintes gêneros: ${genreNames.join(", ")}.
      O usuário já assistiu os seguintes títulos:
      ${JSON.stringify(validWatchedContent)}

      Últimas recomendações (não recomendar estes títulos também):
      ${JSON.stringify(recentTitles)}

      Forneça uma lista de 10 ${mediaType === "movie" ? "filmes" : "séries"} que são muito populares, bem avaliados e correspondem ao humor do usuário.
      NÃO INCLUA os títulos que o usuário já assistiu ou que foram recomendados recentemente.
      Tem que estar presente nos principais streamings: Netflix, Max, Amazon Prime Video, Disney, etc. 
      
      Responda no seguinte formato JSON:
      [
        { "title": "Título", "tmdbId": 12345, "description": "Descrição do filme ou série", "imgUrl": "url da imagem", "tipo": "movie ou tv" }
      ]
    `;

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${
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
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
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
        tipo: (suggestion.tipo === "tv" ? "tv" : "movie") as "movie" | "tv"
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
          
          if (searchData.results && searchData.results.length > 0) {
            return {
              ...suggestion,
              tmdbId: searchData.results[0].id,
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

  } catch (error) {
    console.error("Error fetching recommendation:", error);
    throw error;
  } finally {
    setIsLoadingRecommendation(false);
  }
}

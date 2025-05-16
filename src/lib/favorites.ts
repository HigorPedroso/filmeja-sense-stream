import { supabase } from "@/integrations/supabase/client";


export interface FavoriteItem {
  id: number;
  title?: string;
  name?: string;
  poster_path: string;
  vote_average: number;
  release_date?: string;
  first_air_date?: string;
  media_type: "movie" | "tv";
}

export async function getUserFavorites(): Promise<FavoriteItem[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data: favorites } = await supabase
      .from('favorite_content')
      .select('*')
      .eq('user_id', user.id);

    if (!favorites) return [];

    // Fetch detailed information from TMDB for each favorite
    const detailedFavorites = await Promise.all(
      favorites.map(async (fav) => {
        const response = await fetch(
          `https://api.themoviedb.org/3/${fav.media_type}/${fav.tmdb_id}?api_key=${
            import.meta.env.VITE_TMDB_API_KEY
          }&language=pt-BR`
        );
        const details = await response.json();
        return {
          ...details,
          media_type: fav.media_type
        };
      })
    );

    return detailedFavorites;
  } catch (error) {
    console.error('Error fetching favorites:', error);
    return [];
  }
}
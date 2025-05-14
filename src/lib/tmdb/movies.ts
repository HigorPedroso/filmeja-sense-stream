
import { ContentItem } from "@/types/movie";
import { fetchFromTMDB } from "./api";
import { formatMovieToContentItem } from "./formatters";
import { MOCK_MOVIES } from "./mock-data";

// Function to get popular movies
export const getPopularMovies = async (): Promise<ContentItem[]> => {
  try {
    // Fetch popular movies
    const data = await fetchFromTMDB('/movie/popular');
    
    if (!data) {
      return MOCK_MOVIES.filter(item => item.media_type === 'movie');
    }
    
    // Format results
    return data.results.map(formatMovieToContentItem);
    
  } catch (error) {
    console.error('Error getting popular movies:', error);
    return MOCK_MOVIES.filter(item => item.media_type === 'movie');
  }
};


import { ContentItem } from "@/types/movie";
import { fetchFromTMDB } from "./api";
import { formatTVShowToContentItem } from "./formatters";
import { MOCK_MOVIES } from "./mock-data";

// Function to get popular TV shows
export const getPopularTVShows = async (): Promise<ContentItem[]> => {
  try {
    // Fetch popular TV shows
    const data = await fetchFromTMDB('/tv/popular');
    
    if (!data) {
      return MOCK_MOVIES.filter(item => item.media_type === 'tv');
    }
    
    // Format results
    return data.results.map(formatTVShowToContentItem);
    
  } catch (error) {
    console.error('Error getting popular TV shows:', error);
    return MOCK_MOVIES.filter(item => item.media_type === 'tv');
  }
};

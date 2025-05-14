
import { ContentItem } from "@/types/movie";
import { fetchFromTMDB } from "./api";
import { formatMovieToContentItem, formatTVShowToContentItem } from "./formatters";
import { MOCK_MOVIES } from "./mock-data";

// Function to get trending movies and TV shows
export const getTrending = async (): Promise<ContentItem[]> => {
  try {
    // Fetch trending content for the day
    const data = await fetchFromTMDB('/trending/all/day');
    
    if (!data) {
      return MOCK_MOVIES; // Fallback to mock data
    }
    
    // Format results
    return data.results.map((item: any) => {
      if (item.media_type === 'movie') {
        return formatMovieToContentItem(item);
      } else if (item.media_type === 'tv') {
        return formatTVShowToContentItem(item);
      }
      return null;
    }).filter(Boolean);
    
  } catch (error) {
    console.error('Error getting trending content:', error);
    return MOCK_MOVIES; // Fallback to mock data
  }
};

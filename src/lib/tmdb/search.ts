import { ContentItem } from "@/types/movie";
import { fetchFromTMDB } from "./api";
import { formatMovieToContentItem, formatTVShowToContentItem } from "./formatters";
import { searchMockContent } from "./mock-data";

// Function to search for content
export const searchContent = async (query: string): Promise<ContentItem[]> => {
  if (!query) return [];
  
  try {
    // Search for movies and TV shows
    const data = await fetchFromTMDB('/search/multi', { query });
    
    if (!data) {
      return searchMockContent(query);
    }
    
    // Format and filter results (only keep movies and TV shows)
    return data.results
      .filter((item: any) => item.media_type === 'movie' || item.media_type === 'tv')
      .map((item: any) => {
        if (item.media_type === 'movie') {
          return formatMovieToContentItem(item);
        } else {
          return formatTVShowToContentItem(item);
        }
      });
      
  } catch (error) {
    console.error('Error searching content:', error);
    return searchMockContent(query);
  }
};

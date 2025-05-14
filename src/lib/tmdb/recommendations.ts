
import { ContentItem, MoodType } from "@/types/movie";
import { fetchFromTMDB } from "./api";
import { formatMovieToContentItem, formatTVShowToContentItem } from "./formatters";
import { MOCK_MOVIES } from "./mock-data";

// Function to get movie recommendations based on mood
export const getRecommendationsByMood = async (mood: MoodType): Promise<ContentItem[]> => {
  let genreIds: number[] = [];
  
  // Map moods to genre IDs (based on TMDB genres)
  switch(mood) {
    case 'happy':
      genreIds = [35, 10751]; // Comedy, Family
      break;
    case 'sad':
      genreIds = [18, 10749]; // Drama, Romance
      break;
    case 'excited':
      genreIds = [28, 12, 53]; // Action, Adventure, Thriller
      break;
    case 'relaxed':
      genreIds = [16, 99, 36]; // Animation, Documentary, History
      break;
    case 'romantic':
      genreIds = [10749, 35]; // Romance, Comedy
      break;
    case 'scared':
      genreIds = [27, 9648]; // Horror, Mystery
      break;
    case 'thoughtful':
      genreIds = [878, 18, 36]; // Science Fiction, Drama, History
      break;
  }
  
  try {
    // Select a random genre from the mood's genre list
    const genreId = genreIds[Math.floor(Math.random() * genreIds.length)];
    
    // Fetch movies by genre
    const moviesData = await fetchFromTMDB('/discover/movie', { 
      with_genres: genreId.toString(),
      sort_by: 'popularity.desc'
    });
    
    // Fetch TV shows by genre
    const tvShowsData = await fetchFromTMDB('/discover/tv', { 
      with_genres: genreId.toString(),
      sort_by: 'popularity.desc'
    });
    
    if (!moviesData || !tvShowsData) {
      return MOCK_MOVIES; // Fallback to mock data
    }
    
    // Format and combine results
    const movies = moviesData.results.slice(0, 10).map(formatMovieToContentItem);
    const tvShows = tvShowsData.results.slice(0, 10).map(formatTVShowToContentItem);
    
    // Mix movies and TV shows
    return [...movies, ...tvShows]
      .sort(() => Math.random() - 0.5) // Shuffle array
      .slice(0, 15); // Take 15 items max
      
  } catch (error) {
    console.error('Error getting recommendations by mood:', error);
    return MOCK_MOVIES; // Fallback to mock data
  }
};


// Re-export all TMDB functionality from this central file
import { TMDB_BASE_URL, LANGUAGE } from './api';
export { TMDB_BASE_URL, LANGUAGE };

// Export mock data
export { 
  MOCK_MOVIES, 
  MOCK_STREAMING_PROVIDERS, 
  MOCK_MOOD_OPTIONS 
} from './mock-data';

// Export API functions
export { getPopularMovies } from './movies';
export { getPopularTVShows } from './tv';
export { getTrending } from './trending';
export { searchContent } from './search';
export { getRecommendationsByMood } from './recommendations';
export { getContentDetails } from './content-details';
export { getMoviesByMood } from './utils';

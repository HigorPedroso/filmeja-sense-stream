
// This file now serves as a re-export of the new modular structure
// to maintain backward compatibility with existing imports
export * from './tmdb/index';

const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const BASE_URL = 'https://api.themoviedb.org/3';

export async function getTrending() {
  try {
    const response = await fetch(
      `${BASE_URL}/trending/all/week?api_key=${TMDB_API_KEY}&language=pt-BR`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch trending content');
    }

    const data = await response.json();
    return data.results;
  } catch (error) {
    console.error('Error fetching trending:', error);
    return [];
  }
}

export async function getUpcoming2025() {
  try {
    const response = await fetch(
      `${BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&language=pt-BR&primary_release_year=2025&sort_by=popularity.desc`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch upcoming movies');
    }

    const data = await response.json();
    return data.results;
  } catch (error) {
    console.error('Error fetching upcoming movies:', error);
    return [];
  }
}

export const getMoodRecommendation = async (moodId: string) => {
  const genreMap = {
    happy: [35, 12, 10402], // Comedy, Adventure, Musical
    sad: [18, 10751, 14], // Drama, Family, Fantasy
    anxious: [10749, 35], // Romance, Comedy (short duration)
    bored: [28, 9648, 878], // Action, Mystery, Sci-Fi
    romantic: [10749, 10751], // Romance, Family
    reflective: [99, 18], // Documentary, Drama
  };

  const genres = genreMap[moodId as keyof typeof genreMap] || [];
  
  // Add your TMDB API call here to get movies by genres
  // For now, returning mock data
  return {
    title: "Mock Movie",
    backdrop_path: "/mock-path.jpg",
    overview: "This is a mock movie recommendation based on your mood.",
    genres: ["Genre 1", "Genre 2"]
  };
};

const moodGenreMap = {
  happy: [35, 12, 10402], // Comedy, Adventure, Musical
  sad: [18, 10751, 14], // Drama, Family, Fantasy
  anxious: [10749, 35], // Romance, Comedy
  bored: [28, 9648, 878], // Action, Mystery, Sci-Fi
  romantic: [10749, 10751], // Romance, Family
  reflective: [99, 18], // Documentary, Drama
};

export const getMoviesByMood = async (mood: string) => {
  const genres = moodGenreMap[mood as keyof typeof moodGenreMap] || [];
  const response = await fetch(
    `https://api.themoviedb.org/3/discover/movie?api_key=${import.meta.env.VITE_TMDB_API_KEY}&with_genres=${genres.join(',')}&sort_by=popularity.desc&language=pt-BR`
  );
  const data = await response.json();
  return data.results;
};

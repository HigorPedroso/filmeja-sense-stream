import { ContentDetails, ContentItem, MoodType, Movie, TVShow } from "@/types/movie";
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client to access TMDB API key from edge functions
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://yynlzhfibeozrwrtrjbs.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5bmx6aGZpYmVvenJ3cnRyamJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTc1MDA5MTYsImV4cCI6MjAzMzA3NjkxNn0.JdDBPMF1ycCCGRz1cR0-sgGEP2EFqPeSiwORlC6SYC8';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Base TMDB API URL
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const LANGUAGE = 'pt-BR'; // Portuguese Brazil

// Function to fetch from TMDB API
async function fetchFromTMDB(endpoint: string, params: Record<string, string> = {}) {
  try {
    // Get TMDB API key from Supabase edge function
    const { data, error } = await supabase.functions.invoke('get-tmdb-key', {
      body: { action: 'get_key' }
    });
    
    if (error) {
      console.error('Error fetching TMDB API key:', error);
      throw new Error('Could not fetch TMDB API key');
    }
    
    const apiKey = data.key;
    
    // Build query params
    const queryParams = new URLSearchParams({
      api_key: apiKey,
      language: LANGUAGE,
      ...params
    });
    
    const response = await fetch(`${TMDB_BASE_URL}${endpoint}?${queryParams}`);
    
    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching data from TMDB:', error);
    
    // Fallback to mock data when API fails
    console.log('Falling back to mock data...');
    return null;
  }
}

// Format TMDB movie data to ContentItem
function formatMovieToContentItem(movie: any): ContentItem {
  return {
    id: movie.id,
    title: movie.title,
    poster_path: movie.poster_path,
    backdrop_path: movie.backdrop_path,
    release_date: movie.release_date,
    overview: movie.overview,
    vote_average: movie.vote_average,
    media_type: 'movie',
    genre_ids: movie.genre_ids
  };
}

// Format TMDB TV show data to ContentItem
function formatTVShowToContentItem(tvShow: any): ContentItem {
  return {
    id: tvShow.id,
    title: tvShow.name,
    poster_path: tvShow.poster_path,
    backdrop_path: tvShow.backdrop_path,
    release_date: tvShow.first_air_date,
    overview: tvShow.overview,
    vote_average: tvShow.vote_average,
    media_type: 'tv',
    genre_ids: tvShow.genre_ids
  };
}

// Mock data for development (fallback)
const MOCK_MOVIES: ContentItem[] = [
  {
    id: 1,
    title: "Interestelar",
    poster_path: "/nCbkOyOMTEwlEV0LtCOvCnwEONA.jpg",
    backdrop_path: "/uoT92GJJb2UXmQk9Jf3JJp9hvCh.jpg",
    release_date: "2014-11-07",
    overview: "As reservas naturais da Terra estão chegando ao fim e um grupo de astronautas recebe a missão de verificar possíveis planetas para receberem a população mundial, possibilitando a continuação da espécie.",
    vote_average: 8.4,
    media_type: "movie",
    genre_ids: [12, 18, 878]
  },
  {
    id: 2,
    title: "À Procura da Felicidade",
    poster_path: "/u9mJRgens5jZQ5UMWGBieKJa6Uj.jpg",
    backdrop_path: "/AnfXhKJwb9YIGugAQPdqv9fJXsu.jpg",
    release_date: "2006-12-15",
    overview: "Chris Gardner é um vendedor talentoso e inteligente, mas seu emprego não paga o suficiente para ele e seu filho. Quando eles são despejados, ele se inscreve para um estágio em uma corretora de valores.",
    vote_average: 8.0,
    media_type: "movie",
    genre_ids: [18]
  },
  {
    id: 3,
    title: "Clube da Luta",
    poster_path: "/r3pPehX4ik8NLYPpbDRAh0YRtMb.jpg",
    backdrop_path: "/nQZB3picKH7XVYpvuGX1jgpq6oy.jpg",
    release_date: "1999-10-15",
    overview: "Um homem deprimido que sofre de insônia conhece um estranho vendedor de sabonetes e juntos formam um clube clandestino onde homens lutam entre si.",
    vote_average: 8.4,
    media_type: "movie",
    genre_ids: [18, 53]
  },
  {
    id: 4,
    title: "Stranger Things",
    poster_path: "/49WJfeN0moxb9IPfGn8AIqMGskD.jpg",
    backdrop_path: "/56v2KjBlU4XaOv9rVYEQypROD7P.jpg",
    release_date: "2016-07-15",
    overview: "Quando um garoto desaparece, a cidade toda participa nas buscas. Mas o que encontram são segredos, forças sobrenaturais e uma menina.",
    vote_average: 8.6,
    media_type: "tv",
    genre_ids: [18, 10765]
  },
  {
    id: 5,
    title: "Breaking Bad",
    poster_path: "/30erzlzIOtOK3k3T3BAl1GiVMP1.jpg",
    backdrop_path: "/tsRy63Mu5cu8etL1X7ZLyf7UP1M.jpg",
    release_date: "2008-01-20",
    overview: "Ao saber que tem câncer, um professor de química decide fabricar e vender metanfetamina para garantir o futuro da família.",
    vote_average: 8.8,
    media_type: "tv",
    genre_ids: [18, 80]
  },
  {
    id: 6,
    title: "Oppenheimer",
    poster_path: "/c0DCmfC7Et2K3URnIJ4ahJpeXR2.jpg",
    backdrop_path: "/fm6KqXpk3M2HVveHwCrBSSBaO0V.jpg",
    release_date: "2023-07-21",
    overview: "A história do cientista americano J. Robert Oppenheimer e seu papel no desenvolvimento da bomba atômica.",
    vote_average: 8.2,
    media_type: "movie",
    genre_ids: [18, 36]
  },
  {
    id: 7,
    title: "O Menino do Pijama Listrado",
    poster_path: "/zYRk58BJd7bLErTWlx3tVsUUbbV.jpg",
    backdrop_path: "/xwOgAitic6YJOMnqQMGY2fLJhJX.jpg",
    release_date: "2008-09-12",
    overview: "Durante a Segunda Guerra Mundial, Bruno, um garoto de oito anos, e sua família saem de Berlim para residir próximo a um campo de concentração onde seu pai acaba de se tornar comandante.",
    vote_average: 8.1,
    media_type: "movie",
    genre_ids: [18, 10752]
  },
  {
    id: 8,
    title: "The Last of Us",
    poster_path: "/uKvVjHNqB5VmOrdxqAt2F7J78ED.jpg",
    backdrop_path: "/bQXAqRx2Fgc46uCVWgoPz5L5Dtr.jpg",
    release_date: "2023-01-15",
    overview: "Vinte anos após a queda da civilização moderna, Joel é contratado para tirar Ellie de uma zona de quarentena perigosa.",
    vote_average: 8.7,
    media_type: "tv",
    genre_ids: [18, 10765]
  }
];

export const MOCK_STREAMING_PROVIDERS = [
  { provider_id: 8, provider_name: "Netflix", logo_path: "/t2yyOv40HZeVlLjYsCsPHnWLk4W.jpg" },
  { provider_id: 119, provider_name: "Amazon Prime Video", logo_path: "/68MNrwlkpF7WnmNPXLah69CR5cb.jpg" },
  { provider_id: 337, provider_name: "Disney Plus", logo_path: "/7rwgEs15tFwyR9NPQ5vpzxTj19Q.jpg" },
  { provider_id: 350, provider_name: "Apple TV Plus", logo_path: "/6uhKBfmtzFqOcLousHwZuzcrScK.jpg" },
  { provider_id: 384, provider_name: "HBO Max", logo_path: "/aS2zvJWn9mwiCOeaaCkIh4wleZS.jpg" },
  { provider_id: 607, provider_name: "Globoplay", logo_path: "/vOF4hWwV6l2Db98lhQLUZip9MIW.jpg" }
];

export const MOCK_MOOD_OPTIONS = [
  { 
    id: 'happy', 
    label: 'Feliz', 
    description: 'Estou procurando algo divertido e positivo',
    icon: '😊'
  },
  { 
    id: 'sad', 
    label: 'Triste', 
    description: 'Preciso de algo reconfortante',
    icon: '😢'
  },
  { 
    id: 'excited', 
    label: 'Animado', 
    description: 'Quero algo cheio de ação e adrenalina',
    icon: '🤩'
  },
  { 
    id: 'relaxed', 
    label: 'Relaxado', 
    description: 'Algo tranquilo para descontrair',
    icon: '😌'
  },
  { 
    id: 'romantic', 
    label: 'Romântico', 
    description: 'Estou no clima para uma história de amor',
    icon: '❤️'
  },
  { 
    id: 'scared', 
    label: 'Assustado', 
    description: 'Quero sentir medo e tensão',
    icon: '😱'
  },
  { 
    id: 'thoughtful', 
    label: 'Pensativo', 
    description: 'Algo que me faça refletir',
    icon: '🤔'
  }
];

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

// Function to get content details
export const getContentDetails = async (id: number, type: 'movie' | 'tv'): Promise<ContentDetails> => {
  try {
    // Fetch content details
    const data = await fetchFromTMDB(`/${type}/${id}`);
    
    // Fetch videos to get trailer
    const videosData = await fetchFromTMDB(`/${type}/${id}/videos`);
    
    // Fetch streaming providers (watch providers)
    const watchProvidersData = await fetchFromTMDB(`/${type}/${id}/watch/providers`);
    
    if (!data) {
      const mockItem = MOCK_MOVIES.find(movie => movie.id === id);
      if (!mockItem) {
        throw new Error('Content not found');
      }
      return getContentDetails(id);
    }
    
    // Extract trailer key
    let trailerKey = '';
    if (videosData && videosData.results && videosData.results.length > 0) {
      // Try to find official trailers first
      const trailer = videosData.results.find((video: any) => 
        video.type === 'Trailer' && (video.official || video.site === 'YouTube')
      );
      
      // If no official trailer, just use the first video
      trailerKey = trailer ? trailer.key : (videosData.results[0]?.key || '');
    }
    
    // Extract streaming providers
    let streamingProviders: any[] = [];
    if (watchProvidersData && watchProvidersData.results && watchProvidersData.results['BR']) {
      // Get Brazilian providers (flatrate = subscription)
      const brProviders = watchProvidersData.results['BR'];
      
      if (brProviders.flatrate) {
        streamingProviders = brProviders.flatrate.map((provider: any) => ({
          provider_id: provider.provider_id,
          provider_name: provider.provider_name,
          logo_path: provider.logo_path
        }));
      }
    }
    
    // If no streaming providers from API, use mock data
    if (streamingProviders.length === 0) {
      streamingProviders = [MOCK_STREAMING_PROVIDERS[0], MOCK_STREAMING_PROVIDERS[1]];
    }
    
    // Format the content details
    const contentDetails: ContentDetails = {
      id: data.id,
      title: type === 'movie' ? data.title : data.name,
      overview: data.overview,
      poster_path: data.poster_path,
      backdrop_path: data.backdrop_path,
      release_date: type === 'movie' ? data.release_date : data.first_air_date,
      vote_average: data.vote_average,
      genres: data.genres || [],
      runtime: type === 'movie' ? data.runtime : undefined,
      number_of_seasons: type === 'tv' ? data.number_of_seasons : undefined,
      streaming_providers: streamingProviders,
      trailer_key: trailerKey,
      media_type: type
    };
    
    return contentDetails;
    
  } catch (error) {
    console.error('Error getting content details:', error);
    
    // Fallback to mock content details
    const mockItem = MOCK_MOVIES.find(movie => movie.id === id);
    if (!mockItem) {
      throw new Error('Content not found');
    }
    
    return {
      ...mockItem,
      genres: [
        { id: 18, name: 'Drama' },
        { id: 878, name: 'Ficção Científica' }
      ],
      runtime: mockItem.media_type === 'movie' ? 150 : undefined,
      number_of_seasons: mockItem.media_type === 'tv' ? 4 : undefined,
      streaming_providers: [
        MOCK_STREAMING_PROVIDERS[0],
        MOCK_STREAMING_PROVIDERS[1]
      ],
      trailer_key: 'zSWdZVtXT7E'
    };
  }
};

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

// Helper function to search in mock data
function searchMockContent(query: string): ContentItem[] {
  const lowerQuery = query.toLowerCase();
  return MOCK_MOVIES.filter(
    item => item.title.toLowerCase().includes(lowerQuery) || 
           item.overview.toLowerCase().includes(lowerQuery)
  );
}

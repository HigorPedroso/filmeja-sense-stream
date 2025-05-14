
import { ContentDetails as ContentDetailsType } from "@/types/movie";
import { fetchFromTMDB } from "./api";
import { MOCK_MOVIES, MOCK_STREAMING_PROVIDERS } from "./mock-data";

// Function to get content details
export const getContentDetails = async (id: number, type: 'movie' | 'tv'): Promise<ContentDetailsType> => {
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
      // Pass both id and the media_type from mockItem
      return getContentDetails(id, mockItem.media_type);
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
    const contentDetails: ContentDetailsType = {
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

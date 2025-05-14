
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client to access TMDB API key from edge functions
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://yynlzhfibeozrwrtrjbs.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5bmx6aGZpYmVvenJ3cnRyamJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTc1MDA5MTYsImV4cCI6MjAzMzA3NjkxNn0.JdDBPMF1ycCCGRz1cR0-sgGEP2EFqPeSiwORlC6SYC8';
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Base TMDB API URL
export const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
export const LANGUAGE = 'pt-BR'; // Portuguese Brazil

// Function to fetch from TMDB API
export async function fetchFromTMDB(endpoint: string, params: Record<string, string> = {}) {
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

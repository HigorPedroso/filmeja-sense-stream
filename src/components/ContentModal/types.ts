
export interface ContentModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  content: any;
  isLoading: boolean;
  onRequestNew?: () => void;
  selectedMood?: string;
  onMarkAsWatched: (content: any) => Promise<void>;
}

export interface ContentType {
  id: number;
  title?: string;
  name?: string;
  poster_path?: string;
  backdrop_path?: string;
  overview?: string;
  vote_average?: number;
  release_date?: string;
  runtime?: number;
  original_language?: string;
  genres?: { id: number; name: string }[];
  videos?: { key: string }[];
  tagline?: string;
  mediaType: "movie" | "tv";
  providers?: {
    flatrate?: {
      provider_id: number;
      provider_name: string;
      logo_path: string;
      provider_url?: string;
    }[];
  };
}

export interface WatchedContent {
  id?: string;
  user_id: string;
  tmdb_id: number;
  media_type: string;
  title: string;
  watched_at?: string;
}

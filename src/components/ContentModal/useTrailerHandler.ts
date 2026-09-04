
import { useState, useEffect } from "react";
import { buildYoutubeEmbedUrl } from "@/lib/youtubeEmbed";
import { getTmdbLanguage } from "@/lib/tmdbLanguage";

interface ContentData {
  title?: string;
  name?: string;
  videos?: { key: string }[];
  mediaType?: "movie" | "tv";
}

export const useTrailerHandler = (contentData: ContentData) => {
  const [showTrailerModal, setShowTrailerModal] = useState(false);
  const [trailerSource, setTrailerSource] = useState<"tmdb" | "youtube" | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [trailerUrl, setTrailerUrl] = useState<string>("");

  const handleTrailerClick = async () => {
    setShowTrailerModal(true);
    setIsTransitioning(true);

    try {
      if (contentData.videos && contentData.videos.length > 0) {
        setTrailerSource("tmdb");
        const url = buildYoutubeEmbedUrl(contentData.videos[0]?.key ?? null, "autoplay=1");
        setTrailerUrl(url);
      } else {
        setTrailerSource("youtube");
        const url = await getTrailerUrl();
        setTrailerUrl(url);
      }
    } catch (error) {
      console.error("Error setting trailer URL:", error);
    }

    setIsTransitioning(false);
  };

  const getTrailerUrl = async () => {
    if (trailerSource === "tmdb" && contentData.videos && contentData.videos.length > 0) {
      return buildYoutubeEmbedUrl(contentData.videos[0]?.key ?? null, "autoplay=1");
    }

    const title = contentData.title || contentData.name || "";
    const mediaType = contentData.mediaType || "movie";

    const apiKey = "AIzaSyB0F3SGk2QWvSg5pBr96a_mTu8SzZ4yAfA";
    const isEnglish = getTmdbLanguage() === "en-US";
    const searchQuery = encodeURIComponent(
      isEnglish
        ? `${title} ${mediaType === "movie" ? "movie" : "show"} official trailer`
        : `${title} ${mediaType === "movie" ? "filme" : "série"} trailer oficial`
    );
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=1&q=${searchQuery}&key=${apiKey}`;

    try {
      const res = await fetch(url);
      const data = await res.json();

      if (data.items && data.items.length > 0) {
        const videoId = data.items[0].id.videoId;
        return buildYoutubeEmbedUrl(videoId, "autoplay=1");
      }
    } catch (error) {
      console.error("Error fetching trailer:", error);
    }

    return buildYoutubeEmbedUrl(null, `listType=search&list=${searchQuery}&autoplay=1`);
  };

  const closeTrailerModal = () => {
    setShowTrailerModal(false);
    setTrailerSource(null);
    setTrailerUrl("");
  };

  return {
    showTrailerModal,
    trailerUrl,
    isTransitioning,
    handleTrailerClick,
    closeTrailerModal
  };
};

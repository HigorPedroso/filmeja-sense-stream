
import { useState } from "react";
import { ContentType } from "./types";

export const useTrailerHandler = (contentData: ContentType | null) => {
  const [trailerKey, setTrailerKey] = useState<string | null>(null);

  const handleTrailerClick = async () => {
    if (!contentData) return;
    
    try {
      if (contentData.videos && contentData.videos.length > 0) {
        setTrailerKey(contentData.videos[0]?.key);
        return;
      }

      const title = contentData.title || contentData.name || "";
      const mediaType = contentData.mediaType || "movie";

      const apiKey = "AIzaSyB0F3SGk2QWvSg5pBr96a_mTu8SzZ4yAfA";
      const searchQuery = encodeURIComponent(
        `${title} ${mediaType === "movie" ? "filme" : "série"} trailer oficial`
      );
      const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=1&q=${searchQuery}&key=${apiKey}`;

      try {
        const res = await fetch(url);
        const data = await res.json();

        if (data.items && data.items.length > 0) {
          const videoId = data.items[0].id.videoId;
          setTrailerKey(videoId);
        }
      } catch (error) {
        console.error("Error fetching trailer:", error);
      }
    } catch (error) {
      console.error("Error setting trailer URL:", error);
    }
  };

  return {
    trailerKey,
    handleTrailerClick
  };
};

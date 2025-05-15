
import { ContentItem, MoodType } from "@/types/movie";
import { getRecommendationsByMood } from "./recommendations";

export const getMoviesByMood = async (mood: MoodType): Promise<ContentItem[]> => {
  try {
    const recommendations = await getRecommendationsByMood(mood);
    return recommendations;
  } catch (error) {
    console.error("Error fetching movies by mood:", error);
    return [];
  }
};

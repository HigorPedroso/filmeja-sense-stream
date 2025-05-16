import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

interface WatchedContent {
  title?: string;
  name?: string;
  media_type: "movie" | "tv";
}

interface AIRecommendation {
  title: string;
  type: "movie" | "tv";
}

export async function getRecommendationsFromGemini(
  watchedContent: WatchedContent[]
): Promise<AIRecommendation[]> {
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });

  const watchedTitles = watchedContent
    .map((item) => `${item.title || item.name} (${item.media_type})`)
    .join(", ");

  const prompt = `Based on these watched movies and TV shows: ${watchedTitles}

Please recommend 5 similar movies or TV shows. Consider themes, genres, and style.
Format the response as a JSON array with objects containing:
- title: the exact title
- type: either "movie" or "tv"

Only return the JSON array, no additional text.`;

const geminiResponse = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${
      import.meta.env.VITE_GEMINI_API_KEY
    }`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text:
                  prompt +
                  "\nResponda apenas com o JSON, sem texto adicional.",
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
      }),
    }
  );

  const result = await geminiResponse.json();
  const responseText = result.candidates[0].content.parts[0].text;
  const cleanedJson = responseText.replace(/```json|```/g, "").trim();
  
  try {
    const recommendations = JSON.parse(cleanedJson);
    return recommendations;
  } catch (error) {
    console.error("Error parsing Gemini response:", error);
    return [];
  }
}
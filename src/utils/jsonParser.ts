export function extractJsonFromResponse(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    const jsonMatch = text.match(/```(?:json)?\s*(\[[\s\S]*?\])\s*```/);
    if (jsonMatch?.[1]) {
      try {
        return JSON.parse(jsonMatch[1].trim());
      } catch {
        const arrayMatch = text.match(/\[\s*{[\s\S]*?}\s*\]/);
        if (arrayMatch?.[0]) {
          try {
            return JSON.parse(arrayMatch[0]);
          } catch {
            console.error("Failed to parse array structure");
          }
        }
      }
    }
    
    const suggestions = [];
    const matches = text.matchAll(/{[^}]*"title"[^}]*"tmdbId"[^}]*}/g);
    for (const match of matches) {
      try {
        suggestions.push(JSON.parse(match[0]));
      } catch {
        continue;
      }
    }
    return suggestions;
  }
}
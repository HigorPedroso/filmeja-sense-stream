// Shared by the three AI-recommendation prompt sites (Dashboard's onboarding
// pick, its genre flow, and fetchMoodRecommendation) — each used to fetch,
// parse and validate the Gemini response inline, with subtly different
// copies of the same ~20-line block. Centralized here after tracking down a
// real failure mode via device logs: Gemini can finish with `finishReason:
// "RECITATION"` (it judged the output too close to source material — common
// when asking for structured facts about copyrighted movies/shows, and more
// so with the google_search grounding tool on) and return no text at all.
// It's non-deterministic enough that retrying the same prompt usually
// succeeds, so this retries automatically instead of failing the user's
// very first attempt.

interface CallGeminiOptions {
  maxOutputTokens?: number;
  temperature?: number;
  // Additional attempts after the first (so maxRetries: 2 = 3 total tries).
  maxRetries?: number;
}

export async function callGeminiForText(prompt: string, options: CallGeminiOptions = {}): Promise<string> {
  const { maxOutputTokens = 4096, temperature = 0.7, maxRetries = 2 } = options;

  let lastDiagnostic: Record<string, unknown> = {};

  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${
        import.meta.env.VITE_GEMINI_API_KEY
      }`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          tools: [{ google_search: {} }],
          generationConfig: {
            temperature,
            topK: 40,
            topP: 0.95,
            maxOutputTokens,
            thinkingConfig: { thinkingBudget: 0 },
          },
        }),
      }
    );

    const geminiResponseText = await geminiResponse.text();
    let geminiData: any;
    try {
      geminiData = JSON.parse(geminiResponseText);
    } catch {
      console.error(`[gemini] non-JSON response (attempt ${attempt}/${maxRetries + 1})`, geminiResponse.status, geminiResponseText);
      lastDiagnostic = { status: geminiResponse.status, nonJson: true };
      continue;
    }

    // With google_search grounding enabled the answer can come back split
    // across multiple parts (e.g. grounding metadata ahead of the actual
    // text) — reading only parts[0].text silently dropped real content
    // whenever that happened. Join every part instead.
    const responseParts = geminiData?.candidates?.[0]?.content?.parts;
    const raw = responseParts?.map((p: any) => p?.text || "").join("") || undefined;

    if (raw) return raw;

    lastDiagnostic = {
      status: geminiResponse.status,
      finishReason: geminiData?.candidates?.[0]?.finishReason,
      safetyRatings: geminiData?.candidates?.[0]?.safetyRatings,
      promptFeedback: geminiData?.promptFeedback,
      error: geminiData?.error,
      partsCount: responseParts?.length,
    };
    console.error(`[gemini] empty response (attempt ${attempt}/${maxRetries + 1}) ` + JSON.stringify(lastDiagnostic));

    if (attempt <= maxRetries) {
      await new Promise((resolve) => setTimeout(resolve, 400 * attempt));
    }
  }

  console.error("[gemini] giving up after retries " + JSON.stringify(lastDiagnostic));
  throw new Error("Empty response from Gemini");
}

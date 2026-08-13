import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const logStep = (step: string, details?: unknown) => {
  console.log(`[SEND-TITLE-COMPATIBILITY] ${step}${details ? " - " + JSON.stringify(details) : ""}`);
};

// Same 12 genres the Dashboard's "Por Gênero" picker offers — genre_selected
// events can only ever contain one of these IDs, so this is a closed set.
const GENRE_NAMES: Record<number, string> = {
  28: "Ação",
  12: "Aventura",
  53: "Thriller",
  18: "Drama",
  10749: "Romance",
  10751: "Família",
  14: "Fantasia",
  878: "Ficção Científica",
  16: "Animação",
  35: "Comédia",
  27: "Terror",
  9648: "Mistério",
};

const MIN_SCORE = 80;
const MAX_CANDIDATES_PER_RUN = 20;

// Called daily by a pg_cron job (see supabase/title_compatibility_notifications.sql).
// Checks today's TMDB trending list for titles available on a BR streaming
// service, scores each against every user's genre-pick history, and sends a
// "X% compatible with you" push to anyone above MIN_SCORE who hasn't
// already been notified about that exact title.
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    if (authHeader !== `Bearer ${serviceRoleKey}`) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const tmdbApiKey = Deno.env.get("TMDB_API_KEY");
    if (!tmdbApiKey) throw new Error("TMDB_API_KEY secret is not set");

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseClient = createClient(supabaseUrl, serviceRoleKey);

    const trendingResponse = await fetch(
      `https://api.themoviedb.org/3/trending/all/day?api_key=${tmdbApiKey}&language=pt-BR`
    );
    const trendingData = await trendingResponse.json();
    const candidates = (trendingData.results ?? [])
      .filter((item: any) => (item.media_type === "movie" || item.media_type === "tv") && item.genre_ids?.length)
      .slice(0, MAX_CANDIDATES_PER_RUN);

    logStep("Trending candidates fetched", { count: candidates.length });

    let notifiedCount = 0;

    for (const candidate of candidates) {
      const tmdbId = candidate.id;
      const mediaType = candidate.media_type;
      const title = candidate.title || candidate.name;

      try {
        // Only titles actually streamable in Brazil — same rule the rest
        // of the app uses (flatrate, not rent/buy-only).
        const providersResponse = await fetch(
          `https://api.themoviedb.org/3/${mediaType}/${tmdbId}/watch/providers?api_key=${tmdbApiKey}`
        );
        const providersData = await providersResponse.json();
        if (!providersData.results?.BR?.flatrate?.length) continue;

        const { data: scored, error: scoreError } = await supabaseClient.rpc("get_title_compatibility", {
          candidate_genre_ids: candidate.genre_ids,
        });
        if (scoreError) throw scoreError;

        const matches = (scored ?? []).filter((row: { score: number }) => row.score >= MIN_SCORE);
        if (matches.length === 0) continue;

        // Skip users already notified about this exact title.
        const { data: alreadyNotified } = await supabaseClient
          .from("title_compatibility_notified")
          .select("user_id")
          .eq("tmdb_id", tmdbId)
          .in(
            "user_id",
            matches.map((m: { user_id: string }) => m.user_id)
          );
        const alreadyNotifiedIds = new Set((alreadyNotified ?? []).map((row: { user_id: string }) => row.user_id));

        const matchedGenreNames = candidate.genre_ids
          .map((id: number) => GENRE_NAMES[id])
          .filter(Boolean)
          .join(", ");

        for (const match of matches) {
          if (alreadyNotifiedIds.has(match.user_id)) continue;

          const notificationTitle = `Encontramos um filme ${match.score}% compatível com você`;
          const notificationBody = matchedGenreNames || title;

          const sendResponse = await fetch(`${supabaseUrl}/functions/v1/send-push-notification`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${serviceRoleKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              userId: match.user_id,
              title: notificationTitle,
              body: notificationBody,
              data: { tmdbId: String(tmdbId), mediaType },
            }),
          });
          const sendResult = await sendResponse.json();

          if (sendResponse.ok && sendResult.sent > 0) {
            notifiedCount++;
            await supabaseClient.from("title_compatibility_notified").insert({
              user_id: match.user_id,
              tmdb_id: tmdbId,
              media_type: mediaType,
            });
            await supabaseClient.from("user_events").insert({
              user_id: match.user_id,
              event_type: "notification_sent",
              metadata: { reason: "title_compatibility", tmdbId, score: match.score },
            });
          }
        }
      } catch (candidateError) {
        logStep("Error processing candidate", { tmdbId, error: candidateError.message });
      }
    }

    logStep("Done", { notifiedCount, candidatesChecked: candidates.length });
    return new Response(JSON.stringify({ notified: notifiedCount, candidatesChecked: candidates.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    logStep("Error", { error: error.message });
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const logStep = (step: string, details?: unknown) => {
  console.log(`[SEND-SMART-REENGAGEMENT] ${step}${details ? " - " + JSON.stringify(details) : ""}`);
};

// top_choice is a mood/genre display name stored in Portuguese (the app's
// business-logic source of truth — see moodNames/genreCategories client-side).
// English users still get an English sentence around it; unmapped values
// (a mood/genre added later and not yet listed here) just fall back to the
// raw Portuguese word rather than breaking the notification.
const CHOICE_TRANSLATIONS: Record<string, string> = {
  feliz: "happy",
  triste: "sad",
  animado: "excited",
  relaxado: "relaxed",
  romântico: "romantic",
  assustado: "scared",
  pensativo: "thoughtful",
  Ação: "Action",
  Aventura: "Adventure",
  Thriller: "Thriller",
  Drama: "Drama",
  Romance: "Romance",
  Família: "Family",
  Fantasia: "Fantasy",
  "Ficção Científica": "Sci-Fi",
  Animação: "Animation",
  Comédia: "Comedy",
  Terror: "Horror",
  Mistério: "Mystery",
};

function translateChoice(choice: string, language: string): string {
  if (language !== "en-US") return choice;
  return CHOICE_TRANSLATIONS[choice] ?? choice;
}

// Called once a day by a pg_cron job (see supabase/reengagement_notifications.sql).
// Finds users inactive for 3+ days who haven't been re-engaged recently,
// picks each one's favorite mood/genre from user_events, and sends a
// personalized push via send-push-notification.
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

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseClient = createClient(supabaseUrl, serviceRoleKey);

    const { data: candidates, error } = await supabaseClient.rpc("get_reengagement_candidates", {
      inactive_days: 3,
      cooldown_days: 3,
    });
    if (error) throw error;

    logStep("Candidates found", { count: candidates?.length ?? 0 });

    let sentCount = 0;
    for (const candidate of candidates ?? []) {
      const isEnglish = candidate.language === "en-US";
      const topChoice = candidate.top_choice ? translateChoice(candidate.top_choice, candidate.language) : null;
      const title = isEnglish ? "Missing a good recommendation?" : "Sentiu falta de uma boa recomendação?";
      const body = topChoice
        ? isEnglish
          ? `Based on your taste for "${topChoice}", we picked something for you on FilmeJá.`
          : `Baseado no seu gosto por "${topChoice}", separamos algo pra você no FilmeJá.`
        : isEnglish
          ? "We have new recommendations waiting for you on FilmeJá."
          : "Temos recomendações novas esperando por você no FilmeJá.";

      try {
        const sendResponse = await fetch(`${supabaseUrl}/functions/v1/send-push-notification`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${serviceRoleKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId: candidate.user_id, title, body }),
        });
        const sendResult = await sendResponse.json();

        if (sendResponse.ok && sendResult.sent > 0) {
          sentCount++;
          await supabaseClient.from("user_events").insert({
            user_id: candidate.user_id,
            event_type: "notification_sent",
            metadata: { reason: "reengagement", topChoice: candidate.top_choice },
          });
        } else {
          logStep("Send failed for candidate", { userId: candidate.user_id, sendResult });
        }
      } catch (sendError) {
        logStep("Error sending to candidate", { userId: candidate.user_id, error: sendError.message });
      }
    }

    logStep("Done", { sentCount, totalCandidates: candidates?.length ?? 0 });
    return new Response(JSON.stringify({ sent: sentCount, candidates: candidates?.length ?? 0 }), {
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

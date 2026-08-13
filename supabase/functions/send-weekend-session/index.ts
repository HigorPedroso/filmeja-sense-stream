import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const logStep = (step: string, details?: unknown) => {
  console.log(`[SEND-WEEKEND-SESSION] ${step}${details ? " - " + JSON.stringify(details) : ""}`);
};

// Called every Friday and Saturday evening by a pg_cron job (see
// supabase/weekend_session_notifications.sql). Unlike
// send-smart-reengagement, this goes out to every user with a device token
// — it's a recurring "what to watch tonight" nudge, not a win-back.
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

    // Brasília time specifically — the cron fires at a fixed UTC hour, but
    // which calendar day that lands on (for wording) should follow local time.
    const weekday = new Intl.DateTimeFormat("pt-BR", { weekday: "long", timeZone: "America/Sao_Paulo" }).format(
      new Date()
    );
    const isFriday = weekday.startsWith("sexta");
    const dayGreeting = isFriday ? "Sextou!" : "Chegou o sábado!";

    const { data: candidates, error } = await supabaseClient.rpc("get_weekend_session_candidates");
    if (error) throw error;

    logStep("Candidates found", { count: candidates?.length ?? 0, dayGreeting });

    let sentCount = 0;
    for (const candidate of candidates ?? []) {
      const title = `${dayGreeting} Hora da sessão 🍿`;
      const body = candidate.top_choice
        ? `Que tal algo no clima de "${candidate.top_choice}" pra noite de hoje? Temos uma sugestão no FilmeJá.`
        : "Separamos uma sugestão pra sua noite no FilmeJá.";

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
            metadata: { reason: "weekend_session", topChoice: candidate.top_choice },
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

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Tables keyed by `user_id` that hold data tied to an account. `profiles`
// is keyed by `id` instead, so it's deleted separately below.
const USER_ID_TABLES = [
  "watched_content",
  "user_preferences",
  "user_recommendation_views",
  "watch_history",
  "favorite_content",
  "user_events",
  "device_push_tokens",
  "subscribers",
  "title_compatibility_notified",
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    // The caller can only ever delete their own account: identity comes
    // exclusively from the bearer token, never from the request body.
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    for (const table of USER_ID_TABLES) {
      const { error } = await supabase.from(table).delete().eq("user_id", user.id);
      if (error) {
        console.error(`[delete-account] failed deleting from ${table}`, error);
      }
    }

    const { error: profileError } = await supabase.from("profiles").delete().eq("id", user.id);
    if (profileError) {
      console.error("[delete-account] failed deleting profile", profileError);
    }

    const { error: deleteUserError } = await supabase.auth.admin.deleteUser(user.id);
    if (deleteUserError) {
      console.error("[delete-account] failed deleting auth user", deleteUserError);
      return new Response(JSON.stringify({ error: deleteUserError.message }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("[delete-account] unexpected error", error);
    return new Response(JSON.stringify({ error: error.message || "Internal server error" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

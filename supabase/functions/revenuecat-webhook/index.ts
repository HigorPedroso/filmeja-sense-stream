import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Must match the entitlement identifier configured in the RevenueCat
// dashboard (same constant as src/lib/purchases.ts's PREMIUM_ENTITLEMENT_ID).
const PREMIUM_ENTITLEMENT_ID = "premium";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  // RevenueCat signs webhook requests with whatever value you set as the
  // "Authorization header" in Project Settings > Webhooks — not a real user
  // JWT, so this is compared as a shared secret instead of going through
  // Supabase auth.
  const expectedAuth = Deno.env.get("REVENUECAT_WEBHOOK_AUTH_HEADER");
  const authHeader = req.headers.get("Authorization");
  if (!expectedAuth || authHeader !== expectedAuth) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 401,
    });
  }

  try {
    const body = await req.json();
    const appUserId = body?.event?.app_user_id as string | undefined;

    if (!appUserId) {
      return new Response(JSON.stringify({ error: "Missing app_user_id" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const revenueCatSecretKey = Deno.env.get("REVENUECAT_SECRET_KEY");
    if (!revenueCatSecretKey) {
      console.error("[revenuecat-webhook] REVENUECAT_SECRET_KEY not configured");
      return new Response(JSON.stringify({ error: "Server configuration error" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    // Rather than inferring status from the event type (INITIAL_PURCHASE,
    // RENEWAL, CANCELLATION, EXPIRATION, BILLING_ISSUE, ...), ask RevenueCat
    // for the subscriber's current entitlement state directly — this stays
    // correct even if events arrive out of order or are replayed.
    const subscriberResponse = await fetch(
      `https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(appUserId)}`,
      { headers: { Authorization: `Bearer ${revenueCatSecretKey}` } }
    );

    if (!subscriberResponse.ok) {
      console.error("[revenuecat-webhook] failed to fetch subscriber", await subscriberResponse.text());
      return new Response(JSON.stringify({ error: "Failed to fetch subscriber" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 502,
      });
    }

    const { subscriber } = await subscriberResponse.json();
    const entitlement = subscriber?.entitlements?.[PREMIUM_ENTITLEMENT_ID];
    const isActive = !!entitlement && (!entitlement.expires_date || new Date(entitlement.expires_date) > new Date());

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { error } = await supabase.from("profiles").update({ is_premium: isActive }).eq("id", appUserId);
    if (error) {
      console.error("[revenuecat-webhook] failed updating profile", error);
      return new Response(JSON.stringify({ error: error.message }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    return new Response(JSON.stringify({ success: true, isPremium: isActive }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("[revenuecat-webhook] unexpected error", error);
    return new Response(JSON.stringify({ error: error.message || "Internal server error" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

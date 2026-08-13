import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[SEND-PUSH-NOTIFICATION] ${step}${detailsStr}`);
};

// --- Google service-account JWT bearer flow -------------------------------
// FCM's HTTP v1 API needs a short-lived OAuth2 access token, obtained by
// signing a JWT with the service account's private key and exchanging it at
// Google's token endpoint. No external library — just Web Crypto, which
// Deno's edge runtime supports natively.

function base64url(bytes: ArrayBuffer | Uint8Array): string {
  const bin = String.fromCharCode(...new Uint8Array(bytes));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function pemToPkcs8(pem: string): ArrayBuffer {
  const base64 = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s/g, "");
  const bin = atob(base64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes.buffer;
}

async function getAccessToken(serviceAccount: { client_email: string; private_key: string }): Promise<string> {
  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToPkcs8(serviceAccount.private_key),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const claims = {
    iss: serviceAccount.client_email,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };

  const unsigned = `${base64url(new TextEncoder().encode(JSON.stringify(header)))}.${base64url(
    new TextEncoder().encode(JSON.stringify(claims))
  )}`;
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(unsigned)
  );
  const jwt = `${unsigned}.${base64url(signature)}`;

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  const tokenData = await tokenResponse.json();
  if (!tokenResponse.ok) {
    throw new Error(`Failed to get Google access token: ${JSON.stringify(tokenData)}`);
  }
  return tokenData.access_token;
}

// ---------------------------------------------------------------------------

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  try {
    // Internal-only endpoint — the app itself never calls this directly.
    // Only whoever holds the service role key (us, or a future scheduled
    // "smart notification" function) is allowed to trigger a send.
    const authHeader = req.headers.get("Authorization") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    if (authHeader !== `Bearer ${serviceRoleKey}`) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const { userId, title, body, data } = await req.json();
    if (!userId || !title || !body) {
      return new Response(JSON.stringify({ error: "userId, title and body are required" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const serviceAccountJson = Deno.env.get("FIREBASE_SERVICE_ACCOUNT_JSON");
    if (!serviceAccountJson) {
      throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON secret is not set");
    }
    const serviceAccount = JSON.parse(serviceAccountJson);

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      serviceRoleKey
    );

    const { data: tokens, error: tokensError } = await supabaseClient
      .from("device_push_tokens")
      .select("token")
      .eq("user_id", userId);

    if (tokensError) throw tokensError;
    if (!tokens || tokens.length === 0) {
      logStep("No device tokens for user", { userId });
      return new Response(JSON.stringify({ sent: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const accessToken = await getAccessToken(serviceAccount);

    const results = await Promise.all(
      tokens.map(async ({ token }) => {
        const response = await fetch(
          `https://fcm.googleapis.com/v1/projects/${serviceAccount.project_id}/messages:send`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              message: {
                token,
                notification: { title, body },
                data: data ? Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])) : undefined,
              },
            }),
          }
        );

        if (!response.ok) {
          const errorBody = await response.json().catch(() => null);
          logStep("FCM send failed", { token, error: errorBody });

          // Token is no longer valid on Google's end — stop trying it.
          if (errorBody?.error?.status === "UNREGISTERED" || errorBody?.error?.status === "NOT_FOUND") {
            await supabaseClient.from("device_push_tokens").delete().eq("token", token);
          }
          return false;
        }
        return true;
      })
    );

    const sent = results.filter(Boolean).length;
    logStep("Push send complete", { userId, sent, total: tokens.length });

    return new Response(JSON.stringify({ sent, total: tokens.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    logStep("Error sending push notification", { error: error.message });
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

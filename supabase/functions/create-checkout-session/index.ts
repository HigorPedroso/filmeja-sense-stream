
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
      status: 204
    });
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Verify user authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    console.log("User authenticated:", user.id);

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });
    
    // Check if customer already exists in Stripe
    const customers = await stripe.customers.list({
      email: user.email,
      limit: 1,
    });
    
    let stripeCustomerId;
    
    if (customers.data.length > 0) {
      stripeCustomerId = customers.data[0].id;
      console.log("Existing Stripe customer found:", stripeCustomerId);
    } else {
      // Create a new customer in Stripe
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          supabaseUserId: user.id,
        },
      });
      stripeCustomerId = customer.id;
      console.log("New Stripe customer created:", stripeCustomerId);
    }
    
    const origin = req.headers.get("origin") || "https://filmeja.lovable.app";
    
    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      line_items: [
        {
          price: Deno.env.get("STRIPE_PRODUCT_ID"),
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${origin}/dashboard?payment=success`,
      cancel_url: `${origin}/dashboard?payment=canceled`,
      allow_promotion_codes: true,
      metadata: {
        userId: user.id,
      },
    });
    
    console.log("Created Stripe checkout session:", session.id);
    
    // Try to create or update subscriber record
    try {
      const { data: subscriberData, error: dbError } = await supabaseClient
        .from("subscribers")
        .upsert({
          user_id: user.id,
          email: user.email,
          stripe_customer_id: stripeCustomerId,
          subscription_status: 'pending',
          updated_at: new Date().toISOString(),
        }, { 
          onConflict: "user_id",
        });
      
      if (dbError) {
        console.error("Error updating subscriber record:", dbError);
        console.error("Error details:", {
          user_id: user.id,
          stripe_customer_id: stripeCustomerId,
          error_code: dbError.code,
          error_message: dbError.message,
          error_details: dbError.details
        });
      } else {
        console.log("Subscriber record created/updated successfully");
      }
    } catch (error) {
      console.error("Exception updating subscriber record:", error);
    }

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200
    });
    
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

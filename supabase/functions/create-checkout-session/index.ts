
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

// Helper function to log steps for easier debugging
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
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
    logStep("Function started");
    
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Get user from authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      logStep("Error: No authorization header");
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const token = authHeader.replace("Bearer ", "");
    logStep("Authenticating user with token");
    
    const { data, error } = await supabaseClient.auth.getUser(token);
    
    if (error || !data.user) {
      logStep("Error: User authentication failed", { error: error?.message });
      return new Response(JSON.stringify({ error: error?.message || "Authentication failed" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const user = data.user;
    logStep("User authenticated", { id: user.id, email: user.email });

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });
    
    const origin = req.headers.get("origin") || "http://localhost:3000";
    const productId = Deno.env.get("STRIPE_PRODUCT_ID");
    
    if (!productId) {
      logStep("Error: Missing STRIPE_PRODUCT_ID");
      return new Response(JSON.stringify({ error: "Missing STRIPE_PRODUCT_ID" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    // Check if user already has a Stripe customer
    const customers = await stripe.customers.list({
      email: user.email,
      limit: 1,
    });

    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Found existing Stripe customer", { customerId });
    } else {
      // Create a new customer
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          userId: user.id
        }
      });
      customerId = customer.id;
      logStep("Created new Stripe customer", { customerId });
    }

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [
        {
          price: productId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${origin}/dashboard?payment=success`,
      cancel_url: `${origin}/dashboard?payment=canceled`,
      metadata: {
        userId: user.id,
      },
    });
    
    // After creating the checkout session...
    logStep("Created checkout session", { sessionId: session.id, url: session.url });

    // Create or update subscriber record
    try {
      logStep("Attempting to create/update subscriber record");
      
      // First, try to verify table access
      const { data: testSelect, error: selectError } = await supabaseClient
        .from("subscribers")
        .select("*")
        .limit(1);
      
      logStep("Test select result", { data: testSelect, error: selectError });

      // Prepare subscriber data
      const subscriberData = {
        user_id: user.id,
        email: user.email,
        stripe_customer_id: customerId,
        subscription_status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        stripe_subscription_id: null, // This will be updated by the webhook
        cancel_at_period_end: false,
        current_period_end: null
      };
      
      logStep("Attempting upsert with data", subscriberData);

      // Try the upsert with more detailed error handling
      const { data, error: dbError } = await supabaseClient
        .from("subscribers")
        .upsert(subscriberData)
        .select();  // Add select() to get the result back

      if (dbError) {
        logStep("Upsert error", { 
          code: dbError.code,
          message: dbError.message,
          details: dbError.details,
          hint: dbError.hint
        });
        
        // Try insert as fallback
        logStep("Attempting insert as fallback");
        const { data: insertData, error: insertError } = await supabaseClient
          .from("subscribers")
          .insert(subscriberData)
          .select();
          
        if (insertError) {
          logStep("Insert fallback failed", {
            code: insertError.code,
            message: insertError.message,
            details: insertError.details
          });
        } else {
          logStep("Insert fallback succeeded", insertData);
        }
      } else {
        logStep("Upsert succeeded", data);
      }
    } catch (error) {
      logStep("Exception in subscriber creation", { 
        error: error.message,
        stack: error.stack 
      });
    }

    // Return checkout session URL
    return new Response(
      JSON.stringify({
        url: session.url,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    logStep("Error creating checkout session", { error: error.message });
    return new Response(
      JSON.stringify({
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

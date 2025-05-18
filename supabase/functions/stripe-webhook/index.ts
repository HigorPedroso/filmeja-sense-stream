
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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
    // Verify Stripe signature
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Get Stripe webhook signing secret
    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      console.error("No stripe signature found");
      return new Response(JSON.stringify({ error: "No stripe signature" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }
    
    const body = await req.text();
    console.log("Received webhook with body:", body.substring(0, 200) + "...");
    
    // Create a Supabase client with the service role key for admin privileges
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Handle different event types
    let event;
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        Deno.env.get("STRIPE_WEBHOOK_SIGNING_SECRET") || ""
      );
      console.log("Webhook event constructed successfully:", event.type);
    } catch (err) {
      console.error(`Webhook signature verification failed:`, err.message);
      return new Response(JSON.stringify({ error: `Webhook signature verification failed: ${err.message}` }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const customerId = session.customer;
        const userId = session.metadata?.userId;
        const subscriptionId = session.subscription;
        
        console.log("checkout.session.completed event:", { userId, customerId, subscriptionId });
        
        if (userId && customerId) {
          // Get subscription details if available
          let subscriptionStatus = "active";
          let currentPeriodEnd = null;
          
          if (subscriptionId) {
            const subscription = await stripe.subscriptions.retrieve(
              subscriptionId as string
            );
            subscriptionStatus = subscription.status;
            currentPeriodEnd = new Date(subscription.current_period_end * 1000).toISOString();
          }

          // Update subscriber record
          const { data, error } = await supabaseAdmin.from("subscribers").upsert({
            user_id: userId,
            stripe_customer_id: customerId,
            is_premium: true,
            subscription_status: subscriptionStatus,
            subscription_tier: "premium",
            current_period_end: currentPeriodEnd,
            updated_at: new Date().toISOString(),
          }, { onConflict: "user_id" });
          
          if (error) {
            console.error("Error updating subscribers table:", error);
          } else {
            console.log("Successfully updated subscriber data");
          }
        } else {
          console.error("Missing userId or customerId in checkout session");
        }
        break;
      }
      case "customer.subscription.updated": {
        const subscription = event.data.object;
        const customerId = subscription.customer;
        console.log("subscription.updated event for customer:", customerId);

        // Find the user associated with this Stripe customer
        const { data: subscribers, error: queryError } = await supabaseAdmin
          .from("subscribers")
          .select("*")
          .eq("stripe_customer_id", customerId)
          .limit(1);

        if (queryError) {
          console.error("Error querying subscribers:", queryError);
        }

        if (subscribers && subscribers.length > 0) {
          const subscriber = subscribers[0];
          
          // Update subscription information
          const { error: updateError } = await supabaseAdmin.from("subscribers").upsert({
            user_id: subscriber.user_id,
            stripe_customer_id: customerId,
            is_premium: subscription.status === "active",
            subscription_status: subscription.status,
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            updated_at: new Date().toISOString(),
          }, { onConflict: "user_id" });
          
          if (updateError) {
            console.error("Error updating subscription info:", updateError);
          }
        } else {
          console.error("No subscriber found for customer:", customerId);
        }
        break;
      }
      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        const customerId = subscription.customer;
        console.log("subscription.deleted event for customer:", customerId);

        // Find the user associated with this Stripe customer
        const { data: subscribers, error: queryError } = await supabaseAdmin
          .from("subscribers")
          .select("*")
          .eq("stripe_customer_id", customerId)
          .limit(1);

        if (queryError) {
          console.error("Error querying subscribers:", queryError);
        }

        if (subscribers && subscribers.length > 0) {
          const subscriber = subscribers[0];
          
          // Update subscription information to reflect cancellation
          const { error: updateError } = await supabaseAdmin.from("subscribers").upsert({
            user_id: subscriber.user_id,
            stripe_customer_id: customerId,
            is_premium: false,
            subscription_status: "canceled",
            updated_at: new Date().toISOString(),
          }, { onConflict: "user_id" });
          
          if (updateError) {
            console.error("Error updating cancellation info:", updateError);
          }
        } else {
          console.error("No subscriber found for customer:", customerId);
        }
        break;
      }
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Error processing webhook:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

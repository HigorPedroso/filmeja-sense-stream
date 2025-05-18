
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    // Verify Stripe signature
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Get Stripe webhook signing secret
    const signature = req.headers.get("stripe-signature");
    const body = await req.text();
    
    // Create a Supabase client with the service role key for admin privileges
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Handle different event types
    const event = stripe.webhooks.constructEvent(
      body,
      signature || "",
      Deno.env.get("STRIPE_WEBHOOK_SIGNING_SECRET") || ""
    );

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const customerId = session.customer;
        const userId = session.metadata?.userId;
        const subscriptionId = session.subscription;

        if (userId && subscriptionId) {
          // Get subscription details
          const subscription = await stripe.subscriptions.retrieve(
            subscriptionId as string
          );

          // Update subscriber record
          await supabaseAdmin.from("subscribers").upsert({
            user_id: userId,
            stripe_customer_id: customerId,
            is_premium: true,
            subscription_status: subscription.status,
            subscription_tier: "premium",
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            updated_at: new Date().toISOString(),
          }, { onConflict: "user_id" });
        }
        break;
      }
      case "customer.subscription.updated": {
        const subscription = event.data.object;
        const customerId = subscription.customer;

        // Find the user associated with this Stripe customer
        const { data: subscribers } = await supabaseAdmin
          .from("subscribers")
          .select("*")
          .eq("stripe_customer_id", customerId)
          .limit(1);

        if (subscribers && subscribers.length > 0) {
          const subscriber = subscribers[0];
          
          // Update subscription information
          await supabaseAdmin.from("subscribers").upsert({
            user_id: subscriber.user_id,
            stripe_customer_id: customerId,
            is_premium: subscription.status === "active",
            subscription_status: subscription.status,
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            updated_at: new Date().toISOString(),
          }, { onConflict: "user_id" });
        }
        break;
      }
      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        const customerId = subscription.customer;

        // Find the user associated with this Stripe customer
        const { data: subscribers } = await supabaseAdmin
          .from("subscribers")
          .select("*")
          .eq("stripe_customer_id", customerId)
          .limit(1);

        if (subscribers && subscribers.length > 0) {
          const subscriber = subscribers[0];
          
          // Update subscription information to reflect cancellation
          await supabaseAdmin.from("subscribers").upsert({
            user_id: subscriber.user_id,
            stripe_customer_id: customerId,
            is_premium: false,
            subscription_status: "canceled",
            updated_at: new Date().toISOString(),
          }, { onConflict: "user_id" });
        }
        break;
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Error processing webhook:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { "Content-Type": "application/json" },
      status: 400,
    });
  }
});

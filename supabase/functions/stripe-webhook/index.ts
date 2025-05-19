
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2023-10-16",
});

const supabaseClient = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_ANON_KEY") ?? ""
);

serve(async (req) => {
  const signature = req.headers.get("stripe-signature");
  const body = await req.text();
  
  try {
    // Changed to use constructEventAsync instead of constructEvent
    const event = await stripe.webhooks.constructEventAsync(
      body,
      signature!,
      Deno.env.get("STRIPE_WEBHOOK_SECRET") || ""
    );

    console.log("Webhook event received:", event.type);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const customerId = session.customer;
        const userId = session.metadata.userId;

        console.log("Processing completed checkout:", {
          customerId,
          userId,
          sessionId: session.id
        });

        // Update subscriber status
        const { data, error } = await supabaseClient
          .from("subscribers")
          .update({ 
            subscription_status: "active",
            is_premium: true,
            updated_at: new Date().toISOString()
          })
          .eq("user_id", userId)
          .select();

        if (error) {
          console.error("Error updating subscriber:", error);
          throw new Error(`Failed to update subscriber: ${error.message}`);
        }

        console.log("Successfully updated subscriber status:", data);
        break;
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    console.error("Error processing webhook:", err);
    return new Response(JSON.stringify({ 
      error: err.message,
      details: "Failed to process Stripe webhook"
    }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }
});


import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Helper function to log steps for easier debugging
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
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
    
    // Verify Stripe signature
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Get Stripe webhook signing secret
    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      logStep("Error: No stripe signature found");
      return new Response(JSON.stringify({ error: "No stripe signature" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }
    
    const body = await req.text();
    logStep("Received webhook body", { 
      bodyPreview: body.substring(0, 200) + "...", 
      contentType: req.headers.get("content-type"),
      signature: signature.substring(0, 20) + "..." 
    });
    
    // Create a Supabase client with the service role key for admin privileges
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Handle different event types
    let event;
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        Deno.env.get("STRIPE_WEBHOOK_SIGNING_SECRET") || ""
      );
      logStep("Webhook event constructed successfully", { type: event.type });
    } catch (err) {
      const errorMsg = `Webhook signature verification failed: ${err.message}`;
      logStep("ERROR", { message: errorMsg });
      return new Response(JSON.stringify({ error: errorMsg }), {
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
        const paymentAmount = session.amount_total;
        const paymentCurrency = session.currency;
        const paymentMethod = session.payment_method_types?.[0];
        
        logStep("checkout.session.completed event", { 
          userId, 
          customerId, 
          subscriptionId, 
          paymentAmount,
          paymentCurrency 
        });
        
        if (!userId) {
          logStep("ERROR: Missing userId in checkout session metadata");
          return new Response(JSON.stringify({ error: "Missing userId in session metadata" }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
          });
        }

        if (!customerId) {
          logStep("ERROR: Missing customerId in checkout session");
          return new Response(JSON.stringify({ error: "Missing customerId in session" }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
          });
        }
        
        // Get subscription details if available
        let subscriptionStatus = "active";
        let currentPeriodEnd = null;
        
        if (subscriptionId) {
          try {
            const subscription = await stripe.subscriptions.retrieve(
              subscriptionId as string
            );
            subscriptionStatus = subscription.status;
            currentPeriodEnd = new Date(subscription.current_period_end * 1000).toISOString();
            logStep("Retrieved subscription details", { 
              subscriptionStatus, 
              currentPeriodEnd 
            });
          } catch (subError) {
            logStep("Error retrieving subscription", { error: subError.message });
          }
        }

        // Add record to payment_verifications table
        try {
          logStep("Adding payment verification record");
          
          const paymentVerificationData = {
            user_id: userId,
            payment_id: session.id,
            payment_status: "success",
            verification_date: new Date().toISOString(),
            payment_amount: paymentAmount,
            payment_method: paymentMethod,
            currency: paymentCurrency,
            metadata: {
              checkout_session: session.id,
              stripe_customer_id: customerId,
              subscription_id: subscriptionId,
            },
          };
          
          const { error: paymentVerificationError } = await supabaseAdmin
            .from("payment_verifications")
            .insert(paymentVerificationData);
            
          if (paymentVerificationError) {
            logStep("Error inserting payment verification", { error: paymentVerificationError });
          } else {
            logStep("Payment verification record created successfully");
          }
        } catch (paymentVerificationError) {
          logStep("Failed to create payment verification", { error: paymentVerificationError.message });
        }

        // Update subscriber record
        try {
          const subscriberData = {
            user_id: userId,
            stripe_customer_id: customerId,
            is_premium: true,
            subscription_status: subscriptionStatus,
            subscription_tier: "premium",
            current_period_end: currentPeriodEnd,
            updated_at: new Date().toISOString(),
          };
          
          logStep("Upserting subscriber data", subscriberData);
          
          const { data, error } = await supabaseAdmin
            .from("subscribers")
            .upsert(subscriberData, { onConflict: "user_id" });
          
          if (error) {
            logStep("Error updating subscribers table", { error });
            throw new Error(`Failed to update subscriber: ${error.message}`);
          } else {
            logStep("Successfully updated subscriber data");
          }
        } catch (dbError) {
          logStep("Database operation failed", { error: dbError.message });
          return new Response(JSON.stringify({ error: `Database operation failed: ${dbError.message}` }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500,
          });
        }
        break;
      }
      case "customer.subscription.updated": {
        const subscription = event.data.object;
        const customerId = subscription.customer;
        logStep("subscription.updated event", { customerId });

        // Find the user associated with this Stripe customer
        const { data: subscribers, error: queryError } = await supabaseAdmin
          .from("subscribers")
          .select("*")
          .eq("stripe_customer_id", customerId)
          .limit(1);

        if (queryError) {
          logStep("Error querying subscribers", { error: queryError });
          return new Response(JSON.stringify({ error: `Failed to query subscribers: ${queryError.message}` }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500,
          });
        }

        if (subscribers && subscribers.length > 0) {
          const subscriber = subscribers[0];
          
          // Update subscription information
          const updateData = {
            user_id: subscriber.user_id,
            stripe_customer_id: customerId,
            is_premium: subscription.status === "active",
            subscription_status: subscription.status,
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            updated_at: new Date().toISOString(),
          };
          
          logStep("Updating subscription info", updateData);
          
          const { error: updateError } = await supabaseAdmin
            .from("subscribers")
            .upsert(updateData, { onConflict: "user_id" });
          
          if (updateError) {
            logStep("Error updating subscription info", { error: updateError });
            return new Response(JSON.stringify({ error: `Failed to update subscription: ${updateError.message}` }), {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
              status: 500,
            });
          }
          
          // Add a payment verification record for the update
          try {
            const paymentVerificationData = {
              user_id: subscriber.user_id,
              payment_id: subscription.id,
              payment_status: subscription.status,
              verification_date: new Date().toISOString(),
              metadata: {
                event_type: "subscription.updated",
                stripe_customer_id: customerId,
                subscription_id: subscription.id,
              }
            };
            
            await supabaseAdmin
              .from("payment_verifications")
              .insert(paymentVerificationData);
              
            logStep("Added subscription update verification record");
          } catch (verificationError) {
            logStep("Error adding subscription update verification", { error: verificationError.message });
          }
          
          logStep("Subscription updated successfully");
        } else {
          logStep("No subscriber found for customer", { customerId });
        }
        break;
      }
      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        const customerId = subscription.customer;
        logStep("subscription.deleted event", { customerId });

        // Find the user associated with this Stripe customer
        const { data: subscribers, error: queryError } = await supabaseAdmin
          .from("subscribers")
          .select("*")
          .eq("stripe_customer_id", customerId)
          .limit(1);

        if (queryError) {
          logStep("Error querying subscribers", { error: queryError });
          return new Response(JSON.stringify({ error: `Failed to query subscribers: ${queryError.message}` }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500,
          });
        }

        if (subscribers && subscribers.length > 0) {
          const subscriber = subscribers[0];
          
          // Update subscription information to reflect cancellation
          const cancelData = {
            user_id: subscriber.user_id,
            stripe_customer_id: customerId,
            is_premium: false,
            subscription_status: "canceled",
            updated_at: new Date().toISOString(),
          };
          
          logStep("Updating cancellation info", cancelData);
          
          const { error: updateError } = await supabaseAdmin
            .from("subscribers")
            .upsert(cancelData, { onConflict: "user_id" });
          
          if (updateError) {
            logStep("Error updating cancellation info", { error: updateError });
            return new Response(JSON.stringify({ error: `Failed to update cancellation: ${updateError.message}` }), {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
              status: 500,
            });
          }
          
          // Add a cancellation record to payment_verifications
          try {
            const paymentVerificationData = {
              user_id: subscriber.user_id,
              payment_id: subscription.id,
              payment_status: "canceled",
              verification_date: new Date().toISOString(),
              metadata: {
                event_type: "subscription.deleted",
                stripe_customer_id: customerId,
                subscription_id: subscription.id,
              }
            };
            
            await supabaseAdmin
              .from("payment_verifications")
              .insert(paymentVerificationData);
              
            logStep("Added subscription cancellation record");
          } catch (verificationError) {
            logStep("Error adding cancellation verification", { error: verificationError.message });
          }
          
          logStep("Subscription canceled successfully");
        } else {
          logStep("No subscriber found for customer", { customerId });
        }
        break;
      }
      default:
        logStep(`Unhandled event type ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    logStep("Error processing webhook", { error: error.message });
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

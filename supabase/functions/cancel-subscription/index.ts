import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@12.0.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
}

serve(async (req) => {
  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      headers: corsHeaders,
      status: 200
    })
  }

  try {
    const { userId } = await req.json()
    
    if (!userId) {
      return new Response(
        JSON.stringify({ 
          error: 'userId is required',
          code: 'MISSING_USER_ID'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')

    if (!supabaseUrl || !supabaseKey || !stripeKey) {
      return new Response(
        JSON.stringify({ 
          error: 'Server configuration error',
          code: 'CONFIG_ERROR'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseKey)
    const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' })

    // Single query for subscription details
    const { data: subscriber, error: dbError } = await supabase
      .from('subscribers')
      .select('stripe_subscription_id')
      .eq('user_id', userId)
      .single()

    if (dbError) {
      return new Response(
        JSON.stringify({ 
          error: 'Database query failed',
          details: dbError.message,
          code: 'DB_ERROR'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      )
    }

    if (!subscriber?.stripe_subscription_id) {
      // No subscription found - consider it a success
      return new Response(
        JSON.stringify({ 
          message: 'No active subscription found',
          code: 'SUCCESS'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    // Cancel Stripe subscription at period end
    try {
      await stripe.subscriptions.update(subscriber.stripe_subscription_id, {
        cancel_at_period_end: true
      });
    } catch (stripeError) {
      return new Response(
        JSON.stringify({ 
          error: 'Failed to cancel Stripe subscription',
          details: stripeError.message,
          code: 'STRIPE_ERROR'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      )
    }

    // Update subscription status instead of deleting
    const { error: updateError } = await supabase
      .from('subscribers')
      .update({ 
        subscription_status: 'canceling',
        cancel_at_period_end: true,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)

    if (updateError) {
      return new Response(
        JSON.stringify({ 
          error: 'Failed to update subscription record',
          details: updateError.message,
          code: 'UPDATE_ERROR'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      )
    }

    return new Response(
      JSON.stringify({ 
        message: 'Subscription cancelled successfully',
        code: 'SUCCESS'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        code: 'ERROR'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
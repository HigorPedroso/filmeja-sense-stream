import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@12.0.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { userId } = await req.json()
    console.log('Received request for userId:', userId)

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
      console.error('Missing environment variables:', {
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseKey,
        hasStripe: !!stripeKey
      })
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

    // Get subscription ID from subscribers table
    const { data: subscriber, error: dbError } = await supabase
      .from('subscribers')
      .select('stripe_subscription_id, stripe_customer_id')
      .eq('user_id', userId)
      .single()

    console.log('Subscriber query result:', { subscriber, dbError })

    if (dbError) {
      return new Response(
        JSON.stringify({ 
          error: 'Database query failed',
          details: dbError.message,
          code: 'DB_ERROR'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    if (!subscriber?.stripe_subscription_id) {
      return new Response(
        JSON.stringify({ 
          error: 'No active subscription found',
          code: 'NO_SUBSCRIPTION'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404,
        }
      )
    }

    try {
      const cancelledSubscription = await stripe.subscriptions.cancel(
        subscriber.stripe_subscription_id
      )
      console.log('Stripe cancellation result:', cancelledSubscription)
    } catch (stripeError) {
      console.error('Stripe cancellation error:', stripeError)
      return new Response(
        JSON.stringify({ 
          error: 'Failed to cancel Stripe subscription',
          details: stripeError.message,
          code: 'STRIPE_ERROR'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    const { error: deleteError } = await supabase
      .from('subscribers')
      .delete()
      .eq('user_id', userId)

    if (deleteError) {
      console.error('Delete record error:', deleteError)
      return new Response(
        JSON.stringify({ 
          error: 'Failed to update subscription record',
          details: deleteError.message,
          code: 'DELETE_ERROR'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
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
    console.error('Unhandled error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message,
        code: 'INTERNAL_ERROR'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
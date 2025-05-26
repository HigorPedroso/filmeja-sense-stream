import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "GET, OPTIONS"
  };

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response(null, { 
          headers: corsHeaders,
          status: 200
        });
    }

    const { email } = await req.json()
  
    const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data, error } = await supabase.auth.admin.listUsers()
    const userExists = data?.users.some(user => user.email === email)

    return new Response(
        JSON.stringify({ exists: userExists }),
        { 
            headers: { 
                ...corsHeaders,
                'Content-Type': 'application/json' 
            } 
        },
    )
})
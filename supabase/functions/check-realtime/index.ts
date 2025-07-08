import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    console.log('Checking real-time configuration...')

    // Test 1: Fetch current tokens
    const { data: tokens, error: tokensError } = await supabaseClient
      .from('votable_tokens')
      .select('id, name, votes, updated_at')
      .order('votes', { ascending: false })

    if (tokensError) {
      console.error('Error fetching tokens:', tokensError)
    } else {
      console.log('Current tokens:', tokens)
    }

    // Test 2: Update a token to trigger real-time
    const testTokenId = tokens?.[0]?.id
    if (testTokenId) {
      console.log('Testing real-time by updating token:', testTokenId)
      
      const { error: updateError } = await supabaseClient
        .from('votable_tokens')
        .update({ 
          updated_at: new Date().toISOString() 
        })
        .eq('id', testTokenId)

      if (updateError) {
        console.error('Error updating token:', updateError)
      } else {
        console.log('Token updated successfully - this should trigger real-time')
      }
    }

    // Test 3: Check vote counts vs actual votes
    const { data: voteComparison } = await supabaseClient.rpc('check_vote_counts')
    
    console.log('Vote count comparison:', voteComparison)

    return new Response(
      JSON.stringify({ 
        success: true,
        tokens: tokens,
        message: 'Check logs for real-time debugging info'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error in check-realtime function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})
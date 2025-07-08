import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client with service role key for admin access
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

    // Get request body
    const { walletAddress, tokenId } = await req.json()
    console.log('Vote submission request:', { walletAddress, tokenId })

    if (!walletAddress || !tokenId) {
      throw new Error('Missing required parameters: walletAddress and tokenId')
    }

    // Step 1: Get or create user
    console.log('Step 1: Checking for existing user...')
    const { data: existingUser, error: userFetchError } = await supabaseClient
      .from('users')
      .select('*')
      .eq('wallet_address', walletAddress)
      .single()

    let user = existingUser
    
    if (!existingUser) {
      console.log('User not found, creating new user...')
      const { data: newUser, error: createError } = await supabaseClient
        .from('users')
        .insert({
          wallet_address: walletAddress,
          created_at: new Date().toISOString(),
          last_login: new Date().toISOString()
        })
        .select()
        .single()

      if (createError) {
        console.error('Error creating user:', createError)
        throw new Error(`Failed to create user: ${createError.message}`)
      }
      
      user = newUser
      console.log('New user created:', user.id)
    } else {
      console.log('Existing user found:', user.id)
      
      // Update last login
      const { error: updateError } = await supabaseClient
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', user.id)
      
      if (updateError) {
        console.error('Error updating last login:', updateError)
      }
    }

    // Step 2: Check if user has already voted for this token
    console.log('Step 2: Checking if user has already voted...')
    const { data: existingVote, error: voteCheckError } = await supabaseClient
      .from('user_votes')
      .select('id')
      .eq('user_id', user.id)
      .eq('token_id', tokenId)
      .maybeSingle()

    if (existingVote) {
      console.log('User has already voted for this token')
      return new Response(
        JSON.stringify({ error: 'You have already voted for this token' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Step 3: Submit the vote
    console.log('Step 3: Submitting vote...')
    const { data: voteData, error: voteError } = await supabaseClient
      .from('user_votes')
      .insert({
        user_id: user.id,
        token_id: tokenId,
        voted_at: new Date().toISOString()
      })
      .select()
      .single()

    if (voteError) {
      console.error('Error submitting vote:', voteError)
      throw new Error(`Failed to submit vote: ${voteError.message}`)
    }

    console.log('Vote submitted successfully:', voteData.id)

    // Step 4: Get updated token info
    console.log('Step 4: Fetching updated token info...')
    const { data: token, error: tokenError } = await supabaseClient
      .from('votable_tokens')
      .select('*')
      .eq('id', tokenId)
      .single()

    if (tokenError) {
      console.error('Error fetching token:', tokenError)
    }

    console.log('Current vote count for token:', token?.votes)

    // Step 5: Manually increment vote count (failsafe if trigger fails)
    console.log('Step 5: Manually incrementing vote count as failsafe...')
    const { data: incrementData, error: incrementError } = await supabaseClient
      .rpc('increment_token_votes', { token_id: tokenId })

    if (incrementError) {
      console.error('Error with manual increment:', incrementError)
      // Try direct update as final fallback
      const { error: updateError } = await supabaseClient
        .from('votable_tokens')
        .update({ 
          votes: (token?.votes || 0) + 1,
          updated_at: new Date().toISOString() 
        })
        .eq('id', tokenId)
      
      if (updateError) {
        console.error('Error with direct update:', updateError)
      }
    }

    // Step 6: Force a real-time update by touching the token
    console.log('Step 6: Triggering real-time update...')
    const { error: touchError } = await supabaseClient
      .from('votable_tokens')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', tokenId)

    if (touchError) {
      console.error('Error touching token for real-time update:', touchError)
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        voteId: voteData.id,
        userId: user.id,
        tokenVotes: token?.votes || 0,
        message: 'Vote submitted successfully'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error in submit-vote function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})
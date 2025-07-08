# Edge Functions Deployment Guide

## Deploy the Edge Functions to Supabase

### 1. Submit Vote Function

**Function Name:** `submit-vote`

1. Go to your Supabase Dashboard
2. Navigate to **Edge Functions**
3. Click **New Function**
4. Name it: `submit-vote`
5. Copy and paste the entire contents of `/supabase/functions/submit-vote/index.ts`
6. Click **Deploy**

### 2. Check Realtime Function (Optional - for debugging)

**Function Name:** `check-realtime`

1. Click **New Function**
2. Name it: `check-realtime`
3. Copy and paste the entire contents of `/supabase/functions/check-realtime/index.ts`
4. Click **Deploy**

## What the Edge Functions Do

### submit-vote
- Creates or gets user by wallet address
- Checks if user already voted
- Submits the vote
- Updates vote count via trigger
- Forces a real-time update
- **Provides detailed logging at each step**

### check-realtime (debugging)
- Lists current tokens and votes
- Tests real-time by updating a token
- Compares stored votes vs actual votes

## Testing

After deploying, test by:
1. Connecting your Phantom wallet
2. Clicking vote on any token
3. Check the **Edge Function Logs** in Supabase dashboard

You'll see detailed logs like:
- "Vote submission request: {walletAddress: ..., tokenId: ...}"
- "Step 1: Checking for existing user..."
- "Step 2: Checking if user has already voted..."
- "Step 3: Submitting vote..."
- "Step 4: Fetching updated token info..."
- "Step 5: Triggering real-time update..."

## Viewing Logs

1. Go to **Edge Functions** in Supabase
2. Click on your function name
3. Click **Logs** tab
4. You'll see real-time logs as votes are submitted

This will help us debug exactly what's happening with the voting system!
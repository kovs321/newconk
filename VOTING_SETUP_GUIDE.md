# Voting System Setup Guide

## Overview
This voting system allows users to authenticate with their Phantom wallet and vote on tokens. Each wallet address can only vote once per token, and votes are tracked in real-time using Supabase.

## Database Setup

1. **Run the SQL Setup Script**
   - Open your Supabase project dashboard
   - Navigate to the SQL Editor
   - Copy the entire contents of `voting-system-setup.sql`
   - Paste and run the script
   - This will create:
     - `users` table for wallet authentication
     - `votable_tokens` table with full token metadata
     - `user_votes` table for tracking individual votes
     - Triggers for automatic vote counting
     - Real-time subscriptions

2. **Verify Setup**
   - Check that all three tables were created
   - Verify that 8 mock tokens were inserted
   - Confirm that Row Level Security (RLS) is enabled

## Features

### Wallet Authentication
- Users sign in with their Phantom wallet
- Wallet address is stored as their unique identifier
- No passwords or additional authentication required

### Voting System
- One vote per wallet address per token
- Real-time vote counting with automatic triggers
- Live updates via Supabase real-time subscriptions
- Progress bars showing votes toward goals

### Token Display
- Full token metadata including:
  - Name and ticker symbol
  - Full contract address (no truncation)
  - Token image URLs
  - Current vote count
- Tokens sorted by vote count (highest first)

## Testing

1. **Connect Phantom Wallet**
   - Click "Connect Wallet" button
   - Approve connection in Phantom

2. **Vote on Tokens**
   - Click "Vote" on any token
   - Observe real-time vote count update
   - Try voting again - should see "You have already voted"

3. **Real-time Updates**
   - Open multiple browser windows
   - Vote in one window
   - See updates appear in other windows instantly

## Security

- Wallet addresses are the only authentication method
- Each wallet can only vote once per token (enforced at database level)
- Row Level Security (RLS) policies protect data
- No sensitive data is stored

## Troubleshooting

If votes aren't working:
1. Check that Supabase is connected (check console for errors)
2. Verify the SQL script ran successfully
3. Ensure Phantom wallet is connected
4. Check browser console for specific error messages
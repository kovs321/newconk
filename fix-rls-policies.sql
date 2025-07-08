-- Fix RLS Policies for Anonymous Access (Phantom Wallet Auth)
-- Run this after the initial setup to fix user creation issues

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;

-- Create new policies that work with anonymous access
-- Allow anyone to read users (needed for checking if user exists)
CREATE POLICY "Anyone can view users" ON users
    FOR SELECT USING (true);

-- Allow anyone to create users (wallet connection creates user)
CREATE POLICY "Anyone can create users" ON users
    FOR INSERT WITH CHECK (true);

-- Allow anyone to update users (for last_login updates)
CREATE POLICY "Anyone can update users" ON users
    FOR UPDATE USING (true);

-- Verify the policies are created
SELECT tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename IN ('users', 'votable_tokens', 'user_votes')
ORDER BY tablename, policyname;
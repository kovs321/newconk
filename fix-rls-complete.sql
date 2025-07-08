-- Complete RLS Fix - Run this to fix all permission issues

-- First, disable RLS temporarily to test
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE votable_tokens DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_votes DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies to start fresh
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Anyone can view users" ON users;
DROP POLICY IF EXISTS "Anyone can create users" ON users;
DROP POLICY IF EXISTS "Anyone can update users" ON users;

DROP POLICY IF EXISTS "Anyone can view votable tokens" ON votable_tokens;
DROP POLICY IF EXISTS "Anyone can read voting tokens" ON votable_tokens;
DROP POLICY IF EXISTS "Anyone can update voting tokens" ON votable_tokens;
DROP POLICY IF EXISTS "Anyone can insert voting tokens" ON votable_tokens;

DROP POLICY IF EXISTS "Users can insert their own votes" ON user_votes;
DROP POLICY IF EXISTS "Anyone can view all votes" ON user_votes;
DROP POLICY IF EXISTS "Anyone can read user votes" ON user_votes;
DROP POLICY IF EXISTS "Anyone can insert user votes" ON user_votes;

-- Re-enable RLS with proper policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE votable_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_votes ENABLE ROW LEVEL SECURITY;

-- Create simple, permissive policies for anonymous access
-- Users table - allow all operations
CREATE POLICY "Enable read access for all users" ON users
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for all users" ON users
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON users
    FOR UPDATE USING (true);

-- Votable tokens table - read only for everyone
CREATE POLICY "Enable read access for all users" ON votable_tokens
    FOR SELECT USING (true);

-- User votes table - allow reads and inserts
CREATE POLICY "Enable read access for all users" ON user_votes
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for all users" ON user_votes
    FOR INSERT WITH CHECK (true);

-- Test by inserting a test user
INSERT INTO users (wallet_address, created_at, last_login) 
VALUES ('TEST_WALLET_ADDRESS_123', NOW(), NOW())
ON CONFLICT (wallet_address) DO UPDATE SET last_login = NOW();

-- Check if test user was created
SELECT * FROM users WHERE wallet_address = 'TEST_WALLET_ADDRESS_123';

-- Clean up test user
DELETE FROM users WHERE wallet_address = 'TEST_WALLET_ADDRESS_123';

-- Show all policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename IN ('users', 'votable_tokens', 'user_votes')
ORDER BY tablename, policyname;
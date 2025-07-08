-- Complete Voting System Database Setup for Phantom Wallet Authentication
-- Run this in your Supabase SQL editor

-- Drop existing tables if they exist (for fresh start)
DROP TABLE IF EXISTS user_votes CASCADE;
DROP TABLE IF EXISTS votable_tokens CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Create users table for Phantom wallet authentication
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_address VARCHAR(44) NOT NULL UNIQUE, -- Solana wallet addresses are 44 characters
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create votable_tokens table with full metadata
CREATE TABLE votable_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    ticker VARCHAR(20) NOT NULL,
    contract_address VARCHAR(44) NOT NULL UNIQUE, -- Full Solana contract address
    image_url TEXT,
    votes INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_votes table to track individual votes
CREATE TABLE user_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_id UUID NOT NULL REFERENCES votable_tokens(id) ON DELETE CASCADE,
    voted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, token_id) -- Each user can only vote once per token
);

-- Create function to increment vote count
CREATE OR REPLACE FUNCTION increment_vote_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE votable_tokens 
    SET votes = votes + 1, updated_at = NOW()
    WHERE id = NEW.token_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-increment votes
CREATE TRIGGER increment_vote_trigger
    AFTER INSERT ON user_votes
    FOR EACH ROW
    EXECUTE FUNCTION increment_vote_count();

-- Create function to decrement vote count (for vote removal if needed)
CREATE OR REPLACE FUNCTION decrement_vote_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE votable_tokens 
    SET votes = votes - 1, updated_at = NOW()
    WHERE id = OLD.token_id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-decrement votes
CREATE TRIGGER decrement_vote_trigger
    AFTER DELETE ON user_votes
    FOR EACH ROW
    EXECUTE FUNCTION decrement_vote_count();

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE votable_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_votes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for users table
CREATE POLICY "Users can view their own profile" ON users
    FOR SELECT USING (wallet_address = current_user);

CREATE POLICY "Users can insert their own profile" ON users
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (wallet_address = current_user);

-- Create RLS policies for votable_tokens (everyone can read)
CREATE POLICY "Anyone can view votable tokens" ON votable_tokens
    FOR SELECT USING (true);

-- Create RLS policies for user_votes
CREATE POLICY "Users can insert their own votes" ON user_votes
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can view all votes" ON user_votes
    FOR SELECT USING (true);

-- Enable real-time subscriptions for tables
ALTER PUBLICATION supabase_realtime ADD TABLE votable_tokens;
ALTER PUBLICATION supabase_realtime ADD TABLE user_votes;
ALTER PUBLICATION supabase_realtime ADD TABLE users;

-- Insert mock tokens with full metadata
INSERT INTO votable_tokens (name, ticker, contract_address, image_url, votes) VALUES
    ('Bonk', 'BONK', 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263/logo.png', 0),
    ('Samoyedcoin', 'SAMO', '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU', 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU/logo.png', 0),
    ('dogwifhat', 'WIF', 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm', 'https://bafkreibk3covs5ltyqxa272uodhculbr6kea6betidfwy3ajsav2vjzyum.ipfs.nftstorage.link', 0),
    ('Popcat', 'POPCAT', '7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr', 'https://i.ibb.co/GkmBvR8/popcat.jpg', 0),
    ('Peanut the Squirrel', 'PNUT', '2qEHjDLDLbuBgRYvsxhc5D6uDWAivNFZGan56P1tpump', 'https://pump.mypinata.cloud/ipfs/QmVrKoNP2L3M6ZVaZPBWxfabKRXsJ5VzJAdbJMCeDodJYW', 0),
    ('Goatseus Maximus', 'GOAT', 'CzLSujWBLFsSjncfkh59rUFqvafWcY5tzedWJSuypump', 'https://pump.mypinata.cloud/ipfs/QmYN7kDrPvnAjmBWHPQF5bQDuvcAiu4U1RGBY5LD5T1Ljf', 0),
    ('Fartcoin', 'FARTCOIN', '9BB6NFEcjBCtnNLFko2FqVQBq8HHM13kCyYcdQbgpump', 'https://pump.mypinata.cloud/ipfs/QmbLFQNJFD3KvCcP64AemhvYobmeXDGsLWBhVw8oJ5oiZb', 0),
    ('Pepe', 'PEPE', 'HeLp6NuQkmYB4pYWo2zYs22mESHXPQYzXbB8n4V98jwC', 'https://dd.dexscreener.com/ds-data/tokens/solana/HeLp6NuQkmYB4pYWo2zYs22mESHXPQYzXbB8n4V98jwC.png', 0);

-- Create indexes for better performance
CREATE INDEX idx_users_wallet_address ON users(wallet_address);
CREATE INDEX idx_votable_tokens_contract_address ON votable_tokens(contract_address);
CREATE INDEX idx_user_votes_user_id ON user_votes(user_id);
CREATE INDEX idx_user_votes_token_id ON user_votes(token_id);

-- Verify the setup
SELECT 'Database setup completed successfully' AS status;
SELECT COUNT(*) as total_tokens FROM votable_tokens;
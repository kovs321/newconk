-- BONK STRATEGY VOTING DATABASE SETUP
-- Run this in your Supabase SQL Editor

-- 1. Create voting_tokens table
CREATE TABLE IF NOT EXISTS voting_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    symbol VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    contract_address VARCHAR(100) NOT NULL UNIQUE,
    votes INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create user_votes table
CREATE TABLE IF NOT EXISTS user_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(100) NOT NULL,
    token_id UUID NOT NULL REFERENCES voting_tokens(id) ON DELETE CASCADE,
    voted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, token_id)
);

-- 3. Create auto-increment function
CREATE OR REPLACE FUNCTION increment_vote_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE voting_tokens 
    SET votes = votes + 1, updated_at = NOW()
    WHERE id = NEW.token_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Create auto-decrement function
CREATE OR REPLACE FUNCTION decrement_vote_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE voting_tokens 
    SET votes = votes - 1, updated_at = NOW()
    WHERE id = OLD.token_id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- 5. Create triggers
DROP TRIGGER IF EXISTS increment_vote_trigger ON user_votes;
CREATE TRIGGER increment_vote_trigger
    AFTER INSERT ON user_votes
    FOR EACH ROW
    EXECUTE FUNCTION increment_vote_count();

DROP TRIGGER IF EXISTS decrement_vote_trigger ON user_votes;
CREATE TRIGGER decrement_vote_trigger
    AFTER DELETE ON user_votes
    FOR EACH ROW
    EXECUTE FUNCTION decrement_vote_count();

-- 6. Enable Row Level Security
ALTER TABLE voting_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_votes ENABLE ROW LEVEL SECURITY;

-- 7. Create policies
DROP POLICY IF EXISTS "Anyone can view voting tokens" ON voting_tokens;
CREATE POLICY "Anyone can view voting tokens" ON voting_tokens
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own votes" ON user_votes;
CREATE POLICY "Users can insert their own votes" ON user_votes
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view all votes" ON user_votes;
CREATE POLICY "Users can view all votes" ON user_votes
    FOR SELECT USING (true);

-- 8. Insert your voting tokens
INSERT INTO voting_tokens (symbol, name, contract_address) VALUES
    ('TOKEN1', 'Loading...', 'Fg2Z4usj7UU99XmWV7H7EYnY2LHS7jmvA1qZ9q7nbqvQ'),
    ('TOKEN2', 'Loading...', 'Dkxs6nvfEqM84g1mybKL8oPWoUUawXaQNM2s2jwTbonk'),
    ('TOKEN3', 'Loading...', '94cD37ipFfAcMDBgtpr5gYYXsJWfFbLruZtEW5DTbonk'),
    ('TOKEN4', 'Loading...', '5ZH17JHVyYZy5QFnXyRawfj4mrieyKZihr7K88debonk'),
    ('TOKEN5', 'Loading...', 'DqRB2BZUfWFX8ZbCQvjWFor8KQTohaiTynSsYafbonk')
ON CONFLICT (contract_address) DO NOTHING;

-- Done! Your voting system is now set up.
-- The website will automatically fetch real token metadata from Solana Tracker API.
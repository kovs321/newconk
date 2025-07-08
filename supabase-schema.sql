-- Create voting_tokens table
CREATE TABLE voting_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    symbol VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    contract_address VARCHAR(100) NOT NULL UNIQUE,
    votes INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_votes table to track who voted for what
CREATE TABLE user_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(100) NOT NULL, -- Can be wallet address or session ID
    token_id UUID NOT NULL REFERENCES voting_tokens(id) ON DELETE CASCADE,
    voted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, token_id) -- Prevent double voting
);

-- Create function to increment vote count
CREATE OR REPLACE FUNCTION increment_vote_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE voting_tokens 
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

-- Create function to decrement vote count (if needed for vote removal)
CREATE OR REPLACE FUNCTION decrement_vote_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE voting_tokens 
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
ALTER TABLE voting_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_votes ENABLE ROW LEVEL SECURITY;

-- Create policies for voting_tokens (everyone can read, no one can write directly)
CREATE POLICY "Anyone can view voting tokens" ON voting_tokens
    FOR SELECT USING (true);

-- Create policies for user_votes (users can insert their own votes, view their own votes)
CREATE POLICY "Users can insert their own votes" ON user_votes
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view all votes" ON user_votes
    FOR SELECT USING (true);

-- Insert sample BONK-related tokens (you can replace these with your actual tokens)
INSERT INTO voting_tokens (symbol, name, contract_address) VALUES
    ('BONK', 'Bonk Token', 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263'),
    ('SAMO', 'Samoyedcoin', 'X6y9bV1V5pMKGfXVwWy1xq1m9xGxJrAFrQQWbGfkSuq'),
    ('WIF', 'Dogwifhat', 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm'),
    ('POPCAT', 'Popcat Token', 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN'),
    ('PNUT', 'Peanut Token', 'pnuTzKNjkgTCKZhcUYJZ6tQFaYSBKZNqJ8YoWKpQqZs');
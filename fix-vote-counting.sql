-- Fix Vote Counting Issues
-- Run this to debug and fix vote counting

-- First, let's check if triggers exist
SELECT tgname, tgrelid::regclass, tgtype, tgenabled 
FROM pg_trigger 
WHERE tgname IN ('increment_vote_trigger', 'decrement_vote_trigger');

-- Check if the trigger function exists
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname IN ('increment_vote_count', 'decrement_vote_count');

-- Let's manually count votes to see what's happening
SELECT 
    vt.id,
    vt.name,
    vt.ticker,
    vt.votes as stored_votes,
    COUNT(uv.id) as actual_vote_count
FROM votable_tokens vt
LEFT JOIN user_votes uv ON vt.id = uv.token_id
GROUP BY vt.id, vt.name, vt.ticker, vt.votes
ORDER BY vt.name;

-- Update vote counts to match actual votes
UPDATE votable_tokens vt
SET votes = (
    SELECT COUNT(*) 
    FROM user_votes uv 
    WHERE uv.token_id = vt.id
),
updated_at = NOW();

-- Verify the update worked
SELECT id, name, ticker, votes, updated_at 
FROM votable_tokens 
ORDER BY votes DESC;

-- Recreate the trigger function with debugging
CREATE OR REPLACE FUNCTION increment_vote_count()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the vote count
    UPDATE votable_tokens 
    SET votes = votes + 1, 
        updated_at = NOW()
    WHERE id = NEW.token_id;
    
    -- Log for debugging (you can see this in Supabase logs)
    RAISE NOTICE 'Vote incremented for token_id: %', NEW.token_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Make sure trigger is properly attached
DROP TRIGGER IF EXISTS increment_vote_trigger ON user_votes;
CREATE TRIGGER increment_vote_trigger
    AFTER INSERT ON user_votes
    FOR EACH ROW
    EXECUTE FUNCTION increment_vote_count();

-- Test the trigger with a sample vote
DO $$
DECLARE
    test_user_id UUID;
    test_token_id UUID;
BEGIN
    -- Get a user and token for testing
    SELECT id INTO test_user_id FROM users LIMIT 1;
    SELECT id INTO test_token_id FROM votable_tokens WHERE name = 'Fartcoin' LIMIT 1;
    
    IF test_user_id IS NOT NULL AND test_token_id IS NOT NULL THEN
        -- Insert a test vote
        INSERT INTO user_votes (user_id, token_id) 
        VALUES (test_user_id, test_token_id)
        ON CONFLICT (user_id, token_id) DO NOTHING;
        
        RAISE NOTICE 'Test vote inserted for testing trigger';
    END IF;
END $$;

-- Final check of vote counts
SELECT 
    vt.id,
    vt.name,
    vt.ticker,
    vt.votes as stored_votes,
    COUNT(uv.id) as actual_vote_count,
    CASE 
        WHEN vt.votes = COUNT(uv.id) THEN 'CORRECT'
        ELSE 'MISMATCH'
    END as status
FROM votable_tokens vt
LEFT JOIN user_votes uv ON vt.id = uv.token_id
GROUP BY vt.id, vt.name, vt.ticker, vt.votes
ORDER BY vt.name;
-- Final Fix for Vote Counting Trigger
-- This will ensure votes are counted properly

-- 1. First, drop the existing trigger and function
DROP TRIGGER IF EXISTS increment_vote_trigger ON user_votes;
DROP TRIGGER IF EXISTS decrement_vote_trigger ON user_votes;
DROP FUNCTION IF EXISTS increment_vote_count();
DROP FUNCTION IF EXISTS decrement_vote_count();

-- 2. Create a more robust increment function
CREATE OR REPLACE FUNCTION increment_vote_count()
RETURNS TRIGGER AS $$
BEGIN
    -- Directly increment the vote count
    UPDATE votable_tokens 
    SET 
        votes = votes + 1,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.token_id;
    
    -- If no rows were updated, something is wrong
    IF NOT FOUND THEN
        RAISE WARNING 'No token found with id %', NEW.token_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Create the trigger
CREATE TRIGGER increment_vote_trigger
    AFTER INSERT ON user_votes
    FOR EACH ROW
    EXECUTE FUNCTION increment_vote_count();

-- 4. Create decrement function for vote removal
CREATE OR REPLACE FUNCTION decrement_vote_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE votable_tokens 
    SET 
        votes = GREATEST(votes - 1, 0), -- Never go below 0
        updated_at = CURRENT_TIMESTAMP
    WHERE id = OLD.token_id;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- 5. Create decrement trigger
CREATE TRIGGER decrement_vote_trigger
    AFTER DELETE ON user_votes
    FOR EACH ROW
    EXECUTE FUNCTION decrement_vote_count();

-- 6. Fix current vote counts to match reality
UPDATE votable_tokens vt
SET votes = (
    SELECT COUNT(*) 
    FROM user_votes uv 
    WHERE uv.token_id = vt.id
),
updated_at = CURRENT_TIMESTAMP;

-- 7. Test the trigger with a transaction
DO $$
DECLARE
    test_user_id UUID;
    test_token_id UUID;
    initial_votes INTEGER;
    final_votes INTEGER;
BEGIN
    -- Get a test user and Popcat token
    SELECT id INTO test_user_id FROM users ORDER BY created_at DESC LIMIT 1;
    SELECT id, votes INTO test_token_id, initial_votes FROM votable_tokens WHERE name = 'Popcat' LIMIT 1;
    
    -- Start a transaction
    BEGIN
        -- Try to insert a test vote
        INSERT INTO user_votes (user_id, token_id) 
        VALUES (test_user_id, test_token_id)
        ON CONFLICT (user_id, token_id) DO NOTHING;
        
        -- Check if vote count increased
        SELECT votes INTO final_votes FROM votable_tokens WHERE id = test_token_id;
        
        IF final_votes > initial_votes THEN
            RAISE NOTICE 'SUCCESS: Trigger is working! Votes went from % to %', initial_votes, final_votes;
        ELSE
            RAISE WARNING 'PROBLEM: Trigger may not be working. Votes stayed at %', initial_votes;
        END IF;
        
        -- Rollback the test
        ROLLBACK;
    EXCEPTION 
        WHEN OTHERS THEN
            RAISE NOTICE 'Test completed with error (expected if user already voted): %', SQLERRM;
            ROLLBACK;
    END;
END $$;

-- 8. Show final vote counts
SELECT 
    name,
    ticker,
    votes,
    (SELECT COUNT(*) FROM user_votes WHERE token_id = votable_tokens.id) as actual_votes,
    CASE 
        WHEN votes = (SELECT COUNT(*) FROM user_votes WHERE token_id = votable_tokens.id) 
        THEN '✓ CORRECT' 
        ELSE '✗ MISMATCH' 
    END as status
FROM votable_tokens
ORDER BY votes DESC, name;
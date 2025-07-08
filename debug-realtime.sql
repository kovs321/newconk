-- Debug Real-time and Trigger Issues

-- 1. Check if real-time is enabled on tables
SELECT 
    schemaname,
    tablename,
    pubinsert,
    pubupdate,
    pubdelete
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime';

-- 2. Manually test updating a token to see if real-time works
UPDATE votable_tokens 
SET votes = votes + 0, updated_at = NOW()  -- Touch the record
WHERE name = 'Bonk';

-- 3. Check trigger execution by looking at recent votes and token updates
SELECT 
    'user_votes' as table_name,
    uv.id,
    uv.voted_at as timestamp,
    vt.name as token_name
FROM user_votes uv
JOIN votable_tokens vt ON uv.token_id = vt.id
WHERE uv.voted_at > NOW() - INTERVAL '10 minutes'

UNION ALL

SELECT 
    'votable_tokens' as table_name,
    vt.id,
    vt.updated_at as timestamp,
    vt.name as token_name
FROM votable_tokens vt
WHERE vt.updated_at > NOW() - INTERVAL '10 minutes'
ORDER BY timestamp DESC;

-- 4. Drop and recreate trigger with explicit logging
DROP TRIGGER IF EXISTS increment_vote_trigger ON user_votes;
DROP FUNCTION IF EXISTS increment_vote_count();

-- Create a new trigger function that definitely works
CREATE OR REPLACE FUNCTION increment_vote_count()
RETURNS TRIGGER AS $$
DECLARE
    current_votes INTEGER;
BEGIN
    -- Get current vote count
    SELECT votes INTO current_votes 
    FROM votable_tokens 
    WHERE id = NEW.token_id;
    
    -- Update with new count
    UPDATE votable_tokens 
    SET 
        votes = COALESCE(current_votes, 0) + 1,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.token_id;
    
    -- Log the action
    RAISE LOG 'Vote incremented for token_id % from % to %', 
        NEW.token_id, 
        COALESCE(current_votes, 0), 
        COALESCE(current_votes, 0) + 1;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
CREATE TRIGGER increment_vote_trigger
    AFTER INSERT ON user_votes
    FOR EACH ROW
    EXECUTE FUNCTION increment_vote_count();

-- 5. Test with a dummy vote (will fail if user already voted, which is fine)
DO $$
DECLARE
    test_user_id UUID;
    test_token_id UUID;
    vote_count_before INTEGER;
    vote_count_after INTEGER;
BEGIN
    -- Get a test user and token
    SELECT id INTO test_user_id FROM users ORDER BY created_at DESC LIMIT 1;
    SELECT id INTO test_token_id FROM votable_tokens WHERE name = 'Pepe' LIMIT 1;
    
    -- Get vote count before
    SELECT votes INTO vote_count_before FROM votable_tokens WHERE id = test_token_id;
    
    -- Try to insert a vote
    BEGIN
        INSERT INTO user_votes (user_id, token_id) 
        VALUES (test_user_id, test_token_id);
        
        -- Get vote count after
        SELECT votes INTO vote_count_after FROM votable_tokens WHERE id = test_token_id;
        
        RAISE NOTICE 'Test successful! Votes went from % to %', vote_count_before, vote_count_after;
        
        -- Clean up test vote
        DELETE FROM user_votes WHERE user_id = test_user_id AND token_id = test_token_id;
    EXCEPTION WHEN unique_violation THEN
        RAISE NOTICE 'Test user already voted for this token (expected)';
    END;
END $$;

-- 6. Final vote count refresh
UPDATE votable_tokens vt
SET votes = (
    SELECT COUNT(*) 
    FROM user_votes uv 
    WHERE uv.token_id = vt.id
),
updated_at = NOW();

-- Show final results
SELECT name, ticker, votes 
FROM votable_tokens 
ORDER BY votes DESC;
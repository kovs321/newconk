-- Force Refresh All Vote Counts and Test Real-time Updates

-- 1. First, manually sync ALL vote counts
UPDATE votable_tokens vt
SET votes = (
    SELECT COUNT(*) 
    FROM user_votes uv 
    WHERE uv.token_id = vt.id
),
updated_at = NOW()
WHERE true;  -- Force update all rows

-- 2. Show the updated counts
SELECT name, ticker, votes, updated_at 
FROM votable_tokens 
ORDER BY votes DESC, name;

-- 3. Ensure real-time is enabled for votable_tokens
ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS votable_tokens;
ALTER PUBLICATION supabase_realtime ADD TABLE votable_tokens;

-- 4. Test the trigger is working by checking its last execution
SELECT 
    vt.name,
    vt.votes,
    COUNT(uv.id) as actual_votes,
    MAX(uv.voted_at) as last_vote_time,
    vt.updated_at
FROM votable_tokens vt
LEFT JOIN user_votes uv ON vt.id = uv.token_id
GROUP BY vt.id, vt.name, vt.votes, vt.updated_at
HAVING COUNT(uv.id) > 0
ORDER BY MAX(uv.voted_at) DESC;

-- 5. Force a real-time update by touching all tokens
UPDATE votable_tokens 
SET updated_at = NOW() 
WHERE true;
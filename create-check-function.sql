-- Create a function to check vote counts for edge function
CREATE OR REPLACE FUNCTION check_vote_counts()
RETURNS TABLE (
    token_id UUID,
    token_name TEXT,
    stored_votes INTEGER,
    actual_votes BIGINT,
    matches BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        vt.id as token_id,
        vt.name as token_name,
        vt.votes as stored_votes,
        COUNT(uv.id) as actual_votes,
        vt.votes = COUNT(uv.id) as matches
    FROM votable_tokens vt
    LEFT JOIN user_votes uv ON vt.id = uv.token_id
    GROUP BY vt.id, vt.name, vt.votes
    ORDER BY vt.name;
END;
$$ LANGUAGE plpgsql;
-- Create a manual increment function that can be called via RPC
CREATE OR REPLACE FUNCTION increment_token_votes(token_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE votable_tokens 
    SET 
        votes = votes + 1,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = token_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Token not found with id %', token_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION increment_token_votes(UUID) TO anon;
GRANT EXECUTE ON FUNCTION increment_token_votes(UUID) TO authenticated;
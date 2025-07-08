-- Enable Real-time for All Tables
-- This ensures the frontend receives updates when data changes

-- Check current real-time tables
SELECT 
    schemaname,
    tablename,
    pubinsert,
    pubupdate,
    pubdelete
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime';

-- Remove and re-add tables to ensure they're properly configured
ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS votable_tokens;
ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS user_votes;
ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS users;

-- Re-add with all operations enabled
ALTER PUBLICATION supabase_realtime ADD TABLE votable_tokens;
ALTER PUBLICATION supabase_realtime ADD TABLE user_votes;
ALTER PUBLICATION supabase_realtime ADD TABLE users;

-- Verify they're added
SELECT 
    schemaname,
    tablename,
    pubinsert,
    pubupdate,
    pubdelete
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
ORDER BY tablename;

-- Force an update to trigger real-time
UPDATE votable_tokens 
SET updated_at = NOW() 
WHERE true;

-- Also check if the Supabase real-time service is enabled
-- You may need to check this in your Supabase dashboard under Settings > Database > Replication
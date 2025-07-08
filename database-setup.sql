-- Database setup script for BONK STRATEGY voting system
-- Run this in your Supabase SQL editor

-- Enable Row Level Security for all tables
ALTER TABLE voting_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_votes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for voting_tokens (allow public read, authenticated write)
CREATE POLICY "Anyone can read voting tokens" ON voting_tokens
  FOR SELECT USING (true);

CREATE POLICY "Anyone can update voting tokens" ON voting_tokens
  FOR UPDATE USING (true);

CREATE POLICY "Anyone can insert voting tokens" ON voting_tokens
  FOR INSERT WITH CHECK (true);

-- Create RLS policies for user_votes (allow public read, authenticated write)
CREATE POLICY "Anyone can read user votes" ON user_votes
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert user votes" ON user_votes
  FOR INSERT WITH CHECK (true);

-- Enable real-time subscriptions for both tables
ALTER PUBLICATION supabase_realtime ADD TABLE voting_tokens;
ALTER PUBLICATION supabase_realtime ADD TABLE user_votes;

-- Create a function to increment vote counts
CREATE OR REPLACE FUNCTION increment_vote_count(token_id TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE voting_tokens 
  SET votes = votes + 1, 
      updated_at = NOW()
  WHERE id = token_id;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically update vote counts when user_votes are inserted
CREATE OR REPLACE FUNCTION update_vote_count_trigger()
RETURNS TRIGGER AS $$
BEGIN
  -- Count total votes for the token
  UPDATE voting_tokens 
  SET votes = (
    SELECT COUNT(*) 
    FROM user_votes 
    WHERE token_id = NEW.token_id
  ),
  updated_at = NOW()
  WHERE id = NEW.token_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger that fires after vote insert
DROP TRIGGER IF EXISTS trigger_update_vote_count ON user_votes;
CREATE TRIGGER trigger_update_vote_count
  AFTER INSERT ON user_votes
  FOR EACH ROW
  EXECUTE FUNCTION update_vote_count_trigger();

-- Insert the 5 voting tokens if they don't exist
INSERT INTO voting_tokens (id, symbol, name, contract_address, votes, image, description) 
VALUES 
  ('1', 'BONK', 'BONK Token 1', 'Fg2Z4usj7UU99XmWV7H7EYnY2LHS7jmvA1qZ9q7nbqvQ', 0, '', 'BONK voting token'),
  ('2', 'BONK', 'BONK Token 2', 'Dkxs6nvfEqM84g1mybKL8oPWoUUawXaQNM2s2jwTbonk', 0, '', 'BONK voting token'),
  ('3', 'BONK', 'BONK Token 3', '94cD37ipFfAcMDBgtpr5gYYXsJWfFbLruZtEW5DTbonk', 0, '', 'BONK voting token'),
  ('4', 'BONK', 'BONK Token 4', '5ZH17JHVyYZy5QFnXyRawfj4mrieyKZihr7K88debonk', 0, '', 'BONK voting token'),
  ('5', 'BONK', 'BONK Token 5', 'DqRB2BZUfWFX8ZbCQvjWFor8KQTohaiTynSsYafbonk', 0, '', 'BONK voting token')
ON CONFLICT (id) DO NOTHING;

-- Verify the setup
SELECT 'Tables created successfully' AS status;
SELECT * FROM voting_tokens;
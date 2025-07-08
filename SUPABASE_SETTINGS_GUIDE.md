# Supabase Settings Guide for Voting System

## Important: Enable Anonymous Access

For the Phantom wallet voting system to work, you need to ensure anonymous access is enabled in your Supabase project.

### 1. Check Supabase Project Settings

1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **API**
3. Find the **anon public** key (you should already have this in your app)
4. Make sure anonymous access is enabled

### 2. Run the RLS Fix Script

Run the `fix-rls-complete.sql` script in your SQL editor. This script:
- Temporarily disables RLS to clear any issues
- Drops all existing policies
- Re-enables RLS with proper anonymous access policies
- Tests the setup with a test user insertion

### 3. Verify the Setup

After running the script, you should see:
- A test user created and then deleted
- A list of all policies showing permissive access

### 4. Test in Your App

1. Connect your Phantom wallet
2. Check the browser console for "User created/found: [user-id]"
3. Check the Supabase dashboard → Table Editor → users table
4. You should see your wallet address in the users table

### 5. If Still Having Issues

If you're still getting RLS errors:

1. **Option A: Disable RLS Temporarily** (for testing only)
   ```sql
   ALTER TABLE users DISABLE ROW LEVEL SECURITY;
   ALTER TABLE votable_tokens DISABLE ROW LEVEL SECURITY;
   ALTER TABLE user_votes DISABLE ROW LEVEL SECURITY;
   ```

2. **Option B: Check Service Role Key**
   - If you need to bypass RLS, you could use the service role key instead of anon key
   - But this is NOT recommended for client-side apps

3. **Option C: Enable Supabase Auth Anonymous Sign-ins**
   - Go to Authentication → Settings
   - Enable anonymous sign-ins
   - But this adds complexity we don't need for wallet-only auth

### Recommended Approach

The `fix-rls-complete.sql` script should resolve all issues by creating proper policies for anonymous access.
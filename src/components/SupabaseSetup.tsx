import React, { useState } from 'react';
import { testConnection, checkTablesExist, insertSampleTokens, initializeSupabase } from '../lib/supabase-setup';

const SupabaseSetup: React.FC = () => {
  const [status, setStatus] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runSetup = async () => {
    setLoading(true);
    setError(null);
    setStatus('Starting setup...');

    try {
      // Test connection
      setStatus('Testing Supabase connection...');
      const connected = await testConnection();
      if (!connected) {
        throw new Error('Failed to connect to Supabase. Check your environment variables.');
      }

      // Check if tables exist
      setStatus('Checking if tables exist...');
      const tablesExist = await checkTablesExist();
      
      if (!tablesExist) {
        setStatus('❌ Tables do not exist. Please run the SQL schema in your Supabase dashboard.');
        setError('You need to run the SQL schema first. Check the supabase-schema.sql file in your project.');
        return;
      }

      // Insert sample tokens
      setStatus('Inserting sample tokens...');
      const tokensInserted = await insertSampleTokens();
      
      if (tokensInserted) {
        setStatus('✅ Setup completed successfully! The voting system is ready to use.');
      } else {
        setStatus('⚠️ Setup completed but failed to insert sample tokens.');
      }

    } catch (err: any) {
      setError(err.message || 'Setup failed');
      setStatus('❌ Setup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Supabase Setup</h2>
      
      {/* Instructions */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">Setup Instructions:</h3>
        <ol className="list-decimal list-inside space-y-2 text-blue-800 text-sm">
          <li>Create a Supabase project at <a href="https://supabase.com" className="underline">supabase.com</a></li>
          <li>Get your Project URL and API Key from Settings → API</li>
          <li>Create a <code className="bg-blue-100 px-1 rounded">.env.local</code> file with your credentials</li>
          <li>Run the SQL schema from <code className="bg-blue-100 px-1 rounded">supabase-schema.sql</code> in your Supabase SQL Editor</li>
          <li>Click "Run Setup" below to initialize the voting system</li>
        </ol>
      </div>

      {/* Environment Variables */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Environment Variables:</h3>
        <pre className="text-sm text-gray-700 bg-gray-100 p-2 rounded">
{`VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here`}
        </pre>
      </div>

      {/* Status */}
      {status && (
        <div className={`mb-4 p-3 rounded-lg ${
          status.includes('✅') ? 'bg-green-50 text-green-800' :
          status.includes('❌') ? 'bg-red-50 text-red-800' :
          status.includes('⚠️') ? 'bg-yellow-50 text-yellow-800' :
          'bg-blue-50 text-blue-800'
        }`}>
          {status}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-800 rounded-lg">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Setup Button */}
      <button
        onClick={runSetup}
        disabled={loading}
        className={`w-full py-3 px-6 rounded-lg font-semibold transition-colors ${
          loading 
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-orange-500 text-white hover:bg-orange-600'
        }`}
      >
        {loading ? 'Setting up...' : 'Run Setup'}
      </button>

      {/* SQL Schema Link */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">SQL Schema:</h3>
        <p className="text-sm text-gray-700 mb-2">
          Copy and paste the contents of <code className="bg-gray-100 px-1 rounded">supabase-schema.sql</code> 
          into your Supabase SQL Editor and run it.
        </p>
        <div className="text-xs text-gray-500">
          This creates the tables, triggers, and security policies needed for the voting system.
        </div>
      </div>
    </div>
  );
};

export default SupabaseSetup;
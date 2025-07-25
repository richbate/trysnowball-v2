import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../Supabase'; // ✅ Capital S because the file is Supabase.js
import { useUser } from '../contexts/UserContext';

function Login() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useUser();
  const navigate = useNavigate();

  // Check if user has demo data
  const hasDemoData = () => {
    const debtBalances = localStorage.getItem('debtBalances');
    return !debtBalances; // No real data = still using demo data
  };

  // Redirect authenticated users
  useEffect(() => {
    if (user) {
      if (hasDemoData()) {
        // User is authenticated but has demo data - show create plan flow
        navigate('/my-plan');
      } else {
        // User has real data - go to main app
        navigate('/');
      }
    }
  }, [user, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      console.log('🔄 Attempting login with email:', email);
      console.log('🔄 Supabase client:', supabase);
      console.log('🔄 Supabase URL:', supabase.supabaseUrl);
      console.log('🔄 Supabase Key (first 20 chars):', supabase.supabaseKey?.substring(0, 20) + '...');

      // Test basic connectivity first
      const testUrl = `${supabase.supabaseUrl}/rest/v1/`;
      console.log('🔄 Testing connectivity to:', testUrl);
      
      try {
        const testResponse = await fetch(testUrl, {
          method: 'GET',
          headers: {
            'apikey': supabase.supabaseKey,
            'Content-Type': 'application/json'
          }
        });
        console.log('🔄 Test fetch response status:', testResponse.status);
        console.log('🔄 Test fetch response ok:', testResponse.ok);
      } catch (fetchError) {
        console.error('❌ Basic fetch test failed:', fetchError);
        console.error('❌ This indicates a network/CORS issue');
      }

      const { data, error } = await supabase.auth.signInWithOtp({ 
        email,
        options: {
          emailRedirectTo: `https://trysnowball.netlify.app/login`,
          data: {
            type: 'magiclink'
          }
        }
      });

      console.log('🔄 Supabase response data:', data);
      console.log('🔄 Supabase response error:', error);

      if (error) {
        console.error('❌ Supabase auth error:', error);
        setMessage(`Error: ${error.message}`);
      } else {
        setMessage('Magic link sent! Check your email.');
      }
    } catch (err) {
      console.error('❌ Network/fetch error:', err);
      setMessage(`Network error: ${err.message}. Check console for details.`);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-xl p-8">
        <h1 className="text-2xl font-bold mb-6 text-center text-gray-900 dark:text-gray-100">Log in to Try Snowball</h1>
        
        {hasDemoData() && (
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900 dark:bg-opacity-30 border border-blue-200 dark:border-blue-700 rounded-lg">
            <h3 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">🎯 Ready to Create Your Plan?</h3>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              After logging in, you'll be able to replace the demo data with your real debt information and create your personalized debt freedom plan.
            </p>
          </div>
        )}
        
        <form onSubmit={handleLogin}>
          <label className="block mb-4">
            <span className="text-gray-700 dark:text-gray-300">Email address</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring focus:ring-blue-200 dark:focus:ring-blue-500"
            />
          </label>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? 'Sending...' : (hasDemoData() ? 'Create My Plan' : 'Send Magic Link')}
          </button>
        </form>
        {message && <p className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">{message}</p>}
        
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            We'll send you a secure magic link to log in. No passwords needed!
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
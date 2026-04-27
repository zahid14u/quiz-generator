import { useState } from 'react';
import { supabase } from '@/lib/supabase';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);

  const handleGoogleLogin = async () => {
    try {
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/auth/callback',
          queryParams: { access_type: 'offline', prompt: 'consent' }
        }
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleEmailLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      if (error) {
        setError(error.message);
      } else {
        window.location.href = '/generate';
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="max-w-md w-full mx-auto p-6 bg-white rounded-lg shadow-md">
        <div className="flex items-center justify-between mb-4">
          <a href="#" className="text-2xl font-bold text-purple-500">QuizAI</a>
          <nav className="space-x-4">
            <a href="#" className="text-gray-600 hover:text-gray-900">Generate</a>
            <a href="#" className="text-gray-600 hover:text-gray-900">Pricing</a>
            <a href="#" className="text-gray-600 hover:text-gray-900">Home</a>
          </nav>
        </div>
        <div className="flex flex-col space-y-4">
          <button
            className="w-full rounded-lg border border-slate-300 hover:bg-slate-50 p-4 flex items-center justify-center"
            onClick={handleGoogleLogin}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-6 h-6 mr-2"
            >
              <path d="M12.24 10.285V5.000h6.73v2.285c-.276-.27-1.148-.27-1.423 0-1.861 1.861-1.861 4.862 0 6.723 1.861 1.861 4.863 1.861 6.723 0 1.862-1.863 1.862-4.863 0-6.723z" />
            </svg>
            Continue with Google
          </button>
          <div className="flex items-center justify-center text-gray-600 mb-4">
            or
          </div>
          <form onSubmit={handleEmailLogin}>
            <div className="flex flex-col space-y-2">
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Email"
                className="p-2 rounded-lg border border-slate-300 hover:bg-slate-50 focus:outline-none"
                required
              />
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Password"
                className="p-2 rounded-lg border border-slate-300 hover:bg-slate-50 focus:outline-none"
                required
              />
            </div>
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 p-4 mb-4 rounded-lg">
                {error}
              </div>
            )}
            <button
              type="submit"
              className="w-full rounded-lg bg-purple-500 text-white p-4 hover:bg-purple-700"
            >
              Login
            </button>
          </form>
          <div className="flex flex-col space-y-2">
            <a href="/signup" className="text-gray-600 hover:text-gray-900">
              Don't have an account? Sign up →
            </a>
            <a href="/pricing" className="text-gray-600 hover:text-gray-900">
              Want Pro access? See pricing →
            </a>
            <a href="/forgot-password" className="text-gray-600 hover:text-gray-900">
              Forgot password?
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
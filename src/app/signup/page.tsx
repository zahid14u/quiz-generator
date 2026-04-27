"use client";

import { supabase } from "@/lib/supabase";
import { useState } from "react";

const SignUpPage = () => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleGoogleSignup = async () => {
    try {
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin + "/auth/callback",
        },
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleEmailSignup = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
          emailRedirectTo: window.location.origin + "/auth/callback",
        },
      });
      if (error) {
        setError(error.message);
      } else {
        setSuccess(true);
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="max-w-md w-full mx-auto p-6 bg-white rounded-lg shadow-md">
        <div className="flex items-center justify-between mb-4">
          <a href="#" className="text-2xl font-bold text-purple-500">
            QuizAI
          </a>
          <nav className="space-x-4">
            <a href="#" className="text-gray-600 hover:text-gray-900">
              Generate
            </a>
            <a href="#" className="text-gray-600 hover:text-gray-900">
              Pricing
            </a>
            <a href="#" className="text-gray-600 hover:text-gray-900">
              Home
            </a>
          </nav>
        </div>
        <div className="flex flex-col space-y-4">
          <button
            className="w-full rounded-lg bg-white hover:bg-gray-100 p-4 flex items-center justify-center"
            onClick={handleGoogleSignup}
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
          <form onSubmit={handleEmailSignup}>
            <div className="flex flex-col space-y-2">
              <input
                type="text"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="Full Name"
                className="p-2 rounded-lg border border-slate-300 hover:bg-slate-50 focus:outline-none"
                required
              />
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
                minLength={8}
              />
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Confirm Password"
                className="p-2 rounded-lg border border-slate-300 hover:bg-slate-50 focus:outline-none"
                required
              />
            </div>
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 p-4 mb-4 rounded-lg">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-green-100 border border-green-400 text-green-700 p-4 mb-4 rounded-lg">
                Account created! Check your email.
              </div>
            )}
            <button
              type="submit"
              className="w-full rounded-lg bg-purple-500 text-white p-4 hover:bg-purple-700"
            >
              Sign Up
            </button>
          </form>
          <div className="flex flex-col space-y-2">
            <a href="/login" className="text-gray-600 hover:text-gray-900">
              Already have an account? Login
            </a>
            <a href="/terms" className="text-gray-600 hover:text-gray-900">
              By signing up you agree to Terms
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;

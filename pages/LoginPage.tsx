import React, { useState } from 'react';
import { Logo } from '../components/Logo';

interface LoginPageProps {
  onLogin: (email: string, password: string) => Promise<void>;
  onRegister: (name: string, email: string, password: string) => Promise<void>;
}

export function LoginPage({ onLogin, onRegister }: LoginPageProps) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isRegistering && !name) {
      setError('Please enter your full name.');
      return;
    }
    
    if (!email || !password) {
        setError('Email and password are required.');
        return;
    }

    setIsLoading(true);
    try {
      if (isRegistering) {
        await onRegister(name, email, password);
      } else {
        await onLogin(email, password);
      }
    } catch (err: any) {
      if (err.code) {
        setError(err.code.replace('auth/', '').replace(/-/g, ' '));
      } else {
        setError('An unexpected error occurred.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsRegistering(!isRegistering);
    setError('');
    setName('');
  };
  
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Logo className="h-24" />
          </div>
          <h1 className="text-4xl font-bold text-gray-800">
            {isRegistering ? 'Create an Account' : 'Umvuzo Digital Platform'}
          </h1>
          <p className="mt-2 text-gray-500">
            {isRegistering ? 'Join our platform today' : 'Welcome Back'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {isRegistering && (
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Jane Doe"
                required
                className="mt-1 block w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-brand-orange focus:border-brand-orange text-gray-900"
              />
            </div>
          )}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="mt-1 block w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-brand-orange focus:border-brand-orange text-gray-900"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="mt-1 block w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-brand-orange focus:border-brand-orange text-gray-900"
            />
          </div>
          
          {error && <p className="text-red-500 text-sm capitalize text-center">{error}</p>}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 text-lg font-semibold text-white bg-brand-orange rounded-lg shadow-md hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-orange transition-transform transform hover:scale-105 disabled:bg-gray-400 disabled:scale-100 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Processing...' : (isRegistering ? 'Register' : 'Login')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            {isRegistering ? 'Already have an account? ' : "Don't have an account? "}
            <button onClick={toggleMode} className="font-semibold text-brand-orange hover:underline">
              {isRegistering ? 'Login' : 'Register'}
            </button>
          </p>
        </div>
        <p className="mt-4 text-xs text-center text-gray-400">
            Hint: Log in as <strong>media@isphepho.co.za</strong> to view the admin dashboard.
        </p>
      </div>
    </div>
  );
}
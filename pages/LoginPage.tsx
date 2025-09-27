import React, { useState } from 'react';

interface LoginPageProps {
  onLogin: (email: string) => void;
  onRegister: (name: string, email: string) => boolean;
}

export function LoginPage({ onLogin, onRegister }: LoginPageProps) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isRegistering) {
      if (!name) {
        setError('Please enter your full name.');
        return;
      }
      const success = onRegister(name, email);
      if (!success) {
        setError('An account with this email already exists.');
      }
    } else {
      onLogin(email);
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
              className="mt-1 block w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-brand-orange focus:border-brand-orange text-gray-900"
            />
          </div>
          
          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            className="w-full py-3 px-4 text-lg font-semibold text-white bg-brand-orange rounded-lg shadow-md hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-orange transition-transform transform hover:scale-105"
          >
            {isRegistering ? 'Register' : 'Login'}
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
      </div>
    </div>
  );
}
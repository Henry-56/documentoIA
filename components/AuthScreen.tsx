import React, { useState } from 'react';
import { User, Role } from '../types';
import { Button } from './Button';
import { Bot, Lock, ArrowRight } from 'lucide-react';

interface AuthScreenProps {
  onLogin: (user: User) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate API delay
    setTimeout(() => {
      onLogin({ 
        email, 
        name: name || email.split('@')[0],
        role: Role.CLIENT,
        passwordHash: 'dummy-hash-for-demo',
        createdAt: Date.now()
      });
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-100">
        <div className="flex flex-col items-center mb-8">
          <div className="h-16 w-16 bg-blue-600 rounded-xl flex items-center justify-center text-white mb-4 shadow-lg transform -rotate-3">
            <Bot size={36} />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">DocuMind AI</h1>
          <p className="text-slate-500 text-center mt-2">Sign in to start chatting with your documents secure and privately.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
            <input
              type="text"
              id="name"
              required
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
            <input
              type="email"
              id="email"
              required
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              placeholder="john@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          
          <Button type="submit" className="w-full py-3 text-lg" isLoading={isLoading}>
            Get Started <ArrowRight size={18} />
          </Button>

          <div className="flex items-center justify-center gap-2 text-xs text-slate-400 mt-6">
            <Lock size={12} />
            <span>Secure Enterprise-Grade Encryption</span>
          </div>
        </form>
      </div>
    </div>
  );
};
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import { useAuthStore } from '@/stores/auth-store';
import type { User } from '@/types/user';

export default function RegisterPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data } = await apiClient.post<{ 
        data: { user: User; tokens: { accessToken: string; refreshToken: string } } 
      }>('/auth/register', formData);
      
      setAuth(data.data.user, data.data.tokens.accessToken, data.data.tokens.refreshToken);
      router.push('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="text-center mb-6">
        <h1 className="text-xl font-bold tracking-tight mb-1">Create account</h1>
        <p className="text-muted-foreground text-sm">Join MatchMarket and get 1,000 starting tokens</p>
      </div>

      {error && (
        <div className="mb-4 p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs text-center">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Username</label>
          <input
            type="text"
            required
            minLength={3}
            className="w-full border border-border rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-foreground/20 transition-all bg-white"
            placeholder="johndoe"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Email</label>
          <input
            type="email"
            required
            className="w-full border border-border rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-foreground/20 transition-all bg-white"
            placeholder="you@example.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Password</label>
          <input
            type="password"
            required
            minLength={8}
            className="w-full border border-border rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-foreground/20 transition-all bg-white"
            placeholder="••••••••"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          />
          <p className="text-[11px] text-muted-foreground">Must be at least 8 characters</p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-foreground text-white font-semibold py-2 rounded-lg transition-opacity hover:opacity-90 flex items-center justify-center gap-2 disabled:opacity-50 text-sm"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {loading ? 'Creating account...' : 'Create account'}
        </button>
      </form>

      <div className="mt-5 text-center text-xs text-muted-foreground">
        Already have an account?{' '}
        <Link href="/auth/login" className="text-foreground hover:underline font-medium">
          Log in
        </Link>
      </div>
    </div>
  );
}

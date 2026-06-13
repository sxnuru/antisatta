'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { useAuthStore } from '@/stores/auth-store';
import { User, CheckCircle, XCircle, TrendingUp, Wallet, Clock, Trophy } from 'lucide-react';
import type { PublicProfile } from '@/types/user';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

export default function ProfilePage() {
  const { user, isAuthenticated } = useAuthStore();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile', user?.username],
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: PublicProfile }>(`/users/profile/${user?.username}`);
      return data.data;
    },
    enabled: !!user?.username && isAuthenticated,
  });

  const { data: predictionHistory, isLoading: isLoadingHistory } = useQuery({
    queryKey: ['predictions', 'history'],
    queryFn: async () => {
      try {
        const { data } = await apiClient.get('/predictions/history');
        const resData = data?.data?.data || data?.data || data;
        return Array.isArray(resData) ? resData : (resData?.data || []);
      } catch (err) {
        console.error('Failed to fetch prediction history:', err);
        return [];
      }
    },
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-3">
        <User className="w-10 h-10 text-muted-foreground" />
        <h2 className="text-lg font-bold">Please log in</h2>
        <p className="text-sm text-muted-foreground">You need to be logged in to view your profile.</p>
      </div>
    );
  }

  if (isLoading) {
    return <div className="h-48 rounded-lg bg-secondary animate-pulse" />;
  }

  return (
    <div className="max-w-3xl space-y-6">
      {/* Profile Header */}
      <div className="border border-border rounded-lg p-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center text-xl font-bold">
            {profile?.username.charAt(0).toUpperCase()}
          </div>
          
          <div className="flex-1">
            <h1 className="text-lg font-bold">{profile?.username}</h1>
            <p className="text-xs text-muted-foreground">Member since {new Date(profile?.createdAt || '').toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Balance', value: profile?.balance?.toLocaleString() || '0', icon: Wallet },
          { label: 'ROI', value: `${(profile?.roi || 0) >= 0 ? '+' : ''}${profile?.roi || 0}%`, icon: TrendingUp, color: (profile?.roi || 0) >= 0 ? 'text-green-600' : 'text-red-500' },
          { label: 'Won', value: profile?.predictionsWon || 0, icon: CheckCircle, color: 'text-green-600' },
          { label: 'Lost', value: profile?.predictionsLost || 0, icon: XCircle, color: 'text-red-500' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="border border-border rounded-lg p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">{stat.label}</p>
              <stat.icon className={`w-3.5 h-3.5 ${stat.color || 'text-muted-foreground'}`} />
            </div>
            <p className="text-lg font-bold">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Activity Section */}
      <div className="border border-border rounded-lg overflow-hidden">
        <div className="bg-neutral-50 px-5 py-4 border-b border-border">
          <h2 className="text-sm font-bold">Recent Activity</h2>
        </div>
        
        {isLoadingHistory ? (
          <div className="p-5 space-y-4">
            <div className="h-16 bg-secondary animate-pulse rounded-lg" />
            <div className="h-16 bg-secondary animate-pulse rounded-lg" />
            <div className="h-16 bg-secondary animate-pulse rounded-lg" />
          </div>
        ) : predictionHistory && predictionHistory.length > 0 ? (
          <div className="divide-y divide-border">
            {predictionHistory.map((prediction: any) => (
              <div key={prediction.id} className="p-5 hover:bg-neutral-50 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                      prediction.status === 'WON' ? 'bg-green-100 text-green-700' : 
                      prediction.status === 'LOST' ? 'bg-red-100 text-red-700' : 
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {prediction.status}
                    </span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDistanceToNow(new Date(prediction.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-sm font-bold">
                      {prediction.status === 'WON' && prediction.reward ? (
                        <span className="text-green-600">+{prediction.reward - prediction.stake} Profit</span>
                      ) : prediction.status === 'LOST' ? (
                        <span className="text-red-500">-{prediction.stake} Loss</span>
                      ) : (
                        <span>${prediction.stake} Staked</span>
                      )}
                    </div>
                  </div>
                </div>

                {prediction.market && prediction.outcome ? (
                  <Link href={`/markets/${prediction.market.id}`} className="block group">
                    <h3 className="text-sm font-semibold group-hover:text-blue-600 transition-colors truncate">
                      {prediction.market.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">Predicted:</span>
                      <span className="text-xs font-semibold px-2 py-0.5 bg-secondary rounded">
                        {prediction.outcome.name}
                      </span>
                    </div>
                  </Link>
                ) : (
                  <div className="text-sm text-muted-foreground mt-2">Market data unavailable</div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center text-muted-foreground text-sm">
            Activity history will appear here once you start predicting.
          </div>
        )}
      </div>
    </div>
  );
}

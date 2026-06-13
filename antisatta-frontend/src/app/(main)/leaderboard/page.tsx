'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import type { LeaderboardEntry } from '@/types/leaderboard';

export default function LeaderboardPage() {
  const { data: leaderboard, isLoading } = useQuery({
    queryKey: ['leaderboard', 'all-time'],
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: LeaderboardEntry[] }>('/leaderboard/all-time');
      return data.data;
    },
  });

  const getRankIcon = (rank: number) => {
    return <span className="text-xs font-semibold text-muted-foreground w-4 text-center">{rank}</span>;
  };

  return (
    <div className="max-w-3xl space-y-4">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Leaderboard</h1>
        <p className="text-sm text-muted-foreground">Top predictors by ROI and balance</p>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 rounded-lg bg-secondary animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="border border-border rounded-lg overflow-hidden">
          <div className="grid grid-cols-12 gap-3 px-4 py-2.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider border-b border-border bg-neutral-50">
            <div className="col-span-1 text-center">Rank</div>
            <div className="col-span-4">Predictor</div>
            <div className="col-span-3 text-right">Balance</div>
            <div className="hidden md:block md:col-span-2 text-right">ROI</div>
            <div className="hidden md:block md:col-span-2 text-right">Win Rate</div>
          </div>

          <div className="divide-y divide-border">
            {leaderboard?.map((entry) => {
              const winRate = entry.wins + entry.losses > 0 
                ? Math.round((entry.wins / (entry.wins + entry.losses)) * 100) 
                : 0;
                
              return (
                <div
                  key={entry.userId}
                  className="grid grid-cols-12 gap-3 px-4 py-2.5 items-center hover:bg-neutral-50 transition-colors"
                >
                  <div className="col-span-1 flex justify-center">
                    {getRankIcon(entry.rank)}
                  </div>
                  
                  <div className="col-span-4 font-medium text-sm flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center font-semibold text-[10px]">
                      {entry.username.charAt(0).toUpperCase()}
                    </div>
                    {entry.username}
                  </div>
                  
                  <div className="col-span-3 text-right text-sm font-semibold">
                    {entry.balance.toLocaleString()}
                  </div>
                  
                  <div className={`hidden md:block md:col-span-2 text-right text-sm font-medium ${entry.roi >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {entry.roi >= 0 ? '+' : ''}{entry.roi}%
                  </div>
                  
                  <div className="hidden md:block md:col-span-2 text-right text-sm text-muted-foreground">
                    {winRate}%
                  </div>
                </div>
              );
            })}
            
            {leaderboard?.length === 0 && (
              <div className="p-8 text-center text-muted-foreground text-sm">
                No predictors have placed any bets yet.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useState } from 'react';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import type { Market } from '@/types/market';
import Link from 'next/link';
import { Clock, TrendingUp, TrendingDown, Users, Search } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useAuthStore } from '@/stores/auth-store';

export default function MarketsListPage() {
  const { isAuthenticated } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');

  const { data: markets, isLoading } = useQuery({
    queryKey: ['markets', 'all'],
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: Market[] }>('/markets/trending');
      return data.data;
    },
  });

  const { data: predictionHistory } = useQuery({
    queryKey: ['predictions', 'history'],
    queryFn: async () => {
      const { data } = await apiClient.get('/predictions/history');
      return data.data.data || [];
    },
    enabled: isAuthenticated,
  });

  const { data: customMarkets, isLoading: isLoadingCustom } = useQuery({
    queryKey: ['markets', 'community'],
    queryFn: async () => {
      const { data } = await apiClient.get('/markets/community');
      return data.data.data as Market[];
    },
  });

  const getMarketState = (market: Market) => {
    const now = new Date().getTime();
    const endsAt = new Date(market.endsAt || new Date()).getTime();
    const isEnded = now >= endsAt || market.status === 'RESOLVED' || market.status === 'CANCELLED';
    
    let isBettingActive = false;
    if (!isEnded) {
      if (market.category === 'CUSTOM') {
        isBettingActive = true;
      } else {
        const startsAt = new Date(market.startsAt || new Date()).getTime();
        const bettingStartTime = startsAt - (5 * 60 * 60 * 1000);
        isBettingActive = now >= bettingStartTime;
      }
    }
    
    return { isBettingActive, isEnded };
  };

  const getUserProfitLoss = (marketId: string) => {
    if (!predictionHistory) return null;
    const prediction = predictionHistory.find((p: any) => p.marketId === marketId);
    if (!prediction) return null;
    if (prediction.status === 'WON') {
      return { amount: (prediction.reward || 0) - prediction.stake, isProfit: true };
    } else if (prediction.status === 'LOST') {
      return { amount: -prediction.stake, isProfit: false };
    }
    return null;
  };

  return (
    <div className="max-w-5xl pb-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold mb-1">Prediction Markets</h1>
          <p className="text-sm text-muted-foreground">Browse all live matches and community markets.</p>
        </div>
        {isAuthenticated && (
          <Link 
            href="/markets/create" 
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-semibold text-sm transition-colors"
          >
            Create Market
          </Link>
        )}
      </div>

      {/* Search Bar */}
      <div className="relative mb-6 max-w-md">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-muted-foreground" />
        </div>
        <input
          type="text"
          className="block w-full pl-10 pr-3 py-2 border border-border rounded-md leading-5 bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
          placeholder="Search matches or markets..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-16 rounded-lg bg-secondary animate-pulse"></div>
          ))}
        </div>
      ) : (
        <div className="border border-border rounded-lg overflow-hidden divide-y divide-border">
          {markets?.filter(m => m.category !== 'CUSTOM' && m.title.toLowerCase().includes(searchQuery.toLowerCase())).map((market) => {
            const { isBettingActive, isEnded } = getMarketState(market);
            const pl = isEnded ? getUserProfitLoss(market.id) : null;

            return (
              <Link key={market.id} href={`/markets/${market.id}`} className="block hover:bg-neutral-50 transition-colors">
                <div className="flex items-center gap-4 px-4 py-3">
                  {/* Team logos */}
                  <div className="flex items-center -space-x-2 shrink-0">
                    {market.homeTeamLogo ? (
                      <img src={market.homeTeamLogo} alt="" className="w-8 h-8 object-contain rounded-sm bg-white border border-border" />
                    ) : <div className="w-8 h-8 rounded-sm bg-secondary"></div>}
                    {market.awayTeamLogo ? (
                      <img src={market.awayTeamLogo} alt="" className="w-8 h-8 object-contain rounded-sm bg-white border border-border" />
                    ) : <div className="w-8 h-8 rounded-sm bg-secondary"></div>}
                  </div>

                  {/* Title & meta */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{market.title}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      {!isEnded && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDistanceToNow(new Date(market.startsAt || new Date()), { addSuffix: true })}
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">${market.totalPool.toLocaleString()} Vol</span>
                      <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                        <Users className="w-3 h-3" />
                        {market.participantCount}
                      </span>
                    </div>
                  </div>

                  {/* P/L */}
                  {pl && (
                    <span className={`text-xs font-semibold shrink-0 ${pl.isProfit ? 'text-green-600' : 'text-red-500'}`}>
                      {pl.isProfit ? '+' : ''}{pl.amount}
                    </span>
                  )}

                  {/* Status */}
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded shrink-0 ${
                    isEnded 
                      ? 'bg-neutral-100 text-muted-foreground' 
                      : isBettingActive 
                        ? 'bg-green-50 text-green-700' 
                        : 'bg-blue-50 text-blue-600'
                  }`}>
                    {isEnded ? 'Ended' : isBettingActive ? 'Open' : 'Upcoming'}
                  </span>

                  {/* Odds */}
                  <div className="hidden md:flex items-center gap-1.5 shrink-0">
                    {market.outcomes?.slice(0, 3).map((outcome) => {
                      const prob = Math.round(Number(outcome.probability) * 100);
                      return (
                        <span key={outcome.id} className="text-xs font-semibold text-muted-foreground bg-secondary px-2 py-1 rounded">
                          {outcome.name.length > 8 ? outcome.name.substring(0, 8) + '…' : outcome.name} {prob}¢
                        </span>
                      );
                    })}
                  </div>
                </div>
              </Link>
            );
          })}
          
          {markets?.length === 0 && (
            <div className="py-16 text-center text-muted-foreground text-sm">
              No World Cup matches scheduled currently. Check back soon.
            </div>
          )}
        </div>
      )}

      {/* ── Custom Anti Satta Markets ── */}
      <div className="mt-12 mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold mb-1">Custom Anti Satta Markets</h2>
          <p className="text-sm text-muted-foreground">Community created prediction markets.</p>
        </div>
      </div>

      {isLoadingCustom ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-lg bg-secondary animate-pulse"></div>
          ))}
        </div>
      ) : customMarkets && customMarkets.length > 0 ? (
        <div className="border border-border rounded-lg overflow-hidden divide-y divide-border">
          {customMarkets.filter(m => m.title.toLowerCase().includes(searchQuery.toLowerCase())).map((market) => {
            const { isBettingActive, isEnded } = getMarketState(market);
            const pl = isEnded ? getUserProfitLoss(market.id) : null;

            return (
              <Link key={market.id} href={`/markets/${market.id}`} className="block hover:bg-neutral-50 transition-colors">
                <div className="flex items-center gap-4 px-4 py-3">
                  {/* Avatar/Icon for custom markets */}
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
                    <Users className="w-4 h-4 text-muted-foreground" />
                  </div>

                  {/* Title & meta */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{market.title}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      {!isEnded && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDistanceToNow(new Date(market.endsAt || new Date()), { addSuffix: true })}
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">${market.totalPool.toLocaleString()} Vol</span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {market.participantCount}
                      </span>
                    </div>
                  </div>

                  {/* P/L */}
                  {pl && (
                    <span className={`text-xs font-semibold shrink-0 ${pl.isProfit ? 'text-green-600' : 'text-red-500'}`}>
                      {pl.isProfit ? '+' : ''}{pl.amount}
                    </span>
                  )}

                  {/* Status */}
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded shrink-0 ${
                    isEnded 
                      ? 'bg-neutral-100 text-muted-foreground' 
                      : isBettingActive 
                        ? 'bg-green-50 text-green-700' 
                        : 'bg-blue-50 text-blue-600'
                  }`}>
                    {isEnded ? 'Ended' : isBettingActive ? 'Open' : 'Upcoming'}
                  </span>

                  {/* Odds */}
                  <div className="hidden md:flex items-center gap-1.5 shrink-0">
                    {market.outcomes?.slice(0, 3).map((outcome) => {
                      const prob = Math.round(Number(outcome.probability) * 100);
                      return (
                        <span key={outcome.id} className="text-xs font-semibold text-muted-foreground bg-secondary px-2 py-1 rounded">
                          {outcome.name.length > 8 ? outcome.name.substring(0, 8) + '…' : outcome.name} {prob}¢
                        </span>
                      );
                    })}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="border border-dashed border-border rounded-lg py-16 text-center text-muted-foreground text-sm">
          No custom markets created yet. Be the first to create one!
        </div>
      )}
    </div>
  );
}

'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import type { Market } from '@/types/market';
import Link from 'next/link';
import { Clock, TrendingUp, TrendingDown, Users, CheckCircle } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { useAuthStore } from '@/stores/auth-store';

interface ResolvedMarket extends Market {
  winningOutcomeName: string | null;
  stats: {
    totalBets: number;
    totalWinners: number;
    totalLosers: number;
    totalStaked: number;
    totalPaidOut: number;
  };
}

import type { LeaderboardEntry } from '@/types/leaderboard';


export default function Dashboard() {
  const { isAuthenticated } = useAuthStore();

  const { data: trendingMarkets, isLoading } = useQuery({
    queryKey: ['markets', 'trending'],
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: Market[] }>('/markets/trending');
      return data.data;
    },
  });

  const { data: resolvedMarkets, isLoading: isLoadingResolved } = useQuery({
    queryKey: ['markets', 'resolved'],
    queryFn: async () => {
      const { data } = await apiClient.get('/markets/resolved');
      return data.data as ResolvedMarket[];
    },
  });

  const { data: customMarkets, isLoading: isLoadingCustom } = useQuery({
    queryKey: ['markets', 'community'],
    queryFn: async () => {
      const { data } = await apiClient.get('/markets/community');
      return data.data.data as Market[]; // Returns { data: Market[], meta: ... }
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

  const { data: leaderboard } = useQuery({
    queryKey: ['leaderboard', 'top'],
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: LeaderboardEntry[] }>('/leaderboard/all-time');
      return data.data.slice(0, 5);
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

  const getRankIcon = (rank: number) => {
    return <span className="font-bold text-muted-foreground text-sm">#{rank}</span>;
  };

  return (
    <div className="flex gap-8 max-w-[1400px] mx-auto pb-8">
      {/* Main Content Column */}
      <div className="flex-1 space-y-8 min-w-0 max-w-5xl">
        {/* ── World Cup Markets ── */}
        <section>
          <h2 className="text-lg font-bold mb-4">World Cup Markets</h2>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 rounded-lg bg-secondary animate-pulse"></div>
              ))}
            </div>
          ) : (
            <div className="border border-border rounded-lg overflow-hidden divide-y divide-border">
              {trendingMarkets?.filter(m => m.category !== 'CUSTOM').slice(0, 10).map((market) => {
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
                        </div>
                      </div>

                      {/* Status badge */}
                      <div className="shrink-0 flex items-center gap-3">
                        {pl && (
                          <span className={`text-xs font-semibold ${pl.isProfit ? 'text-green-600' : 'text-red-500'}`}>
                            {pl.isProfit ? '+' : ''}{pl.amount}
                          </span>
                        )}
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                          isEnded 
                            ? 'bg-neutral-100 text-muted-foreground' 
                            : isBettingActive 
                              ? 'bg-green-50 text-green-700' 
                              : 'bg-blue-50 text-blue-600'
                        }`}>
                          {isEnded ? 'Ended' : isBettingActive ? 'Open' : 'Upcoming'}
                        </span>
                      </div>

                      {/* Odds preview */}
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

              {trendingMarkets?.length === 0 && (
                <div className="py-12 text-center text-muted-foreground text-sm">
                  No World Cup markets available at the moment.
                </div>
              )}
            </div>
          )}
        </section>

        {/* ── Custom Anti Satta Markets ── */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">Custom Anti Satta Markets</h2>
            <Link href="/markets/create" className="text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 px-2 py-1 rounded">
              + Create Market
            </Link>
          </div>

          {isLoadingCustom ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-20 rounded-lg bg-secondary animate-pulse"></div>
              ))}
            </div>
          ) : customMarkets && customMarkets.length > 0 ? (
            <div className="border border-border rounded-lg overflow-hidden divide-y divide-border">
              {customMarkets.map((market) => {
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

                      {/* Status badge */}
                      <div className="shrink-0 flex items-center gap-3">
                        {pl && (
                          <span className={`text-xs font-semibold ${pl.isProfit ? 'text-green-600' : 'text-red-500'}`}>
                            {pl.isProfit ? '+' : ''}{pl.amount}
                          </span>
                        )}
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                          isEnded 
                            ? 'bg-neutral-100 text-muted-foreground' 
                            : isBettingActive 
                              ? 'bg-green-50 text-green-700' 
                              : 'bg-blue-50 text-blue-600'
                        }`}>
                          {isEnded ? 'Ended' : isBettingActive ? 'Open' : 'Upcoming'}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="border border-dashed border-border rounded-lg py-12 text-center text-muted-foreground text-sm">
              No custom markets created yet. Be the first to create one!
            </div>
          )}
        </section>

        {/* ── Previous Matches ── */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">Previous Matches</h2>
            <span className="text-xs font-medium text-muted-foreground">Concluded</span>
          </div>

          {isLoadingResolved ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 rounded-lg bg-secondary animate-pulse"></div>
              ))}
            </div>
          ) : resolvedMarkets && resolvedMarkets.length > 0 ? (
            <div className="border border-border rounded-lg overflow-hidden divide-y divide-border">
              {resolvedMarkets.map((market) => {
                const pl = getUserProfitLoss(market.id);

                return (
                  <Link key={market.id} href={`/markets/${market.id}`} className="block hover:bg-neutral-50 transition-colors">
                    <div className="px-4 py-3">
                      {/* Row 1: Teams, score, date */}
                      <div className="flex items-center gap-4">
                        {/* Home team */}
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {market.homeTeamLogo ? (
                            <img src={market.homeTeamLogo} alt="" className="w-7 h-7 object-contain rounded-sm shrink-0" />
                          ) : <div className="w-7 h-7 rounded-sm bg-secondary shrink-0"></div>}
                          <span className="text-sm font-semibold truncate">{market.homeTeam}</span>
                        </div>

                        {/* Score */}
                        <div className="shrink-0 text-center">
                          {market.matchScore ? (
                            <span className="text-base font-bold tracking-wide">{market.matchScore}</span>
                          ) : (
                            <span className="text-xs font-medium text-muted-foreground">FT</span>
                          )}
                        </div>

                        {/* Away team */}
                        <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                          <span className="text-sm font-semibold truncate text-right">{market.awayTeam}</span>
                          {market.awayTeamLogo ? (
                            <img src={market.awayTeamLogo} alt="" className="w-7 h-7 object-contain rounded-sm shrink-0" />
                          ) : <div className="w-7 h-7 rounded-sm bg-secondary shrink-0"></div>}
                        </div>

                        {/* P/L & Date */}
                        <div className="hidden md:flex items-center gap-3 shrink-0 ml-2">
                          {pl && (
                            <span className={`text-xs font-semibold flex items-center gap-0.5 ${pl.isProfit ? 'text-green-600' : 'text-red-500'}`}>
                              {pl.isProfit ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                              {pl.isProfit ? '+' : ''}{pl.amount}
                            </span>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {market.resolvedAt ? format(new Date(market.resolvedAt), 'MMM d') : ''}
                          </span>
                        </div>
                      </div>

                      {/* Row 2: Winner + Odds */}
                      <div className="flex items-center gap-3 mt-2">
                        {market.winningOutcomeName && (
                          <span className="flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded">
                            <CheckCircle className="w-3 h-3" />
                            {market.winningOutcomeName}
                          </span>
                        )}

                        <div className="flex items-center gap-1.5 ml-auto">
                          {market.outcomes.map((outcome) => {
                            const prob = Math.round(Number(outcome.probability) * 100);
                            return (
                              <span
                                key={outcome.id}
                                className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                                  outcome.isWinner
                                    ? 'bg-green-50 text-green-700'
                                    : 'bg-neutral-100 text-muted-foreground'
                                }`}
                              >
                                {outcome.name.length > 10 ? outcome.name.substring(0, 10) + '…' : outcome.name} {prob}¢
                              </span>
                            );
                          })}
                        </div>

                        {/* Stats */}
                        <div className="hidden lg:flex items-center gap-2 text-[11px] text-muted-foreground ml-2 shrink-0">
                          <span>{market.stats.totalBets} bets</span>
                          <span>·</span>
                          <span className="text-green-600">{market.stats.totalWinners}W</span>
                          <span className="text-red-500">{market.stats.totalLosers}L</span>
                          <span>·</span>
                          <span>${market.stats.totalStaked.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="border border-dashed border-border rounded-lg py-12 text-center text-muted-foreground text-sm">
              No concluded matches yet. Resolved matches will appear here.
            </div>
          )}
        </section>
      </div>

      {/* Right Sidebar: Top Users */}
      <div className="w-80 shrink-0 hidden lg:block">
        <div className="sticky top-20 border border-border rounded-lg overflow-hidden">
          <div className="bg-neutral-50 px-4 py-3 border-b border-border flex items-center justify-between">
            <h2 className="text-sm font-bold text-foreground">Top Predictors</h2>
            <Link href="/leaderboard" className="text-[11px] font-semibold text-blue-600 hover:text-blue-700">
              View All
            </Link>
          </div>
          <div className="divide-y divide-border">
            {leaderboard?.map((user: any) => (
              <div key={user.userId || user.id} className="flex items-center gap-3 px-4 py-3 hover:bg-neutral-50 transition-colors">
                <div className="w-6 flex justify-center shrink-0">
                  {getRankIcon(user.rank)}
                </div>
                <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center font-bold text-xs shrink-0">
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate text-foreground">{user.username}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-foreground">{user.balance.toLocaleString()}</p>
                  <p className={`text-[10px] font-semibold ${user.roi >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {user.roi >= 0 ? '+' : ''}{user.roi}% ROI
                  </p>
                </div>
              </div>
            ))}
            {!leaderboard?.length && (
              <div className="px-4 py-8 text-center text-xs text-muted-foreground">
                No predictors yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

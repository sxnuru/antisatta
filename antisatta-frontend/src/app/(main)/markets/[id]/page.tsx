'use client';

import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { useAuthStore } from '@/stores/auth-store';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, ReferenceLine } from 'recharts';
import { AlertCircle, Radio } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { useParams } from 'next/navigation';
import { io, Socket } from 'socket.io-client';

const generateMockHistory = (currentProbs: any[]) => {
  const data = [];
  const hours = ['8:00 AM', '12:00 PM', '4:00 PM', '8:00 PM', '12:00 AM', 'Now'];
  
  for (let i = 0; i < hours.length; i++) {
    const point: any = { time: hours[i] };
    currentProbs.forEach((outcome) => {
      const variance = (hours.length - 1 - i) * (Math.random() * 0.05 - 0.025);
      let prob = Number(outcome.probability) + variance;
      if (prob < 0) prob = 0.01;
      if (prob > 1) prob = 0.99;
      point[outcome.name] = i === hours.length - 1 ? Number(outcome.probability) : prob;
    });
    data.push(point);
  }
  return data;
};

const CHART_COLORS = ['#16a34a', '#9ca3af', '#2563eb'];

export default function MarketDetailsPage() {
  const params = useParams();
  const queryClient = useQueryClient();
  const { isAuthenticated, updateBalance, user } = useAuthStore();
  const [selectedOutcomeId, setSelectedOutcomeId] = useState<string | null>(null);
  const [stake, setStake] = useState<number | ''>('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [liveSocket, setLiveSocket] = useState<Socket | null>(null);
  const [liveData, setLiveData] = useState<{ matchScore?: string, matchStatus?: string } | null>(null);

  const { data: market, isLoading } = useQuery({
    queryKey: ['market', params.id],
    queryFn: async () => {
      const { data } = await apiClient.get(`/markets/${params.id}`);
      return data.data;
    },
    refetchInterval: 10000,
  });

  // Setup Socket.IO for Real-time Live Updates
  useEffect(() => {
    const socket = io('http://localhost:4000', {
      transports: ['websocket'],
    });

    socket.on('connect', () => {
      console.log('Connected to real-time sync');
      socket.emit('market:join', { marketId: params.id });
    });

    socket.on('market:update', (data) => {
      setLiveData({ matchScore: data.matchScore, matchStatus: data.matchStatus });
      queryClient.invalidateQueries({ queryKey: ['market', params.id] });
    });

    setLiveSocket(socket);

    return () => {
      socket.emit('market:leave', { marketId: params.id });
      socket.disconnect();
    };
  }, [params.id, queryClient]);

  const predictMutation = useMutation({
    mutationFn: async (payload: { marketId: string; outcomeId: string; stake: number }) => {
      const { data } = await apiClient.post('/predictions', payload);
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['market', params.id] });
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
      setSuccess(true);
      setError('');
      if (user) {
        updateBalance(user.balance - variables.stake);
      }
      setTimeout(() => setSuccess(false), 3000);
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Failed to place prediction');
      setSuccess(false);
    }
  });

  const handlePredict = () => {
    if (!selectedOutcomeId || !stake || Number(stake) <= 0) return;
    setError('');
    predictMutation.mutate({
      marketId: params.id as string,
      outcomeId: selectedOutcomeId,
      stake: Number(stake),
    });
  };

  const isBettingActive = useMemo(() => {
    if (!market || !market.endsAt) return false;
    if (market.status === 'RESOLVED' || market.status === 'CANCELLED') return false;
    
    const now = new Date().getTime();
    const endsAt = new Date(market.endsAt).getTime();
    
    // For custom markets, they are open immediately until endsAt
    if (market.category === 'CUSTOM') {
      return now < endsAt;
    }
    
    // For other markets (e.g. World Cup), respect startsAt and betting window
    if (!market.startsAt) return false;
    const startsAt = new Date(market.startsAt).getTime();
    const bettingStartTime = startsAt - (5 * 60 * 60 * 1000);
    return now >= bettingStartTime && now < endsAt;
  }, [market]);

  const mockChartData = useMemo(() => {
    if (!market?.outcomes) return [];
    return generateMockHistory(market.outcomes);
  }, [market]);

  const resolveMutation = useMutation({
    mutationFn: async (winningOutcomeId: string) => {
      return apiClient.post(`/markets/${params.id}/resolve`, { winningOutcomeId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['market', params.id] });
      queryClient.invalidateQueries({ queryKey: ['user-session'] });
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Failed to resolve market');
    }
  });

  const [confirmResolve, setConfirmResolve] = useState<string | null>(null);

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading market...</div>;

  if (!market) {
    return <div className="text-center py-20 text-muted-foreground">Market not found</div>;
  }

  const currentScore = liveData?.matchScore || market.matchScore;
  const currentStatus = liveData?.matchStatus || market.matchStatus;
  const isLive = currentStatus === 'IN_PLAY';

  return (
    <div className="max-w-5xl mx-auto pb-12">
      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Left Column */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium mb-2">
            <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
            <span>›</span>
            <span>{market.category.replace(/_/g, ' ')}</span>
            {isLive && (
              <span className="flex items-center gap-1 text-red-500 bg-red-50 px-1.5 py-0.5 rounded text-[11px] ml-1 font-semibold">
                <Radio className="w-3 h-3" /> LIVE
              </span>
            )}
          </div>
          
          <h1 className="text-xl font-bold tracking-tight mb-6">{market.title}</h1>
          
          {/* Teams & Score */}
          <div className="flex items-center justify-center gap-8 mb-6 py-4 border border-border rounded-lg">
            <div className="flex flex-col items-center gap-2">
              {market.homeTeamLogo ? (
                <img src={market.homeTeamLogo} alt={market.homeTeam || 'Home'} className="w-10 h-7 rounded-sm object-cover" />
              ) : <div className="w-10 h-7 rounded-sm bg-secondary"></div>}
              <span className="font-semibold text-xs">{market.homeTeam}</span>
            </div>
            
            <div className="flex flex-col items-center text-center">
              {currentScore ? (
                <span className="text-xl font-bold">{currentScore}</span>
              ) : null}
              <span className="text-xs font-medium text-muted-foreground">{format(new Date(market.startsAt || new Date()), 'h:mm a')}</span>
              <span className="text-[11px] text-muted-foreground">{format(new Date(market.startsAt || new Date()), 'MMM d')}</span>
              {isLive && <span className="text-[11px] text-red-500 font-semibold mt-0.5">{currentStatus}</span>}
            </div>
            
            <div className="flex flex-col items-center gap-2">
              {market.awayTeamLogo ? (
                <img src={market.awayTeamLogo} alt={market.awayTeam || 'Away'} className="w-10 h-7 rounded-sm object-cover" />
              ) : <div className="w-10 h-7 rounded-sm bg-secondary"></div>}
              <span className="font-semibold text-xs">{market.awayTeam}</span>
            </div>
          </div>

          {/* Chart */}
          <div className="h-[350px] w-full border border-border rounded-lg p-4">
            <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
              <LineChart data={mockChartData} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }} dy={10} />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tickFormatter={(val) => `${Math.round(val * 100)}%`}
                  tick={{ fontSize: 11, fill: '#9ca3af' }} 
                  domain={[0, 1]} 
                  orientation="right"
                  dx={5}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderColor: '#e5e5e5', borderRadius: '8px', padding: '8px 12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', fontSize: '12px' }}
                  itemStyle={{ color: '#1a1a1a', fontWeight: 600, fontSize: '12px' }}
                  formatter={(value: any) => [`${Math.round(Number(value) * 100)}%`, undefined]}
                />
                <ReferenceLine y={0.5} stroke="#e5e5e5" strokeDasharray="4 4" />
                
                {market.outcomes?.map((outcome: any, idx: number) => (
                  <Line 
                    key={outcome.id} 
                    type="monotone" 
                    dataKey={outcome.name} 
                    stroke={CHART_COLORS[idx % CHART_COLORS.length]} 
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, strokeWidth: 0 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Creator Resolve Panel */}
          {user && market.creator && user.id === market.creator.id && market.status !== 'RESOLVED' && market.status !== 'CANCELLED' && (
            <div className="mt-8 border border-border rounded-lg p-5 bg-neutral-50/50">
              <h3 className="font-bold text-lg mb-2">Creator Tools: Resolve Market</h3>
              <p className="text-sm text-muted-foreground mb-4">
                As the creator, you must resolve this market by selecting the correct winning outcome. Once resolved, the total pool will be distributed to the winners, and the market will be closed.
              </p>
              
              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4 text-sm font-semibold border border-red-100 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}
              {success && (
                <div className="bg-green-50 text-green-700 p-3 rounded-md mb-4 text-sm font-semibold border border-green-100 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Market successfully resolved!
                </div>
              )}

              <div className="flex flex-wrap gap-3">
                {market.outcomes?.map((outcome: any) => (
                  <div key={outcome.id} className="relative">
                    {confirmResolve === outcome.id ? (
                      <div className="flex gap-2 items-center bg-red-50 p-1.5 rounded-md border border-red-200">
                        <span className="text-sm font-semibold text-red-700 px-2">Confirm?</span>
                        <button
                          disabled={resolveMutation.isPending}
                          onClick={() => {
                            setError('');
                            resolveMutation.mutate(outcome.id);
                            setConfirmResolve(null);
                          }}
                          className="bg-red-600 text-white hover:bg-red-700 px-3 py-1.5 rounded text-sm font-bold transition-colors disabled:opacity-50"
                        >
                          Yes, Resolve
                        </button>
                        <button
                          onClick={() => setConfirmResolve(null)}
                          className="text-muted-foreground hover:text-foreground px-2 py-1.5 text-sm font-medium"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmResolve(outcome.id)}
                        className="bg-white border border-border hover:border-blue-500 hover:text-blue-600 px-4 py-2 rounded-md font-medium text-sm transition-colors"
                      >
                        Declare "{outcome.name}" Winner
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Betting Panel */}
        <div className="w-full lg:w-[340px] shrink-0">
          <div className="border border-border rounded-lg p-5 sticky top-20">
            
            <div className="flex items-center gap-2 mb-4">
              {market.homeTeamLogo ? (
                <img src={market.homeTeamLogo} className="w-6 h-5 rounded-sm object-cover" />
              ) : <div className="w-6 h-5 rounded-sm bg-secondary"></div>}
              <div className="flex flex-col min-w-0">
                <span className="text-[11px] text-muted-foreground truncate">{market.title}</span>
                <span className="font-semibold text-xs text-foreground">
                  {selectedOutcomeId 
                    ? market.outcomes?.find((o: any) => o.id === selectedOutcomeId)?.name 
                    : market.homeTeam}
                </span>
              </div>
            </div>

            <div className="flex items-center border-b border-border pb-2 mb-4">
              <button className="font-semibold text-sm border-b-2 border-foreground pb-2 -mb-[9px]">Buy</button>
              <span className="text-[11px] text-muted-foreground ml-auto">Market</span>
            </div>

            {/* Outcome buttons */}
            <div className="flex flex-col gap-2 mb-6">
              {market.outcomes?.map((outcome: any) => {
                const isSelected = selectedOutcomeId === outcome.id;
                const probPercent = Math.round(Number(outcome.probability) * 100);

                return (
                  <button
                    key={outcome.id}
                    onClick={() => setSelectedOutcomeId(outcome.id)}
                    className={`flex justify-between items-center py-2.5 px-3 rounded-lg text-sm font-semibold transition-colors border ${
                      isSelected 
                        ? 'bg-green-50 border-green-200 text-green-800' 
                        : 'bg-secondary border-transparent text-foreground hover:bg-neutral-200'
                    }`}
                  >
                    <span>{outcome.name}</span>
                    <span>{probPercent}¢</span>
                  </button>
                );
              })}
            </div>

            {/* Amount input */}
            <div className="mb-5">
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-semibold text-muted-foreground">Amount</span>
                <div className="text-2xl font-bold flex items-center">
                  <span className="text-muted-foreground mr-0.5 text-lg">$</span>
                  <input
                    type="number"
                    value={stake}
                    onChange={(e) => {
                      let val = e.target.value ? Number(e.target.value) : '';
                      if (typeof val === 'number' && val > 1000) val = 1000;
                      setStake(val as number | '');
                    }}
                    placeholder="0"
                    className="w-20 bg-transparent text-right outline-none p-0 m-0 focus:ring-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    style={{ WebkitAppearance: 'none', MozAppearance: 'textfield' } as any}
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-1.5">
                {[1, 5, 10, 100].map(amt => (
                  <button 
                    key={amt}
                    onClick={() => setStake(prev => {
                      const next = (Number(prev) || 0) + amt;
                      return next > 1000 ? 1000 : next;
                    })}
                    className="bg-secondary hover:bg-neutral-200 text-foreground text-[11px] font-semibold px-3 py-1.5 rounded-full transition-colors"
                  >
                    +${amt}
                  </button>
                ))}
              </div>
            </div>

            {/* Potential Return Display */}
            {selectedOutcomeId && stake && Number(stake) > 0 ? (() => {
              const selectedOutcome = market.outcomes?.find((o: any) => o.id === selectedOutcomeId);
              if (!selectedOutcome) return null;
              
              const stakeAmt = Number(stake);
              const newTotalPool = Number(market.totalPool) + stakeAmt;
              const newOutcomePool = Number(selectedOutcome.poolTokens) + stakeAmt;
              const potentialReturn = Math.floor((stakeAmt / newOutcomePool) * newTotalPool);
              const potentialProfit = potentialReturn - stakeAmt;

              return (
                <div className="bg-neutral-50 rounded-lg p-3 mb-4 border border-border">
                  <div className="flex justify-between items-center text-xs mb-1">
                    <span className="text-muted-foreground">Potential Return</span>
                    <span className="font-bold text-green-600">${potentialReturn.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-muted-foreground">Est. Profit</span>
                    <span className="font-semibold text-green-600">+${potentialProfit.toLocaleString()}</span>
                  </div>
                </div>
              );
            })() : null}

            {!isBettingActive ? (
              <div className="p-2.5 bg-red-50 text-red-600 text-xs font-medium rounded-lg flex items-center gap-1.5 mb-3">
                <AlertCircle className="w-3.5 h-3.5" /> Market closed
              </div>
            ) : !isAuthenticated ? (
               <div className="text-center text-xs text-muted-foreground mb-3">Log in to place a trade.</div>
            ) : null}

            <button
              onClick={handlePredict}
              disabled={!selectedOutcomeId || !stake || Number(stake) <= 0 || Number(stake) > 1000 || Number(stake) > (user?.balance || 0) || !isBettingActive || !isAuthenticated || predictMutation.isPending}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-40 disabled:hover:bg-blue-500 text-sm"
            >
              {predictMutation.isPending ? 'Processing...' : 'Trade'}
            </button>
            
            {error && <p className="text-destructive font-semibold text-center mt-3 text-xs">{error}</p>}
            {success && <p className="text-green-600 font-semibold text-center mt-3 text-xs">Trade Successful!</p>}
            
            <p className="text-[10px] text-muted-foreground text-center mt-4">
              By trading, you agree to the <span className="underline cursor-pointer hover:text-foreground transition-colors">Terms of Use</span>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

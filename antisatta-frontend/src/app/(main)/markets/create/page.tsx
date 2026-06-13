'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { Plus, Trash2, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useAuthStore } from '@/stores/auth-store';

export default function CreateMarketPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuthStore();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [outcomes, setOutcomes] = useState([{ name: '' }, { name: '' }]);
  const [resolutionSource, setResolutionSource] = useState('');
  const [error, setError] = useState('');

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiClient.post('/markets', data);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['markets'] });
      // Redirect to the newly created market
      router.push(`/markets/${data.id || ''}`);
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Failed to create market');
    },
  });

  if (!isAuthenticated) {
    return (
      <div className="max-w-2xl pb-8 text-center pt-20">
        <h1 className="text-2xl font-bold mb-4">Sign in to Create a Market</h1>
        <p className="text-muted-foreground mb-6">You must be logged in to create your own custom markets.</p>
        <Link href="/auth/login" className="bg-blue-600 text-white px-6 py-2 rounded-md font-semibold">
          Sign In
        </Link>
      </div>
    );
  }

  const handleAddOutcome = () => {
    if (outcomes.length >= 10) return;
    setOutcomes([...outcomes, { name: '' }]);
  };

  const handleRemoveOutcome = (index: number) => {
    if (outcomes.length <= 2) return;
    setOutcomes(outcomes.filter((_, i) => i !== index));
  };

  const handleOutcomeChange = (index: number, value: string) => {
    const newOutcomes = [...outcomes];
    newOutcomes[index].name = value;
    setOutcomes(newOutcomes);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (title.length < 5) return setError('Title must be at least 5 characters');
    if (description.length < 10) return setError('Description must be at least 10 characters');
    
    let parsedEndsAt: string | undefined = undefined;
    if (endsAt) {
      const endDate = new Date(endsAt);
      if (endDate <= new Date()) {
        return setError('End date must be in the future');
      }
      parsedEndsAt = endDate.toISOString();
    }

    const validOutcomes = outcomes.filter(o => o.name.trim().length > 0);
    if (validOutcomes.length < 2) return setError('At least 2 valid outcomes are required');

    createMutation.mutate({
      title,
      description,
      category: 'CUSTOM', // Hardcoded for user-created markets
      endsAt: parsedEndsAt,
      resolutionSource: resolutionSource || undefined,
      outcomes: validOutcomes,
    });
  };

  return (
    <div className="max-w-2xl pb-16">
      <div className="mb-6">
        <Link href="/markets" className="text-sm text-blue-600 hover:underline flex items-center gap-1 mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Markets
        </Link>
        <h1 className="text-2xl font-bold mb-1">Create Custom Market</h1>
        <p className="text-sm text-muted-foreground">Create your own betting market and let the community predict.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 bg-white border border-border rounded-lg p-6">
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm font-medium border border-red-100">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold mb-1.5">Market Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Will GPT-5 be released in 2026?"
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              maxLength={255}
            />
            <p className="text-[11px] text-muted-foreground mt-1">Make it a clear, answerable question.</p>
          </div>

          <div>
            <label className="block text-sm font-bold mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide clear rules for resolution..."
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm min-h-[100px] resize-y"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold mb-1.5">Ends At</label>
              <input
                type="datetime-local"
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
              <p className="text-[11px] text-muted-foreground mt-1">When does trading stop?</p>
            </div>

            <div>
              <label className="block text-sm font-bold mb-1.5">Resolution Source (Optional)</label>
              <input
                type="text"
                value={resolutionSource}
                onChange={(e) => setResolutionSource(e.target.value)}
                placeholder="e.g. Official OpenAI blog"
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-border">
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-bold">Outcomes</label>
            {outcomes.length < 10 && (
              <button
                type="button"
                onClick={handleAddOutcome}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 bg-blue-50 px-2 py-1 rounded"
              >
                <Plus className="w-3 h-3" /> Add Option
              </button>
            )}
          </div>
          
          <div className="space-y-3">
            {outcomes.map((outcome, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  value={outcome.name}
                  onChange={(e) => handleOutcomeChange(index, e.target.value)}
                  placeholder={`Outcome ${index + 1} (e.g. Yes, No, Maybe)`}
                  className="flex-1 px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
                {outcomes.length > 2 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveOutcome(index)}
                    className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t border-border">
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {createMutation.isPending ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Creating Market...
              </>
            ) : (
              'Create Custom Market'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

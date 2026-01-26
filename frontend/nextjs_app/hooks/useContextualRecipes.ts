import { useState, useEffect } from 'react';
import { useUser } from '@/hooks/useUser';

export function useContextualRecipes(contextType: string, contextId: string, trackCode: string) {
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useUser();

  const fetchRecommendations = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/recipes/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          context_type: contextType,
          context_id: contextId,
          track_code: trackCode,
          user_id: user.id
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch recommendations: ${response.status}`);
      }

      const { recommendations: data, message } = await response.json();
      setRecommendations(data || []);
    } catch (err) {
      console.error('Failed to fetch contextual recommendations:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setRecommendations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (contextId && trackCode && user) {
      fetchRecommendations();
    }
  }, [contextId, trackCode, user?.id]);

  return {
    recommendations,
    loading,
    error,
    refetch: fetchRecommendations
  };
}

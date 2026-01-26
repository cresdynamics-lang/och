/**
 * Recommendations Page - CSR Example
 * Fetches AI recommendations client-side using FastAPI
 */

'use client';

import { useState, useEffect } from 'react';
import { fastapiClient } from '@/services/fastapiClient';
import { useAuth } from '@/hooks/useAuth';
import type { RecommendationResponse } from '@/services/types';

export default function RecommendationsPage() {
  const { user, isAuthenticated } = useAuth();
  const [recommendations, setRecommendations] = useState<RecommendationResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const loadRecommendations = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const data = await fastapiClient.recommendations.getRecommendations({
          user_id: user.id,
          limit: 10,
        });
        setRecommendations(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load recommendations');
      } finally {
        setIsLoading(false);
      }
    };

    loadRecommendations();
  }, [isAuthenticated, user]);

  if (!isAuthenticated) {
    return <div>Please log in to view recommendations</div>;
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Personalized Recommendations</h1>
      
      {recommendations && recommendations.recommendations.length > 0 ? (
        <div className="space-y-4">
          {recommendations.recommendations.map((item, index) => (
            <div
              key={`${item.content_id}-${index}`}
              className="border rounded-lg p-4 hover:shadow-lg transition-shadow"
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-xl font-semibold">{item.title}</h3>
                <span className="text-sm text-gray-500">
                  {(item.score * 100).toFixed(0)}% match
                </span>
              </div>
              {item.description && (
                <p className="text-gray-600 mb-2">{item.description}</p>
              )}
              {item.reason && (
                <p className="text-sm text-blue-600">{item.reason}</p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">
          No recommendations available at this time.
        </div>
      )}
    </div>
  );
}


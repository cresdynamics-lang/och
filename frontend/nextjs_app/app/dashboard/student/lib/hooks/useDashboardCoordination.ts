'use client';

import { useState, useEffect, useCallback } from 'react';
import { useDashboardStore } from '../store/dashboardStore';

export function useDashboardCoordination() {
  const { setLoading, setNextActions } = useDashboardStore();
  const [isLoading, setIsLoading] = useState(true);

  const loadDashboardData = useCallback(async () => {
    setIsLoading(true);
    setLoading(true);

    try {
      // Simulate loading dashboard data
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Set some mock next actions
      setNextActions([
        {
          id: '1',
          type: 'mission',
          title: 'Complete Security Assessment',
          urgency: 'high'
        },
        {
          id: '2', 
          type: 'coaching',
          title: 'Weekly Reflection',
          urgency: 'medium'
        }
      ]);

      setIsLoading(false);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      setIsLoading(false);
      setLoading(false);
    }
  }, [setLoading, setNextActions]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  return {
    isLoading,
    refresh: loadDashboardData
  };
}
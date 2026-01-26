'use client';

import { RouteGuard } from '@/components/auth/RouteGuard';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { RecipeGenerator } from '@/components/admin/RecipeGenerator';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useState, useEffect } from 'react';

interface Mission {
  id: string;
  title: string;
  track_code: string;
  instructions?: string;
}

interface EnvStatus {
  grok: boolean;
  llama: boolean;
  supabase: boolean;
}

export default function AdminRecipesPage() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [envStatus, setEnvStatus] = useState<EnvStatus>({
    grok: false,
    llama: false,
    supabase: false
  });

  useEffect(() => {
    const fetchMissions = async () => {
      try {
        const response = await fetch('/api/missions?limit=50');
        const data = await response.json();
        setMissions(data.results || data || []);
      } catch (error) {
        console.error('Failed to fetch missions:', error);
      } finally {
        setLoading(false);
      }
    };

    const fetchEnvStatus = async () => {
      try {
        const response = await fetch('/api/recipes/env-status');
        const data = await response.json();
        setEnvStatus(data);
      } catch (error) {
        console.error('Failed to fetch environment status:', error);
      }
    };

    fetchMissions();
    fetchEnvStatus();
  }, []);

  return (
    <RouteGuard>
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-4xl font-bold mb-2 text-och-defender">AI Recipe Engine</h1>
            <p className="text-och-steel">
              Generate contextual cybersecurity recipes using Grok 3 AI based on mission requirements
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <RecipeGenerator missions={missions} />
            </div>

            <div className="space-y-4">
              <Card>
                <div className="p-6 border-b border-slate-800/50">
                  <h3 className="text-lg font-semibold">AI Environment Status</h3>
                </div>
                <div className="p-6 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Grok 4 API</span>
                    <Badge variant={envStatus.grok ? "defender" : "outline"}>
                      {envStatus.grok ? "✅ Configured" : "❌ Missing"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Llama Fallback</span>
                    <Badge variant={envStatus.llama ? "defender" : "outline"}>
                      {envStatus.llama ? "✅ Configured" : "❌ Optional"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Supabase</span>
                    <Badge variant={envStatus.supabase ? "defender" : "outline"}>
                      {envStatus.supabase ? "✅ Connected" : "❌ Missing"}
                    </Badge>
                  </div>
                </div>
              </Card>

              <Card>
                <div className="p-6 border-b border-slate-800/50">
                  <h3 className="text-lg font-semibold">Quick Stats</h3>
                </div>
                <div className="p-6">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Total Recipes:</span>
                      <span className="font-semibold">11</span>
                    </div>
                    <div className="flex justify-between">
                      <span>AI Generated:</span>
                      <span className="font-semibold">0</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tracks Covered:</span>
                      <span className="font-semibold">15</span>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </AdminLayout>
    </RouteGuard>
  );
}


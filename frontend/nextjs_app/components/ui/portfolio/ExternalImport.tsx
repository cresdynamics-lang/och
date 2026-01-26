/**
 * External Import Component
 * GitHub and TryHackMe OAuth integration UI
 */

'use client';

import { useState } from 'react';
import { Github, Shield, Loader2, CheckCircle } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { connectGitHub, importGitHubRepositories, connectTryHackMe, importTryHackMeProfile } from '@/lib/portfolio/oauth';
import { usePortfolio } from '@/hooks/usePortfolio';
import { useAuth } from '@/hooks/useAuth';

export function ExternalImport() {
  const [isImporting, setIsImporting] = useState<'github' | 'thm' | null>(null);
  const [importedCount, setImportedCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const { user } = useAuth();
  const userId = user?.id?.toString();
  const { refetch } = usePortfolio(userId);

  const handleGitHubConnect = async () => {
    try {
      setError(null);
      await connectGitHub();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect GitHub');
    }
  };

  const handleTHMConnect = async () => {
    try {
      setError(null);
      await connectTryHackMe();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect TryHackMe');
    }
  };

  const handleGitHubImport = async (accessToken: string) => {
    if (!userId) return;

    setIsImporting('github');
    setError(null);

    try {
      const items = await importGitHubRepositories(userId, accessToken);
      setImportedCount(items.length);
      await refetch();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import GitHub repositories');
    } finally {
      setIsImporting(null);
    }
  };

  const handleTHMImport = async (accessToken: string) => {
    if (!userId) return;

    setIsImporting('thm');
    setError(null);

    try {
      const items = await importTryHackMeProfile(userId, accessToken);
      setImportedCount(items.length);
      await refetch();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import TryHackMe profile');
    } finally {
      setIsImporting(null);
    }
  };

  return (
    <Card className="border-indigo-500/50 bg-gradient-to-br from-indigo-500/5">
      <div className="p-6">
        <h3 className="text-lg font-semibold text-slate-100 mb-4">Import from External Platforms</h3>
        <p className="text-sm text-slate-400 mb-6">
          Connect your GitHub or TryHackMe accounts to automatically import portfolio items
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-sm text-red-400">
            {error}
          </div>
        )}

        {importedCount > 0 && (
          <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/50 rounded-lg text-sm text-emerald-400 flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Successfully imported {importedCount} item(s)
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* GitHub */}
          <div className="border border-slate-700 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-4">
              <Github className="w-6 h-6 text-slate-300" />
              <h4 className="font-semibold text-slate-100">GitHub</h4>
            </div>
            <p className="text-sm text-slate-400 mb-4">
              Import your public repositories as portfolio items
            </p>
            <Button
              variant="outline"
              onClick={handleGitHubConnect}
              disabled={isImporting !== null}
              className="w-full"
            >
              {isImporting === 'github' ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Github className="w-4 h-4 mr-2" />
                  Connect GitHub
                </>
              )}
            </Button>
          </div>

          {/* TryHackMe */}
          <div className="border border-slate-700 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-6 h-6 text-slate-300" />
              <h4 className="font-semibold text-slate-100">TryHackMe</h4>
            </div>
            <p className="text-sm text-slate-400 mb-4">
              Import your completed rooms and achievements
            </p>
            <Button
              variant="outline"
              onClick={handleTHMConnect}
              disabled={isImporting !== null}
              className="w-full"
            >
              {isImporting === 'thm' ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4 mr-2" />
                  Connect TryHackMe
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}


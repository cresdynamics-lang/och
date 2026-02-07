'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { X, Search, AlertTriangle, CheckCircle2, Download } from 'lucide-react';
import { useAuditLog } from '@/hooks/useAuditLog';
import type { ToolAnalysisResponse } from '@/types/analyst-tools';

interface SigmaIOCHunterProps {
  onClose: () => void;
  userId: string;
}

export const SigmaIOCHunter = ({ onClose, userId }: SigmaIOCHunterProps) => {
  const [ioc, setIoc] = useState('192.168.4.17');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<ToolAnalysisResponse | null>(null);
  const logAction = useAuditLog(userId);

  const handleSearch = async () => {
    if (!ioc.trim()) return;

    setIsSearching(true);
    logAction('sigma.search', { ioc });

    try {
      const response = await fetch(`/api/analyst/${userId}/tools/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool: 'sigma',
          payload: { ioc: ioc.trim() },
        }),
      });

      const data: ToolAnalysisResponse = await response.json();
      setResults(data);
    } catch (error) {
      console.error('Sigma search error:', error);
      alert('Failed to search Sigma rules. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-500 text-white';
      case 'high':
        return 'bg-och-signal-orange text-white';
      case 'medium':
        return 'bg-och-sahara-gold text-black';
      case 'low':
        return 'bg-och-steel-grey text-white';
      default:
        return 'bg-och-steel-grey text-white';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-och-midnight-black border border-och-defender-blue/30 rounded-lg w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-och-steel-grey/50 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-och-defender-blue">Sigma IOC Hunter</h3>
            <p className="text-xs text-och-steel-grey mt-1">Search Sigma rules by IOC</p>
          </div>
          <button
            onClick={onClose}
            className="text-och-steel-grey hover:text-white transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-4 border-b border-och-steel-grey/50">
          <div className="flex gap-2">
              <input
              type="text"
              value={ioc}
              onChange={(e) => setIoc(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter IOC (IP, domain, hash, etc.)"
              aria-label="IOC Search Input"
              className="flex-1 px-4 py-2 bg-och-steel-grey/20 border border-och-steel-grey/30 rounded-lg text-white placeholder-och-steel-grey focus:outline-none focus:ring-2 focus:ring-och-defender-blue focus:border-och-defender-blue"
            />
            <Button
              onClick={handleSearch}
              disabled={isSearching || !ioc.trim()}
              className="bg-och-defender-blue hover:bg-och-defender-blue/90"
            >
              <Search className="w-4 h-4 mr-2" />
              {isSearching ? 'Searching...' : 'Search'}
            </Button>
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-4">
          {results ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-och-steel-grey">
                  Found {results.results.length} Sigma hit{results.results.length !== 1 ? 's' : ''}
                </div>
                {results.metadata?.sigmaHits && (
                  <div className="text-lg font-bold text-och-defender-blue">
                    {results.metadata.sigmaHits} Sigma hits
                  </div>
                )}
              </div>

              {results.results.map((result) => (
                <div
                  key={result.id}
                  className="bg-och-steel-grey/20 border border-och-steel-grey/30 rounded-lg p-4 hover:bg-och-steel-grey/30 transition-all"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={getSeverityColor(result.severity)}>
                          {result.severity.toUpperCase()}
                        </Badge>
                        <span className="font-medium text-sm">{result.type}</span>
                      </div>
                      <div className="text-sm text-white mt-1">{result.description}</div>
                      {result.ioc && (
                        <div className="text-xs text-och-steel-grey mt-1">
                          IOC: <span className="text-och-defender-blue">{result.ioc}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {result.metadata && (
                    <div className="mt-3 pt-3 border-t border-och-steel-grey/30">
                      <div className="text-xs text-och-steel-grey space-y-1">
                        {result.metadata.ruleId && (
                          <div>Rule ID: {result.metadata.ruleId}</div>
                        )}
                        {result.metadata.ruleName && (
                          <div>Rule: {result.metadata.ruleName}</div>
                        )}
                        {result.metadata.matchedFields && (
                          <div>
                            Matched Fields: {result.metadata.matchedFields.join(', ')}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {results.mttrUpdate && (
                <div className="p-3 bg-och-cyber-mint/10 border border-och-cyber-mint/30 rounded-lg">
                  <div className="text-xs text-och-cyber-mint">
                    MTTR Update: {results.mttrUpdate}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <Search className="w-12 h-12 text-och-steel-grey mb-4" />
              <div className="text-och-steel-grey">
                Enter an IOC to search Sigma rules
              </div>
              <div className="text-xs text-och-steel-grey mt-2">
                Examples: IP addresses, domains, file hashes, process names
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-och-steel-grey/50 flex items-center justify-between">
          <div className="text-xs text-och-steel-grey">
            Search Sigma detection rules by IOC
          </div>
          <Button variant="outline" onClick={onClose} className="h-8 text-xs">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};


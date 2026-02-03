'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { X, Play, Search, Clock, AlertTriangle, CheckCircle, Zap } from 'lucide-react';
import { useAuditLog } from '@/hooks/useAuditLog';

interface SIEMQueryBuilderProps {
  ioc: string;
  onClose: () => void;
  userId: string;
}

interface QueryResult {
  timestamp: string;
  source: string;
  event: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  details: string;
}

export const SIEMQueryBuilder = ({ ioc, onClose, userId }: SIEMQueryBuilderProps) => {
  const [query, setQuery] = useState(`index=mtu_lab sourcetype=smb ioc="${ioc}"`);
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<QueryResult[]>([]);
  const [queryTime, setQueryTime] = useState<number | null>(null);

  const logAction = useAuditLog(userId);

  // Mock query execution
  const executeQuery = async () => {
    setIsRunning(true);
    logAction('siem.query.execute', { query, ioc });

    // Simulate query execution time
    const startTime = Date.now();

    // Mock results based on IOC
    const mockResults: QueryResult[] = [
      {
        timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
        source: 'SMB Server',
        event: 'Ransomware Detected',
        severity: 'critical',
        details: `IOC ${ioc} accessed encrypted files`
      },
      {
        timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        source: 'Endpoint Protection',
        event: 'Malware Alert',
        severity: 'high',
        details: 'ryuk.exe process detected and quarantined'
      },
      {
        timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
        source: 'Firewall',
        event: 'Suspicious Connection',
        severity: 'medium',
        details: `Outbound connection to ${ioc}:445 blocked`
      }
    ];

    // Simulate network delay
    setTimeout(() => {
      setResults(mockResults);
      setQueryTime(Date.now() - startTime);
      setIsRunning(false);
      logAction('siem.query.complete', {
        query,
        resultCount: mockResults.length,
        executionTime: Date.now() - startTime
      });
    }, 1500);
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="w-4 h-4 text-red-400" />;
      case 'high':
        return <Zap className="w-4 h-4 text-och-signal-orange" />;
      case 'medium':
        return <AlertTriangle className="w-4 h-4 text-och-sahara-gold" />;
      default:
        return <CheckCircle className="w-4 h-4 text-och-cyber-mint" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'border-red-400/50 bg-red-400/10 text-red-400';
      case 'high':
        return 'border-och-signal-orange/50 bg-och-signal-orange/10 text-och-signal-orange';
      case 'medium':
        return 'border-och-sahara-gold/50 bg-och-sahara-gold/10 text-och-sahara-gold';
      default:
        return 'border-och-cyber-mint/50 bg-och-cyber-mint/10 text-och-cyber-mint';
    }
  };

  // Auto-execute query on mount
  useEffect(() => {
    executeQuery();
  }, []);

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl bg-och-midnight-black border border-och-steel-grey/50 rounded-lg max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-och-steel-grey/50 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-och-defender-blue flex items-center gap-2">
              <Search className="w-6 h-6" />
              SIEM Query Builder
            </h2>
            <p className="text-sm text-och-steel-grey mt-1">
              Live query execution against MTN SOC infrastructure
            </p>
          </div>

          <Button
            variant="ghost"
            onClick={onClose}
            className="text-och-steel-grey hover:text-white"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Query Interface */}
        <div className="p-6 border-b border-och-steel-grey/50">
          <div className="flex items-center gap-3 mb-4">
            <div className="font-medium text-och-cyber-mint">Query:</div>
            <Badge className="bg-och-defender-blue/20 text-och-defender-blue border-och-defender-blue/30">
              MTN Lab Environment
            </Badge>
          </div>

          <div className="bg-och-steel-grey/30 rounded-lg p-4">
            <div className="font-mono text-sm text-white mb-4">
              <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full bg-transparent border-none outline-none resize-none font-mono text-sm"
                rows={2}
                placeholder="Enter SIEM query..."
              />
            </div>

            <div className="flex items-center justify-between">
              <Button
                onClick={executeQuery}
                disabled={isRunning}
                className="bg-och-defender-blue hover:bg-och-defender-blue/90"
              >
                {isRunning ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Executing...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Execute Query
                  </>
                )}
              </Button>

              {queryTime && (
                <div className="flex items-center gap-2 text-sm text-och-steel-grey">
                  <Clock className="w-4 h-4" />
                  Query executed in {queryTime}ms
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-white">
                Query Results ({results.length} hits)
              </h3>

              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${results.length > 0 ? 'bg-och-cyber-mint animate-pulse' : 'bg-och-steel-grey'}`} />
                <span className="text-sm text-och-steel-grey">
                  {results.length > 0 ? 'Live' : 'No results'}
                </span>
              </div>
            </div>

            {results.length === 0 && !isRunning && (
              <div className="text-center py-8 text-och-steel-grey">
                <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No results found for the current query.</p>
                <p className="text-sm mt-2">Try adjusting your search parameters.</p>
              </div>
            )}

            <div className="space-y-3">
              {results.map((result, index) => (
                <div
                  key={index}
                  className={`border rounded-lg p-4 transition-all ${getSeverityColor(result.severity)}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getSeverityIcon(result.severity)}
                      <span className="font-medium capitalize">{result.severity}</span>
                    </div>

                    <div className="text-xs text-och-steel-grey">
                      {new Date(result.timestamp).toLocaleTimeString()}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="text-sm">
                      <span className="text-och-steel-grey">Source:</span>
                      <span className="ml-2 font-medium">{result.source}</span>
                    </div>

                    <div className="text-sm">
                      <span className="text-och-steel-grey">Event:</span>
                      <span className="ml-2 font-medium">{result.event}</span>
                    </div>

                    <div className="text-sm text-och-steel-grey mt-2">
                      {result.details}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

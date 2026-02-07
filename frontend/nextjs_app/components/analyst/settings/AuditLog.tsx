'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Download, Search, Clock } from 'lucide-react';

interface AuditLogProps {
  auditLog: Array<{
    id: string;
    action: string;
    timestamp: string;
    details: string;
  }>;
  userId: string;
}

export const AuditLog = ({ auditLog, userId }: AuditLogProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredLogs, setFilteredLogs] = useState(auditLog);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setFilteredLogs(auditLog);
      return;
    }
    setFilteredLogs(
      auditLog.filter(log =>
        log.action.toLowerCase().includes(query.toLowerCase()) ||
        log.details.toLowerCase().includes(query.toLowerCase())
      )
    );
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium flex items-center gap-2">
          <Clock className="w-5 h-5 text-och-defender-blue" />
          Audit Log (Last 30 Days)
        </h4>
        <Button size="sm" variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-och-steel-grey" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search audit log..."
          className="w-full pl-10 pr-4 py-2 bg-och-midnight-black border border-och-steel-grey/30 rounded-lg text-white placeholder-och-steel-grey focus:outline-none focus:ring-2 focus:ring-och-defender-blue"
          aria-label="Search audit log"
        />
      </div>

      {/* Log Entries */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {filteredLogs.length > 0 ? (
          filteredLogs.map((log) => (
            <div
              key={log.id}
              className="p-3 bg-och-steel-grey/10 border border-och-steel-grey/30 rounded-lg"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="font-medium text-sm">{log.action}</div>
                  <div className="text-xs text-och-steel-grey mt-1">{log.details}</div>
                </div>
                <div className="text-xs text-och-steel-grey ml-4 whitespace-nowrap">
                  {formatTimestamp(log.timestamp)}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-sm text-och-steel-grey text-center py-8">
            {searchQuery ? 'No matching entries found' : 'No audit log entries'}
          </div>
        )}
      </div>
    </div>
  );
};


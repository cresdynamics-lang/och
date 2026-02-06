'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { CardEnhanced, CardContent } from '@/components/ui/card-enhanced';
import { Play, FileText, Network, Rss, Keyboard } from 'lucide-react';
import useSWR from 'swr';
import { fetcher } from '@/utils/fetcher';
import { ToolButton } from './ToolButton';
import { useAuditLog } from '@/hooks/useAuditLog';
import { SIEMQueryBuilder } from './SIEMQueryBuilder';
import { YARARuleEditor } from './YARARuleEditor';
import { WiresharkLab } from './WiresharkLab';
import { ThreatIntelFeed } from './ThreatIntelFeed';
import { SigmaIOCHunter } from './SigmaIOCHunter';

interface ToolsPanelProps {
  userId: string;
}

interface Tool {
  id: string;
  icon: any;
  title: string;
  subtitle: string;
  action?: string;
  status?: string;
  shortcut: string;
  url?: string;
  onClick?: () => void;
}

export const ToolsPanel = ({ userId }: ToolsPanelProps) => {
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [selectedIOC, setSelectedIOC] = useState<string>('192.168.4.17');
  const [selectedRule, setSelectedRule] = useState<string>('ryuk_network_beacon');

  const logAction = useAuditLog(userId);

  const { data: recentTools, error, isLoading } = useSWR(
    `/api/analyst/${userId}/tools/recent`,
    fetcher,
    { refreshInterval: 30000 }
  );

  const tools: Tool[] = [
    {
      id: 'siem',
      icon: Play,
      title: 'SIEM Query Builder',
      subtitle: recentTools?.siem?.recentQuery || '192.168.4.17 | ryuk.exe',
      action: 'GO',
      shortcut: '⌘ K',
      onClick: () => {
        logAction('tool.launch', { tool: 'siem' });
        setActiveModal('siem');
      }
    },
    {
      id: 'yara',
      icon: FileText,
      title: 'YARA Rule Editor',
      subtitle: recentTools?.yara?.recentRule || 'ryuk_network_beacon',
      action: 'NEW',
      shortcut: '⌘ Y',
      onClick: () => {
        logAction('tool.launch', { tool: 'yara' });
        setActiveModal('yara');
      }
    },
    {
      id: 'wireshark',
      icon: Network,
      title: 'Wireshark Lab',
      subtitle: recentTools?.wireshark?.packetsCaptured
        ? `${recentTools.wireshark.packetsCaptured} packets`
        : 'MTN Lab pcap (47 packets)',
      status: 'LIVE',
      shortcut: '⌘ W',
      onClick: () => {
        logAction('tool.launch', { tool: 'wireshark' });
        setActiveModal('wireshark');
      }
    },
    {
      id: 'threat-intel',
      icon: Rss,
      title: 'Threat Intel Feed',
      subtitle: recentTools?.threatIntel?.recentThreat || 'APT28 | Ecobank Phishing',
      status: 'LIVE',
      shortcut: '⌘ I',
      onClick: () => {
        logAction('tool.launch', { tool: 'threat-intel' });
        setActiveModal('threat-intel');
      }
    },
    {
      id: 'sigma',
      icon: FileText,
      title: 'Sigma IOC Hunter',
      subtitle: recentTools?.sigma?.recentIOC || '192.168.4.17',
      shortcut: '⌘ S',
      onClick: () => {
        logAction('tool.launch', { tool: 'sigma' });
        setActiveModal('sigma');
      }
    }
  ];

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        switch (e.key.toLowerCase()) {
          case 'k':
            e.preventDefault();
            logAction('tool.shortcut', { tool: 'siem', shortcut: '⌘ K' });
            setActiveModal('siem');
            break;
          case 'y':
            e.preventDefault();
            logAction('tool.shortcut', { tool: 'yara', shortcut: '⌘ Y' });
            setActiveModal('yara');
            break;
          case 'w':
            e.preventDefault();
            logAction('tool.shortcut', { tool: 'wireshark', shortcut: '⌘ W' });
            setActiveModal('wireshark');
            break;
          case 'i':
            e.preventDefault();
            logAction('tool.shortcut', { tool: 'threat-intel', shortcut: '⌘ I' });
            setActiveModal('threat-intel');
            break;
          case 's':
            e.preventDefault();
            logAction('tool.shortcut', { tool: 'sigma', shortcut: '⌘ S' });
            setActiveModal('sigma');
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [logAction]);

  const closeModal = () => {
    setActiveModal(null);
  };

  if (isLoading) {
    return (
      <div className="h-full flex flex-col overflow-hidden">
        <div className="p-4 border-b border-och-steel-grey/50 flex-shrink-0">
          <div className="h-6 bg-och-defender-blue/30 rounded w-1/2 animate-pulse"></div>
        </div>
        <div className="px-4 py-3 flex-1 overflow-y-auto space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-och-steel-grey/30 rounded-xl animate-pulse"></div>
          ))}
        </div>
        <div className="p-4 border-t border-och-steel-grey/50">
          <div className="h-20 bg-och-steel-grey/30 rounded animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center">
        <div className="text-6xl mb-4">⚠️</div>
        <h3 className="text-lg font-medium text-och-signal-orange mb-2">Tools Unavailable</h3>
        <p className="text-och-steel-grey text-sm mb-4">
          Unable to load SOC tools. Please try again later.
        </p>
        <Button onClick={() => window.location.reload()} variant="outline">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="h-full flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-och-steel-grey/50 flex-shrink-0">
          <h3 className="font-inter text-xl font-bold text-och-defender-blue flex items-center gap-2">
            ⚙️ TOOLS
          </h3>
          <div className="text-xs text-och-steel-grey uppercase tracking-wider">
            SOC Toolbox
          </div>
        </div>

        {/* Tool Quick Launch */}
        <div className="px-4 py-3 flex-1 overflow-y-auto space-y-3">
          {tools.map((tool) => (
            <ToolButton key={tool.id} tool={tool} />
          ))}
        </div>

        {/* Keyboard Shortcuts */}
        <div className="p-4 border-t border-och-steel-grey/50 flex-shrink-0 bg-och-steel-grey/30">
          <div className="text-xs text-och-steel-grey uppercase tracking-wider mb-3 flex items-center gap-2">
            <Keyboard className="w-4 h-4" />
            QUICK LAUNCH
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-2 p-2 bg-och-defender-blue/10 rounded-lg border border-och-defender-blue/20">
              <span className="font-mono bg-och-defender-blue text-white px-2 py-1 rounded text-xs">⌘ K</span>
              <span className="text-och-defender-blue font-medium">SIEM</span>
            </div>

            <div className="flex items-center gap-2 p-2 bg-och-sahara-gold/10 rounded-lg border border-och-sahara-gold/20">
              <span className="font-mono bg-och-sahara-gold text-black px-2 py-1 rounded text-xs">⌘ Y</span>
              <span className="text-och-sahara-gold font-medium">YARA</span>
            </div>

            <div className="flex items-center gap-2 p-2 bg-och-cyber-mint/10 rounded-lg border border-och-cyber-mint/20">
              <span className="font-mono bg-och-cyber-mint text-black px-2 py-1 rounded text-xs">⌘ W</span>
              <span className="text-och-cyber-mint font-medium">WIRESHARK</span>
            </div>

            <div className="flex items-center gap-2 p-2 bg-och-signal-orange/10 rounded-lg border border-och-signal-orange/20">
              <span className="font-mono bg-och-signal-orange text-black px-2 py-1 rounded text-xs">⌘ I</span>
              <span className="text-och-signal-orange font-medium">INTEL</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tool Modals */}
      {activeModal === 'siem' && (
        <SIEMQueryBuilder
          ioc={selectedIOC}
          onClose={closeModal}
          userId={userId}
        />
      )}

      {activeModal === 'yara' && (
        <YARARuleEditor
          ruleName={selectedRule}
          onClose={closeModal}
          userId={userId}
        />
      )}

      {activeModal === 'wireshark' && (
        <WiresharkLab
          onClose={closeModal}
          userId={userId}
        />
      )}

      {activeModal === 'threat-intel' && (
        <ThreatIntelFeed
          onClose={closeModal}
          userId={userId}
        />
      )}

      {activeModal === 'sigma' && (
        <SigmaIOCHunter
          onClose={closeModal}
          userId={userId}
        />
      )}
    </>
  );
};
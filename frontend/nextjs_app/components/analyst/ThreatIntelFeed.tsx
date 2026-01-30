'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { X, Rss, AlertTriangle, Shield, TrendingUp, MapPin, Calendar } from 'lucide-react';
import { useAuditLog } from '@/hooks/useAuditLog';

interface ThreatIntelFeedProps {
  onClose: () => void;
  userId: string;
}

interface ThreatAlert {
  id: string;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  source: string;
  timestamp: string;
  iocs: string[];
  mitreTactics: string[];
  sigmaRule?: string;
  location?: string;
  affectedEntities: string[];
}

export const ThreatIntelFeed = ({ onClose, userId }: ThreatIntelFeedProps) => {
  const [alerts, setAlerts] = useState<ThreatAlert[]>([]);
  const [selectedAlert, setSelectedAlert] = useState<ThreatAlert | null>(null);
  const [filter, setFilter] = useState<'all' | 'critical' | 'high' | 'medium' | 'low'>('all');

  const logAction = useAuditLog(userId);

  // Mock threat intel data
  useEffect(() => {
    const mockAlerts: ThreatAlert[] = [
      {
        id: 'apt28-phishing-001',
        title: 'APT28 Phishing Campaign Targeting Financial Sector',
        description: 'Russian state-sponsored group APT28 has launched a sophisticated phishing campaign targeting East African financial institutions.',
        severity: 'critical',
        category: 'Phishing',
        source: 'Mandiant Intelligence',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        iocs: ['phishing@ecobank-ke.com', '185.234.72.123', 'evilcorp.ltd'],
        mitreTactics: ['Initial Access', 'Credential Access', 'Discovery'],
        location: 'Kenya, Tanzania',
        affectedEntities: ['Ecobank', 'KCB Bank', 'Equity Bank'],
        sigmaRule: 'Phishing Email with Malicious Attachment'
      },
      {
        id: 'ryuk-ransomware-002',
        title: 'Ryuk Ransomware Deployment in Healthcare Sector',
        description: 'Ryuk ransomware variant detected in multiple healthcare facilities across Nairobi. Attackers are demanding $50,000 in Bitcoin.',
        severity: 'high',
        category: 'Ransomware',
        source: 'Recorded Future',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        iocs: ['192.168.4.17', 'ryuk_network_beacon', 'btc_wallet_123'],
        mitreTactics: ['Execution', 'Persistence', 'Impact'],
        location: 'Nairobi, Kenya',
        affectedEntities: ['Nairobi Hospital', 'Aga Khan Hospital'],
        sigmaRule: 'Ransomware File Encryption Activity'
      },
      {
        id: 'supply-chain-003',
        title: 'SolarWinds-style Supply Chain Compromise Detected',
        description: 'Third-party software vendor compromise affecting multiple Kenyan government agencies.',
        severity: 'high',
        category: 'Supply Chain',
        source: 'CrowdStrike Intelligence',
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        iocs: ['malicious_update.exe', 'vendor_api_key_leak', 'backdoor.dll'],
        mitreTactics: ['Initial Access', 'Privilege Escalation', 'Lateral Movement'],
        location: 'Government Networks, Kenya',
        affectedEntities: ['Ministry of Finance', 'KNBS'],
        sigmaRule: 'Suspicious Software Update Process'
      },
      {
        id: 'ddos-botnet-004',
        title: 'Mirai Botnet Targeting IoT Devices in East Africa',
        description: 'Large-scale botnet scanning for vulnerable IoT devices across East African ISPs.',
        severity: 'medium',
        category: 'Botnet',
        source: 'Kaspersky Lab',
        timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
        iocs: ['scanner_ip_ranges', 'telnet_brute_force', 'mirai_signature'],
        mitreTactics: ['Reconnaissance', 'Resource Development'],
        location: 'East Africa',
        affectedEntities: ['Safaricom', 'Airtel Kenya'],
        sigmaRule: 'IoT Device Scanning Activity'
      }
    ];

    setAlerts(mockAlerts);
    setSelectedAlert(mockAlerts[0]);
  }, []);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-400/20 text-red-400 border-red-400/30';
      case 'high':
        return 'bg-och-signal-orange/20 text-och-signal-orange border-och-signal-orange/30';
      case 'medium':
        return 'bg-och-sahara-gold/20 text-och-sahara-gold border-och-sahara-gold/30';
      default:
        return 'bg-och-cyber-mint/20 text-och-cyber-mint border-och-cyber-mint/30';
    }
  };

  const filteredAlerts = alerts.filter(alert =>
    filter === 'all' || alert.severity === filter
  );

  const handleAlertClick = (alert: ThreatAlert) => {
    setSelectedAlert(alert);
    logAction('threat-intel.alert.view', { alertId: alert.id, severity: alert.severity });
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-7xl bg-och-midnight-black border border-och-steel-grey/50 rounded-lg max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-och-steel-grey/50 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-och-defender-blue flex items-center gap-2">
              <Rss className="w-6 h-6" />
              Threat Intelligence Feed
            </h2>
            <p className="text-sm text-och-steel-grey mt-1">
              Live threat alerts from global intelligence sources (MITRE ATT&CK + Sigma)
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

        {/* Filters */}
        <div className="p-6 border-b border-och-steel-grey/50">
          <div className="flex items-center gap-3">
            <Shield className="w-4 h-4 text-och-steel-grey" />
            <div className="font-medium text-och-cyber-mint">Filter by Severity:</div>

            <div className="flex gap-2">
              {['all', 'critical', 'high', 'medium', 'low'].map((severity) => (
                <Button
                  key={severity}
                  variant={filter === severity ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter(severity as any)}
                  className={filter === severity ? 'bg-och-defender-blue hover:bg-och-defender-blue/90' : 'border-och-steel-grey/50'}
                >
                  {severity.charAt(0).toUpperCase() + severity.slice(1)}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-1 min-h-0">
          {/* Alerts List */}
          <div className="flex-1 border-r border-och-steel-grey/50">
            <div className="h-96 overflow-y-auto">
              <div className="space-y-2 p-4">
                {filteredAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      selectedAlert?.id === alert.id
                        ? 'border-och-defender-blue bg-och-defender-blue/10'
                        : 'border-och-steel-grey/30 hover:border-och-steel-grey/50'
                    }`}
                    onClick={() => handleAlertClick(alert)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge className={`text-xs ${getSeverityColor(alert.severity)}`}>
                          {alert.severity.toUpperCase()}
                        </Badge>
                        <span className="font-medium text-white">{alert.title}</span>
                      </div>

                      <div className="text-xs text-och-steel-grey flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(alert.timestamp).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="text-sm text-och-steel-grey mb-2 line-clamp-2">
                      {alert.description}
                    </div>

                    <div className="flex items-center gap-4 text-xs text-och-steel-grey">
                      <span>{alert.source}</span>
                      {alert.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {alert.location}
                        </div>
                      )}
                      <span>{alert.category}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Alert Details */}
          <div className="w-96 p-6">
            {selectedAlert ? (
              <div className="space-y-6">
                {/* Alert Header */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Badge className={getSeverityColor(selectedAlert.severity)}>
                      {selectedAlert.severity.toUpperCase()}
                    </Badge>
                    <span className="text-sm text-och-steel-grey">{selectedAlert.category}</span>
                  </div>

                  <h3 className="text-lg font-medium text-white mb-2">
                    {selectedAlert.title}
                  </h3>

                  <p className="text-sm text-och-steel-grey mb-4">
                    {selectedAlert.description}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-och-steel-grey">
                    <div className="flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      {selectedAlert.source}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(selectedAlert.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* MITRE ATT&CK Tactics */}
                <div>
                  <div className="text-sm font-medium text-och-cyber-mint mb-2">MITRE ATT&CK Tactics</div>
                  <div className="flex flex-wrap gap-1">
                    {selectedAlert.mitreTactics.map((tactic, index) => (
                      <Badge
                        key={index}
                        className="text-xs bg-och-defender-blue/20 text-och-defender-blue border-och-defender-blue/30"
                      >
                        {tactic}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Indicators of Compromise */}
                <div>
                  <div className="text-sm font-medium text-och-sahara-gold mb-2">Indicators of Compromise (IOCs)</div>
                  <div className="space-y-1">
                    {selectedAlert.iocs.map((ioc, index) => (
                      <div key={index} className="font-mono text-xs bg-och-steel-grey/20 p-2 rounded text-och-steel-grey">
                        {ioc}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Sigma Rule */}
                {selectedAlert.sigmaRule && (
                  <div>
                    <div className="text-sm font-medium text-och-signal-orange mb-2">Sigma Detection Rule</div>
                    <div className="font-mono text-xs bg-och-steel-grey/20 p-3 rounded text-och-steel-grey">
                      {selectedAlert.sigmaRule}
                    </div>
                  </div>
                )}

                {/* Affected Entities */}
                <div>
                  <div className="text-sm font-medium text-red-400 mb-2">Affected Entities</div>
                  <div className="space-y-1">
                    {selectedAlert.affectedEntities.map((entity, index) => (
                      <div key={index} className="text-sm text-red-300">
                        • {entity}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-4 border-t border-och-steel-grey/30">
                  <div className="flex gap-2">
                    <Button className="flex-1 bg-och-defender-blue hover:bg-och-defender-blue/90">
                      <Shield className="w-4 h-4 mr-2" />
                      Add to SIEM Rules
                    </Button>
                    <Button variant="outline" className="border-och-steel-grey/50">
                      Export IOCs
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-och-steel-grey">
                <Rss className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Select a threat alert to view details.</p>
                <p className="text-sm mt-2">Live feed from global intelligence sources.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

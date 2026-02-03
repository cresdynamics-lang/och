'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { X, Play, Pause, Square, Network, Eye, Filter, Download } from 'lucide-react';
import { useAuditLog } from '@/hooks/useAuditLog';

interface WiresharkLabProps {
  onClose: () => void;
  userId: string;
}

interface Packet {
  id: number;
  timestamp: string;
  source: string;
  destination: string;
  protocol: string;
  length: number;
  info: string;
  severity?: 'normal' | 'suspicious' | 'malicious';
}

export const WiresharkLab = ({ onClose, userId }: WiresharkLabProps) => {
  const [isCapturing, setIsCapturing] = useState(true);
  const [packets, setPackets] = useState<Packet[]>([]);
  const [selectedPacket, setSelectedPacket] = useState<Packet | null>(null);
  const [filter, setFilter] = useState('');
  const [packetCount, setPacketCount] = useState(0);

  const logAction = useAuditLog(userId);

  // Mock packet capture
  useEffect(() => {
    if (!isCapturing) return;

    const interval = setInterval(() => {
      const mockPackets: Packet[] = [
        {
          id: Date.now(),
          timestamp: new Date().toISOString(),
          source: '192.168.4.17',
          destination: '10.0.0.5',
          protocol: 'SMB',
          length: 256,
          info: 'SMB Negotiate Protocol Request',
          severity: 'normal'
        },
        {
          id: Date.now() + 1,
          timestamp: new Date().toISOString(),
          source: '10.0.0.5',
          destination: '192.168.4.17',
          protocol: 'SMB',
          length: 128,
          info: 'SMB Negotiate Protocol Response',
          severity: 'normal'
        },
        {
          id: Date.now() + 2,
          timestamp: new Date().toISOString(),
          source: '192.168.4.17',
          destination: '185.234.72.123',
          protocol: 'HTTPS',
          length: 512,
          info: 'Client Hello (Ryuk C2 Beacon)',
          severity: 'malicious'
        }
      ];

      setPackets(prev => [...mockPackets, ...prev].slice(0, 100)); // Keep last 100 packets
      setPacketCount(prev => prev + mockPackets.length);
    }, 2000);

    return () => clearInterval(interval);
  }, [isCapturing]);

  const toggleCapture = () => {
    setIsCapturing(!isCapturing);
    logAction('wireshark.capture.toggle', { capturing: !isCapturing });
  };

  const stopCapture = () => {
    setIsCapturing(false);
    logAction('wireshark.capture.stop', { totalPackets: packetCount });
  };

  const clearPackets = () => {
    setPackets([]);
    setPacketCount(0);
    setSelectedPacket(null);
    logAction('wireshark.capture.clear');
  };

  const exportCapture = () => {
    logAction('wireshark.capture.export', { packetCount });
    // Mock export functionality
    console.log('Exporting PCAP file...');
  };

  const filteredPackets = packets.filter(packet =>
    filter === '' ||
    packet.source.includes(filter) ||
    packet.destination.includes(filter) ||
    packet.protocol.toLowerCase().includes(filter.toLowerCase()) ||
    packet.info.toLowerCase().includes(filter.toLowerCase())
  );

  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case 'malicious':
        return 'text-red-400 bg-red-400/10 border-red-400/30';
      case 'suspicious':
        return 'text-och-signal-orange bg-och-signal-orange/10 border-och-signal-orange/30';
      default:
        return 'text-och-steel-grey bg-och-steel-grey/10 border-och-steel-grey/30';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-7xl bg-och-midnight-black border border-och-steel-grey/50 rounded-lg max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-och-steel-grey/50 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-och-defender-blue flex items-center gap-2">
              <Network className="w-6 h-6" />
              Wireshark Lab
            </h2>
            <p className="text-sm text-och-steel-grey mt-1">
              Live packet capture from MTN SOC network infrastructure
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
              isCapturing ? 'bg-och-cyber-mint/20 text-och-cyber-mint' : 'bg-och-steel-grey/20 text-och-steel-grey'
            }`}>
              <div className={`w-2 h-2 rounded-full ${isCapturing ? 'bg-och-cyber-mint animate-pulse' : 'bg-och-steel-grey'}`} />
              {isCapturing ? 'CAPTURING' : 'STOPPED'}
            </div>

            <Button
              variant="ghost"
              onClick={onClose}
              className="text-och-steel-grey hover:text-white"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Controls */}
        <div className="p-6 border-b border-och-steel-grey/50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Button
                onClick={toggleCapture}
                className={isCapturing ? 'bg-red-500 hover:bg-red-600' : 'bg-och-cyber-mint hover:bg-och-cyber-mint/90'}
              >
                {isCapturing ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                {isCapturing ? 'Pause' : 'Start'}
              </Button>

              <Button
                onClick={stopCapture}
                variant="outline"
                className="border-och-steel-grey/50"
                disabled={!isCapturing}
              >
                <Square className="w-4 h-4 mr-2" />
                Stop
              </Button>

              <Button
                onClick={clearPackets}
                variant="outline"
                className="border-och-steel-grey/50"
              >
                Clear
              </Button>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-sm text-och-steel-grey">
                Total Packets: <span className="font-mono font-bold text-och-cyber-mint">{packetCount}</span>
              </div>

              <Button
                onClick={exportCapture}
                variant="outline"
                className="border-och-steel-grey/50"
              >
                <Download className="w-4 h-4 mr-2" />
                Export PCAP
              </Button>
            </div>
          </div>

          {/* Filter */}
          <div className="flex items-center gap-3">
            <Filter className="w-4 h-4 text-och-steel-grey" />
            <input
              type="text"
              placeholder="Filter packets (IP, protocol, content)..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="flex-1 px-3 py-2 bg-och-steel-grey/30 border border-och-steel-grey/50 rounded-lg text-white placeholder-och-steel-grey focus:border-och-defender-blue focus:outline-none"
            />
          </div>
        </div>

        {/* Packet Analysis */}
        <div className="flex flex-1 min-h-0">
          {/* Packet List */}
          <div className="flex-1 border-r border-och-steel-grey/50">
            <div className="h-96 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-och-steel-grey/30 sticky top-0">
                  <tr className="text-left">
                    <th className="px-4 py-2 text-och-steel-grey font-medium">No.</th>
                    <th className="px-4 py-2 text-och-steel-grey font-medium">Time</th>
                    <th className="px-4 py-2 text-och-steel-grey font-medium">Source</th>
                    <th className="px-4 py-2 text-och-steel-grey font-medium">Destination</th>
                    <th className="px-4 py-2 text-och-steel-grey font-medium">Protocol</th>
                    <th className="px-4 py-2 text-och-steel-grey font-medium">Length</th>
                    <th className="px-4 py-2 text-och-steel-grey font-medium">Info</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPackets.map((packet, index) => (
                    <tr
                      key={packet.id}
                      className={`border-b border-och-steel-grey/20 hover:bg-och-defender-blue/10 cursor-pointer ${
                        selectedPacket?.id === packet.id ? 'bg-och-defender-blue/20' : ''
                      }`}
                      onClick={() => setSelectedPacket(packet)}
                    >
                      <td className="px-4 py-2 font-mono text-och-cyber-mint">{index + 1}</td>
                      <td className="px-4 py-2 text-och-steel-grey">
                        {new Date(packet.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="px-4 py-2 font-mono text-white">{packet.source}</td>
                      <td className="px-4 py-2 font-mono text-white">{packet.destination}</td>
                      <td className="px-4 py-2">
                        <Badge className={`text-xs ${getSeverityColor(packet.severity)}`}>
                          {packet.protocol}
                        </Badge>
                      </td>
                      <td className="px-4 py-2 font-mono text-och-sahara-gold">{packet.length}</td>
                      <td className="px-4 py-2 text-och-steel-grey truncate max-w-xs">
                        {packet.info}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Packet Details */}
          <div className="w-96 p-6">
            <div className="flex items-center gap-3 mb-4">
              <Eye className="w-5 h-5 text-och-cyber-mint" />
              <div className="font-medium text-och-cyber-mint">Packet Details</div>
            </div>

            {selectedPacket ? (
              <div className="space-y-4">
                <div className="bg-och-steel-grey/20 rounded-lg p-4">
                  <div className="space-y-3">
                    <div>
                      <div className="text-xs text-och-steel-grey uppercase tracking-wider mb-1">Timestamp</div>
                      <div className="font-mono text-sm">{new Date(selectedPacket.timestamp).toLocaleString()}</div>
                    </div>

                    <div>
                      <div className="text-xs text-och-steel-grey uppercase tracking-wider mb-1">Source → Destination</div>
                      <div className="font-mono text-sm">
                        {selectedPacket.source} → {selectedPacket.destination}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-och-steel-grey uppercase tracking-wider mb-1">Protocol & Length</div>
                      <div className="flex items-center gap-2">
                        <Badge className={getSeverityColor(selectedPacket.severity)}>
                          {selectedPacket.protocol}
                        </Badge>
                        <span className="text-sm text-och-steel-grey">
                          {selectedPacket.length} bytes
                        </span>
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-och-steel-grey uppercase tracking-wider mb-1">Information</div>
                      <div className="text-sm text-white">{selectedPacket.info}</div>
                    </div>

                    {selectedPacket.severity === 'malicious' && (
                      <div className="mt-4 p-3 bg-red-400/10 border border-red-400/30 rounded-lg">
                        <div className="flex items-center gap-2 text-red-400">
                          <AlertTriangle className="w-4 h-4" />
                          <span className="text-sm font-medium">Malicious Activity Detected</span>
                        </div>
                        <div className="text-xs text-red-300 mt-1">
                          This packet shows signs of ransomware C2 communication.
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-och-steel-grey">
                <Network className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Select a packet to view details.</p>
                <p className="text-sm mt-2">Packet capture is {isCapturing ? 'active' : 'paused'}.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

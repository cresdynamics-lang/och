import React, { useState } from 'react';
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  DollarSign,
  FileText,
  Target,
  Wallet,
  Zap,
  X
} from 'lucide-react';

interface MobileBottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const MobileBottomNav = ({ activeTab, onTabChange }: MobileBottomNavProps) => {
  const [showOverlay, setShowOverlay] = useState(false);

  const tabs = [
    { id: 'revenue', label: 'Revenue', icon: DollarSign, emoji: '💰' },
    { id: 'invoices', label: 'Invoices', icon: FileText, emoji: '📋' },
    { id: 'placements', label: 'Placements', icon: Target, emoji: '🎯' },
    { id: 'cashflow', label: 'Cash Flow', icon: Wallet, emoji: '💸' },
    { id: 'actions', label: 'Actions', icon: Zap, emoji: '⚡' }
  ];

  const handleTabClick = (tabId: string) => {
    onTabChange(tabId);
    setShowOverlay(true);
  };

  const closeOverlay = () => {
    setShowOverlay(false);
  };

  return (
    <>
      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-xl border-t border-slate-700/50 z-50">
        <div className="flex items-center justify-around py-2 px-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <Button
                key={tab.id}
                variant="ghost"
                size="sm"
                className={`flex flex-col items-center gap-1 h-16 px-2 py-1 rounded-lg transition-all ${
                  isActive
                    ? 'bg-cyan-500/20 text-cyan-400 shadow-lg shadow-cyan-500/20'
                    : 'text-slate-400 hover:text-cyan-400 hover:bg-slate-800/50'
                }`}
                onClick={() => handleTabClick(tab.id)}
              >
                <span className="text-lg">{tab.emoji}</span>
                <span className="text-xs font-mono">{tab.label}</span>
              </Button>
            );
          })}
        </div>
      </div>

      {/* Mobile Overlay */}
      {showOverlay && (
        <div className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40 flex items-end">
          <Card className="w-full bg-slate-900 border-slate-700 rounded-t-xl border-b-0 max-h-[80vh] overflow-y-auto">
            <div className="p-4 border-b border-slate-700 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">
                {tabs.find(t => t.id === activeTab)?.emoji} {tabs.find(t => t.id === activeTab)?.label}
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={closeOverlay}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="p-4 space-y-4">
              {/* Content based on active tab */}
              {activeTab === 'revenue' && (
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-cyan-400">KES 4,970,000</div>
                    <div className="text-sm text-slate-400">Total Revenue</div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-slate-800 rounded-lg">
                      <div className="text-lg font-bold text-yellow-400">KES 3.2M</div>
                      <div className="text-xs text-slate-400">Cohort</div>
                    </div>
                    <div className="text-center p-3 bg-slate-800 rounded-lg">
                      <div className="text-lg font-bold text-green-400">KES 600K</div>
                      <div className="text-xs text-slate-400">Placements</div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'invoices' && (
                <div className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-slate-800 rounded-lg">
                      <div>
                        <div className="font-semibold text-white">MTN</div>
                        <div className="text-sm text-slate-400">Due Feb 15</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-orange-400">KES 500K</div>
                        <div className="text-xs text-slate-400">Due Soon</div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-slate-800 rounded-lg">
                      <div>
                        <div className="font-semibold text-white">Vodacom</div>
                        <div className="text-sm text-slate-400">Paid</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-green-400">KES 300K</div>
                        <div className="text-xs text-slate-400">✓ Paid</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'placements' && (
                <div className="space-y-4">
                  <div className="text-center mb-4">
                    <div className="text-xl font-bold text-cyan-400">12 Active</div>
                    <div className="text-sm text-slate-400">Placement Pipeline</div>
                  </div>
                  <div className="space-y-3">
                    <div className="p-3 bg-slate-800 rounded-lg">
                      <div className="font-semibold text-white">John Doe → MTN</div>
                      <div className="text-sm text-slate-400">SOC L1 Analyst • KES 150K</div>
                      <div className="text-xs text-green-400 mt-1">90% probability</div>
                    </div>
                    <div className="p-3 bg-slate-800 rounded-lg">
                      <div className="font-semibold text-white">Jane Smith → Vodacom</div>
                      <div className="text-sm text-slate-400">Security Engineer • KES 200K</div>
                      <div className="text-xs text-yellow-400 mt-1">75% probability</div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'cashflow' && (
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-cyan-400">KES 2.1M</div>
                    <div className="text-sm text-slate-400">Available Cash</div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-slate-800 rounded-lg">
                      <div className="text-lg font-bold text-red-400">KES 150K</div>
                      <div className="text-xs text-slate-400">Monthly Burn</div>
                    </div>
                    <div className="text-center p-3 bg-slate-800 rounded-lg">
                      <div className="text-lg font-bold text-green-400">14mo</div>
                      <div className="text-xs text-slate-400">Runway</div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'actions' && (
                <div className="space-y-3">
                  <Button className="w-full bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/30">
                    QuickBooks CSV Export
                  </Button>
                  <Button className="w-full bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/30">
                    ROI PDF Report
                  </Button>
                  <Button className="w-full bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/30">
                    Payment Reminders
                  </Button>
                  <Button className="w-full bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/30">
                    New Invoice
                  </Button>
                  <Button className="w-full bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/30">
                    P&L Statement
                  </Button>
                  <Button className="w-full bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/30">
                    Reconcile Accounts
                  </Button>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
    </>
  );
};

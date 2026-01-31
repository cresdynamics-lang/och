import React from 'react';
import { Card } from "@/components/ui/Card";
import { CardContent, CardHeader } from "@/components/ui/card-enhanced";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ArrowRight, TrendingUp, Users, Target, DollarSign } from 'lucide-react';

export const PlacementPipeline = () => {
  const placements = [
    {
      id: 'PL-001',
      candidate: 'John Doe',
      company: 'MTN',
      position: 'SOC L1 Analyst',
      salary: 150000,
      stage: 'Offer Extended',
      probability: 90,
      lastUpdate: '2 hours ago'
    },
    {
      id: 'PL-002',
      candidate: 'Jane Smith',
      company: 'Vodacom',
      position: 'Security Engineer',
      salary: 200000,
      stage: 'Interview',
      probability: 75,
      lastUpdate: '1 day ago'
    },
    {
      id: 'PL-003',
      candidate: 'Mike Johnson',
      company: 'Ecobank',
      position: 'Cybersecurity Analyst',
      salary: 180000,
      stage: 'Screening',
      probability: 60,
      lastUpdate: '3 days ago'
    }
  ];

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'Offer Extended':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'Interview':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'Screening':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      default:
        return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  const getProbabilityColor = (probability: number) => {
    if (probability >= 80) return 'text-green-400';
    if (probability >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm">
      <CardHeader>
        <h3 className="text-white flex items-center gap-2 text-lg font-semibold">
          <Target className="w-5 h-5 text-cyan-400" />
          Active Placements Pipeline
        </h3>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {placements.map((placement, index) => (
            <div key={placement.id} className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50 border border-slate-700/30 hover:bg-slate-800/70 transition-all">
              <div className="flex items-center gap-4 flex-1">
                <div className="text-sm font-mono text-cyan-400 bg-cyan-500/10 px-2 py-1 rounded">
                  {placement.id}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-white">{placement.candidate}</div>
                  <div className="text-sm text-slate-400">{placement.company} • {placement.position}</div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="font-semibold text-white">KES {placement.salary.toLocaleString()}</div>
                  <div className={`text-sm font-bold ${getProbabilityColor(placement.probability)}`}>
                    {placement.probability}% likely
                  </div>
                </div>

                <Badge className={`${getStageColor(placement.stage)}`}>
                  {placement.stage}
                </Badge>

                <div className="text-xs text-slate-400 font-mono">
                  {placement.lastUpdate}
                </div>

                <Button variant="ghost" size="sm" className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10">
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t border-slate-700/50">
          <div className="grid grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-xl font-bold text-cyan-400">12</div>
              <div className="text-xs text-slate-400">Active Placements</div>
            </div>
            <div>
              <div className="text-xl font-bold text-green-400">KES 1.8M</div>
              <div className="text-xs text-slate-400">Total Value</div>
            </div>
            <div>
              <div className="text-xl font-bold text-yellow-400">KES 150K</div>
              <div className="text-xs text-slate-400">Average Salary</div>
            </div>
            <div>
              <div className="text-xl font-bold text-blue-400">75%</div>
              <div className="text-xs text-slate-400">Avg Probability</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

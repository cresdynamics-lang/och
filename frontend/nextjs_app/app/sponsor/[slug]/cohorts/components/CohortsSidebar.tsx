'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { CohortCard } from './CohortCard';
import { CohortStatusBadge, sortCohortsByStatus } from './CohortStatusBadge';
import { AddStudentsModal } from './AddStudentsModal';
import {
  Plus,
  Users,
  ChevronDown,
  ChevronUp,
  Filter,
  Search,
  X
} from 'lucide-react';

interface CohortsSidebarProps {
  sponsorSlug: string;
  isOpen: boolean;
  onClose?: () => void;
  onCohortAction?: (action: string, cohortId: string) => void;
  onNewCohort?: () => void;
}

interface Cohort {
  id: string;
  name: string;
  track_slug: string;
  status: string;
  target_size: number;
  students_enrolled: number;
  active_students: number;
  completion_rate: number;
  start_date: string | null;
  target_completion_date: string | null;
  budget_allocated: number;
  ai_interventions_count: number;
  placement_goal: number;
  value_created_kes: number;
  avg_readiness_score: number;
  top_talent_count: number;
  at_risk_students: number;
  ai_alerts_count: number;
  is_over_budget: boolean;
  is_behind_schedule: boolean;
  needs_attention: boolean;
}

export function CohortsSidebar({
  sponsorSlug,
  isOpen,
  onClose,
  onCohortAction,
  onNewCohort
}: CohortsSidebarProps) {
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [trackFilter, setTrackFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'completion' | 'students' | 'status'>('status');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [addStudentsModal, setAddStudentsModal] = useState<{ open: boolean; cohortId: string; cohortName: string }>({
    open: false,
    cohortId: '',
    cohortName: ''
  });

  useEffect(() => {
    if (isOpen) {
      fetchCohorts();
    }
  }, [isOpen, sponsorSlug]);

  const fetchCohorts = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/sponsors/${sponsorSlug}/cohorts/`, {
        headers: {
          // Add auth header when authentication is implemented
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch cohorts: ${response.status}`);
      }

      const data = await response.json();
      setCohorts(data.cohorts || []);
    } catch (err: any) {
      console.error('Error fetching cohorts:', err);
      setError(err.message || 'Failed to load cohorts');

      // Mock data for development
      setCohorts([
        {
          id: '1',
          name: 'Jan 2026 - Defender',
          track_slug: 'defender',
          status: 'active',
          target_size: 187,
          students_enrolled: 127,
          active_students: 127,
          completion_rate: 68.2,
          start_date: '2026-01-15',
          target_completion_date: '2026-06-30',
          budget_allocated: 3200000,
          ai_interventions_count: 3,
          placement_goal: 25,
          value_created_kes: 3200000,
          avg_readiness_score: 82.7,
          top_talent_count: 15,
          at_risk_students: 8,
          ai_alerts_count: 3,
          is_over_budget: false,
          is_behind_schedule: false,
          needs_attention: true
        },
        {
          id: '2',
          name: 'Feb 2026 - GRC',
          track_slug: 'grc',
          status: 'active',
          target_size: 120,
          students_enrolled: 89,
          active_students: 89,
          completion_rate: 42.1,
          start_date: '2026-02-01',
          target_completion_date: '2026-07-31',
          budget_allocated: 1800000,
          ai_interventions_count: 1,
          placement_goal: 20,
          value_created_kes: 1800000,
          avg_readiness_score: 75.3,
          top_talent_count: 8,
          at_risk_students: 12,
          ai_alerts_count: 5,
          is_over_budget: false,
          is_behind_schedule: false,
          needs_attention: true
        },
        {
          id: '3',
          name: 'Mar 2026 - Innovation',
          track_slug: 'innovation',
          status: 'draft',
          target_size: 100,
          students_enrolled: 0,
          active_students: 0,
          completion_rate: 0,
          start_date: null,
          target_completion_date: null,
          budget_allocated: 2000000,
          ai_interventions_count: 0,
          placement_goal: 15,
          value_created_kes: 0,
          avg_readiness_score: 0,
          top_talent_count: 0,
          at_risk_students: 0,
          ai_alerts_count: 0,
          is_over_budget: false,
          is_behind_schedule: false,
          needs_attention: false
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort cohorts
  const filteredCohorts = cohorts.filter(cohort => {
    const matchesSearch = cohort.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || cohort.status === statusFilter;
    const matchesTrack = trackFilter === 'all' || cohort.track_slug === trackFilter;
    return matchesSearch && matchesStatus && matchesTrack;
  });

  const sortedCohorts = [...filteredCohorts].sort((a, b) => {
    let aValue: any, bValue: any;

    switch (sortBy) {
      case 'name':
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
        break;
      case 'completion':
        aValue = a.completion_rate;
        bValue = b.completion_rate;
        break;
      case 'students':
        aValue = a.active_students;
        bValue = b.active_students;
        break;
      case 'status':
        const statusOrder = { active: 1, draft: 2, graduated: 3, archived: 4 };
        aValue = statusOrder[a.status as keyof typeof statusOrder] || 99;
        bValue = statusOrder[b.status as keyof typeof statusOrder] || 99;
        break;
      default:
        return 0;
    }

    if (sortOrder === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  });

  const handleCohortAction = (action: string, cohortId: string) => {
    if (action === 'add_students') {
      const cohort = cohorts.find(c => c.id === cohortId);
      if (cohort) {
        setAddStudentsModal({
          open: true,
          cohortId,
          cohortName: cohort.name
        });
      }
    } else {
      onCohortAction?.(action, cohortId);
    }
  };

  const handleAddStudents = async (cohortId: string, studentData: any) => {
    try {
      const response = await fetch(`/api/sponsors/${sponsorSlug}/cohorts/${cohortId}/students/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Add auth header when authentication is implemented
        },
        body: JSON.stringify(studentData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add students');
      }

      // Refresh cohorts data
      fetchCohorts();

      return await response.json();
    } catch (error: any) {
      console.error('Error adding students:', error);
      throw error;
    }
  };

  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  // Summary stats
  const totalCohorts = cohorts.length;
  const activeCohorts = cohorts.filter(c => c.status === 'active').length;
  const totalStudents = cohorts.reduce((sum, c) => sum + c.active_students, 0);
  const avgCompletion = cohorts.length > 0
    ? cohorts.reduce((sum, c) => sum + c.completion_rate, 0) / cohorts.length
    : 0;

  return (
    <div className={`
      fixed inset-y-0 right-0 z-50 w-full max-w-sm bg-slate-950 border-l border-slate-800
      transform transition-transform duration-300 ease-in-out
      ${isOpen ? 'translate-x-0' : 'translate-x-full'}
      md:relative md:translate-x-0 md:w-80 md:flex-shrink-0
    `}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <Users className="w-6 h-6 text-blue-400" />
          <div>
            <h2 className="text-lg font-semibold text-white">Cohorts</h2>
            <p className="text-sm text-slate-400">{totalCohorts} total • {activeCohorts} active</p>
          </div>
        </div>
        <Button
          size="sm"
          onClick={onNewCohort}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-1" />
          New
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="p-4 border-b border-slate-800">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{totalStudents}</div>
            <div className="text-xs text-slate-400">Total Students</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{avgCompletion.toFixed(1)}%</div>
            <div className="text-xs text-slate-400">Avg Completion</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="p-4 border-b border-slate-800 space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search cohorts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:border-slate-600 focus:outline-none"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="flex-1 px-3 py-1 bg-slate-800 border border-slate-700 rounded text-sm text-white focus:border-slate-600 focus:outline-none"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="graduated">Graduated</option>
            <option value="archived">Archived</option>
          </select>

          <select
            value={trackFilter}
            onChange={(e) => setTrackFilter(e.target.value)}
            className="flex-1 px-3 py-1 bg-slate-800 border border-slate-700 rounded text-sm text-white focus:border-slate-600 focus:outline-none"
          >
            <option value="all">All Tracks</option>
            <option value="defender">Defender</option>
            <option value="grc">GRC</option>
            <option value="innovation">Innovation</option>
            <option value="leadership">Leadership</option>
            <option value="offensive">Offensive</option>
          </select>
        </div>

        {/* Sort */}
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={sortBy === 'status' ? 'defender' : 'outline'}
            onClick={() => handleSort('status')}
            className="flex-1 text-xs"
          >
            Status {sortBy === 'status' && (sortOrder === 'asc' ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />)}
          </Button>
          <Button
            size="sm"
            variant={sortBy === 'completion' ? 'defender' : 'outline'}
            onClick={() => handleSort('completion')}
            className="flex-1 text-xs"
          >
            Completion {sortBy === 'completion' && (sortOrder === 'asc' ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />)}
          </Button>
        </div>
      </div>

      {/* Cohorts List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse">
                <div className="bg-slate-800 rounded-lg p-4">
                  <div className="h-4 bg-slate-700 rounded mb-2"></div>
                  <div className="h-3 bg-slate-700 rounded mb-2 w-3/4"></div>
                  <div className="h-3 bg-slate-700 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="p-4 text-center">
            <p className="text-red-400 mb-2">Error loading cohorts</p>
            <p className="text-slate-400 text-sm mb-4">{error}</p>
            <Button onClick={fetchCohorts} size="sm">
              Retry
            </Button>
          </div>
        ) : sortedCohorts.length === 0 ? (
          <div className="p-4 text-center">
            <Users className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 mb-4">No cohorts found</p>
            <Button onClick={onNewCohort} size="sm">
              <Plus className="w-4 h-4 mr-1" />
              Create First Cohort
            </Button>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {sortedCohorts.map(cohort => (
              <CohortCard
                key={cohort.id}
                cohort={cohort}
                sponsorSlug={sponsorSlug}
                onAction={handleCohortAction}
              />
            ))}
          </div>
        )}
      </div>

      {/* Mobile Close Button */}
      <div className="md:hidden p-4 border-t border-slate-800">
        <Button
          onClick={onClose}
          variant="outline"
          className="w-full text-slate-400 border-slate-600"
        >
          <X className="w-4 h-4 mr-2" />
          Close
        </Button>
      </div>

      {/* Add Students Modal */}
      <AddStudentsModal
        isOpen={addStudentsModal.open}
        onClose={() => setAddStudentsModal({ open: false, cohortId: '', cohortName: '' })}
        onAddStudents={handleAddStudents}
        cohortId={addStudentsModal.cohortId}
        cohortName={addStudentsModal.cohortName}
      />
    </div>
  );
}

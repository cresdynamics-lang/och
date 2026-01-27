'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import {
  Users,
  Search,
  Trophy,
  Mail,
  Calendar,
  Target,
  MessageSquare,
  Eye,
  Filter,
  ArrowUpDown,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface Student {
  id: string;
  name: string;
  email: string;
  readiness_score: number;
  completion_percentage: number;
  joined_at: string;
  last_activity_at: string | null;
  enrollment_status: string;
  cohort_rank: number;
  top_skills: string[];
  last_activity_days: number;
  mentor_sessions_completed: number;
  missions_completed: number;
}

interface StudentRosterProps {
  students: Student[];
  cohortId: string;
  sponsorSlug: string;
}

type SortField = 'name' | 'readiness_score' | 'completion_percentage' | 'cohort_rank' | 'last_activity_days';
type SortOrder = 'asc' | 'desc';

export function StudentRoster({ students, cohortId, sponsorSlug }: StudentRosterProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('readiness_score');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [readinessFilter, setReadinessFilter] = useState<string>('all');

  // Filter students
  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || student.enrollment_status === statusFilter;
    const matchesReadiness = readinessFilter === 'all' ||
      (readinessFilter === 'excellent' && student.readiness_score >= 90) ||
      (readinessFilter === 'strong' && student.readiness_score >= 80 && student.readiness_score < 90) ||
      (readinessFilter === 'good' && student.readiness_score >= 70 && student.readiness_score < 80) ||
      (readinessFilter === 'developing' && student.readiness_score < 70);

    return matchesSearch && matchesStatus && matchesReadiness;
  });

  // Sort students
  const sortedStudents = [...filteredStudents].sort((a, b) => {
    let aValue: any = a[sortField];
    let bValue: any = b[sortField];

    if (sortField === 'name') {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }

    if (sortOrder === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const getReadinessColor = (score: number) => {
    if (score >= 90) return 'text-green-400 bg-green-500/20';
    if (score >= 80) return 'text-blue-400 bg-blue-500/20';
    if (score >= 70) return 'text-amber-400 bg-amber-500/20';
    return 'text-red-400 bg-red-500/20';
  };

  const getReadinessLabel = (score: number) => {
    if (score >= 90) return 'Excellent';
    if (score >= 80) return 'Strong';
    if (score >= 70) return 'Good';
    return 'Developing';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'enrolled': return 'bg-green-500/20 text-green-400';
      case 'completed': return 'bg-blue-500/20 text-blue-400';
      case 'withdrawn': return 'bg-red-500/20 text-red-400';
      default: return 'bg-slate-500/20 text-slate-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Stats */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Student Roster ({sortedStudents.length})
          </h2>
          <p className="text-slate-400">
            Manage and monitor individual student progress
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="text-slate-400 border-slate-600">
            <Filter className="w-4 h-4 mr-2" />
            Bulk Actions
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Users className="w-4 h-4 mr-2" />
            Add Students
          </Button>
        </div>
      </div>

      {/* Filters and Search */}
      <Card className="p-4 bg-slate-900/50 border-slate-700">
        <div className="flex flex-wrap gap-4">
          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white focus:border-slate-600 focus:outline-none"
          >
            <option value="all">All Status</option>
            <option value="enrolled">Enrolled</option>
            <option value="completed">Completed</option>
            <option value="withdrawn">Withdrawn</option>
          </select>

          {/* Readiness Filter */}
          <select
            value={readinessFilter}
            onChange={(e) => setReadinessFilter(e.target.value)}
            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white focus:border-slate-600 focus:outline-none"
          >
            <option value="all">All Readiness</option>
            <option value="excellent">Excellent (90+)</option>
            <option value="strong">Strong (80-89)</option>
            <option value="good">Good (70-79)</option>
            <option value="developing">Developing (<70)</option>
          </select>
        </div>
      </Card>

      {/* Student Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedStudents.map(student => (
          <Card key={student.id} className="p-4 bg-slate-900/50 border-slate-700 hover:border-slate-600 transition-all duration-200">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {student.cohort_rank <= 3 && (
                  <Trophy className={`w-4 h-4 ${student.cohort_rank === 1 ? 'text-yellow-400' : 'text-slate-400'}`} />
                )}
                <span className="text-white font-semibold">#{student.cohort_rank}</span>
              </div>
              <Badge className={getStatusColor(student.enrollment_status)}>
                {student.enrollment_status}
              </Badge>
            </div>

            {/* Student Info */}
            <div className="mb-4">
              <h3 className="text-white font-semibold text-base mb-1">{student.name}</h3>
              <div className="flex items-center gap-1 text-slate-400 text-sm mb-2">
                <Mail className="w-3 h-3" />
                <span className="truncate">{student.email}</span>
              </div>

              {/* Readiness Score */}
              <div className="flex items-center gap-2 mb-2">
                <Badge className={`${getReadinessColor(student.readiness_score)} text-xs`}>
                  {student.readiness_score} - {getReadinessLabel(student.readiness_score)}
                </Badge>
              </div>

              {/* Completion */}
              <div className="mb-2">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-slate-400">Completion</span>
                  <span className="text-white">{student.completion_percentage.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-1.5">
                  <div
                    className="h-1.5 bg-blue-500 rounded-full"
                    style={{ width: `${student.completion_percentage}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Skills */}
            <div className="mb-4">
              <p className="text-slate-400 text-xs mb-2">Top Skills</p>
              <div className="flex flex-wrap gap-1">
                {student.top_skills.slice(0, 3).map((skill, index) => (
                  <Badge key={index} className="bg-slate-700 text-slate-300 text-xs px-2 py-0.5">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Activity Stats */}
            <div className="grid grid-cols-3 gap-2 mb-4 text-center">
              <div>
                <div className="text-white font-semibold text-sm">{student.missions_completed}</div>
                <div className="text-slate-400 text-xs">Missions</div>
              </div>
              <div>
                <div className="text-white font-semibold text-sm">{student.mentor_sessions_completed}</div>
                <div className="text-slate-400 text-xs">Mentor</div>
              </div>
              <div>
                <div className="text-white font-semibold text-sm">{student.last_activity_days}d</div>
                <div className="text-slate-400 text-xs">Active</div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="flex-1 text-slate-400 border-slate-600 hover:text-white"
              >
                <Eye className="w-3 h-3 mr-1" />
                View
              </Button>
              <Button
                size="sm"
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                <MessageSquare className="w-3 h-3 mr-1" />
                Contact
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {sortedStudents.length === 0 && (
        <Card className="p-8 bg-slate-900/50 border-slate-700 text-center">
          <Users className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-white font-semibold mb-2">No students found</h3>
          <p className="text-slate-400 mb-4">
            {searchTerm || statusFilter !== 'all' || readinessFilter !== 'all'
              ? 'Try adjusting your filters or search terms.'
              : 'No students have been enrolled in this cohort yet.'}
          </p>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Users className="w-4 h-4 mr-2" />
            Add Students
          </Button>
        </Card>
      )}
    </div>
  );
}

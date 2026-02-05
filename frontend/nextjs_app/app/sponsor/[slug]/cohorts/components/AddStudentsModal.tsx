'use client';

import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import {
  Upload,
  Users,
  Filter,
  Search,
  CheckCircle,
  AlertCircle,
  X,
  FileText,
  Target,
  Zap
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface AddStudentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddStudents: (cohortId: string, studentData: any) => Promise<void>;
  cohortId: string;
  cohortName: string;
}

interface StudentCandidate {
  id: string;
  name: string;
  email: string;
  readiness_score?: number;
  track_completion?: number;
  status: 'available' | 'selected' | 'added';
}

export function AddStudentsModal({
  isOpen,
  onClose,
  onAddStudents,
  cohortId,
  cohortName
}: AddStudentsModalProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'manual'>('manual'); // Only show manual tab
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [results, setResults] = useState<{ added: number; skipped: number; total: number } | null>(null);
  const [linkedStudents, setLinkedStudents] = useState<StudentCandidate[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(true);

  // Fetch linked students when modal opens
  useEffect(() => {
    if (isOpen && user?.id) {
      fetchLinkedStudents();
    }
  }, [isOpen, user?.id]);

  const fetchLinkedStudents = async () => {
    if (!user?.id) return;
    
    setLoadingStudents(true);
    try {
      const response = await fetch(`/api/v1/director/sponsors/${user.id}/students`);
      if (response.ok) {
        const data = await response.json();
        const students = data.students.map((student: any) => ({
          id: student.id,
          name: `${student.first_name} ${student.last_name}`.trim() || student.email,
          email: student.email,
          status: 'available' as const
        }));
        setLinkedStudents(students);
      }
    } catch (error) {
      console.error('Failed to fetch linked students:', error);
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleManualAdd = async () => {
    const selectedIds = Array.from(selectedStudents);
    setLoading(true);
    try {
      await onAddStudents(cohortId, {
        method: 'manual',
        user_ids: selectedIds
      });

      setResults({
        added: selectedIds.length,
        skipped: 0,
        total: selectedIds.length
      });

      setSelectedStudents(new Set());
    } catch (error) {
      console.error('Error adding students manually:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleStudentSelection = (studentId: string) => {
    const newSelected = new Set(selectedStudents);
    if (newSelected.has(studentId)) {
      newSelected.delete(studentId);
    } else {
      newSelected.add(studentId);
    }
    setSelectedStudents(newSelected);
  };

  const filteredCandidates = linkedStudents.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const resetModal = () => {
    setActiveTab('manual');
    setSearchTerm('');
    setSelectedStudents(new Set());
    setResults(null);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Students to {cohortName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header */}
          <div className="bg-slate-800/50 p-4 rounded-lg">
            <h3 className="text-white font-semibold mb-2">Your Linked Students</h3>
            <p className="text-slate-400 text-sm mb-4">
              Select students that you have linked to your sponsor account to enroll in this cohort.
            </p>

            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search your students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Loading State */}
            {loadingStudents && (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            )}

            {/* No Students */}
            {!loadingStudents && linkedStudents.length === 0 && (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400">No students linked to your account</p>
                <p className="text-slate-500 text-sm mt-1">
                  Contact your program director to link students to your sponsor account
                </p>
              </div>
            )}

            {/* Student List */}
            {!loadingStudents && linkedStudents.length > 0 && (
              <div className="max-h-64 overflow-y-auto space-y-2">
                {filteredCandidates.map(student => (
                  <div
                    key={student.id}
                    onClick={() => toggleStudentSelection(student.id)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedStudents.has(student.id)
                        ? 'bg-blue-500/20 border-blue-500/30'
                        : 'bg-slate-900 border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                          selectedStudents.has(student.id)
                            ? 'bg-blue-500 border-blue-500'
                            : 'border-slate-600'
                        }`}>
                          {selectedStudents.has(student.id) && (
                            <CheckCircle className="w-3 h-3 text-white" />
                          )}
                        </div>
                        <div>
                          <div className="text-white font-medium">{student.name}</div>
                          <div className="text-slate-400 text-sm">{student.email}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!loadingStudents && linkedStudents.length > 0 && (
              <div className="mt-4 text-sm text-slate-400">
                {selectedStudents.size} of {filteredCandidates.length} students selected
              </div>
            )}
          </div>

          {/* Action Button */}
          <div className="flex justify-end">
            <Button
              onClick={handleManualAdd}
              disabled={loading || selectedStudents.size === 0}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Users className="w-4 h-4 mr-2" />
              {loading ? 'Enrolling...' : `Enroll ${selectedStudents.size} Students`}
            </Button>
          </div>

          {/* Results */}
          {results && (
            <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <h4 className="text-green-400 font-semibold">Students Added Successfully</h4>
              </div>
              <p className="text-green-300 text-sm">
                Added {results.added} students to {cohortName}.
                {results.skipped > 0 && ` ${results.skipped} were skipped.`}
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

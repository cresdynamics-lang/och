'use client';

import { useState, useRef } from 'react';
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
  const [activeTab, setActiveTab] = useState<'csv' | 'auto' | 'manual'>('auto');
  const [loading, setLoading] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvPreview, setCsvPreview] = useState<any[]>([]);
  const [autoEnrollCount, setAutoEnrollCount] = useState(10);
  const [readinessFilter, setReadinessFilter] = useState(70);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [results, setResults] = useState<{ added: number; skipped: number; total: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mock student candidates for manual selection
  const [studentCandidates] = useState<StudentCandidate[]>([
    { id: '1', name: 'Alice Johnson', email: 'alice@example.com', readiness_score: 85, track_completion: 78, status: 'available' },
    { id: '2', name: 'Bob Smith', email: 'bob@example.com', readiness_score: 92, track_completion: 88, status: 'available' },
    { id: '3', name: 'Carol Davis', email: 'carol@example.com', readiness_score: 76, track_completion: 65, status: 'available' },
    { id: '4', name: 'David Wilson', email: 'david@example.com', readiness_score: 88, track_completion: 82, status: 'available' },
    { id: '5', name: 'Eva Brown', email: 'eva@example.com', readiness_score: 79, track_completion: 71, status: 'available' },
  ]);

  const handleCsvUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setCsvFile(file);

    // Mock CSV parsing
    const mockData = [
      { name: 'John Doe', email: 'john@example.com' },
      { name: 'Jane Smith', email: 'jane@example.com' },
      { name: 'Mike Johnson', email: 'mike@example.com' },
    ];
    setCsvPreview(mockData);
  };

  const handleAutoEnroll = async () => {
    setLoading(true);
    try {
      await onAddStudents(cohortId, {
        method: 'auto_enroll',
        count: autoEnrollCount,
        filters: {
          min_readiness: readinessFilter
        }
      });

      setResults({
        added: autoEnrollCount,
        skipped: 0,
        total: autoEnrollCount
      });
    } catch (error) {
      console.error('Error auto-enrolling students:', error);
    } finally {
      setLoading(false);
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

      // Update status of selected students
      setSelectedStudents(new Set());
    } catch (error) {
      console.error('Error adding students manually:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCsvAdd = async () => {
    if (!csvPreview.length) return;

    setLoading(true);
    try {
      await onAddStudents(cohortId, {
        method: 'csv',
        csv_data: csvPreview
      });

      setResults({
        added: csvPreview.length,
        skipped: 0,
        total: csvPreview.length
      });
    } catch (error) {
      console.error('Error adding students from CSV:', error);
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

  const filteredCandidates = studentCandidates.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const resetModal = () => {
    setActiveTab('auto');
    setCsvFile(null);
    setCsvPreview([]);
    setAutoEnrollCount(10);
    setReadinessFilter(70);
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
          {/* Tab Navigation */}
          <div className="flex border-b border-slate-700">
            {[
              { id: 'auto', label: 'Auto-Enroll', icon: Zap },
              { id: 'csv', label: 'CSV Upload', icon: Upload },
              { id: 'manual', label: 'Manual Select', icon: Users }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center gap-2 px-4 py-2 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-slate-400 hover:text-slate-300'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="min-h-[400px]">
            {/* Auto-Enroll Tab */}
            {activeTab === 'auto' && (
              <div className="space-y-6">
                <div className="bg-slate-800/50 p-4 rounded-lg">
                  <h3 className="text-white font-semibold mb-2">Smart Auto-Enrollment</h3>
                  <p className="text-slate-400 text-sm mb-4">
                    Automatically enroll top-performing students based on AI readiness scores and curriculum progress.
                  </p>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        Number of Students
                      </label>
                      <Input
                        type="number"
                        min="1"
                        max="100"
                        value={autoEnrollCount}
                        onChange={(e) => setAutoEnrollCount(parseInt(e.target.value) || 10)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        Minimum Readiness Score
                      </label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={readinessFilter}
                        onChange={(e) => setReadinessFilter(parseInt(e.target.value) || 70)}
                      />
                    </div>
                  </div>

                  <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded">
                    <p className="text-blue-400 text-sm">
                      Will enroll {autoEnrollCount} students with readiness scores ≥ {readinessFilter}%
                    </p>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={handleAutoEnroll}
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    {loading ? 'Enrolling...' : 'Auto-Enroll Students'}
                  </Button>
                </div>
              </div>
            )}

            {/* CSV Upload Tab */}
            {activeTab === 'csv' && (
              <div className="space-y-6">
                <div className="bg-slate-800/50 p-4 rounded-lg">
                  <h3 className="text-white font-semibold mb-2">CSV Upload</h3>
                  <p className="text-slate-400 text-sm mb-4">
                    Upload a CSV file with student names and email addresses.
                  </p>

                  <div className="space-y-4">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv"
                      onChange={handleCsvUpload}
                      className="hidden"
                    />

                    <div className="flex gap-4">
                      <Button
                        onClick={() => fileInputRef.current?.click()}
                        variant="outline"
                        className="flex-1"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Choose CSV File
                      </Button>
                    </div>

                    {csvFile && (
                      <div className="flex items-center gap-2 text-sm text-slate-300">
                        <FileText className="w-4 h-4" />
                        {csvFile.name}
                      </div>
                    )}
                  </div>

                  {csvPreview.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-white font-medium mb-2">Preview ({csvPreview.length} students)</h4>
                      <div className="bg-slate-900 p-3 rounded max-h-32 overflow-y-auto">
                        {csvPreview.slice(0, 5).map((row, index) => (
                          <div key={index} className="text-sm text-slate-300 mb-1">
                            {row.name} - {row.email}
                          </div>
                        ))}
                        {csvPreview.length > 5 && (
                          <div className="text-sm text-slate-500">
                            ... and {csvPreview.length - 5} more
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={handleCsvAdd}
                    disabled={loading || csvPreview.length === 0}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {loading ? 'Uploading...' : 'Add Students'}
                  </Button>
                </div>
              </div>
            )}

            {/* Manual Selection Tab */}
            {activeTab === 'manual' && (
              <div className="space-y-6">
                <div className="bg-slate-800/50 p-4 rounded-lg">
                  <h3 className="text-white font-semibold mb-2">Manual Student Selection</h3>
                  <p className="text-slate-400 text-sm mb-4">
                    Select individual students to add to this cohort.
                  </p>

                  {/* Search */}
                  <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      placeholder="Search students..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  {/* Student List */}
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
                            <div className={`w-4 h-4 rounded border-2 ${
                              selectedStudents.has(student.id)
                                ? 'bg-blue-500 border-blue-500'
                                : 'border-slate-600'
                            }`}>
                              {selectedStudents.has(student.id) && (
                                <CheckCircle className="w-4 h-4 text-blue-500" />
                              )}
                            </div>
                            <div>
                              <div className="text-white font-medium">{student.name}</div>
                              <div className="text-slate-400 text-sm">{student.email}</div>
                            </div>
                          </div>

                          <div className="text-right">
                            {student.readiness_score && (
                              <Badge className="bg-emerald-500/20 text-emerald-400">
                                {student.readiness_score}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 text-sm text-slate-400">
                    {selectedStudents.size} of {filteredCandidates.length} students selected
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={handleManualAdd}
                    disabled={loading || selectedStudents.size === 0}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Users className="w-4 h-4 mr-2" />
                    {loading ? 'Adding...' : `Add ${selectedStudents.size} Students`}
                  </Button>
                </div>
              </div>
            )}
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

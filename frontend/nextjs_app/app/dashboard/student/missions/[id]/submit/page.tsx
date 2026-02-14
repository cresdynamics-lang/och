'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { useMissions } from '../../hooks/useMissions';

export default function MissionSubmitPage() {
  const params = useParams();
  const router = useRouter();
  const missionId = params.id as string;
  
  const { useMission, submitMission } = useMissions();
  const { data: mission, isLoading } = useMission(missionId);
  
  const [notes, setNotes] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [githubUrl, setGithubUrl] = useState('');
  const [notebookUrl, setNotebookUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');

  const reqs = (mission as { submission_requirements?: Record<string, unknown> })?.submission_requirements || {};
  const notesRequired = (reqs.notes_required ?? true) as boolean;
  const notesMinChars = Math.max(10, Number(reqs.notes_min_chars ?? 20));
  const filesRequired = (reqs.files_required ?? false) as boolean;
  const githubRequired = (reqs.github_required ?? false) as boolean;
  const notebookRequired = (reqs.notebook_required ?? false) as boolean;
  const videoRequired = (reqs.video_required ?? false) as boolean;

  const canSubmit = () => {
    if (notesRequired && notes.trim().length < notesMinChars) return false;
    if (filesRequired && files.length === 0) return false;
    if (githubRequired && !githubUrl?.trim()) return false;
    if (notebookRequired && !notebookUrl?.trim()) return false;
    if (videoRequired && !videoUrl?.trim()) return false;
    return true;
  };

  const getMissingRequirements = () => {
    const m: string[] = [];
    if (notesRequired && notes.trim().length < notesMinChars) m.push(`Notes (at least ${notesMinChars} characters)`);
    if (filesRequired && files.length === 0) m.push('Upload at least one file');
    if (githubRequired && !githubUrl?.trim()) m.push('GitHub Repository URL');
    if (notebookRequired && !notebookUrl?.trim()) m.push('Notebook URL');
    if (videoRequired && !videoUrl?.trim()) m.push('Video Demo URL');
    return m;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const missing = getMissingRequirements();
    if (missing.length > 0) {
      alert('Missing required items: ' + missing.join(', '));
      return;
    }

    try {
      const formData = new FormData();
      formData.append('notes', notes);
      
      // Only add files if there are any
      if (files.length > 0) {
        files.forEach(file => {
          formData.append('files', file);
        });
      }
      
      if (githubUrl) formData.append('github_url', githubUrl);
      if (notebookUrl) formData.append('notebook_url', notebookUrl);
      if (videoUrl) formData.append('video_url', videoUrl);

      await submitMission.mutateAsync({ missionId, submission: formData });
      
      // Redirect to mission detail page
      router.push(`/dashboard/student/missions/${missionId}`);
    } catch (error) {
      console.error('Submission failed:', error);
      alert('Submission failed. Please try again.');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 bg-slate-950 min-h-screen">
        <div className="text-white">Loading mission...</div>
      </div>
    );
  }

  if (!mission) {
    return (
      <div className="p-6 bg-slate-950 min-h-screen">
        <div className="text-white">Mission not found</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-slate-950 min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">
          Submit Mission: {mission.code}
        </h1>
        <p className="text-gray-300">{mission.title}</p>
      </div>

      <div className="bg-green-900/20 border border-green-800 rounded-lg p-4 mb-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-green-200">
              All subtasks completed!
            </h3>
            <p className="text-sm text-green-300 mt-1">
              Ready to submit your mission for AI review.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Requirements banner when not met */}
        {!canSubmit() && getMissingRequirements().length > 0 && (
          <div className="p-4 rounded-lg bg-amber-500/15 border border-amber-500/40">
            <p className="text-amber-200 font-semibold mb-1">Complete required items before submitting</p>
            <ul className="text-amber-200/90 text-sm list-disc list-inside">
              {getMissingRequirements().map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Notes Section */}
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-white mb-2">
            Mission Notes & Reflection {notesRequired && <span className="text-amber-400">*</span>}
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={6}
            className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
            placeholder="Describe your approach, challenges faced, lessons learned..."
          />
        </div>

        {/* File Upload */}
        <div>
          <label htmlFor="files" className="block text-sm font-medium text-white mb-2">
            Upload Files {filesRequired && <span className="text-amber-400">*</span>}
          </label>
          <input
            type="file"
            id="files"
            multiple
            onChange={handleFileChange}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-md text-white file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
          />
          {files.length > 0 && (
            <div className="mt-2">
              <p className="text-sm text-gray-400">Selected files:</p>
              <ul className="text-sm text-gray-200">
                {files.map((file, index) => (
                  <li key={index}>• {file.name}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* URL Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="github" className="block text-sm font-medium text-white mb-2">
              GitHub Repository {githubRequired && <span className="text-amber-400">*</span>}
            </label>
            <input
              type="url"
              id="github"
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              placeholder="https://github.com/..."
              className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-md text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
            />
          </div>
          
          <div>
            <label htmlFor="notebook" className="block text-sm font-medium text-white mb-2">
              Notebook URL {notebookRequired && <span className="text-amber-400">*</span>}
            </label>
            <input
              type="url"
              id="notebook"
              value={notebookUrl}
              onChange={(e) => setNotebookUrl(e.target.value)}
              placeholder="https://colab.research.google.com/..."
              className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-md text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
            />
          </div>
          
          <div>
            <label htmlFor="video" className="block text-sm font-medium text-white mb-2">
              Video Demo URL {videoRequired && <span className="text-amber-400">*</span>}
            </label>
            <input
              type="url"
              id="video"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://youtube.com/..."
              className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-md text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-between">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 text-gray-300 bg-slate-700 rounded-md hover:bg-slate-600"
          >
            Back
          </button>
          
          <button
            type="submit"
            disabled={submitMission.isPending || !canSubmit()}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            title={!canSubmit() ? getMissingRequirements().join('; ') : undefined}
          >
            {submitMission.isPending ? 'Submitting...' : 'Submit for AI Review'}
          </button>
        </div>
      </form>
    </div>
  );
}
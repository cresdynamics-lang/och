'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { CohortsSidebar } from './components/CohortsSidebar';
import { NewCohortModal } from './components/NewCohortModal';
import { CohortCard } from './components/CohortCard';

export default function CohortsPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [newCohortModalOpen, setNewCohortModalOpen] = useState(false);

  const handleNewCohort = () => {
    setNewCohortModalOpen(true);
  };

  const handleCreateCohort = async (cohortData: any) => {
    try {
      const response = await fetch(`/api/sponsors/${slug}/cohorts/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Add auth header when authentication is implemented
        },
        body: JSON.stringify(cohortData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create cohort');
      }

      const result = await response.json();

      // Redirect to the new cohort dashboard
      router.push(`/sponsor/${slug}/cohort/${result.cohort_id}/dashboard`);

    } catch (error: any) {
      console.error('Error creating cohort:', error);
      throw error;
    }
  };

  const handleCohortAction = (action: string, cohortId: string) => {
    switch (action) {
      case 'edit':
        // TODO: Open edit modal
        console.log('Edit cohort:', cohortId);
        break;
      case 'boost':
        // TODO: Open AI boost modal
        console.log('Boost cohort:', cohortId);
        break;
      case 'add_students':
        // TODO: Open add students modal
        console.log('Add students to cohort:', cohortId);
        break;
      case 'export':
        // TODO: Trigger export
        console.log('Export cohort:', cohortId);
        break;
      default:
        console.log('Unknown action:', action, 'for cohort:', cohortId);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Cohorts Sidebar */}
      <CohortsSidebar
        sponsorSlug={slug}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onCohortAction={handleCohortAction}
        onNewCohort={handleNewCohort}
      />

      {/* Main Content Area */}
      <div className="md:ml-80">
        {/* Mobile Header */}
        <div className="md:hidden p-4 border-b border-slate-800">
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex items-center gap-2 text-white"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <span>Cohorts</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="max-w-6xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-white mb-2">Cohort Management</h1>
              <p className="text-slate-400">
                Manage your cybersecurity talent cohorts, track progress, and deploy AI interventions.
              </p>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-6 text-center">
                <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <h3 className="text-white font-semibold mb-2">Create Cohort</h3>
                <p className="text-slate-400 text-sm mb-4">
                  Start a new cohort with track selection and goals
                </p>
                <button
                  onClick={handleNewCohort}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
                >
                  Create New Cohort
                </button>
              </div>

              <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-6 text-center">
                <div className="w-12 h-12 bg-emerald-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-white font-semibold mb-2">View Analytics</h3>
                <p className="text-slate-400 text-sm mb-4">
                  Comprehensive cohort performance analytics
                </p>
                <button
                  onClick={() => router.push(`/sponsor/${slug}/dashboard`)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
                >
                  View Dashboard
                </button>
              </div>

              <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-6 text-center">
                <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h3 className="text-white font-semibold mb-2">Bulk Operations</h3>
                <p className="text-slate-400 text-sm mb-4">
                  Import students, export reports, and manage cohorts
                </p>
                <button
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
                >
                  Bulk Tools
                </button>
              </div>
            </div>

            {/* Recent Cohorts Preview */}
            <div>
              <h2 className="text-xl font-semibold text-white mb-4">Recent Cohorts</h2>
              <p className="text-slate-400 mb-6">
                Your cohorts are displayed in the sidebar. Use the menu button on mobile to access them.
              </p>

              {/* Mobile: Show a few cohort cards */}
              <div className="md:hidden grid gap-4">
                {/* Mock cohort cards for mobile preview */}
                <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-medium">Jan 2026 - Defender</span>
                    <span className="text-emerald-400 text-sm">🟢 Active</span>
                  </div>
                  <p className="text-slate-400 text-sm">127/187 students • 68% complete</p>
                  <button
                    onClick={() => router.push(`/sponsor/${slug}/cohort/mock-id/dashboard`)}
                    className="mt-2 text-blue-400 text-sm hover:text-blue-300"
                  >
                    View Dashboard →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* New Cohort Modal */}
      <NewCohortModal
        isOpen={newCohortModalOpen}
        onClose={() => setNewCohortModalOpen(false)}
        onCreateCohort={handleCreateCohort}
        sponsorSlug={slug}
      />
    </div>
  );
}

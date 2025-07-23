import React, { useState, useEffect } from 'react';
import { Modal, Badge, EmptyState, WelcomeBanner, DiagnosticModal } from '../components';
import { LinkList } from '../components/links/LinkList';
import { LinkForm } from '../components/links/LinkForm';
import { LinkFilters } from '../components/links/LinkFilters';
import { useLinkStore } from '../stores/linkStore';
import { useSettingsStore } from '../stores/settingsStore';
import { useHotkeys } from '../hooks/useHotkeys';
import { diagnosticService } from '../services/diagnosticService';
import { AlertTriangle, Settings, Plus, BarChart3, Filter, Search } from 'lucide-react';

export const LinksPage: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [diagnosticOpen, setDiagnosticOpen] = useState(false);
  const [issueNotification, setIssueNotification] = useState<{
    show: boolean;
    critical: number;
    warnings: number;
  }>({ show: false, critical: 0, warnings: 0 });
  const { rawLinks, setStatusFilter } = useLinkStore();
  const { setShowOnboarding, hasSeenOnboarding, setDontShowOnboarding } = useSettingsStore();

  const total = rawLinks.length;
  const active = rawLinks.filter((l) => l.status === 'active').length;
  const archived = rawLinks.filter((l) => l.status === 'archived').length;
  const highPriority = rawLinks.filter((l) => l.priority === 'high').length;

  const handleShowOnboarding = () => {
    // Reset the "don't show again" preference when manually showing onboarding
    setDontShowOnboarding(false);
    setShowOnboarding(true);
  };

  const handleShowDiagnostics = () => {
    setDiagnosticOpen(true);
  };

  const isNewUser = total === 0 && !hasSeenOnboarding;

  // Automatic issue detection
  useEffect(() => {
    const checkForIssues = async () => {
      try {
        const issueSummary = await diagnosticService.getIssueSummary();
        if (issueSummary.total > 0) {
          setIssueNotification({
            show: true,
            critical: issueSummary.critical,
            warnings: issueSummary.warnings
          });
        }
      } catch (error) {
        console.error('Failed to run automatic diagnostics:', error);
      }
    };

    // Run diagnostics after a short delay to avoid blocking the UI
    const timer = setTimeout(checkForIssues, 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Research Links</h1>
              <p className="text-gray-600 mt-1">Save, organize, and chat with your web research</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleShowOnboarding}
                className="inline-flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 bg-white hover:bg-gray-50 rounded-xl border border-gray-200 hover:border-gray-300 transition-all duration-200 shadow-sm hover:shadow-md"
                title="Show setup guide"
              >
                <span className="text-sm font-medium">Help</span>
              </button>
              <button
                onClick={handleShowDiagnostics}
                className="inline-flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 bg-white hover:bg-gray-50 rounded-xl border border-gray-200 hover:border-gray-300 transition-all duration-200 shadow-sm hover:shadow-md"
                title="Run system diagnostics"
              >
                <Settings className="w-4 h-4" />
                <span className="text-sm font-medium">Diagnostics</span>
              </button>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">Total Links</p>
                  <p className="text-2xl font-bold text-blue-900">{total}</p>
                </div>
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-4 h-4 text-blue-600" />
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">Active</p>
                  <p className="text-2xl font-bold text-green-900">{active}</p>
                </div>
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-yellow-600">Archived</p>
                  <p className="text-2xl font-bold text-yellow-900">{archived}</p>
                </div>
                <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-600">High Priority</p>
                  <p className="text-2xl font-bold text-red-900">{highPriority}</p>
                </div>
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Welcome banner for new users */}
        {isNewUser && <WelcomeBanner />}

        {/* Subtle Issue notification banner - positioned lower */}
        {issueNotification.show && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  <AlertTriangle className="w-4 h-4 text-gray-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-600">
                    {issueNotification.critical > 0 && (
                      <span className="font-medium text-gray-700">
                        {issueNotification.critical} issue{issueNotification.critical > 1 ? 's' : ''}
                      </span>
                    )}
                    {issueNotification.critical > 0 && issueNotification.warnings > 0 && ' and '}
                    {issueNotification.warnings > 0 && (
                      <span className="font-medium text-gray-700">
                        {issueNotification.warnings} warning{issueNotification.warnings > 1 ? 's' : ''}
                      </span>
                    )}
                    {' '}detected. 
                    <button
                      onClick={() => setDiagnosticOpen(true)}
                      className="text-blue-600 hover:text-blue-800 font-medium ml-1 underline"
                    >
                      Run diagnostics
                    </button>
                    {' '}for details.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIssueNotification({ show: false, critical: 0, warnings: 0 })}
                className="text-gray-400 hover:text-gray-600 text-sm"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Filters and Actions Bar */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1">
              <div className="flex items-center gap-2 text-gray-500">
                <Search className="w-4 h-4" />
                <span className="text-sm font-medium">Filters</span>
              </div>
              <LinkFilters />
            </div>
            <button
              onClick={() => setOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <Plus className="w-4 h-4" />
              Add Link
            </button>
          </div>
        </div>

        {/* Links Content */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {total === 0 ? (
            <EmptyState
              type="links"
              onAction={() => setOpen(true)}
              showOnboarding={true}
              onShowOnboarding={handleShowOnboarding}
            />
          ) : (
            <LinkList />
          )}
        </div>
      </div>

      {/* Modals */}
      <Modal isOpen={open} onClose={() => setOpen(false)} title="Add Link">
        <LinkForm onSuccess={() => setOpen(false)} />
      </Modal>

      <DiagnosticModal 
        isOpen={diagnosticOpen} 
        onClose={() => setDiagnosticOpen(false)} 
      />
    </div>
  );
};

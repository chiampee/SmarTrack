import React, { useState, useEffect } from 'react';
import { Modal, Badge, EmptyState, WelcomeBanner, DiagnosticModal } from '../components';
import { LinkList } from '../components/links/LinkList';
import { LinkForm } from '../components/links/LinkForm';
import { LinkFilters } from '../components/links/LinkFilters';
import { useLinkStore } from '../stores/linkStore';
import { useSettingsStore } from '../stores/settingsStore';
import { useHotkeys } from '../hooks/useHotkeys';
import { diagnosticService } from '../services/diagnosticService';
import { useSettings } from '../contexts/SettingsContext';
import { AlertTriangle, Plus, BarChart3 } from 'lucide-react';


export const LinksPage: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [issueNotification, setIssueNotification] = useState<{
    show: boolean;
    critical: number;
    warnings: number;
  }>({ show: false, critical: 0, warnings: 0 });
  const { rawLinks, setStatusFilter } = useLinkStore();
  const { hasSeenOnboarding } = useSettingsStore();
  const settings = useSettings();
  const { showOnboarding, showDiagnostics } = settings;

  const total = rawLinks.length;
  const active = rawLinks.filter((l) => l.status === 'active').length;
  const archived = rawLinks.filter((l) => l.status === 'archived').length;
  const highPriority = rawLinks.filter((l) => l.priority === 'high').length;



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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      {/* Page Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/60 px-6 py-4">
        <div className="max-w-full mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <BarChart3 className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                    Research Links
                  </h1>
                  <p className="text-gray-600 text-sm">Save, organize, and chat with your web research</p>
                </div>
              </div>
            </div>

          </div>

          {/* Compact Stats Overview */}
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-gray-600">Total:</span>
              <span className="font-semibold text-gray-900">{total}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-gray-600">Active:</span>
              <span className="font-semibold text-green-600">{active}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <span className="text-gray-600">Archived:</span>
              <span className="font-semibold text-orange-600">{archived}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span className="text-gray-600">Priority:</span>
              <span className="font-semibold text-red-600">{highPriority}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-full mx-auto px-6 py-4">
        {/* Welcome banner for new users */}
        {isNewUser && <WelcomeBanner />}

        {/* Clean Issue notification banner */}
        {issueNotification.show && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  <div className="w-6 h-6 bg-amber-500 rounded-md flex items-center justify-center">
                    <AlertTriangle className="w-3 h-3 text-white" />
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-xs text-amber-800">
                    {issueNotification.critical > 0 && (
                      <span className="font-semibold text-amber-900">
                        {issueNotification.critical} issue{issueNotification.critical > 1 ? 's' : ''}
                      </span>
                    )}
                    {issueNotification.critical > 0 && issueNotification.warnings > 0 && ' and '}
                    {issueNotification.warnings > 0 && (
                      <span className="font-semibold text-amber-900">
                        {issueNotification.warnings} warning{issueNotification.warnings > 1 ? 's' : ''}
                      </span>
                    )}
                    {' '}detected. 
                    <button
                      onClick={showDiagnostics}
                      className="text-blue-600 hover:text-blue-800 font-semibold ml-1 underline"
                    >
                      Run diagnostics
                    </button>
                    {' '}for details.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIssueNotification({ show: false, critical: 0, warnings: 0 })}
                className="text-amber-500 hover:text-amber-700 text-sm w-5 h-5 flex items-center justify-center rounded hover:bg-amber-100 transition-colors"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Clean Filters and Actions Bar */}
        <div className="bg-white/90 backdrop-blur-sm rounded-lg border border-gray-200/50 p-3 mb-4 shadow-sm relative z-50">
          <div className="flex items-center justify-between">
            <LinkFilters />
            <div className="flex items-center gap-2">
              <button
                onClick={() => setOpen(true)}
                className="group inline-flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
              >
                <Plus className="w-4 h-4" />
                Add Link
              </button>

            </div>
          </div>
        </div>

        {/* Enhanced Links Content */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200/60 shadow-md overflow-hidden">
          {total === 0 ? (
            <EmptyState
              type="links"
              onAction={() => setOpen(true)}
              showOnboarding={true}
              onShowOnboarding={showOnboarding}
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
        </div>
  );
};

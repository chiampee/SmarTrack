import React, { useEffect, useState } from 'react';
import { useBoardStore } from '../../stores/boardStore';
import { useLinkStore } from '../../stores/linkStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { useSettings } from '../../contexts/SettingsContext';
import { Link, useLocation } from 'react-router-dom';
import { Modal, Button, QuickStartGuide } from '..';
import { LinkForm } from '../links/LinkForm';
import { 
  Plus, 
  Trash2, 
  MessageSquare, 
  BookOpen, 
  Settings, 
  BarChart3,
  FolderOpen,
  Sparkles,
  HelpCircle,
  Activity,
  ChevronDown,
  ChevronRight,
  RefreshCcw
} from 'lucide-react';

export const Sidebar: React.FC<{ open: boolean; onClose: () => void }> = ({
  open,
  onClose,
}) => {
  const { boards, loadBoards } = useBoardStore();
  const { clearAll, rawLinks } = useLinkStore();
  const { hasSeenOnboarding } = useSettingsStore();
  const { showOnboarding, showDiagnostics } = useSettings();
  const location = useLocation();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    loadBoards();
  }, [loadBoards]);

  const isNewUser = rawLinks.length === 0 && !hasSeenOnboarding;
  const isLinksPage = location.pathname === '/';

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-10 bg-black/30 md:hidden"
          onClick={onClose}
        />
      )}
              <aside
          className={`fixed top-12 inset-y-0 left-0 z-20 w-64 transform bg-white/90 backdrop-blur-sm border-r border-gray-200/60 shadow-xl transition-transform md:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
        >
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-4 border-b border-gray-200/60 bg-gradient-to-r from-gray-50 to-blue-50/30">
              <h1 className="text-lg font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">Navigation</h1>
            </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {/* Quick Start Guide for new users */}
            {isNewUser && <QuickStartGuide />}

            {/* Boards Section */}
            {boards.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center">
                    <FolderOpen className="w-3 h-3 text-blue-600" />
                  </div>
                  <h2 className="text-xs font-bold text-gray-800 uppercase tracking-wide">Boards</h2>
                </div>
                <nav className="space-y-1">
                  {boards.map((b) => (
                    <Link
                      key={b.id}
                      to="/boards"
                      className="group flex items-center gap-2 px-3 py-2 text-xs text-gray-600 hover:text-gray-900 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 rounded-lg transition-all duration-300"
                      onClick={onClose}
                    >
                      <BookOpen className="w-3 h-3 group-hover:scale-110 transition-transform duration-300" />
                      <span className="truncate font-medium">{b.title}</span>
                    </Link>
                  ))}
                </nav>
              </div>
            )}

            {/* Quick Actions Section */}
            {isLinksPage && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg flex items-center justify-center">
                    <Sparkles className="w-3 h-3 text-purple-600" />
                  </div>
                  <h2 className="text-xs font-bold text-gray-800 uppercase tracking-wide">Quick Actions</h2>
                </div>
                <div className="space-y-2">
                  <Button
                    size="sm"
                    variant="primary"
                    className="group w-full justify-start gap-2 px-3 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
                    onClick={() => setAddOpen(true)}
                  >
                    <Plus className="w-3 h-3 group-hover:rotate-90 transition-transform duration-300" />
                    Add Link
                  </Button>

                  {rawLinks.length > 0 && (
                    <Button
                      size="sm"
                      variant="secondary"
                      className="group w-full justify-start gap-2 px-3 py-2 bg-white/80 hover:bg-white border border-gray-200/60 hover:border-gray-300 text-gray-700 hover:text-gray-900 font-semibold rounded-lg shadow-sm hover:shadow-md transition-all duration-300 backdrop-blur-sm"
                      onClick={() => setConfirmOpen(true)}
                    >
                      <Trash2 className="w-3 h-3 group-hover:scale-110 transition-transform duration-300" />
                      Delete All
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Main Navigation Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-gradient-to-br from-indigo-100 to-blue-100 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-3 h-3 text-indigo-600" />
                </div>
                <h2 className="text-xs font-bold text-gray-800 uppercase tracking-wide">Navigation</h2>
              </div>
              <nav className="space-y-1">
                <Link 
                  to="/" 
                  className={`group flex items-center gap-2 px-3 py-2 text-xs rounded-lg transition-all duration-300 ${
                    location.pathname === '/'
                      ? 'bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 border border-blue-200 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50'
                  }`}
                  onClick={onClose}
                >
                  <BookOpen className={`w-3 h-3 ${location.pathname === '/' ? 'text-blue-600' : 'text-gray-500'} group-hover:scale-110 transition-transform duration-300`} />
                  <span className="font-medium">Links</span>
                </Link>
                <Link 
                  to="/boards" 
                  className={`group flex items-center gap-3 px-4 py-3 text-sm rounded-xl transition-all duration-300 ${
                    location.pathname === '/boards'
                      ? 'bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 border border-blue-200 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50'
                  }`}
                  onClick={onClose}
                >
                  <FolderOpen className={`w-4 h-4 ${location.pathname === '/boards' ? 'text-blue-600' : 'text-gray-500'} group-hover:scale-110 transition-transform duration-300`} />
                  <span className="font-medium">Boards</span>
                  <span className="ml-auto text-xs bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700 px-2 py-1 rounded-full font-semibold border border-amber-200">Soon</span>
                </Link>
                <Link 
                  to="/tasks" 
                  className={`group flex items-center gap-3 px-4 py-3 text-sm rounded-xl transition-all duration-300 ${
                    location.pathname === '/tasks'
                      ? 'bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 border border-blue-200 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50'
                  }`}
                  onClick={onClose}
                >
                  <Sparkles className={`w-4 h-4 ${location.pathname === '/tasks' ? 'text-blue-600' : 'text-gray-500'} group-hover:scale-110 transition-transform duration-300`} />
                  <span className="font-medium">Tasks</span>
                  <span className="ml-auto text-xs bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700 px-2 py-1 rounded-full font-semibold border border-amber-200">Soon</span>
                </Link>
                <Link 
                  to="/chat-history" 
                  className={`group flex items-center gap-3 px-4 py-3 text-sm rounded-xl transition-all duration-300 ${
                    location.pathname === '/chat-history'
                      ? 'bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 border border-blue-200 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50'
                  }`}
                  onClick={onClose}
                >
                  <MessageSquare className={`w-4 h-4 ${location.pathname === '/chat-history' ? 'text-blue-600' : 'text-gray-500'} group-hover:scale-110 transition-transform duration-300`} />
                  <span className="font-medium">Chat History</span>
                </Link>
                <div className="space-y-1">
                  <button 
                    onClick={() => setSettingsOpen(!settingsOpen)}
                    className="group flex items-center gap-3 px-4 py-3 text-sm text-gray-600 hover:text-gray-900 hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50 rounded-xl transition-all duration-300 w-full"
                  >
                    <Settings className="w-4 h-4 text-gray-500 group-hover:scale-110 transition-transform duration-300" />
                    <span className="font-medium">Settings & Help</span>
                    {settingsOpen ? (
                      <ChevronDown className="w-4 h-4 text-gray-400 ml-auto" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-400 ml-auto" />
                    )}
                  </button>
                  
                  {settingsOpen && (
                    <div className="ml-6 space-y-1">
                      <button 
                        onClick={() => {
                          showOnboarding();
                          onClose();
                        }}
                        className="group flex items-center gap-2 px-3 py-2 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors duration-200 w-full"
                      >
                        <HelpCircle className="w-3 h-3 text-gray-400" />
                        <span>Help & Setup</span>
                      </button>
                      <button 
                        onClick={() => {
                          showDiagnostics();
                          onClose();
                        }}
                        className="group flex items-center gap-2 px-3 py-2 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors duration-200 w-full"
                      >
                        <Activity className="w-3 h-3 text-gray-400" />
                        <span>Diagnostics</span>
                      </button>
                      <Link 
                        to="/database-tests"
                        onClick={onClose}
                        className="group flex items-center gap-2 px-3 py-2 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors duration-200 w-full"
                      >
                        <BarChart3 className="w-3 h-3 text-gray-400" />
                        <span>Database Tests</span>
                      </Link>
                      <button 
                        onClick={() => {
                          setConfirmOpen(true);
                          onClose();
                        }}
                        className="group flex items-center gap-2 px-3 py-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors duration-200 w-full"
                      >
                        <Trash2 className="w-3 h-3 text-red-400" />
                        <span>Clear All Links</span>
                      </button>
                      {/* Development only - Reset Onboarding */}
                      {import.meta.env.DEV && (
                        <button 
                          onClick={() => {
                            useSettingsStore.getState().resetOnboarding();
                            onClose();
                          }}
                          className="group flex items-center gap-2 px-3 py-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors duration-200 w-full"
                        >
                          <RefreshCcw className="w-3 h-3 text-red-400" />
                          <span>Reset Onboarding (Dev)</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </nav>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200/60 bg-gradient-to-r from-gray-50 to-blue-50/30">
            <div className="text-xs text-gray-600 text-center font-medium">
              Smart Research Tracker v1.0
            </div>
          </div>
        </div>

        {/* Add Link modal */}
        <Modal isOpen={addOpen} onClose={() => setAddOpen(false)} title="Add Link">
          <LinkForm onSuccess={() => setAddOpen(false)} />
        </Modal>

        {/* Confirm modal */}
        <Modal
          isOpen={confirmOpen}
          onClose={() => setConfirmOpen(false)}
          title="Clear All Links"
          footer={
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setConfirmOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={async () => {
                  await clearAll();
                  setConfirmOpen(false);
                  onClose();
                  
                  // Force a page refresh after clearing to ensure clean state
                  setTimeout(() => {
                    console.log('🔄 Reloading page to ensure clean state');
                    window.location.reload();
                  }, 2000);
                }}
              >
                Clear All Links
              </Button>
            </div>
          }
        >
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
              <Trash2 className="w-5 h-5 text-red-600" />
              <div>
                <h3 className="font-medium text-red-900">Warning</h3>
                <p className="text-sm text-red-700">This action cannot be undone.</p>
              </div>
            </div>
            <p className="text-gray-700">
              Are you sure you want to clear all {rawLinks.length} links from your database? This will permanently remove all your saved research links, summaries, and chat history.
            </p>
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> This will also clear any AI summaries and chat conversations associated with these links.
              </p>
            </div>
          </div>
        </Modal>
      </aside>
    </>
  );
};

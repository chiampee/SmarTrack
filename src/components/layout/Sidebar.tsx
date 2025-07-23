import React, { useEffect, useState } from 'react';
import { useBoardStore } from '../../stores/boardStore';
import { useLinkStore } from '../../stores/linkStore';
import { useSettingsStore } from '../../stores/settingsStore';
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
  Sparkles
} from 'lucide-react';

export const Sidebar: React.FC<{ open: boolean; onClose: () => void }> = ({
  open,
  onClose,
}) => {
  const { boards, loadBoards } = useBoardStore();
  const { clearAll, rawLinks } = useLinkStore();
  const { hasSeenOnboarding } = useSettingsStore();
  const location = useLocation();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  useEffect(() => {
    loadBoards();
  }, [loadBoards]);

  const isNewUser = rawLinks.length === 0 && !hasSeenOnboarding;
  const isLinksPage = location.pathname === '/links';

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-10 bg-black/30 md:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={`fixed top-14 inset-y-0 left-0 z-20 w-64 transform bg-white border-r border-gray-200 shadow-sm transition-transform md:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-gray-100">
            <h1 className="text-lg font-semibold text-gray-900">Navigation</h1>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {/* Quick Start Guide for new users */}
            {isNewUser && <QuickStartGuide />}

            {/* Boards Section */}
            {boards.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <FolderOpen className="w-4 h-4 text-gray-500" />
                  <h2 className="text-sm font-semibold text-gray-700">Boards</h2>
                </div>
                <nav className="space-y-1">
                  {boards.map((b) => (
                    <Link
                      key={b.id}
                      to="/"
                      className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
                      onClick={onClose}
                    >
                      <BookOpen className="w-4 h-4" />
                      <span className="truncate">{b.title}</span>
                    </Link>
                  ))}
                </nav>
              </div>
            )}

            {/* Quick Actions Section */}
            {isLinksPage && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-gray-500" />
                  <h2 className="text-sm font-semibold text-gray-700">Quick Actions</h2>
                </div>
                <div className="space-y-2">
                  <Button
                    size="sm"
                    variant="primary"
                    className="w-full justify-start gap-2"
                    onClick={() => setAddOpen(true)}
                  >
                    <Plus className="w-4 h-4" />
                    Add Link
                  </Button>
                  {rawLinks.length > 0 && (
                    <Button
                      size="sm"
                      variant="secondary"
                      className="w-full justify-start gap-2"
                      onClick={() => setConfirmOpen(true)}
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete All
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Navigation Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-gray-500" />
                <h2 className="text-sm font-semibold text-gray-700">Navigation</h2>
              </div>
              <nav className="space-y-1">
                <Link 
                  to="/chat-history" 
                  className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${
                    location.pathname === '/chat-history'
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                  onClick={onClose}
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Chat History</span>
                </Link>
                <button 
                  className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors w-full"
                >
                  <Settings className="w-4 h-4" />
                  <span>Settings</span>
                </button>
              </nav>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-100">
            <div className="text-xs text-gray-500 text-center">
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
          title="Delete All Links"
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
                }}
              >
                Delete All
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
              Are you sure you want to delete all {rawLinks.length} links? This will permanently remove all your saved research links.
            </p>
          </div>
        </Modal>
      </aside>
    </>
  );
};

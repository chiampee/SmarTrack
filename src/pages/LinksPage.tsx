import React, { useState } from 'react';
import { Modal, Badge, EmptyState, WelcomeBanner } from '../components';
import { LinkList } from '../components/links/LinkList';
import { LinkForm } from '../components/links/LinkForm';
import { LinkFilters } from '../components/links/LinkFilters';
import { useLinkStore } from '../stores/linkStore';
import { useSettingsStore } from '../stores/settingsStore';
import { useHotkeys } from '../hooks/useHotkeys';

export const LinksPage: React.FC = () => {
  const [open, setOpen] = useState(false);
  const { rawLinks, setStatusFilter } = useLinkStore();
  const { setShowOnboarding, hasSeenOnboarding } = useSettingsStore();

  useHotkeys({
    '/': () => {
      const el = document.getElementById('searchInput') as HTMLInputElement | null;
      el?.focus();
    },
    'Mod+k': () => setOpen(true),
  });

  const total = rawLinks.length;
  const active = rawLinks.filter((l) => l.status === 'active').length;
  const archived = rawLinks.filter((l) => l.status === 'archived').length;
  const highPrio = rawLinks.filter((l) => l.priority === 'high').length;

  const handleShowOnboarding = () => {
    setShowOnboarding(true);
  };

  const isNewUser = total === 0 && !hasSeenOnboarding;

  return (
    <div className="pt-0 px-4 pb-4">
      <div className="mb-4 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">Research Links</h1>
          <p className="text-sm text-gray-600 mt-1">
            Save, organize, and chat with your web research
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleShowOnboarding}
            className="text-sm text-gray-600 hover:text-gray-900 px-3 py-1 rounded-md hover:bg-gray-100 transition-colors"
            title="Show setup guide"
          >
            Help
          </button>
        </div>
      </div>

      {/* Welcome banner for new users */}
      {isNewUser && <WelcomeBanner />}

      {/* Stats bar */}
      {total > 0 && (
        <div className="flex flex-wrap gap-3 mb-3 text-sm">
          <button
            className="flex items-center gap-1 focus:outline-none hover:bg-gray-100 px-2 py-1 rounded transition-colors"
            onClick={() => setStatusFilter(undefined)}
            title="Show all"
          >
            <Badge>{total}</Badge> Total
          </button>
          <button
            className="flex items-center gap-1 focus:outline-none hover:bg-gray-100 px-2 py-1 rounded transition-colors"
            onClick={() => setStatusFilter('active')}
            title="Filter Active"
          >
            <Badge variant="success">{active}</Badge> Active
          </button>
          <button
            className="flex items-center gap-1 focus:outline-none hover:bg-gray-100 px-2 py-1 rounded transition-colors"
            onClick={() => setStatusFilter('archived')}
            title="Filter Archived"
          >
            <Badge variant="warning">{archived}</Badge> Archived
          </button>
          <span className="flex items-center gap-1 px-2 py-1">
            <Badge variant="danger">{highPrio}</Badge> High Priority
          </span>
        </div>
      )}

      <LinkFilters />
      
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

      <Modal isOpen={open} onClose={() => setOpen(false)} title="Add Link">
        <LinkForm onSuccess={() => setOpen(false)} />
      </Modal>
    </div>
  );
};

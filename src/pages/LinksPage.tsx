import React, { useState } from 'react';
import { Modal, Badge } from '../components';
import { LinkList } from '../components/links/LinkList';
import { LinkForm } from '../components/links/LinkForm';
import { LinkFilters } from '../components/links/LinkFilters';
import { useLinkStore } from '../stores/linkStore';
import { useHotkeys } from '../hooks/useHotkeys';

export const LinksPage: React.FC = () => {
  const [open, setOpen] = useState(false);
  const { rawLinks } = useLinkStore();
  const { setStatusFilter } = useLinkStore();

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
  return (
    <div className="pt-0 px-4 pb-4">
      <div className="mb-4 flex justify-between">
        <h1 className="text-2xl font-semibold">Links</h1>
      </div>
      {/* Stats bar */}
      <div className="flex flex-wrap gap-3 mb-3 text-sm">
        <button
          className="flex items-center gap-1 focus:outline-none"
          onClick={() => setStatusFilter(undefined)}
          title="Show all"
        >
          <Badge>{total}</Badge> Total
        </button>
        <button
          className="flex items-center gap-1 focus:outline-none"
          onClick={() => setStatusFilter('active')}
          title="Filter Active"
        >
          <Badge variant="success">{active}</Badge> Active
        </button>
        <button
          className="flex items-center gap-1 focus:outline-none"
          onClick={() => setStatusFilter('archived')}
          title="Filter Archived"
        >
          <Badge variant="warning">{archived}</Badge> Archived
        </button>
        <span>
          <Badge variant="danger">{highPrio}</Badge> High Priority
        </span>
      </div>
      <LinkFilters />
      <LinkList />
      <Modal isOpen={open} onClose={() => setOpen(false)} title="Add Link">
        <LinkForm onSuccess={() => setOpen(false)} />
      </Modal>
    </div>
  );
};

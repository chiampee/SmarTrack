import React, { useState } from 'react';
import { Button, Modal, Badge } from '../components';
import { LinkList } from '../components/links/LinkList';
import { LinkForm } from '../components/links/LinkForm';
import { LinkFilters } from '../components/links/LinkFilters';
import { useLinkStore } from '../stores/linkStore';

export const LinksPage: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { rawLinks, clearAll } = useLinkStore();

  const total = rawLinks.length;
  const active = rawLinks.filter((l) => l.status === 'active').length;
  const archived = rawLinks.filter((l) => l.status === 'archived').length;
  const highPrio = rawLinks.filter((l) => l.priority === 'high').length;
  return (
    <div className="pt-0 px-4 pb-4">
      <div className="mb-4 flex justify-between">
        <h1 className="text-2xl font-semibold">Links</h1>
        <div className="flex gap-3">
          <Button onClick={() => setOpen(true)}>Add Link</Button>
          {rawLinks.length > 0 && (
            <Button variant="danger" onClick={() => setConfirmOpen(true)}>
              Delete All
            </Button>
          )}
        </div>
      </div>
      {/* Stats bar */}
      <div className="flex flex-wrap gap-3 mb-3 text-sm">
        <span>
          <Badge>{total}</Badge> Total
        </span>
        <span>
          <Badge variant="success">{active}</Badge> Active
        </span>
        <span>
          <Badge variant="warning">{archived}</Badge> Archived
        </span>
        <span>
          <Badge variant="danger">{highPrio}</Badge> High Priority
        </span>
      </div>
      <LinkFilters />
      <LinkList />
      <Modal isOpen={open} onClose={() => setOpen(false)} title="Add Link">
        <LinkForm onSuccess={() => setOpen(false)} />
      </Modal>

      {/* Confirm clear modal */}
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
              }}
            >
              Delete All
            </Button>
          </div>
        }
      >
        <p className="text-sm text-gray-700">
          Are you sure you want to delete <strong>all</strong> links and their summaries? This action cannot be undone.
        </p>
      </Modal>
    </div>
  );
};

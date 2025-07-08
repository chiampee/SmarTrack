import React, { useState } from 'react';
import { Button, Modal } from '../components';
import { LinkList } from '../components/links/LinkList';
import { LinkForm } from '../components/links/LinkForm';

export const LinksPage: React.FC = () => {
  const [open, setOpen] = useState(false);
  return (
    <div className="p-4">
      <div className="mb-4 flex justify-between">
        <h1 className="text-2xl font-semibold">Links</h1>
        <Button onClick={() => setOpen(true)}>Add Link</Button>
      </div>
      <LinkList />
      <Modal isOpen={open} onClose={() => setOpen(false)} title="Add Link">
        <LinkForm onSuccess={() => setOpen(false)} />
      </Modal>
    </div>
  );
}; 
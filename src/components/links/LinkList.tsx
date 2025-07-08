import React, { useEffect } from 'react';
import { useLinkStore } from '../../stores/linkStore';
import { LinkCard } from './LinkCard';
import { LoadingSpinner } from '..';

export const LinkList: React.FC = () => {
  const { links, loading, loadLinks } = useLinkStore();

  useEffect(() => {
    loadLinks();
  }, [loadLinks]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="flex flex-col gap-3">
      {links.map((l) => (
        <LinkCard key={l.id} link={l} />
      ))}
    </div>
  );
}; 
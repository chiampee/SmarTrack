import React from 'react';
import { Link as LinkType } from '../../types/Link';
import { Badge, Button } from '..';
import { useLinkStore } from '../../stores/linkStore';

export const LinkCard: React.FC<{ link: LinkType }> = ({ link }) => {
  const { deleteLink } = useLinkStore();
  return (
    <div className="flex gap-3 rounded border border-gray-200 p-3 shadow-sm hover:shadow">
      {link.metadata.image && (
        <img src={link.metadata.image} alt="thumb" className="h-16 w-16 rounded object-cover" />
      )}
      <div className="flex flex-1 flex-col gap-1">
        <a href={link.url} target="_blank" rel="noreferrer" className="font-medium text-blue-600">
          {link.metadata.title || link.url}
        </a>
        <p className="line-clamp-2 text-sm text-gray-600">{link.metadata.description}</p>
        <div className="flex items-center gap-2 text-xs">
          <Badge variant="warning">{link.priority}</Badge>
          <Badge>{link.status}</Badge>
        </div>
      </div>
      <Button
        variant="danger"
        size="sm"
        onClick={() => {
          if (confirm('Delete link?')) deleteLink(link.id);
        }}
      >
        Delete
      </Button>
    </div>
  );
}; 
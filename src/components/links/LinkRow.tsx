import React, { useState } from 'react';
import { Link as LinkType } from '../../types/Link';
import { Badge } from '..';
import { Circle, CheckCircle, MoreVertical } from 'lucide-react';
import { AISummaryModal } from '../ai/AISummaryModal';
import { Modal } from '..';
import { useLinkStore } from '../../stores/linkStore';
import { LinkForm } from './LinkForm';
import { ChatModal } from '../ai/ChatModal';

interface Props {
  link: LinkType;
  columns: string[];
  selectable?: boolean;
  selected?: boolean;
  onSelect?: (checked: boolean) => void;
}

const priorityVariant = {
  low: 'default',
  medium: 'success',
  high: 'warning',
} as const;

const statusVariant = {
  active: 'default',
  archived: 'warning',
  deleted: 'danger',
} as const;

export const LinkRow: React.FC<Props> = ({ link, columns, selectable = false, selected = false, onSelect }) => {
  const { updateLink, deleteLink } = useLinkStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [editing, setEditing] = useState<{
    field?: 'title' | 'labels' | 'priority' | 'status';
  }>({});
  const [draft, setDraft] = useState<string>('');

  const startEdit = (
    field: 'title' | 'labels' | 'priority' | 'status',
    value: string
  ) => {
    setEditing({ field });
    setDraft(value);
  };

  const commit = async () => {
    if (!editing.field) return;
    const changes: Partial<LinkType> = {};
    if (editing.field === 'title') {
      changes.metadata = { ...link.metadata, title: draft };
    }
    if (editing.field === 'labels') {
      changes.labels = draft
        .split(',')
        .map((l) => l.trim())
        .filter(Boolean);
    }
    if (editing.field === 'priority')
      changes.priority = draft as LinkType['priority'];
    if (editing.field === 'status')
      changes.status = draft as LinkType['status'];
    await updateLink(link.id, changes);
    setEditing({});
  };

  const cancel = () => setEditing({});

  const toggleDone = async () => {
    const newStatus = link.status === 'archived' ? 'active' : 'archived';
    await updateLink(link.id, { status: newStatus });
  };
  const handleDelete = async () => {
    await deleteLink(link.id);
    setMenuOpen(false);
  };

  const gridTemplate = {
    gridTemplateColumns: selectable
      ? `40px repeat(${columns.length + 1}, minmax(0, 1fr))`
      : `repeat(${columns.length + 1}, minmax(0, 1fr))`,
  } as React.CSSProperties;

  const renderCell = (col: string) => {
    switch (col) {
      case 'name':
        const displayName = (() => {
          let t = link.metadata.title?.trim();
          if (t) t = t.replace(/^title:\s*/i, '').trim();
          if (t && t !== link.url) return t;
          // fallback to domain
          try {
            const u = new URL(link.url.startsWith('http') ? link.url : `https://${link.url}`);
            let host = u.hostname;
            if (host.startsWith('www.')) host = host.slice(4);
            return host;
          } catch {
            return link.url;
          }
        })();
        return (
          <div className="flex items-center gap-2 truncate">
            <button
              type="button"
              aria-label={
                link.status === 'archived' ? 'Mark as active' : 'Mark as done'
              }
              onClick={toggleDone}
              className="group flex-shrink-0 rounded-full p-1 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {link.status === 'archived' ? (
                <CheckCircle
                  size={18}
                  className="text-green-600 transition-colors group-hover:text-green-700"
                />
              ) : (
                <Circle
                  size={18}
                  className="text-gray-400 transition-colors group-hover:text-gray-600"
                />
              )}
            </button>
            {editing.field === 'title' ? (
              <input
                className="w-full rounded border border-gray-300 px-1 text-sm"
                value={draft}
                autoFocus
                onChange={(e) => setDraft(e.target.value)}
                onBlur={commit}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commit();
                  if (e.key === 'Escape') cancel();
                }}
              />
            ) : (
              (() => {
                const limitWords = (str: string, maxWords: number) => {
                  const parts = str.split(/\s+/);
                  if (parts.length <= maxWords) return str;
                  return parts.slice(0, maxWords).join(' ') + '…';
                };
                const limited = limitWords(displayName, 6);
                return (
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-blue-600 hover:underline cursor-pointer line-clamp-1"
                    title={displayName}
                    onDoubleClick={() => startEdit('title', link.metadata.title || '')}
                  >
                    {limited}
                  </a>
                );
              })()
            )}
          </div>
        );
      case 'url':
        return (
          <div className="truncate">
            <a
              href={link.url}
              target="_blank"
              rel="noreferrer"
              className="text-blue-600 hover:underline truncate"
              title={link.url}
            >
              {(() => {
                try {
                  const u = new URL(link.url.startsWith('http') ? link.url : `https://${link.url}`);
                  let host = u.hostname;
                  if (host.startsWith('www.')) host = host.slice(4);
                  return host;
                } catch {
                  return link.url;
                }
              })()}
            </a>
          </div>
        );
      case 'created':
        return (
          <div className="text-xs text-gray-600">
            {new Date(link.createdAt).toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
        );
      case 'labels':
        return (
          <div
            className="text-xs text-gray-600 truncate cursor-pointer"
            onDoubleClick={() => startEdit('labels', link.labels.join(', '))}
          >
            {editing.field === 'labels' ? (
              <input
                className="w-full rounded border border-gray-300 px-1 text-xs"
                value={draft}
                autoFocus
                onChange={(e) => setDraft(e.target.value)}
                onBlur={commit}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commit();
                  if (e.key === 'Escape') cancel();
                }}
              />
            ) : (
              link.labels.join(', ')
            )}
          </div>
        );
      case 'priority':
        return (
          <div
            className="cursor-pointer"
            onDoubleClick={() => startEdit('priority', link.priority)}
          >
            {editing.field === 'priority' ? (
              <select
                className="rounded border border-gray-300 px-1 text-xs"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={commit}
                autoFocus
              >
                <option value="low">low</option>
                <option value="medium">medium</option>
                <option value="high">high</option>
              </select>
            ) : (
              <Badge variant={priorityVariant[link.priority]}>
                {link.priority}
              </Badge>
            )}
          </div>
        );
      case 'status':
        return (
          <div
            className="cursor-pointer"
            onDoubleClick={() => startEdit('status', link.status)}
          >
            {editing.field === 'status' ? (
              <select
                className="rounded border border-gray-300 px-1 text-xs"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={commit}
                autoFocus
              >
                <option value="active">active</option>
                <option value="archived">archived</option>
                <option value="deleted">deleted</option>
              </select>
            ) : (
              <Badge variant={statusVariant[link.status]}>{link.status}</Badge>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className="relative grid items-center gap-3 border-b border-gray-100 px-4 py-1.5 text-sm even:bg-gray-50 hover:bg-gray-100"
      style={gridTemplate}
    >
      {selectable && (
        <div className="flex items-center justify-center px-2 border-r">
          <input
            type="checkbox"
            checked={selected}
            onChange={(e) => onSelect?.(e.target.checked)}
          />
        </div>
      )}
      {columns.map((c) => (
        <React.Fragment key={c}>{renderCell(c)}</React.Fragment>
      ))}
      {/* Actions column */}
      <div className="text-right text-gray-400 hover:text-gray-600 relative">
        <button onClick={() => setMenuOpen(!menuOpen)}>
          <MoreVertical size={16} />
        </button>
        {menuOpen && (
          <div className="absolute right-0 mt-1 w-28 rounded border border-gray-200 bg-white shadow-lg z-20">
            <button
              className="block w-full px-3 py-1.5 text-left text-sm hover:bg-gray-100"
              onClick={() => {
                setEditOpen(true);
                setMenuOpen(false);
              }}
            >
              Edit
            </button>
            <button
              className="block w-full px-3 py-1.5 text-left text-sm hover:bg-gray-100"
              onClick={() => {
                setSummaryOpen(true);
                setMenuOpen(false);
              }}
            >
              AI Summary
            </button>
            <button
              className="block w-full px-3 py-1.5 text-left text-sm hover:bg-gray-100"
              onClick={() => {
                setChatOpen(true);
                setMenuOpen(false);
              }}
            >
              Chat
            </button>
            <button
              className="block w-full px-3 py-1.5 text-left text-sm text-red-600 hover:bg-gray-100"
              onClick={handleDelete}
            >
              Delete
            </button>
          </div>
        )}
      </div>
      <Modal isOpen={editOpen} onClose={() => setEditOpen(false)} title="Edit Link">
        <LinkForm existing={link} onSuccess={() => setEditOpen(false)} />
      </Modal>
      <AISummaryModal link={link} isOpen={summaryOpen} onClose={() => setSummaryOpen(false)} />
      <ChatModal link={link} isOpen={chatOpen} onClose={() => setChatOpen(false)} />
    </div>
  );
};

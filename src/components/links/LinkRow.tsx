import React, { useState, useEffect } from 'react';
import { Link as LinkType } from '../../types/Link';
import { Badge } from '..';
import { Square, CheckSquare, CheckCircle, Info, MessageSquare, Edit2, Trash } from 'lucide-react';
import { ContextInspectorModal } from '../ai/ContextInspectorModal';
import { AISummaryModal } from '../ai/AISummaryModal';
import { Modal } from '..';
import { useLinkStore } from '../../stores/linkStore';
import { LinkForm } from './LinkForm';
import { ChatModal } from '../ai/ChatModal';
import { aiSummaryService } from '../../services/aiSummaryService';

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
  const [historyOpen, setHistoryOpen] = useState(false);
  const [summaryStatus, setSummaryStatus] = useState<string>('');
  const [contextOpen, setContextOpen] = useState(false);
  const [editing, setEditing] = useState<{
    field?: 'title' | 'labels' | 'priority' | 'status';
  }>({});
  const [draft, setDraft] = useState<string>('');

  useEffect(() => {
    (async () => {
      try {
        const summaries = await aiSummaryService.getByLink(link.id);
        const kinds = summaries.map((s) => s.kind);
        const parts: string[] = [];
        if (kinds.includes('raw')) {
          const raw = summaries.find((s) => s.kind === 'raw');
          const len = raw?.content?.length ?? 0;
          const kb = Math.round(len / 1000);
          parts.push(`Raw: ✔ (${kb} kB)`);
        } else {
          parts.push('Raw: ✖');
        }
        parts.push(`TL;DR: ${kinds.includes('tldr') ? '✔' : '✖'}`);
        setSummaryStatus(parts.join('  '));
      } catch {}
    })();
  }, [link.id]);

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
            {/* status icon removed – merged into tri-state selector */}
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
                    {link.status === 'archived' && (
                      <Badge variant="warning" className="ml-2 hidden sm:inline-flex">
                        Archived
                      </Badge>
                    )}
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
        return (() => {
          // Prefer createdAt but gracefully fall back to updatedAt when missing.
          const raw = link.createdAt ?? (link as any).updatedAt;
          const d = raw ? new Date(raw) : new Date('');

          if (isNaN(d as any)) {
            return <span className="text-xs text-gray-400">—</span>;
          }

          return (
            <time
              dateTime={d.toISOString()}
              title={d.toLocaleString()}
              className="text-xs text-gray-600"
            >
              {d.toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </time>
          );
        })();
      case 'labels':
        const hashColor = (str: string) => {
          let h = 0;
          for (let i = 0; i < str.length; i++) h = (h << 5) - h + str.charCodeAt(i);
          const hue = Math.abs(h) % 360;
          return `hsl(${hue} 70% 85%)`;
        };
        return (
          <div
            className="flex flex-wrap gap-1 cursor-pointer"
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
              link.labels.map((lab) => (
                <span
                  key={lab}
                  className="rounded-full px-2 py-0.5 text-[10px]"
                  style={{ backgroundColor: hashColor(lab), color: '#333' }}
                >
                  {lab}
                </span>
              ))
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
      className="group relative grid items-center gap-3 border-b border-gray-100 px-4 py-1.5 text-sm even:bg-gray-50 hover:bg-blue-50"
      style={gridTemplate}
    >
      {selectable && (
        <div className="flex items-center justify-center px-2 border-r">
          <button
            type="button"
            onClick={(e) => {
              // regular click: toggle selection
              onSelect?.(!selected);
            }}
            onContextMenu={(e) => {
              e.preventDefault();
              void toggleDone();
            }}
            title={
              link.status === 'archived'
                ? 'Done – right-click to mark active / left-click to select'
                : selected
                ? 'Selected – right-click to mark done'
                : 'Left-click to select / right-click to mark done'
            }
            className="p-1 focus:outline-none"
          >
            {link.status === 'archived' ? (
              <CheckCircle size={18} className="text-green-600" />
            ) : selected ? (
              <CheckSquare size={18} className="text-blue-600" />
            ) : (
              <Square size={18} className="text-gray-400" />
            )}
          </button>
        </div>
      )}
      {columns.map((c) => (
        <React.Fragment key={c}>{renderCell(c)}</React.Fragment>
      ))}
      {/* Actions column */}
      <div className="flex items-center gap-2 pl-2">
        {summaryStatus && (
          <button
            type="button"
            title={summaryStatus + ' – View context'}
            className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-blue-600 transition"
            onClick={(e) => {
              e.stopPropagation();
              setContextOpen(true);
            }}
          >
            <Info size={16} />
          </button>
        )}
        <button
          type="button"
          title="Chat"
          className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-blue-600 transition"
          onClick={() => setChatOpen(true)}
        >
          <MessageSquare size={16} />
        </button>
        <button
          type="button"
          title="Edit"
          className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-blue-600 transition"
          onClick={() => setEditOpen(true)}
        >
          <Edit2 size={16} />
        </button>
        <button
          type="button"
          title="Delete"
          className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-600 transition"
          onClick={handleDelete}
        >
          <Trash size={16} />
        </button>
      </div>
      <Modal isOpen={editOpen} onClose={() => setEditOpen(false)} title="Edit Link">
        <LinkForm existing={link} onSuccess={() => setEditOpen(false)} />
      </Modal>
      <AISummaryModal link={link} isOpen={summaryOpen} onClose={() => setSummaryOpen(false)} />
      <ChatModal link={link} isOpen={chatOpen} onClose={() => setChatOpen(false)} />
      <ContextInspectorModal
        linkIds={[link.id]}
        isOpen={contextOpen}
        onClose={() => setContextOpen(false)}
      />
      {historyOpen && (
        <ChatModal link={link} isOpen={historyOpen} onClose={() => setHistoryOpen(false)} />
      )}
    </div>
  );
};

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
  columnWidths?: Record<string, number>;
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

export const LinkRow: React.FC<Props> = ({ link, columns, columnWidths = {}, selectable = false, selected = false, onSelect }) => {
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
  
  // Text presentation mode state
  const [textPresentationMode, setTextPresentationMode] = useState<Record<string, 'wrap' | 'clip' | 'words'>>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('linkTextPresentationMode') || '{}');
      return saved;
    } catch {
      return {};
    }
  });

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

  // Function to get column width with constraints
  // Function to format text based on presentation mode
  const formatText = (text: string, column: string) => {
    const mode = textPresentationMode[column] || 'wrap';
    
    switch (mode) {
      case 'clip':
        return text.length > 50 ? text.substring(0, 50) + '...' : text;
      case 'words':
        const words = text.split(' ');
        return words.length > 4 ? words.slice(0, 4).join(' ') + '...' : text;
      case 'wrap':
      default:
        return text;
    }
  };

  // Function to get CSS class based on presentation mode
  const getTextPresentationClass = (column: string) => {
    const mode = textPresentationMode[column] || 'wrap';
    
    switch (mode) {
      case 'clip':
        return 'truncate';
      case 'words':
        return 'line-clamp-2';
      case 'wrap':
      default:
        return 'break-words';
    }
  };

  const getColumnWidth = (col: string) => {
    const defaultWidths: Record<string, number> = {
      name: 300,    // Much wider for names to prevent truncation
      url: 200,     // Wider for URLs
      labels: 150,  // Wider for multiple labels
      status: 100,  // Adequate for status
      priority: 100, // Adequate for priority
      created: 120  // Adequate for dates
    };
    
    const customWidth = columnWidths[col];
    const defaultWidth = defaultWidths[col] || 150;
    const width = customWidth || defaultWidth;
    
    // Ensure reasonable constraints to prevent content cutoff
    return Math.max(80, Math.min(width, 500)); // Min 80px, Max 500px
  };

  const gridTemplate = {
    gridTemplateColumns: `40px repeat(${columns.length}, 1fr)`,
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
                className="w-full rounded-lg border border-gray-300 px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                const limited = formatText(displayName, col);
                return (
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-blue-600 hover:text-blue-700 hover:underline cursor-pointer line-clamp-1 transition-colors duration-200"
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
              className="text-blue-600 hover:text-blue-700 hover:underline truncate transition-colors duration-200 font-medium"
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
          if (isNaN(d.getTime())) {
            return (
              <span className="text-gray-400 text-sm">—</span>
            );
          }
          return (
            <time
              className="text-gray-600 text-sm font-medium"
              dateTime={d.toISOString()}
              title={d.toLocaleString()}
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
          // Use more vibrant colors with better contrast
          return `hsl(${hue}, 70%, 85%)`;
        };
        
        const getTextColor = (str: string) => {
          let h = 0;
          for (let i = 0; i < str.length; i++) h = (h << 5) - h + str.charCodeAt(i);
          const hue = Math.abs(h) % 360;
          // Darker text for better readability
          return `hsl(${hue}, 60%, 25%)`;
        };
        
        return (
          <div
            className="flex flex-wrap gap-1.5 cursor-pointer"
            onDoubleClick={() => startEdit('labels', link.labels.join(', '))}
          >
            {editing.field === 'labels' ? (
              <input
                className="w-full rounded-lg border border-gray-300 px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                  className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium border shadow-sm"
                  style={{ 
                    backgroundColor: hashColor(lab), 
                    color: getTextColor(lab),
                    borderColor: getTextColor(lab) + '20'
                  }}
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
                className="rounded-lg border border-gray-300 px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                className="rounded-lg border border-gray-300 px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
    <div className="group relative hover:bg-gray-50 transition-all duration-200">
      <table className="w-full">
        <tbody>
          <tr>
            {/* Checkbox column - always present for alignment */}
            <td className="w-10 px-3 py-3 border-r border-gray-100">
              <div className="flex items-center justify-center">
                {selectable ? (
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
                    className="p-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded-md transition-all duration-200 hover:bg-gray-100"
                  >
                    {link.status === 'archived' ? (
                      <CheckCircle size={18} className="text-green-600" />
                    ) : selected ? (
                      <CheckSquare size={18} className="text-blue-600" />
                    ) : (
                      <Square size={18} className="text-gray-400 group-hover:text-gray-600" />
                    )}
                  </button>
                ) : (
                  <div className="w-5 h-5"></div> // Empty space for alignment
                )}
              </div>
            </td>
            {columns.map((c) => (
              <td 
                key={c} 
                style={{ minWidth: getColumnWidth(c) }}
                className="px-4 py-3 border-r border-gray-100"
              >
                <div className={getTextPresentationClass(c)}>
                  {renderCell(c)}
                </div>
              </td>
            ))}

          </tr>
        </tbody>
      </table>
      
      {/* Actions overlay - positioned absolutely to not affect table layout */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center gap-1 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200 px-2 py-1">
        {summaryStatus && (
          <button
            type="button"
            onClick={() => setSummaryOpen(true)}
            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-all duration-200"
            title="View AI Summary"
          >
            <Info size={16} />
          </button>
        )}
        <button
          type="button"
          onClick={() => setChatOpen(true)}
          className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-md transition-all duration-200"
          title="Chat about this link"
        >
          <MessageSquare size={16} />
        </button>
        <button
          type="button"
          onClick={() => setEditOpen(true)}
          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-all duration-200"
          title="Edit link"
        >
          <Edit2 size={16} />
        </button>
        <button
          type="button"
          onClick={() => setContextOpen(true)}
          className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-md transition-all duration-200"
          title="View context"
        >
          <Info size={16} />
        </button>
        <button
          type="button"
          onClick={() => deleteLink(link.id)}
          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-all duration-200"
          title="Delete link"
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

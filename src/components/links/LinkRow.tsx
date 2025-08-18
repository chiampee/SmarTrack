import React, { useState, useEffect } from 'react';
import { Link as LinkType } from '../../types/Link';
import { Badge } from '..';
import { Square, CheckSquare, CheckCircle, Info, MessageSquare, Edit2, Trash, ExternalLink } from 'lucide-react';
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
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [contextMenuOpen, setContextMenuOpen] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
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

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setContextMenuOpen(false);
    };

    if (contextMenuOpen) {
      document.addEventListener('click', handleClickOutside);
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          setContextMenuOpen(false);
        }
      });
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [contextMenuOpen]);

  // Keyboard shortcuts for the link row
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle keys when the row is focused or hovered
      const rowElement = document.querySelector(`[data-link-id="${link.id}"]`);
      if (!rowElement?.matches(':hover')) return;

      if (e.key === 'Delete' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setDeleteConfirmOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
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

  const openLinkInNewTab = () => {
    try {
      const href = link.url.startsWith('http') ? link.url : `https://${link.url}`;
      const win = window.open(href, '_blank', 'noopener,noreferrer');
      // If popup blocked or failed, fall back to programmatic anchor click
      if (!win || win.closed || typeof win.closed === 'undefined') {
        const a = document.createElement('a');
        a.href = href;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        // Attach temporarily to ensure some browsers honor the click
        document.body.appendChild(a);
        a.click();
        // Clean up
        setTimeout(() => {
          try { document.body.removeChild(a); } catch {}
        }, 0);
      }
    } catch {
      try {
        const a = document.createElement('a');
        a.href = link.url;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          try { document.body.removeChild(a); } catch {}
        }, 0);
      } catch (_) {}
    }
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
      description: 200, // Good width for description text
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
                  <div className="flex items-center gap-2 min-w-0">
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noreferrer"
                      className="font-medium text-blue-600 hover:text-blue-700 hover:underline cursor-pointer line-clamp-1 transition-colors duration-200 min-w-0"
                      title={displayName}
                      onDoubleClick={() => startEdit('title', link.metadata.title || '')}
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); openLinkInNewTab(); }}
                    >
                      {limited}
                    </a>
                    <button
                      type="button"
                      aria-label="Open link in new tab"
                      onClick={(e) => { e.stopPropagation(); openLinkInNewTab(); }}
                      className="shrink-0 p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      title="Open link in new tab"
                    >
                      <ExternalLink size={14} />
                    </button>
                    {link.status === 'archived' && (
                      <Badge variant="warning" className="ml-1 hidden sm:inline-flex shrink-0">
                        Archived
                      </Badge>
                    )}
                  </div>
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
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); openLinkInNewTab(); }}
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
      case 'description':
        const description = link.metadata?.description || '';
        return (
          <div className="text-sm text-gray-600">
            {description ? (
              <span title={description} className="line-clamp-2">
                {formatText(description, col)}
              </span>
            ) : (
              <span className="text-gray-400 italic">No description</span>
            )}
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
          <tr
            data-link-id={link.id}
            onContextMenu={(e) => {
              e.preventDefault();
              setContextMenuPosition({ x: e.clientX, y: e.clientY });
              setContextMenuOpen(true);
            }}
          >
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
        {/* Quick delete hint */}
        <div className="text-xs text-gray-400 mr-2 hidden group-hover:block">
          Press <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">Delete</kbd> to delete
        </div>
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
          onClick={() => {
            try {
              const href = link.url.startsWith('http') ? link.url : `https://${link.url}`;
              window.open(href, '_blank', 'noopener,noreferrer');
            } catch {
              window.open(link.url, '_blank', 'noopener,noreferrer');
            }
          }}
          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-all duration-200"
          title="Open link in new tab"
        >
          <ExternalLink size={16} />
        </button>
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
          onClick={() => setDeleteConfirmOpen(true)}
          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-all duration-200"
          title="Delete link"
        >
          <Trash size={16} />
        </button>
      </div>
      
      {/* Context Menu */}
      {contextMenuOpen && (
        <div 
          className="fixed z-50 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[200px]"
          style={{ 
            left: contextMenuPosition.x, 
            top: contextMenuPosition.y,
            transform: 'translate(-50%, -100%)'
          }}
        >
          <button
            type="button"
            onClick={() => {
              try {
                const href = link.url.startsWith('http') ? link.url : `https://${link.url}`;
                window.open(href, '_blank', 'noopener,noreferrer');
              } catch {
                window.open(link.url, '_blank', 'noopener,noreferrer');
              }
              setContextMenuOpen(false);
            }}
            className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 flex items-center gap-2"
          >
            <ExternalLink size={16} />
            Open Link
          </button>

          <button
            type="button"
            onClick={() => {
              setEditOpen(true);
              setContextMenuOpen(false);
            }}
            className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 flex items-center gap-2"
          >
            <Edit2 size={16} />
            Edit Link
          </button>
          
          {summaryStatus && (
            <button
              type="button"
              onClick={() => {
                setSummaryOpen(true);
                setContextMenuOpen(false);
              }}
              className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 flex items-center gap-2"
            >
              <Info size={16} />
              View AI Summary
            </button>
          )}
          
          <button
            type="button"
            onClick={() => {
              setChatOpen(true);
              setContextMenuOpen(false);
            }}
            className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 flex items-center gap-2"
          >
            <MessageSquare size={16} />
            Chat about this link
          </button>
          
          <button
            type="button"
            onClick={() => {
              setContextOpen(true);
              setContextMenuOpen(false);
            }}
            className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 flex items-center gap-2"
          >
            <Info size={16} />
            View Context
          </button>
          
          <div className="border-t border-gray-200 my-1"></div>
          
          <button
            type="button"
            onClick={() => {
              setDeleteConfirmOpen(true);
              setContextMenuOpen(false);
            }}
            className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 flex items-center gap-2"
          >
            <Trash size={16} />
            Delete Link
          </button>
        </div>
      )}
      
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
      
      {/* Delete Confirmation Modal */}
      <Modal isOpen={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)} title="Delete Link">
        <div className="space-y-4">
          <div className="text-gray-700">
            <p className="mb-2">Are you sure you want to delete this link?</p>
            <div className="bg-gray-50 p-3 rounded-md">
              <p className="font-medium text-gray-900">{link.metadata?.title || 'Untitled Link'}</p>
              <p className="text-sm text-gray-600 truncate">{link.url}</p>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              This action cannot be undone. The link and all associated data (summaries, chat history, etc.) will be permanently removed.
            </p>
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setDeleteConfirmOpen(false)}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={async () => {
                try {
                  await deleteLink(link.id);
                  setDeleteConfirmOpen(false);
                } catch (error) {
                  console.error('Failed to delete link:', error);
                }
              }}
              className="px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors duration-200"
            >
              Delete Permanently
            </button>
          </div>
        </div>
      </Modal>
      
      {historyOpen && (
        <ChatModal link={link} isOpen={historyOpen} onClose={() => setHistoryOpen(false)} />
      )}
    </div>
  );
};

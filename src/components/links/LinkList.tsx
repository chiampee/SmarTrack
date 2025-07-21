import { Skeleton } from '../Skeleton';
import { ErrorBanner } from '../ErrorBanner';
import { LinkRow } from './LinkRow';
import { Button } from '../Button';
import { Modal } from '../Modal';
import { MultiChatPanel } from '../ai/MultiChatPanel';
import { useLinkStore } from '../../stores/linkStore';
import { ChevronUp, ChevronDown, GripVertical } from 'lucide-react';
import React, { useEffect, useState, useRef } from 'react';
import { Link } from '../../types/Link';
import { aiSummaryService } from '../../services/aiSummaryService';
import { LinkForm } from './LinkForm';

const DEFAULT_COLUMNS = ['name', 'url', 'labels', 'status', 'priority', 'created'] as const;

export const LinkList: React.FC = () => {
  const { links, loading, loadLinks, error, sortKey, sortDir: sdir, toggleSort, updateLink } = useLinkStore();
  const [open, setOpen] = useState(false);

  const [columns, setColumns] = useState<string[]>(() => {
    const saved = localStorage.getItem('linkColumnOrder');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (
          Array.isArray(parsed) &&
          DEFAULT_COLUMNS.every((c) => parsed.includes(c))
        ) {
          return parsed;
        }
      } catch {}
    }
    return [...DEFAULT_COLUMNS];
  });

  const reorder = (source: string, target: string) => {
    if (source === target) return;
    setColumns((prev) => {
      const newOrder = [...prev];
      const fromIdx = newOrder.indexOf(source);
      const toIdx = newOrder.indexOf(target);
      if (fromIdx === -1 || toIdx === -1) return prev;
      newOrder.splice(fromIdx, 1);
      newOrder.splice(toIdx, 0, source);
      localStorage.setItem('linkColumnOrder', JSON.stringify(newOrder));
      return newOrder;
    });
  };

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [chatLinks, setChatLinks] = useState<typeof links | null>(null);
  const [anchorLabel, setAnchorLabel] = useState<string | null>(null);
  const [pendingSummaries, setPendingSummaries] = useState(0);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [dragOverGroup, setDragOverGroup] = useState<string | null>(null);
  const [isSorting, setIsSorting] = useState(false);

  // keep latest list of group keys for safe access inside callbacks
  const groupKeysRef = useRef<string[]>([]);

  // ---------------------- Group drag & drop (categories) -------------------
  const [groupOrder, setGroupOrder] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('linkGroupOrder') || '[]');
    } catch {
      return [];
    }
  });

  const reorderGroup = (source: string, target: string) => {
    if (source === target) return;
    setGroupOrder((prev) => {
      // Start with current order, or create new array if empty
      const arr = prev.length ? [...prev] : [];
      
      // If source isn't in the array yet, add it
      if (!arr.includes(source)) {
        arr.push(source);
      }
      
      // If target isn't in the array yet, add it
      if (!arr.includes(target)) {
        arr.push(target);
      }
      
      const fromIdx = arr.indexOf(source);
      const toIdx = arr.indexOf(target);
      if (fromIdx === -1 || toIdx === -1) return prev;
      arr.splice(fromIdx, 1);
      arr.splice(toIdx, 0, source);
      localStorage.setItem('linkGroupOrder', JSON.stringify(arr));
      return arr;
    });
  };

  const onGroupDragStart = (e: React.DragEvent<HTMLDivElement>, grp: string) => {
    e.dataTransfer.setData('text/plain', grp);
    e.dataTransfer.effectAllowed = 'move';
  };
  const onGroupDrop = (e: React.DragEvent<HTMLDivElement>, targetGrp: string) => {
    e.preventDefault();
    const src = e.dataTransfer.getData('text/plain');
    if (src && src !== targetGrp) {
      reorderGroup(src, targetGrp);
    }
    setDragOverGroup(null);
  };

  const moveGroup = (label: string, dir: 'up' | 'down') => {
    setGroupOrder((prev) => {
      const keys = prev.length ? [...prev] : [...groupKeysRef.current];
      const idx = keys.indexOf(label);
      if (idx === -1) return prev;
      const nxt = dir === 'up' ? idx - 1 : idx + 1;
      if (nxt < 0 || nxt >= keys.length) return prev;
      const _tmp = keys[idx];
      keys[idx] = keys[nxt];
      keys[nxt] = _tmp;
      localStorage.setItem('linkGroupOrder', JSON.stringify(keys));
      return keys;
    });
  };

  // ---------------------- Drag & Drop column reordering --------------------
  const onDragStart = (e: React.DragEvent<HTMLDivElement>, col: string) => {
    e.dataTransfer.setData('text/plain', col);
    e.dataTransfer.effectAllowed = 'move';
  };

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>, targetCol: string) => {
    e.preventDefault();
    const sourceCol = e.dataTransfer.getData('text/plain');
    if (sourceCol && sourceCol !== targetCol) {
      reorder(sourceCol, targetCol);
    }
    setDragOverColumn(null);
  };

  const archiveSelected = async () => {
    if (!selectedIds.length) return;
    await Promise.all(selectedIds.map((id) => updateLink(id, { status: 'archived' })));
    setSelectedIds([]);
  };

  useEffect(() => {
    (async () => {
      let count = 0;
      for (const l of links) {
        const sums = await aiSummaryService.getByLink(l.id);
        if (!sums.some((s) => s.kind === 'tldr')) count++;
      }
      setPendingSummaries(count);
    })();
  }, [links]);

  const toggleSelectAll = (checked: boolean, visibleLinks: typeof links) => {
    if (checked) {
      setSelectedIds((prev) => [
        ...prev,
        ...visibleLinks.map((l) => l.id).filter((id) => !prev.includes(id)),
      ]);
    } else {
      setSelectedIds((prev) => prev.filter((id) => !visibleLinks.some((l) => l.id === id)));
    }
  };

  const startChat = () => {
    const selected = links.filter((l) => selectedIds.includes(l.id));
    if (selected.length) {
      // determine anchor label from last selected link
      const lastId = selectedIds[selectedIds.length - 1];
      const lastLink = links.find((l) => l.id === lastId);
      let lbl: string | null = null;
      if (lastLink) {
        lbl = lastLink.labels.length ? lastLink.labels[0] : 'Unlabeled';
      }
      setAnchorLabel(lbl);

      setChatLinks(selected);
      setSelectedIds([]);
    }
  };

  useEffect(() => {
    loadLinks();
  }, [loadLinks]);

  if (loading)
    return (
      <div className="border border-gray-200">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-10 w-full border-b border-gray-100" />
        ))}
      </div>
    );

  if (error) return <ErrorBanner message={error} onRetry={loadLinks} />;

  const SortHeader: React.FC<{col: string; label:string}> = ({col,label})=>{
      const is = sortKey===col;
      return (
        <div className="flex items-center gap-1 w-full">
          <button
            onClick={async (e)=>{
              e.preventDefault();
              e.stopPropagation();
              setIsSorting(true);
              try {
                toggleSort(col as any);
              } finally {
                setTimeout(() => setIsSorting(false), 100);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setIsSorting(true);
                try {
                  toggleSort(col as any);
                } finally {
                  setTimeout(() => setIsSorting(false), 100);
                }
              }
            }}
            className={`flex items-center gap-1 rounded px-2 py-1 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset ${
              is 
                ? 'bg-blue-50 text-blue-700 hover:bg-blue-100' 
                : 'hover:bg-gray-100 text-gray-700 hover:text-gray-900'
            } ${isSorting ? 'opacity-75' : ''}`}
            tabIndex={0}
            role="button"
            aria-label={`Sort by ${label}${is ? ` (${sdir === 'asc' ? 'ascending' : 'descending'})` : ''}`}
            aria-pressed={is}
            disabled={isSorting}
          >
            <span className="font-medium">{label}</span>
            {is ? (
              sdir === 'asc' ? (
                <ChevronUp size={14} className="text-blue-600" />
              ) : (
                <ChevronDown size={14} className="text-blue-600" />
              )
            ) : (
              <div className="w-3.5 h-3.5 opacity-30" />
            )}
          </button>
        </div>
      );
  };

  // Grouping view when sorted by labels
  if (sortKey === 'labels' || sortKey === 'status') {
    // Build groups; include 'Unlabeled' for none
    const groups: Record<string, typeof links> = {};
    if (sortKey === 'labels') {
      const archivedArr: typeof links = [];
      const deletedArr: typeof links = [];
      for (const link of links) {
        if (link.status === 'archived') {
          archivedArr.push(link);
          continue;
        }
        if (link.status === 'deleted') {
          deletedArr.push(link);
          continue;
        }
        // active links grouped by labels
        if (link.labels.length === 0) {
          (groups['Unlabeled'] ||= []).push(link);
        } else {
          for (const label of link.labels) {
            (groups[label] ||= []).push(link);
          }
        }
      }
      if (archivedArr.length) groups['Archived'] = archivedArr;
      if (deletedArr.length) groups['Deleted'] = deletedArr;
    } else {
      // group by status
      for (const link of links) {
        (groups[link.status] ||= []).push(link);
      }
    }

    let sortedLabelKeys = Object.keys(groups)
      .filter((k) => k !== 'Archived' && k !== 'Deleted')
      .sort((a, b) => {
        // If we have a custom order, use it; otherwise sort alphabetically
        if (groupOrder.length > 0) {
          const aIdx = groupOrder.indexOf(a);
          const bIdx = groupOrder.indexOf(b);
          // If both are in custom order, sort by their position
          if (aIdx !== -1 && bIdx !== -1) {
            return aIdx - bIdx;
          }
          // If only one is in custom order, prioritize it
          if (aIdx !== -1) return -1;
          if (bIdx !== -1) return 1;
        }
        // Fallback to alphabetical
        return a.localeCompare(b);
      });
    if (groups['Archived']) sortedLabelKeys.push('Archived');
    if (groups['Deleted']) sortedLabelKeys.push('Deleted');

    // Apply custom order for groups that exist
    if (groupOrder.length > 0) {
      const customOrdered = groupOrder.filter(k => sortedLabelKeys.includes(k));
      const remaining = sortedLabelKeys.filter(k => !groupOrder.includes(k));
      sortedLabelKeys = [...customOrdered, ...remaining];
    }

    // update ref for callbacks
    groupKeysRef.current = sortedLabelKeys;

    const gridTemplate = {
      gridTemplateColumns: `40px repeat(${columns.length + 1}, minmax(0, 1fr))`,
    } as React.CSSProperties;

    const labelMap: Record<string, string> = {
      name: 'Name',
      url: 'Link',
      labels: 'Labels',
      priority: 'Priority',
      status: 'Status',
      created: 'Created',
    };

    return (
      <div className="space-y-6">
        {selectedIds.length > 0 && (
          <div className="flex items-center justify-between mb-2">
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={startChat}>
                Start Chat with {selectedIds.length} link{selectedIds.length === 1 ? '' : 's'}
              </Button>
              <Button variant="secondary" size="sm" onClick={archiveSelected}>
                Archive
              </Button>
            </div>
          </div>
        )}
        {sortedLabelKeys.map((label) => (
          <div
            key={label}
            className={`border rounded transition-all duration-200 ${
              dragOverGroup === label 
                ? 'border-blue-400 bg-blue-50 shadow-lg' 
                : 'border-gray-200'
            }`}
            draggable
            onDragStart={(e) => onGroupDragStart(e, label)}
            onDragOver={(e) => {
              onDragOver(e);
              setDragOverGroup(label);
            }}
            onDrop={(e) => onGroupDrop(e, label)}
            onDragLeave={() => setDragOverGroup(null)}
          >
            <div className="bg-gray-100 px-3 py-2 text-sm font-semibold flex items-center justify-between group-header">
              <span>{label.charAt(0).toUpperCase() + label.slice(1)}</span>
              <span className="flex gap-1 opacity-0 group-hover:opacity-100">
                <button
                  type="button"
                  aria-label="Move up"
                  className="p-1 hover:bg-gray-200 rounded"
                  onClick={() => moveGroup(label, 'up')}
                >
                  <ChevronUp size={14} />
                </button>
                <button
                  type="button"
                  aria-label="Move down"
                  className="p-1 hover:bg-gray-200 rounded"
                  onClick={() => moveGroup(label, 'down')}
                >
                  <ChevronDown size={14} />
                </button>
              </span>
            </div>
            {/* Header */}
            <div
              className="grid border-b border-gray-200 bg-gray-50 text-xs font-semibold uppercase text-gray-600"
              style={gridTemplate}
            >
              {/* select all checkbox */}
              <div className="px-2 py-2 border-r flex items-center justify-center">
                <HeaderCheckbox
                  groupLinks={groups[label] as any}
                  selectedIds={selectedIds}
                  toggleSelectAll={toggleSelectAll}
                />
              </div>
              {columns.map((col) => (
                <div
                  key={col}
                  className={`px-3 py-2 border-r last:border-r-0 select-none flex items-center cursor-move transition-all duration-150 ${
                    dragOverColumn === col 
                      ? 'bg-blue-100 border-blue-300' 
                      : 'hover:bg-gray-50'
                  }`}
                  draggable
                  onDragStart={(e) => onDragStart(e, col)}
                  onDragOver={(e) => {
                    onDragOver(e);
                    setDragOverColumn(col);
                  }}
                  onDrop={(e) => onDrop(e, col)}
                  onDragLeave={() => setDragOverColumn(null)}
                  onMouseDown={(e) => {
                    // Prevent drag when clicking the sort button
                    if ((e.target as HTMLElement).closest('button')) {
                      e.preventDefault();
                    }
                  }}
                >
                  <SortHeader col={col} label={labelMap[col]} />
                </div>
              ))}
              <div className="px-3 py-2">&nbsp;</div>
            </div>
            {groups[label].map((l) => (
              <LinkRow
                key={l.id}
                link={l}
                columns={columns}
                selectable
                selected={selectedIds.includes(l.id)}
                onSelect={(c) =>
                  setSelectedIds((prev) => {
                    if (c) return [...prev, l.id];
                    return prev.filter((id) => id !== l.id);
                  })
                }
              />
            ))}

            {/* Chat panel anchored under this label group */}
            {chatLinks && anchorLabel === label && (
              <div className="px-3 py-4 bg-gray-50 border-t">
                <MultiChatPanel links={chatLinks} onClose={() => setChatLinks(null)} />
              </div>
            )}
          </div>
        ))}
        {/* fallback: if anchor label missing (e.g., selection cleared) render at end */}
        {chatLinks && !anchorLabel && (
          <div className="mt-6">
            <MultiChatPanel links={chatLinks} onClose={() => setChatLinks(null)} />
          </div>
        )}
      </div>
    );
  }

  const gridTemplate = {
    gridTemplateColumns: `40px repeat(${columns.length + 1}, minmax(0, 1fr))`,
  } as React.CSSProperties;

  const labelMap: Record<string, string> = {
    name: 'Name',
    url: 'Link',
    labels: 'Labels',
    priority: 'Priority',
    status: 'Status',
    created: 'Created',
  };

  return (
    <div className="border border-gray-200">
      {selectedIds.length > 0 && (
        <div className="flex items-center justify-between mb-2">
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={startChat}>
              Start Chat with {selectedIds.length} link{selectedIds.length === 1 ? '' : 's'}
            </Button>
            <Button variant="secondary" size="sm" onClick={archiveSelected}>
              Archive
            </Button>
          </div>
        </div>
      )}

      <div
        className="grid bg-gray-25 sticky top-24 z-20 shadow-[inset_0_-1px_0_#e5e5e5] px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500 select-none"
        style={gridTemplate}
      >
        {/* select all checkbox header */}
        <div className="flex items-center justify-center px-2 border-r">
          <input
            type="checkbox"
            onChange={(e) => toggleSelectAll(e.target.checked, links)}
            checked={links.length > 0 && links.every((l) => selectedIds.includes(l.id))}
          />
        </div>
        {columns.map((col)=>(
          <div
            key={col}
            className={`${col==='labels' || col==='status'?'hidden lg:block':''} select-none flex items-center cursor-move transition-all duration-150 ${
              dragOverColumn === col 
                ? 'bg-blue-100 border-blue-300' 
                : 'hover:bg-gray-50'
            }`}
            draggable
            onDragStart={(e) => onDragStart(e, col)}
            onDragOver={(e) => {
              onDragOver(e);
              setDragOverColumn(col);
            }}
            onDrop={(e) => onDrop(e, col)}
            onDragLeave={() => setDragOverColumn(null)}
            onMouseDown={(e) => {
              // Prevent drag when clicking the sort button
              if ((e.target as HTMLElement).closest('button')) {
                e.preventDefault();
              }
            }}
          >
            <SortHeader col={col} label={labelMap[col]} />
          </div>
        ))}
        <div>&nbsp;</div>
      </div>
      {links.map((l) => (
        <LinkRow
          key={l.id}
          link={l}
          columns={columns}
          selectable
          selected={selectedIds.includes(l.id)}
          onSelect={(c) =>
            setSelectedIds((prev) => {
              if (c) return [...prev, l.id];
              return prev.filter((id) => id !== l.id);
            })
          }
        />
      ))}
      {links.length === 0 && (
        <div className="py-16 text-center text-gray-500 flex flex-col items-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No links yet</h3>
          <p className="text-sm text-gray-600 max-w-sm">
            Save web pages using the browser extension to start building your research collection.
          </p>
          <div className="mt-6 flex gap-3">
            <button
              onClick={() => setOpen(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Add Link Manually
            </button>
          </div>
        </div>
      )}
      {chatLinks && (
        <div className="mt-6">
          <MultiChatPanel links={chatLinks} onClose={() => setChatLinks(null)} />
        </div>
      )}
      {pendingSummaries > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-4 py-2 rounded shadow">
          AI is generating summaries for {pendingSummaries} link{pendingSummaries === 1 ? '' : 's'}…
        </div>
      )}
      <Modal isOpen={open} onClose={() => setOpen(false)} title="Add Link">
        <LinkForm onSuccess={() => setOpen(false)} />
      </Modal>
    </div>
  );
};

function HeaderCheckbox({
  groupLinks,
  selectedIds,
  toggleSelectAll,
}: {
  groupLinks: Link[];
  selectedIds: string[];
  toggleSelectAll: (checked: boolean, visibleLinks: Link[]) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const isChecked = groupLinks.every((l) => selectedIds.includes(l.id)) && groupLinks.length > 0;
  const isIndeterminate = !isChecked && groupLinks.some((l) => selectedIds.includes(l.id));
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = isIndeterminate;
  }, [isIndeterminate]);
  return (
    <input
      ref={ref}
      type="checkbox"
      onChange={(e) => toggleSelectAll(e.target.checked, groupLinks)}
      checked={isChecked}
    />
  );
}

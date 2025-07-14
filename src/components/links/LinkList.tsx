import { Skeleton } from '../Skeleton';
import { ErrorBanner } from '../ErrorBanner';
import { LinkRow } from './LinkRow';
import { Button } from '../Button';
import { MultiChatPanel } from '../ai/MultiChatPanel';
import { useLinkStore } from '../../stores/linkStore';
import { ChevronUp, ChevronDown, GripVertical } from 'lucide-react';
import React, { useEffect, useState, useRef } from 'react';
import { Link } from '../../types/Link';
import { aiSummaryService } from '../../services/aiSummaryService';

const DEFAULT_COLUMNS = ['name', 'url', 'labels', 'status', 'priority', 'created'] as const;

export const LinkList: React.FC = () => {
  const { links, loading, loadLinks, error, sortKey, sortDir: sdir, toggleSort, updateLink } = useLinkStore();

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
      const fallback = groupKeysRef.current;
      const arr = prev.length ? [...prev] : [...fallback];
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
    const src = e.dataTransfer.getData('text/plain');
    if (src) reorderGroup(src, targetGrp);
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
    const sourceCol = e.dataTransfer.getData('text/plain');
    if (sourceCol) reorder(sourceCol, targetCol);
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
        <button
          onClick={()=>toggleSort(col as any)}
          className="flex items-center gap-1 w-full">
          <span>{label}</span>
          {is && (sdir==='asc'? <ChevronUp size={12}/> : <ChevronDown size={12}/>)}
        </button>
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
      .sort((a, b) => a.localeCompare(b));
    if (groups['Archived']) sortedLabelKeys.push('Archived');
    if (groups['Deleted']) sortedLabelKeys.push('Deleted');

    // apply saved order
    const orderedKeys = [
      ...groupOrder.filter((k) => sortedLabelKeys.includes(k)),
      ...sortedLabelKeys.filter((k) => !groupOrder.includes(k)),
    ];
    sortedLabelKeys = orderedKeys;

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
            className="border border-gray-200 rounded"
            draggable
            onDragStart={(e) => onGroupDragStart(e, label)}
            onDragOver={onDragOver}
            onDrop={(e) => onGroupDrop(e, label)}
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
                  className="px-3 py-2 border-r last:border-r-0 cursor-move select-none"
                  draggable
                  onDragStart={(e) => onDragStart(e, col)}
                  onDragOver={onDragOver}
                  onDrop={(e) => onDrop(e, col)}
                >
                  {labelMap[col]}
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
            className={`${col==='labels' || col==='status'?'hidden lg:block':''} cursor-move select-none`}
            draggable
            onDragStart={(e)=>onDragStart(e,col)}
            onDragOver={onDragOver}
            onDrop={(e)=>onDrop(e,col)}
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
        <div className="py-20 text-center text-gray-500 flex flex-col items-center">
          <svg width="120" height="90" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3"><path d="M3 5h18M3 12h18M3 19h18" opacity=".2"/><rect x="3" y="5" width="18" height="6" rx="1"/><rect x="3" y="13" width="12" height="6" rx="1"/></svg>
          <p className="mt-4">No links yet</p>
          <p className="text-xs">Save a page with the browser extension to get started.</p>
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

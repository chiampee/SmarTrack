import { Skeleton } from '../Skeleton';
import { ErrorBanner } from '../ErrorBanner';
import { LinkRow } from './LinkRow';
import { Button } from '../Button';
import { MultiChatPanel } from '../ai/MultiChatPanel';
import { useLinkStore } from '../../stores/linkStore';
import React, { useEffect, useState, useRef } from 'react';
import { Link } from '../../types/Link';
import { aiSummaryService } from '../../services/aiSummaryService';

const DEFAULT_COLUMNS = ['name', 'url', 'labels', 'status', 'priority', 'created'] as const;

export const LinkList: React.FC = () => {
  const { links, loading, loadLinks, error, sortKey } = useLinkStore();

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

  // Grouping view when sorted by labels
  if (sortKey === 'labels') {
    // Build groups; include 'Unlabeled' for none
    const groups: Record<string, typeof links> = {};
    for (const link of links) {
      if (link.labels.length === 0) {
        (groups['Unlabeled'] ||= []).push(link);
      } else {
        for (const label of link.labels) {
          (groups[label] ||= []).push(link);
        }
      }
    }

    const sortedLabelKeys = Object.keys(groups).sort((a, b) =>
      a.localeCompare(b)
    );

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
        {/* Action bar for grouped view */}
        <div className="flex items-center justify-between mb-2">
          <Button
            variant="secondary"
            size="sm"
            disabled={!selectedIds.length}
            onClick={startChat}
          >
            Start Chat with {selectedIds.length} link{selectedIds.length === 1 ? '' : 's'}
          </Button>
        </div>
        {sortedLabelKeys.map((label) => (
          <div key={label} className="border border-gray-200 rounded">
            <div className="bg-gray-100 px-3 py-2 text-sm font-semibold">
              {label}
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
                <div key={col} className="px-3 py-2 border-r last:border-r-0">
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
      {/* Action bar */}
      <div className="flex items-center justify-between mb-2">
        <Button variant="secondary" size="sm" disabled={!selectedIds.length} onClick={startChat}>
          Start Chat with {selectedIds.length} link{selectedIds.length === 1 ? '' : 's'}
        </Button>
      </div>

      <div
        className="grid bg-gray-50 sticky top-12 z-10 shadow-sm px-4 py-1.5 text-xs font-semibold text-gray-500 select-none"
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
        {columns.map((col) => (
          <div
            key={col}
            draggable
            onDragStart={(e) => e.dataTransfer.setData('text/plain', col)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              const source = e.dataTransfer.getData('text/plain');
              reorder(source, col);
            }}
            className="cursor-move"
          >
            {labelMap[col]}
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
        <p className="px-4 py-6 text-center text-sm text-gray-500">
          No links yet
        </p>
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

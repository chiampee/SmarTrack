import { Skeleton } from '../Skeleton';
import { ErrorBanner } from '../ErrorBanner';
import { LinkRow } from './LinkRow';
import { useLinkStore } from '../../stores/linkStore';
import React, { useEffect, useState } from 'react';

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
      gridTemplateColumns: `repeat(${columns.length + 1}, minmax(0, 1fr))`,
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
              {columns.map((col) => (
                <div key={col} className="px-3 py-2 border-r last:border-r-0">
                  {labelMap[col]}
                </div>
              ))}
              <div className="px-3 py-2">&nbsp;</div>
            </div>
            {groups[label].map((l) => (
              <LinkRow key={l.id} link={l} columns={columns} />
            ))}
          </div>
        ))}
      </div>
    );
  }

  const gridTemplate = {
    gridTemplateColumns: `repeat(${columns.length + 1}, minmax(0, 1fr))`,
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
      <div
        className="grid bg-gray-50 px-4 py-1.5 text-xs font-semibold text-gray-500 select-none"
        style={gridTemplate}
      >
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
        <LinkRow key={l.id} link={l} columns={columns} />
      ))}
      {links.length === 0 && (
        <p className="px-4 py-6 text-center text-sm text-gray-500">
          No links yet
        </p>
      )}
    </div>
  );
};

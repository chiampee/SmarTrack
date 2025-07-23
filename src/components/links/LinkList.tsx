import { Skeleton } from '../Skeleton';
import { ErrorBanner } from '../ErrorBanner';
import { LinkRow } from './LinkRow';
import { Button } from '../Button';
import { Modal } from '../Modal';
import { MultiChatPanel } from '../ai/MultiChatPanel';
import { useLinkStore } from '../../stores/linkStore';
import { ChevronUp, ChevronDown, GripVertical, MessageSquare, Archive, Square, CheckSquare, CheckCircle, Eye, EyeOff, Settings, Copy, Clipboard } from 'lucide-react';
import React, { useEffect, useState, useRef } from 'react';
import { Link } from '../../types/Link';
import { aiSummaryService } from '../../services/aiSummaryService';
import { LinkForm } from './LinkForm';

const DEFAULT_COLUMNS = ['name', 'url', 'labels', 'status', 'priority', 'created'] as const;

export const LinkList: React.FC = () => {
  const { links, loading, loadLinks, error, sortKey, sortDir: sdir, toggleSort, updateLink } = useLinkStore();
  const [open, setOpen] = useState(false);
  const [columns, setColumns] = useState<string[]>([...DEFAULT_COLUMNS]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [chatLinks, setChatLinks] = useState<typeof links | null>(null);
  const [anchorLabel, setAnchorLabel] = useState<string | null>(null);
  const [pendingSummaries, setPendingSummaries] = useState(0);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [dragOverGroup, setDragOverGroup] = useState<string | null>(null);
  const [isSorting, setIsSorting] = useState(false);
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('linkColumnWidths') || '{}');
      // If no saved settings, use best view widths as default
      if (Object.keys(saved).length === 0) {
        const bestViewWidths = {
          name: 350,     // Much wider for titles to prevent truncation
          labels: 150,   // Good for multiple labels
          status: 100,   // Adequate for status
          priority: 100  // Adequate for priority
        };
        localStorage.setItem('linkColumnWidths', JSON.stringify(bestViewWidths));
        return bestViewWidths;
      }
      return saved;
    } catch {
      const bestViewWidths = {
        name: 350,     // Much wider for titles to prevent truncation
        labels: 150,   // Good for multiple labels
        status: 100,   // Adequate for status
        priority: 100  // Adequate for priority
      };
      localStorage.setItem('linkColumnWidths', JSON.stringify(bestViewWidths));
      return bestViewWidths;
    }
  });
  const [resizingColumn, setResizingColumn] = useState<string | null>(null);
  const [previewWidths, setPreviewWidths] = useState<Record<string, number>>({});
  const [showColumnSettings, setShowColumnSettings] = useState(false);
  const [contextMenu, setContextMenu] = useState<{
    show: boolean;
    x: number;
    y: number;
    link: Link | null;
  }>({
    show: false,
    x: 0,
    y: 0,
    link: null
  });
  
  // Text presentation mode state
  const [textPresentationMode, setTextPresentationMode] = useState<Record<string, 'wrap' | 'clip' | 'words'>>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('linkTextPresentationMode') || '{}');
      // Ensure all default columns are present
      const defaultMode = DEFAULT_COLUMNS.reduce((acc, col) => {
        acc[col] = saved[col] || 'wrap';
        return acc;
      }, {} as Record<string, 'wrap' | 'clip' | 'words'>);
      return defaultMode;
    } catch {
      return DEFAULT_COLUMNS.reduce((acc, col) => {
        acc[col] = 'wrap';
        return acc;
      }, {} as Record<string, 'wrap' | 'clip' | 'words'>);
    }
  });
  
  // Column visibility state
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('linkVisibleColumns') || '{}');
      // If no saved settings, use best view as default
      if (Object.keys(saved).length === 0) {
        const bestViewVisibility = {
          name: true,    // Always show name - most important
          url: false,    // Hide URL to save space - can be accessed via name link
          labels: true,  // Show labels for categorization
          status: true,  // Show status for quick overview
          priority: true, // Show priority for task management
          created: false // Hide created date to save space
        };
        localStorage.setItem('linkVisibleColumns', JSON.stringify(bestViewVisibility));
        return bestViewVisibility;
      }
      // Ensure all default columns are present
      const defaultVisibility = DEFAULT_COLUMNS.reduce((acc, col) => {
        acc[col] = saved[col] !== undefined ? saved[col] : true;
        return acc;
      }, {} as Record<string, boolean>);
      return defaultVisibility;
    } catch {
      const bestViewVisibility = {
        name: true,    // Always show name - most important
        url: false,    // Hide URL to save space - can be accessed via name link
        labels: true,  // Show labels for categorization
        status: true,  // Show status for quick overview
        priority: true, // Show priority for task management
        created: false // Hide created date to save space
      };
      localStorage.setItem('linkVisibleColumns', JSON.stringify(bestViewVisibility));
      return bestViewVisibility;
    }
  });
  
  // Local sorting state for label groups
  const [localSortKey, setLocalSortKey] = useState<string>('name');
  const [localSortDir, setLocalSortDir] = useState<'asc' | 'desc'>('asc');

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

  // Load saved column order or use default
  useEffect(() => {
    try {
      const savedOrder = localStorage.getItem('linkColumnOrder');
      if (savedOrder) {
        const parsedOrder = JSON.parse(savedOrder);
        // Validate that all default columns are present
        const isValidOrder = DEFAULT_COLUMNS.every(col => parsedOrder.includes(col));
        if (isValidOrder) {
          setColumns(parsedOrder);
          return;
        }
      }
    } catch {
      // If parsing fails, use default order
    }
    // Use default order if no valid saved order
    setColumns([...DEFAULT_COLUMNS]);
  }, []); // Only run once on mount

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
    console.log('Drag started for column:', col);
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
    console.log('Drop event - source:', sourceCol, 'target:', targetCol);
    if (sourceCol && sourceCol !== targetCol) {
      console.log('Reordering columns:', sourceCol, '->', targetCol);
      reorder(sourceCol, targetCol);
    }
    setDragOverColumn(null);
  };

  // ---------------------- Column Resizing --------------------
  const onResizeStart = (e: React.MouseEvent<HTMLDivElement>, col: string) => {
    e.preventDefault();
    e.stopPropagation();
    setResizingColumn(col);
    
    const startX = e.clientX;
    const startWidth = columnWidths[col] || 150; // Default width
    
    const onMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startX;
      const newWidth = Math.max(80, Math.min(500, startWidth + deltaX)); // Min 80px, Max 500px
      
      // Update preview width for real-time feedback
      setPreviewWidths(prev => ({ ...prev, [col]: newWidth }));
    };
    
    const onMouseUp = () => {
      // Save the final width
      const finalWidth = previewWidths[col] || startWidth;
      setColumnWidths(prev => {
        const newWidths = { ...prev, [col]: finalWidth };
        localStorage.setItem('linkColumnWidths', JSON.stringify(newWidths));
        return newWidths;
      });
      
      // Clear preview and resizing state
      setPreviewWidths({});
      setResizingColumn(null);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
    
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
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

  const copySelectedLinksInfo = async () => {
    const selected = links.filter((l) => selectedIds.includes(l.id));
    if (selected.length) {
      const linkInfo = selected.map(link => {
        const rawData = {
          id: link.id,
          url: link.url,
          metadata: {
            title: link.metadata.title || 'Untitled',
            description: link.metadata.description || 'No description',
            image: link.metadata.image || 'No image'
          },
          summary: link.summary || 'No summary',
          labels: link.labels,
          priority: link.priority,
          status: link.status,
          boardId: link.boardId || null,
          createdAt: link.createdAt,
          updatedAt: link.updatedAt
        };
        
        return JSON.stringify(rawData, null, 2);
      }).join('\n\n---\n\n');

      try {
        await navigator.clipboard.writeText(linkInfo);
        // Show visual feedback
        const button = document.querySelector('[data-copy-button="bulk"]') as HTMLButtonElement;
        if (button) {
          const originalText = button.innerHTML;
          button.innerHTML = '<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg> Copied!';
          button.disabled = true;
          setTimeout(() => {
            button.innerHTML = originalText;
            button.disabled = false;
          }, 2000);
        }
        console.log('Raw link data copied to clipboard');
      } catch (err) {
        console.error('Failed to copy to clipboard:', err);
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = linkInfo;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
    }
  };

    const copySingleLinkInfo = async (link: Link) => {
    const rawData = {
      id: link.id,
      url: link.url,
      metadata: {
        title: link.metadata.title || 'Untitled',
        description: link.metadata.description || 'No description',
        image: link.metadata.image || 'No image'
      },
      summary: link.summary || 'No summary',
      labels: link.labels,
      priority: link.priority,
      status: link.status,
      boardId: link.boardId || null,
      createdAt: link.createdAt,
      updatedAt: link.updatedAt
    };
    
    const linkInfo = JSON.stringify(rawData, null, 2);

    try {
      await navigator.clipboard.writeText(linkInfo);
      // Show visual feedback in context menu
      const contextMenu = document.querySelector('[data-context-menu="copy"]') as HTMLButtonElement;
      if (contextMenu) {
        const originalText = contextMenu.innerHTML;
        contextMenu.innerHTML = '<svg class="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg> Copied!';
        setTimeout(() => {
          contextMenu.innerHTML = originalText;
        }, 2000);
      }
      // Also show feedback for inline copy button if it exists
      const inlineButton = document.querySelector('[data-copy-button="inline"]') as HTMLButtonElement;
      if (inlineButton) {
        const originalHTML = inlineButton.innerHTML;
        inlineButton.innerHTML = '<svg class="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>';
        setTimeout(() => {
          inlineButton.innerHTML = originalHTML;
        }, 2000);
      }
      console.log('Raw link data copied to clipboard');
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = linkInfo;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
  };

  const startChatWithSingleLink = (link: Link) => {
    setChatLinks([link]);
    setAnchorLabel(link.labels.length ? link.labels[0] : 'Unlabeled');
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

  // Function to get column width with constraints
  const getColumnWidth = (col: string) => {
    const defaultWidths: Record<string, number> = {
      name: 300,    // Much wider for names to prevent truncation
      url: 200,     // Wider for URLs
      labels: 150,  // Wider for multiple labels
      status: 100,  // Adequate for status
      priority: 100, // Adequate for priority
      created: 120  // Adequate for dates
    };
    
    // Use preview width if currently resizing this column
    if (resizingColumn === col && previewWidths[col] !== undefined) {
      return Math.max(80, Math.min(previewWidths[col], 500)); // Min 80px, Max 500px
    }
    
    const customWidth = columnWidths[col];
    const defaultWidth = defaultWidths[col] || 150;
    const width = customWidth || defaultWidth;
    
    // Ensure reasonable constraints to prevent content cutoff
    return Math.max(80, Math.min(width, 500)); // Min 80px, Max 500px
  };

  // Calculate total table width
  const getTotalTableWidth = () => {
    const checkboxWidth = 40; // Fixed checkbox column width
    const totalColumnWidths = columns
      .filter(col => visibleColumns[col])
      .reduce((sum, col) => sum + getColumnWidth(col), 0);
    return checkboxWidth + totalColumnWidths;
  };

  // Function to toggle column visibility
  const toggleColumnVisibility = (column: string) => {
    setVisibleColumns(prev => {
      const newVisibility = { ...prev, [column]: !prev[column] };
      localStorage.setItem('linkVisibleColumns', JSON.stringify(newVisibility));
      return newVisibility;
    });
  };

  // Function to set text presentation mode
  const updateTextPresentationMode = (column: string, mode: 'wrap' | 'clip' | 'words') => {
    setTextPresentationMode(prev => {
      const newMode = { ...prev, [column]: mode };
      localStorage.setItem('linkTextPresentationMode', JSON.stringify(newMode));
      return newMode;
    });
  };

  // Function to set best view preset
  const setBestView = () => {
    const bestViewVisibility = {
      name: true,    // Always show name - most important
      url: false,    // Hide URL to save space - can be accessed via name link
      labels: true,  // Show labels for categorization
      status: true,  // Show status for quick overview
      priority: true, // Show priority for task management
      created: false // Hide created date to save space
    };
    
    const bestViewWidths = {
      name: 350,     // Much wider for titles to prevent truncation
      labels: 150,   // Good for multiple labels
      status: 100,   // Adequate for status
      priority: 100  // Adequate for priority
    };
    
    const bestViewTextMode = {
      name: 'words' as const,    // Show first 4 words for names
      labels: 'wrap' as const,   // Full labels
      status: 'wrap' as const,   // Full status
      priority: 'wrap' as const  // Full priority
    };
    
    setVisibleColumns(bestViewVisibility);
    setColumnWidths(bestViewWidths);
    setTextPresentationMode(bestViewTextMode);
    localStorage.setItem('linkVisibleColumns', JSON.stringify(bestViewVisibility));
    localStorage.setItem('linkColumnWidths', JSON.stringify(bestViewWidths));
    localStorage.setItem('linkTextPresentationMode', JSON.stringify(bestViewTextMode));
    
    console.log('Applied best view preset');
  };

  // Function to reset all table settings to defaults
  const resetTableSettings = () => {
    // Reset column order
    setColumns([...DEFAULT_COLUMNS]);
    localStorage.removeItem('linkColumnOrder');
    
    // Reset column widths
    setColumnWidths({});
    localStorage.removeItem('linkColumnWidths');
    
    // Reset group order
    setGroupOrder([]);
    localStorage.removeItem('linkGroupOrder');
    
    // Reset column visibility
    setVisibleColumns(DEFAULT_COLUMNS.reduce((acc, col) => {
      acc[col] = true;
      return acc;
    }, {} as Record<string, boolean>));
    localStorage.removeItem('linkVisibleColumns');
    
    // Reset text presentation mode
    setTextPresentationMode(DEFAULT_COLUMNS.reduce((acc, col) => {
      acc[col] = 'wrap';
      return acc;
    }, {} as Record<string, 'wrap' | 'clip' | 'words'>));
    localStorage.removeItem('linkTextPresentationMode');
    
    console.log('Table settings reset to defaults');
  };

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
        return 'truncate text-left';
      case 'words':
        return 'line-clamp-2 text-left';
      case 'wrap':
      default:
        return 'break-words text-left';
    }
  };

  // Function to render cell content
  const renderCellContent = (link: Link, col: string) => {
    switch (col) {
      case 'name':
      return (
          <div className="group flex items-center gap-2">
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer break-words flex-1"
              title={link.metadata.title || link.url}
            >
              {formatText(link.metadata.title || 'Untitled', col)}
            </a>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                copySingleLinkInfo(link);
              }}
              className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-green-600"
              title="Copy link info"
              data-copy-button="inline"
            >
              <Copy className="w-3 h-3" />
            </button>
          </div>
        );
      case 'url':
        return (
          <a
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer text-sm break-words"
            title={link.url}
          >
            {formatText(link.url, col)}
          </a>
        );
      case 'labels':
        return (
          <div className="flex flex-wrap gap-1">
            {link.labels.map((label) => (
              <span
                key={label}
                className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800"
              >
                {label}
              </span>
            ))}
          </div>
        );
      case 'status':
        return (
          <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
            link.status === 'active' ? 'bg-green-100 text-green-800' :
            link.status === 'archived' ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}>
            {link.status}
          </span>
        );
      case 'priority':
        return (
          <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
            link.priority === 'high' ? 'bg-red-100 text-red-800' :
            link.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
            'bg-green-100 text-green-800'
          }`}>
            {link.priority}
          </span>
        );
      case 'created':
        return (
          <span className="text-sm text-gray-500">
            {new Date(link.createdAt).toLocaleDateString()}
          </span>
        );
      default:
        return null;
    }
  };

  // Function to sort links within a group
  const sortGroupLinks = (groupLinks: typeof links) => {
    return [...groupLinks].sort((a, b) => {
      let cmp = 0;
      
      switch (localSortKey) {
        case 'name':
          const aTitle = a.metadata.title || '';
          const bTitle = b.metadata.title || '';
          cmp = aTitle.localeCompare(bTitle);
          break;
        case 'url':
          cmp = a.url.localeCompare(b.url);
          break;
        case 'labels':
          const aLabels = a.labels.join(', ');
          const bLabels = b.labels.join(', ');
          cmp = aLabels.localeCompare(bLabels);
          break;
        case 'status':
          cmp = a.status.localeCompare(b.status);
          break;
        case 'priority':
          const priorityOrder = { low: 0, medium: 1, high: 2 };
          cmp = priorityOrder[a.priority] - priorityOrder[b.priority];
          break;
        case 'created':
          cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        default:
          cmp = 0;
      }
      
      return localSortDir === 'asc' ? cmp : -cmp;
    });
  };

  const SortHeader: React.FC<{col: string; label:string}> = ({col,label})=>{
      const is = sortKey === 'labels' ? localSortKey === col : sortKey === col;
      const currentSortDir = sortKey === 'labels' ? localSortDir : sdir;
      
      const handleSort = async (e: React.MouseEvent | React.KeyboardEvent) => {
              e.preventDefault();
              e.stopPropagation();
              setIsSorting(true);
              try {
          if (sortKey === 'labels') {
            // Local sorting for label groups
            if (localSortKey === col) {
              setLocalSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
            } else {
              setLocalSortKey(col);
              setLocalSortDir('asc');
            }
          } else {
            // Global sorting for regular view
                toggleSort(col as any);
          }
              } finally {
                setTimeout(() => setIsSorting(false), 100);
              }
      };

      return (
        <div className="flex items-center gap-2 w-full">
          <button
            onClick={handleSort}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                handleSort(e);
              }
            }}
            className={`flex items-center gap-2 rounded-md px-2 py-1 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
              is 
                ? 'bg-blue-100 text-blue-700 hover:bg-blue-200 shadow-sm' 
                : 'hover:bg-gray-100 text-gray-700 hover:text-gray-900'
            } ${isSorting ? 'opacity-75' : ''}`}
            tabIndex={0}
            role="button"
            aria-label={`Sort by ${label}${is ? ` (${currentSortDir === 'asc' ? 'ascending' : 'descending'})` : ''}`}
            aria-pressed={is}
            disabled={isSorting}
          >
            <span className="font-semibold text-sm">{label}</span>
            {is ? (
              currentSortDir === 'asc' ? (
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
  if (sortKey === 'labels') {
    // Build groups; include 'Unlabeled' for none
    const groups: Record<string, typeof links> = {};
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
      gridTemplateColumns: `40px repeat(${columns.length}, 1fr)`,
      gap: '0'
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
        {/* Table Settings Bar */}
        <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-600">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              Settings auto-saved
            </span>
            <button
              onClick={setBestView}
              className="flex items-center gap-1 text-gray-500 hover:text-green-600 transition-colors duration-200"
              title="Apply recommended table layout"
            >
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              Best View
            </button>
            <button
              onClick={() => setShowColumnSettings(!showColumnSettings)}
              className="flex items-center gap-1 text-gray-500 hover:text-blue-600 transition-colors duration-200"
              title="Toggle column visibility settings"
            >
              <Settings size={14} />
              Columns
            </button>
            <button
              onClick={resetTableSettings}
              className="text-gray-500 hover:text-red-600 transition-colors duration-200"
              title="Reset all table settings to defaults"
            >
              Reset Settings
            </button>
          </div>
          <div className="text-xs text-gray-500">
            Drag headers to reorder • Drag edges to resize
          </div>
        </div>

        {/* Column Visibility Settings */}
        {showColumnSettings && (
          <div className="px-4 py-3 bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-700">Column Visibility</h3>
              <button
                onClick={() => setShowColumnSettings(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
              >
                ×
              </button>
            </div>
            
            {/* Best View Preset Button */}
            <div className="mb-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-blue-800">Recommended View</h4>
                  <p className="text-xs text-blue-600 mt-1">Optimized layout for best readability</p>
                </div>
                <button
                  onClick={setBestView}
                  className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-md hover:bg-blue-700 transition-colors duration-200"
                >
                  Apply Best View
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              {DEFAULT_COLUMNS.map((col) => (
                <div key={col} className="space-y-2">
                  {/* Column Visibility */}
                  <button
                    onClick={() => toggleColumnVisibility(col)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-all duration-200 w-full ${
                      visibleColumns[col]
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'bg-gray-50 text-gray-500 border border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    {visibleColumns[col] ? (
                      <Eye size={14} className="text-blue-600" />
                    ) : (
                      <EyeOff size={14} className="text-gray-400" />
                    )}
                    <span>{labelMap[col] || col}</span>
                  </button>
                  
                  {/* Text Presentation Mode - only show if column is visible */}
                  {visibleColumns[col] && (
                    <div className="flex gap-1">
                      <button
                        onClick={() => updateTextPresentationMode(col, 'wrap')}
                        className={`px-2 py-1 text-xs rounded transition-all duration-200 ${
                          textPresentationMode[col] === 'wrap'
                            ? 'bg-green-100 text-green-700 border border-green-200'
                            : 'bg-gray-50 text-gray-500 border border-gray-200 hover:bg-gray-100'
                        }`}
                        title="Show full text with word wrapping"
                      >
                        Wrap
                      </button>
                      <button
                        onClick={() => updateTextPresentationMode(col, 'clip')}
                        className={`px-2 py-1 text-xs rounded transition-all duration-200 ${
                          textPresentationMode[col] === 'clip'
                            ? 'bg-green-100 text-green-700 border border-green-200'
                            : 'bg-gray-50 text-gray-500 border border-gray-200 hover:bg-gray-100'
                        }`}
                        title="Show first 50 characters"
                      >
                        Clip
                      </button>
                      <button
                        onClick={() => updateTextPresentationMode(col, 'words')}
                        className={`px-2 py-1 text-xs rounded transition-all duration-200 ${
                          textPresentationMode[col] === 'words'
                            ? 'bg-green-100 text-green-700 border border-green-200'
                            : 'bg-gray-50 text-gray-500 border border-gray-200 hover:bg-gray-100'
                        }`}
                        title="Show first 4 words"
                      >
                        4 Words
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedIds.length > 0 && (
          <div className="flex items-center justify-between mb-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-blue-700">
                <CheckCircle className="w-4 h-4" />
                <span className="font-medium">
                  {selectedIds.length} link{selectedIds.length === 1 ? '' : 's'} selected
                </span>
              </div>
              <div className="text-xs text-blue-600">
                Right-click any link for individual actions
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={startChat}
                className="flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700"
                title="Start AI chat with selected links"
              >
                <MessageSquare className="w-3 h-3" />
                Start Chat
              </Button>
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={copySelectedLinksInfo}
                className="flex items-center gap-2 bg-green-600 text-white hover:bg-green-700"
                title="Copy all link information to clipboard"
                data-copy-button="bulk"
              >
                <Copy className="w-3 h-3" />
                Copy Info
              </Button>
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={archiveSelected}
                className="flex items-center gap-2 bg-gray-600 text-white hover:bg-gray-700"
                title="Archive selected links"
              >
                <Archive className="w-3 h-3" />
                Archive
              </Button>
            </div>
          </div>
        )}
        {sortedLabelKeys.map((label) => (
          <div
            key={label}
            className={`border border-gray-200 rounded-xl overflow-hidden transition-all duration-200 shadow-sm ${
              dragOverGroup === label 
                ? 'border-blue-400 bg-blue-50 shadow-lg' 
                : 'hover:shadow-md'
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
            <div className="bg-gradient-to-r from-gray-100 to-gray-200 px-4 py-3 text-sm font-semibold flex items-center justify-between group-header border-b border-gray-200">
              <span className="text-gray-700">{label.charAt(0).toUpperCase() + label.slice(1)}</span>
              <span className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <button
                  type="button"
                  aria-label="Move up"
                  className="p-1.5 hover:bg-gray-300 rounded-md transition-all duration-200"
                  onClick={() => moveGroup(label, 'up')}
                >
                  <ChevronUp size={14} />
                </button>
                <button
                  type="button"
                  aria-label="Move down"
                  className="p-1.5 hover:bg-gray-300 rounded-md transition-all duration-200"
                  onClick={() => moveGroup(label, 'down')}
                >
                  <ChevronDown size={14} />
                </button>
              </span>
            </div>
            {/* Single table for perfect alignment */}
            <div className="overflow-x-auto">
              <table className="w-full">
              <thead>
                <tr className="bg-gray-50 text-xs font-semibold uppercase text-gray-600 border-b border-gray-200 text-left">
              {/* select all checkbox */}
                  <th className="w-10 px-3 py-3 border-r">
                    <div className="flex items-center justify-center">
                <HeaderCheckbox
                  groupLinks={groups[label] as any}
                  selectedIds={selectedIds}
                  toggleSelectAll={toggleSelectAll}
                />
              </div>
                  </th>
                  {columns.filter(col => visibleColumns[col]).map((col) => (
                    <th
                  key={col}
                      style={{ minWidth: getColumnWidth(col) }}
                      className={`px-4 py-3 border-r select-none cursor-move transition-all duration-150 relative text-left ${
                        resizingColumn === col
                          ? 'bg-blue-50 border-blue-300 shadow-sm'
                          : dragOverColumn === col 
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
                      <div className="flex items-center gap-2">
                        <div className="p-1 rounded hover:bg-gray-200 transition-colors duration-200">
                          <GripVertical 
                            size={14} 
                            className="text-gray-500 opacity-70 hover:opacity-100 transition-opacity duration-200 cursor-move" 
                          />
                        </div>
                  <SortHeader col={col} label={labelMap[col]} />
                </div>
                      {/* Resize handle */}
                      <div
                        className={`absolute right-0 top-0 bottom-0 w-1 cursor-col-resize transition-colors duration-200 ${
                          resizingColumn === col 
                            ? 'bg-blue-600 shadow-lg' 
                            : 'hover:bg-blue-500'
                        }`}
                        onMouseDown={(e) => onResizeStart(e, col)}
                        title="Drag to resize column"
                      />
                      {/* Width indicator during resize */}
                      {resizingColumn === col && (
                        <div className="absolute -top-8 right-0 bg-blue-600 text-white text-xs px-2 py-1 rounded shadow-lg z-10">
                          {getColumnWidth(col)}px
            </div>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sortGroupLinks(groups[label]).map((l) => (
                  <tr key={l.id} className="group relative hover:bg-gray-50 transition-all duration-200">
                    {/* Checkbox column */}
                    <td className="w-10 px-3 py-3 border-r border-gray-100">
                      <div className="flex items-center justify-center">
                        <button
                          type="button"
                          onClick={(e) => {
                  setSelectedIds((prev) => {
                              if (prev.includes(l.id)) {
                    return prev.filter((id) => id !== l.id);
                              } else {
                                return [...prev, l.id];
                              }
                            });
                          }}
                          onContextMenu={(e) => {
                            e.preventDefault();
                            setContextMenu({
                              show: true,
                              x: e.clientX,
                              y: e.clientY,
                              link: l
                            });
                          }}
                          title={
                            l.status === 'archived'
                              ? 'Done – right-click for more options / left-click to select'
                              : selectedIds.includes(l.id)
                              ? 'Selected – right-click for more options'
                              : 'Left-click to select / right-click for more options'
                          }
                          className="p-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded-md transition-all duration-200 hover:bg-gray-100"
                        >
                          {l.status === 'archived' ? (
                            <CheckCircle size={18} className="text-green-600" />
                          ) : selectedIds.includes(l.id) ? (
                            <CheckSquare size={18} className="text-blue-600" />
                          ) : (
                            <Square size={18} className="text-gray-400 group-hover:text-gray-600" />
                          )}
                        </button>
                      </div>
                    </td>
                    {/* Data columns */}
                    {columns.filter(c => visibleColumns[c]).map((c) => (
                      <td 
                        key={c} 
                        style={{ minWidth: getColumnWidth(c) }}
                        className="px-4 py-3 border-r border-gray-100 text-left"
                      >
                                        <div className={`${getTextPresentationClass(c)} text-left`}>
                  {renderCellContent(l, c)}
                </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            </div>

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

        {/* Context Menu */}
        {contextMenu.show && contextMenu.link && (
          <div
            className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[200px]"
            style={{
              left: contextMenu.x,
              top: contextMenu.y,
            }}
            onMouseLeave={() => setContextMenu({ show: false, x: 0, y: 0, link: null })}
          >
            <button
              onClick={() => {
                startChatWithSingleLink(contextMenu.link!);
                setContextMenu({ show: false, x: 0, y: 0, link: null });
              }}
              className="w-full px-4 py-2 text-left text-sm hover:bg-blue-50 flex items-center gap-2"
            >
              <MessageSquare className="w-4 h-4 text-blue-600" />
              Start Chat
            </button>
            <button
              onClick={() => {
                copySingleLinkInfo(contextMenu.link!);
                setContextMenu({ show: false, x: 0, y: 0, link: null });
              }}
              className="w-full px-4 py-2 text-left text-sm hover:bg-green-50 flex items-center gap-2"
              data-context-menu="copy"
            >
              <Copy className="w-4 h-4 text-green-600" />
              Copy Info
            </button>
            <button
              onClick={() => {
                void updateLink(contextMenu.link!.id, { 
                  status: contextMenu.link!.status === 'archived' ? 'active' : 'archived' 
                });
                setContextMenu({ show: false, x: 0, y: 0, link: null });
              }}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
            >
              <Archive className="w-4 h-4 text-gray-600" />
              {contextMenu.link!.status === 'archived' ? 'Mark Active' : 'Mark Archived'}
            </button>
            <hr className="my-1" />
            <button
              onClick={() => {
                setSelectedIds(prev => 
                  prev.includes(contextMenu.link!.id) 
                    ? prev.filter(id => id !== contextMenu.link!.id)
                    : [...prev, contextMenu.link!.id]
                );
                setContextMenu({ show: false, x: 0, y: 0, link: null });
              }}
              className="w-full px-4 py-2 text-left text-sm hover:bg-purple-50 flex items-center gap-2"
            >
              <CheckSquare className="w-4 h-4 text-purple-600" />
              {selectedIds.includes(contextMenu.link!.id) ? 'Deselect' : 'Select'}
            </button>
          </div>
        )}

        {/* Click outside to close context menu */}
        {contextMenu.show && (
          <div
            className="fixed inset-0 z-40"
            onClick={() => setContextMenu({ show: false, x: 0, y: 0, link: null })}
          />
        )}
      </div>
    );
  }

  const gridTemplate = {
    gridTemplateColumns: `40px repeat(${columns.length}, 1fr)`,
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
    <div className="bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
      {/* Table Settings Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-200 text-xs text-gray-600">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            Settings auto-saved
          </span>
          <button
            onClick={setBestView}
            className="flex items-center gap-1 text-gray-500 hover:text-green-600 transition-colors duration-200"
            title="Apply recommended table layout"
          >
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            Best View
          </button>
          <button
            onClick={() => setShowColumnSettings(!showColumnSettings)}
            className="flex items-center gap-1 text-gray-500 hover:text-blue-600 transition-colors duration-200"
            title="Toggle column visibility settings"
          >
            <Settings size={14} />
            Columns
          </button>
          <button
            onClick={resetTableSettings}
            className="text-gray-500 hover:text-red-600 transition-colors duration-200"
            title="Reset all table settings to defaults"
          >
            Reset Settings
          </button>
        </div>
        <div className="text-xs text-gray-500">
          Drag headers to reorder • Drag edges to resize
        </div>
      </div>

      {/* Column Visibility Settings */}
      {showColumnSettings && (
        <div className="px-4 py-3 bg-white border border-gray-200 rounded-lg shadow-sm mx-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-700">Column Visibility</h3>
            <button
              onClick={() => setShowColumnSettings(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
            >
              ×
            </button>
          </div>
          
          {/* Best View Preset Button */}
          <div className="mb-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-blue-800">Recommended View</h4>
                <p className="text-xs text-blue-600 mt-1">Optimized layout for best readability</p>
              </div>
              <button
                onClick={setBestView}
                className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-md hover:bg-blue-700 transition-colors duration-200"
              >
                Apply Best View
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            {DEFAULT_COLUMNS.map((col) => (
              <div key={col} className="space-y-2">
                {/* Column Visibility */}
                <button
                  onClick={() => toggleColumnVisibility(col)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-all duration-200 w-full ${
                    visibleColumns[col]
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'bg-gray-50 text-gray-500 border border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  {visibleColumns[col] ? (
                    <Eye size={14} className="text-blue-600" />
                  ) : (
                    <EyeOff size={14} className="text-gray-400" />
                  )}
                  <span>{labelMap[col] || col}</span>
                </button>
                
                {/* Text Presentation Mode - only show if column is visible */}
                {visibleColumns[col] && (
                  <div className="flex gap-1">
                    <button
                      onClick={() => updateTextPresentationMode(col, 'wrap')}
                      className={`px-2 py-1 text-xs rounded transition-all duration-200 ${
                        textPresentationMode[col] === 'wrap'
                          ? 'bg-green-100 text-green-700 border border-green-200'
                          : 'bg-gray-50 text-gray-500 border border-gray-200 hover:bg-gray-100'
                      }`}
                      title="Show full text with word wrapping"
                    >
                      Wrap
                    </button>
                    <button
                      onClick={() => updateTextPresentationMode(col, 'clip')}
                      className={`px-2 py-1 text-xs rounded transition-all duration-200 ${
                        textPresentationMode[col] === 'clip'
                          ? 'bg-green-100 text-green-700 border border-green-200'
                          : 'bg-gray-50 text-gray-500 border border-gray-200 hover:bg-gray-100'
                      }`}
                      title="Show first 50 characters"
                    >
                      Clip
                    </button>
                    <button
                      onClick={() => updateTextPresentationMode(col, 'words')}
                      className={`px-2 py-1 text-xs rounded transition-all duration-200 ${
                        textPresentationMode[col] === 'words'
                          ? 'bg-green-100 text-green-700 border border-green-200'
                          : 'bg-gray-50 text-gray-500 border border-gray-200 hover:bg-gray-100'
                      }`}
                      title="Show first 4 words"
                    >
                      4 Words
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedIds.length > 0 && (
        <div className="flex items-center justify-between p-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-b border-blue-500 shadow-lg">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <MessageSquare size={20} className="text-white" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Selected for AI Chat</h3>
                <p className="text-blue-100 text-sm">Ready to analyze your research</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-sm text-blue-100">Selected</div>
              <div className="text-xl font-bold">{selectedIds.length} link{selectedIds.length === 1 ? '' : 's'}</div>
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={archiveSelected} 
                className="bg-white/20 hover:bg-white/30 text-white border-white/30 hover:border-white/50"
              >
              <Archive size={16} className="mr-2" />
                Archive
              </Button>
              
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={copySelectedLinksInfo}
                className="bg-green-600 hover:bg-green-700 text-white border-green-600 hover:border-green-700 font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                data-copy-button="bulk"
              >
                <Copy size={16} className="mr-2" />
                Copy Info
              </Button>
              
              <Button 
                variant="primary" 
                size="sm" 
                onClick={startChat} 
                className="bg-white text-blue-600 hover:bg-gray-100 font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <MessageSquare size={16} className="mr-2" />
                Start AI Chat
            </Button>
          </div>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full">
        <thead>
          <tr className="bg-gray-50 text-xs font-semibold uppercase text-gray-600 border-b border-gray-200 text-left">
        {/* select all checkbox header */}
            <th className="w-10 px-3 py-3 border-r">
              <div className="flex items-center justify-center">
          <input
            type="checkbox"
            onChange={(e) => toggleSelectAll(e.target.checked, links)}
            checked={links.length > 0 && links.every((l) => selectedIds.includes(l.id))}
                  className="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
          />
        </div>
            </th>
            {columns.filter(col => visibleColumns[col]).map((col, index)=>(
              <th
            key={col}
                style={{ minWidth: getColumnWidth(col) }}
                className={`px-4 py-3 border-r select-none cursor-move transition-all duration-150 relative text-left ${
                  resizingColumn === col
                    ? 'bg-blue-50 border-blue-300 shadow-sm'
                    : dragOverColumn === col 
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
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded hover:bg-gray-200 transition-colors duration-200">
                    <GripVertical 
                      size={14} 
                      className="text-gray-500 opacity-70 hover:opacity-100 transition-opacity duration-200 cursor-move" 
                    />
                  </div>
            <SortHeader col={col} label={labelMap[col]} />
          </div>
                {/* Resize handle */}
                <div
                  className={`absolute right-0 top-0 bottom-0 w-1 cursor-col-resize transition-colors duration-200 ${
                    resizingColumn === col 
                      ? 'bg-blue-600 shadow-lg' 
                      : 'hover:bg-blue-500'
                  }`}
                  onMouseDown={(e) => onResizeStart(e, col)}
                  title="Drag to resize column"
                />
                {/* Width indicator during resize */}
                {resizingColumn === col && (
                  <div className="absolute -top-8 right-0 bg-blue-600 text-white text-xs px-2 py-1 rounded shadow-lg z-10">
                    {getColumnWidth(col)}px
      </div>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
        {links.map((l, index) => (
            <tr key={l.id} className="group relative hover:bg-gray-50 transition-all duration-200">
              {/* Checkbox column */}
              <td className="w-10 px-3 py-3 border-r border-gray-100">
                <div className="flex items-center justify-center">
                  <button
                    type="button"
                    onClick={(e) => {
              setSelectedIds((prev) => {
                        if (prev.includes(l.id)) {
                return prev.filter((id) => id !== l.id);
                        } else {
                          return [...prev, l.id];
                        }
                      });
                    }}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      void updateLink(l.id, { status: l.status === 'archived' ? 'active' : 'archived' });
                    }}
                    title={
                      l.status === 'archived'
                        ? 'Done – right-click to mark active / left-click to select'
                        : selectedIds.includes(l.id)
                        ? 'Selected – right-click to mark done'
                        : 'Left-click to select / right-click to mark done'
                    }
                    className="p-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded-md transition-all duration-200 hover:bg-gray-100"
                  >
                    {l.status === 'archived' ? (
                      <CheckCircle size={18} className="text-green-600" />
                    ) : selectedIds.includes(l.id) ? (
                      <CheckSquare size={18} className="text-blue-600" />
                    ) : (
                      <Square size={18} className="text-gray-400 group-hover:text-gray-600" />
                    )}
                  </button>
                </div>
              </td>
              {/* Data columns */}
              {columns.filter(c => visibleColumns[c]).map((c) => (
                <td 
                  key={c} 
                  style={{ minWidth: getColumnWidth(c) }}
                  className="px-4 py-3 border-r border-gray-100 text-left"
                >
                  <div className={`${getTextPresentationClass(c)} text-left`}>
                    {renderCellContent(l, c)}
                  </div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      </div>
      {/* Empty state is now handled by the parent component */}
      {chatLinks && (
        <div className="mt-6">
          <MultiChatPanel links={chatLinks} onClose={() => setChatLinks(null)} />
        </div>
      )}
      {pendingSummaries > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-full shadow-lg border border-blue-500">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
            <span className="font-medium">
              AI is generating summaries for {pendingSummaries} link{pendingSummaries === 1 ? '' : 's'}…
            </span>
          </div>
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

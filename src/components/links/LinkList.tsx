import { Skeleton } from '../Skeleton';
import { ErrorBanner } from '../ErrorBanner';
import { LinkRow } from './LinkRow';
import { Button } from '../Button';
import { Modal } from '../Modal';
import { MultiChatPanel } from '../ai/MultiChatPanel';
import { ChatGPTExportModal } from '../ChatGPTExportModal';
import { openChatGPTWithLinksAndCopy } from '../../utils/chatGptExport';
// Using store-provided filtered links rather than raw DB query
import { useLinkStore } from '../../stores/linkStore';
import { useCallback } from 'react';
import { linkService } from '../../services/linkService';
import {
  ChevronUp,
  ChevronDown,
  GripVertical,
  MessageSquare,
  Archive,
  Square,
  CheckSquare,
  CheckCircle,
  Eye,
  EyeOff,
  Settings,
  Copy,
  Clipboard,
  X,
  ExternalLink,
  Edit2,
  Trash,
  Plus,
} from 'lucide-react';
import React, { useEffect, useState, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { Link } from '../../types/Link';
import { aiSummaryService } from '../../services/aiSummaryService';
import { LinkForm } from './LinkForm';
import { LinkFilters } from './LinkFilters';
import { BulkEditForm } from './BulkEditForm';
import { DeleteConfirmationModal } from './DeleteConfirmationModal';
import { panelDiagnostics } from '../../utils/panelDiagnostics';

const DEFAULT_COLUMNS = [
  'name',
  'url',
  'description',
  'labels',
  'status',
  'priority',
  'created',
] as const;

export const LinkList: React.FC = () => {
  console.log('🔄 LinkList component rendering');
  
  const {
    sortKey,
    sortDir: sdir,
    toggleSort,
    links: storeLinks,
    loading,
    loadLinks,
    deleteLink,
  } = useLinkStore();
  
  // Use local state for the modal since Zustand subscriptions aren't working properly
  const [bulkDeleteModalOpen, setBulkDeleteModalOpenLocal] = useState(false);
  console.log('📊 Current bulkDeleteModalOpen state:', bulkDeleteModalOpen);
  
  // Wrapper to set both local state and store state
  const setBulkDeleteModalOpen = useCallback((open: boolean) => {
    console.log('🔧 Setting bulkDeleteModalOpen to:', open);
    setBulkDeleteModalOpenLocal(open);
    useLinkStore.getState().setBulkDeleteModalOpen(open);
  }, []);
  
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<Link | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const [columns, setColumns] = useState<string[]>([...DEFAULT_COLUMNS]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [chatLinks, setChatLinks] = useState<Link[] | null>(null);
  const [anchorLabel, setAnchorLabel] = useState<string | null>(null);
  const [pendingSummaries, setPendingSummaries] = useState(0);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [dragOverGroup, setDragOverGroup] = useState<string | null>(null);
  const [isSorting, setIsSorting] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'error';
  }>({
    show: false,
    message: '',
    type: 'success',
  });
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(
    () => {
      try {
        const saved = JSON.parse(
          localStorage.getItem('linkColumnWidths') || '{}'
        );
        // If no saved settings, use best view widths as default
        if (Object.keys(saved).length === 0) {
          const bestViewWidths = {
            name: 350, // Much wider for titles to prevent truncation
            description: 200, // Good width for description text
            labels: 150, // Good for multiple labels
            status: 100, // Adequate for status
            priority: 100, // Adequate for priority
          };
          localStorage.setItem(
            'linkColumnWidths',
            JSON.stringify(bestViewWidths)
          );
          return bestViewWidths;
        }
        return saved;
      } catch {
        const bestViewWidths = {
          name: 350, // Much wider for titles to prevent truncation
          labels: 150, // Good for multiple labels
          status: 100, // Adequate for status
          priority: 100, // Adequate for priority
        };
        localStorage.setItem(
          'linkColumnWidths',
          JSON.stringify(bestViewWidths)
        );
        return bestViewWidths;
      }
    }
  );
  const [resizingColumn, setResizingColumn] = useState<string | null>(null);
  const [previewWidths, setPreviewWidths] = useState<Record<string, number>>(
    {}
  );
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
    link: null,
  });

  // Helper to open the edit modal reliably
  const openEditor = (link: Link) => {
    console.log('[Links] openEditor called', {
      id: link.id,
      url: link.url,
      title: link.metadata?.title,
    });
    setEditingLink(link);
    // Defer opening by a tick to ensure editingLink is set before rendering form
    setTimeout(() => {
      console.log('[Links] Setting editOpen=true');
      setEditOpen(true);
      // Ensure an editor is visible even if the Headless UI modal fails to mount
      setShowEditFallback(true);
      // After a short delay, if neither modal nor fallback is present, render an emergency editor portal
      window.setTimeout(() => {
        const hasHeadless = !!document.querySelector('[data-modal-id="edit-link-modal"]');
        const hasFallback = !!document.getElementById('edit-link-modal-fallback');
        const hasEmergency = !!document.getElementById('srt-emergency-editor');
        if (!hasHeadless && !hasFallback && !hasEmergency) {
          try {
            const container = document.createElement('div');
            container.id = 'srt-emergency-editor';
            container.style.position = 'fixed';
            container.style.inset = '0';
            container.style.zIndex = '2147483647';
            container.style.background = 'rgba(0,0,0,0.5)';
            container.style.display = 'flex';
            container.style.alignItems = 'center';
            container.style.justifyContent = 'center';
            document.body.appendChild(container);
            const panel = document.createElement('div');
            panel.style.width = '100%';
            panel.style.maxWidth = '640px';
            panel.style.margin = '0 16px';
            panel.style.background = '#fff';
            panel.style.borderRadius = '12px';
            panel.style.boxShadow = '0 10px 30px rgba(0,0,0,0.25)';
            container.appendChild(panel);
            const root = createRoot(panel);
            const onClose = () => {
              try { root.unmount(); } catch {}
              try { container.remove(); } catch {}
            };
            root.render(
              <div>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <h3 style={{ margin: 0, fontSize: 18 }}>Edit Link</h3>
                  <button aria-label="Close" onClick={onClose} style={{ padding: 8, borderRadius: 8, background: 'transparent', border: '1px solid #eee' }}>×</button>
                </div>
                <div style={{ padding: 16 }}>
                  <LinkForm existing={link} onSuccess={onClose} />
                </div>
              </div>
            );
          } catch (err) {
            console.error('[Links] Failed to mount emergency editor', err);
          }
        }
      }, 120);
    }, 0);
  };

  // Ensure modal robustness: ESC closes, body scroll locks, and emergency container is cleaned
  useEffect(() => {
    const cleanupEmergencyContainer = () => {
      const el = document.getElementById('srt-emergency-editor');
      if (el) {
        try { el.remove(); } catch {}
      }
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        console.debug('[Links] ESC pressed – closing editor');
        setEditOpen(false);
        setEditingLink(null);
        cleanupEmergencyContainer();
      }
    };

    if (editOpen) {
      // Lock scroll while editor is open
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', onKey);
      return () => {
        document.body.style.overflow = prev;
        window.removeEventListener('keydown', onKey);
        cleanupEmergencyContainer();
      };
    }

    // When closed ensure cleanup as well
    cleanupEmergencyContainer();
    return undefined;
  }, [editOpen]);

  // Defensive: delegate clicks for inline edit buttons to ensure the modal opens
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) {
        console.debug('[Links] edit capture: event without target');
        return;
      }
      // Helpful trace of the click path
      try {
        const path = (e.composedPath?.() || [])
          .slice(0, 5)
          .map((n: any) => n?.nodeName || n?.tagName || typeof n)
          .join(' > ');
        console.debug('[Links] edit capture: click path:', path);
      } catch {}
      const editBtn = target.closest(
        '[data-edit-button="inline"]'
      ) as HTMLElement | null;
      if (!editBtn) {
        return;
      }
      const linkId = editBtn.getAttribute('data-link-id');
      if (!linkId) {
        console.debug('[Links] edit capture: button without data-link-id');
        return; // let React handler run
      }
      const link = storeLinks.find((l) => l.id === linkId);
      if (!link) {
        console.debug('[Links] edit capture: link not found in store for id', linkId);
        return; // let React handler run
      }
      e.preventDefault();
      e.stopPropagation();
      console.debug('[Links] edit capture: opening editor for id', linkId);
      openEditor(link);
    };
    console.debug('[Links] Installing edit capture handler on root');
    root.addEventListener('click', handler, true);
    return () => {
      console.debug('[Links] Removing edit capture handler from root');
      root.removeEventListener('click', handler, true);
    };
  }, [storeLinks]);

  // Trace modal state changes and data availability
  useEffect(() => {
    console.debug('[Links] editOpen state changed:', editOpen);
  }, [editOpen]);
  useEffect(() => {
    console.debug('[Links] editingLink updated:', editingLink?.id, editingLink?.metadata?.title);
  }, [editingLink]);

  // If the modal doesn't appear, enable a simple fallback overlay
  useEffect(() => {
    if (editOpen) {
      const t = window.setTimeout(() => {
        const node = document.querySelector('[data-modal-id="edit-link-modal"]');
        const present = !!node;
        console.debug('[Links] modal DOM presence:', present);
        if (present) {
          setShowEditFallback(false);
        } else {
          setShowEditFallback(true);
        }
      }, 80);
      return () => window.clearTimeout(t);
    } else {
      setShowEditFallback(false);
    }
  }, [editOpen]);

  // ChatGPT export modal state
  const [chatGPTExportOpen, setChatGPTExportOpen] = useState(false);
  const [chatGPTExportLinks, setChatGPTExportLinks] = useState<Link[]>([]);
  
  const [bulkEditOpen, setBulkEditOpen] = useState(false);
  const [showEditFallback, setShowEditFallback] = useState(false);

  // Text presentation mode state
  const [textPresentationMode, setTextPresentationMode] = useState<
    Record<string, 'wrap' | 'clip' | 'words'>
  >(() => {
    try {
      const saved = JSON.parse(
        localStorage.getItem('linkTextPresentationMode') || '{}'
      );
      // Ensure all default columns are present
      const defaultMode = DEFAULT_COLUMNS.reduce(
        (acc, col) => {
          acc[col] = saved[col] || 'wrap';
          return acc;
        },
        {} as Record<string, 'wrap' | 'clip' | 'words'>
      );
      return defaultMode;
    } catch {
      return DEFAULT_COLUMNS.reduce(
        (acc, col) => {
          acc[col] = 'wrap';
          return acc;
        },
        {} as Record<string, 'wrap' | 'clip' | 'words'>
      );
    }
  });

  // Column visibility state
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(
    () => {
      try {
        const saved = JSON.parse(
          localStorage.getItem('linkVisibleColumns') || '{}'
        );
        // If no saved settings, use best view as default
        if (Object.keys(saved).length === 0) {
          const bestViewVisibility = {
            name: true, // Always show name - most important
            url: false, // Hide URL to save space - can be accessed via name link
            description: true, // Show description for context
            labels: true, // Show labels for categorization
            status: true, // Show status for quick overview
            priority: true, // Show priority for task management
            created: false, // Hide created date to save space
          };
          localStorage.setItem(
            'linkVisibleColumns',
            JSON.stringify(bestViewVisibility)
          );
          return bestViewVisibility;
        }
        // Ensure all default columns are present
        const defaultVisibility = DEFAULT_COLUMNS.reduce(
          (acc, col) => {
            acc[col] = saved[col] !== undefined ? saved[col] : true;
            return acc;
          },
          {} as Record<string, boolean>
        );
        return defaultVisibility;
      } catch {
        const bestViewVisibility = {
          name: true, // Always show name - most important
          url: false, // Hide URL to save space - can be accessed via name link
          description: true, // Show description for context
          labels: true, // Show labels for categorization
          status: true, // Show status for quick overview
          priority: true, // Show priority for task management
          created: false, // Hide created date to save space
        };
        localStorage.setItem(
          'linkVisibleColumns',
          JSON.stringify(bestViewVisibility)
        );
        return bestViewVisibility;
      }
    }
  );

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
        const isValidOrder = DEFAULT_COLUMNS.every((col) =>
          parsedOrder.includes(col)
        );
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

  const normalizeCol = (val: string) => {
    const map: Record<string, string> = {
      name: 'name',
      url: 'url',
      description: 'description',
      labels: 'labels',
      status: 'status',
      priority: 'priority',
      created: 'created',
    };
    return map[val] || val;
  };

  const reorder = (source: string, target: string) => {
    console.log('Reordering columns:', source, '->', target);
    if (source === target) {
      console.log('Source and target are the same, no reordering needed');
      return;
    }
    setColumns((prev) => {
      const newOrder = [...prev];
      const src = normalizeCol(source);
      const tgt = normalizeCol(target);
      let fromIdx = newOrder.indexOf(src);
      let toIdx = newOrder.indexOf(tgt);
      console.log('Current order:', prev);
      console.log('Indices:', { fromIdx, toIdx, source: src, target: tgt });
      if (fromIdx === -1 || toIdx === -1) {
        // Fallback to case-insensitive matching
        const lower = newOrder.map((c) => c.toLowerCase());
        fromIdx = lower.indexOf(src.toLowerCase());
        toIdx = lower.indexOf(tgt.toLowerCase());
      }
      if (fromIdx === -1 || toIdx === -1) {
        console.log(
          'Invalid indices after normalization, returning previous order'
        );
        return prev;
      }
      const [moved] = newOrder.splice(fromIdx, 1);
      newOrder.splice(toIdx, 0, moved);
      console.log('New order:', newOrder);
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

  const onGroupDragStart = (
    e: React.DragEvent<HTMLDivElement>,
    grp: string
  ) => {
    e.dataTransfer.setData('text/plain', grp);
    e.dataTransfer.effectAllowed = 'move';
  };
  const onGroupDrop = (
    e: React.DragEvent<HTMLDivElement>,
    targetGrp: string
  ) => {
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
  const [draggedColumn, setDraggedColumn] = useState<string | null>(null);

  const onDragStart = (e: React.DragEvent<HTMLDivElement>, col: string) => {
    console.log('🚀 Drag started for column:', col);
    // Set multiple formats to maximize compatibility
    e.dataTransfer.setData('text/plain', col);
    e.dataTransfer.setData('application/x-srt-col', col);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedColumn(col);
    // Add visual feedback
    e.currentTarget.style.opacity = '0.5';
    e.currentTarget.style.transform = 'scale(1.05)';
  };

  const onDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    console.log('🏁 Drag ended');
    setDraggedColumn(null);
    // Reset visual feedback
    e.currentTarget.style.opacity = '1';
    e.currentTarget.style.transform = 'scale(1)';
  };

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>, targetCol: string) => {
    e.preventDefault();
    // Prefer internal state to avoid browser overriding dataTransfer
    const dtCustom = e.dataTransfer.getData('application/x-srt-col');
    const dtText = e.dataTransfer.getData('text/plain');
    const sourceCol = draggedColumn || dtCustom || dtText;
    console.log('🎯 Drop event - source:', sourceCol, 'target:', targetCol);

    if (sourceCol && sourceCol !== targetCol) {
      console.log('✅ Reordering columns:', sourceCol, '->', targetCol);
      reorder(sourceCol, targetCol);
    } else {
      console.log('ℹ️ No valid source column detected');
    }

    setDragOverColumn(null);
    setDraggedColumn(null);
  };

  const onDragEnter = (e: React.DragEvent<HTMLDivElement>, col: string) => {
    e.preventDefault();
    if (draggedColumn && draggedColumn !== col) {
      console.log('🎯 Drag entered column:', col);
      setDragOverColumn(col);
    }
  };

  const onDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    // Only clear if we're leaving the entire header cell
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragOverColumn(null);
    }
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
      setPreviewWidths((prev) => ({ ...prev, [col]: newWidth }));
    };

    const onMouseUp = () => {
      // Save the final width
      const finalWidth = previewWidths[col] || startWidth;
      setColumnWidths((prev) => {
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
    console.log('[Dashboard] archiveSelected function called');
    if (!selectedIds.length) {
      console.log('[Dashboard] No links selected for archiving');
      return;
    }
    console.log('[Dashboard] Archiving links:', selectedIds);
    try {
      // Update the extension storage directly
      const selectedLinks = getSelectedLinks();
      if (selectedLinks.length > 0) {
        try {
          window.postMessage(
            {
              type: 'SRT_UPDATE_LINKS_STATUS',
              links: selectedLinks.map((link) => ({
                id: link.id,
                status: 'archived',
              })),
            },
            '*'
          );
          console.log('[Dashboard] Archive request sent to extension');
        } catch (error) {
          console.warn(
            '[Dashboard] Failed to update extension storage:',
            error
          );
        }
      }

      console.log('[Dashboard] Links archived successfully');
      setSelectedIds([]);
      // Refresh the links to show updated status
      setTimeout(() => {
        loadLinks();
      }, 500); // Small delay to allow extension to process the update
    } catch (error) {
      console.error('[Dashboard] Failed to archive links:', error);
    }
  };

  const deleteSelected = async () => {
    if (!selectedIds.length) return;
    
    try {
      const selectedLinks = getSelectedLinks();
      if (selectedLinks.length > 0) {
        // Delete from the database
        for (const link of selectedLinks) {
          await deleteLink(link.id);
        }
        
        // Also notify the extension to remove these links
        try {
          window.postMessage(
            {
              type: 'SRT_DELETE_LINKS',
              linkIds: selectedLinks.map(link => link.id),
            },
            '*'
          );
        } catch (error) {
          console.warn('[Dashboard] Failed to notify extension:', error);
        }
      }

      setSelectedIds([]);
      // Refresh the links to show updated status
      setTimeout(() => {
        loadLinks();
      }, 500);
    } catch (error) {
      console.error('[Dashboard] Failed to delete links:', error);
    }
  };

  const bulkEditSelected = async (changes: Partial<Link & { addLabels?: string }>) => {
    if (!selectedIds.length) return;
    console.log('[Dashboard] Bulk editing links:', selectedIds, changes);
    try {
      const selectedLinks = getSelectedLinks();
      if (selectedLinks.length > 0) {
        // Update each selected link
        for (const link of selectedLinks) {
          const updateData: Partial<Link> = { ...changes };
          
          // Handle addLabels - append to existing labels
          if (changes.addLabels) {
            const newLabels = changes.addLabels
              .split(',')
              .map(l => l.trim())
              .filter(Boolean);
            const existingLabels = link.labels || [];
            const combinedLabels = [...new Set([...existingLabels, ...newLabels])];
            updateData.labels = combinedLabels;
            delete (updateData as any).addLabels;
          }
          
          await linkService.update(link.id, updateData);
        }
        
        // Refresh the links to show updated status
        setTimeout(() => {
          loadLinks();
        }, 100);
      }

      console.log('[Dashboard] Links updated successfully');
      setBulkEditOpen(false);
    } catch (error) {
      console.error('[Dashboard] Failed to update links:', error);
    }
  };

  const runPanelDiagnostics = async () => {
    console.log('🔧 Running panel diagnostics...');
    try {
      const results = await panelDiagnostics.runFullDiagnostics();
      panelDiagnostics.displayResults(results);
      
      const recommendations = panelDiagnostics.getRecommendations(results);
      console.log('💡 Recommendations:', recommendations);
      
      // Show results in an alert for quick feedback
      const status = results.overall.status;
      const message = results.overall.message;
      const icon = status === 'success' ? '✅' : status === 'warning' ? '⚠️' : '❌';
      
      alert(`${icon} Panel Diagnostics Complete\n\n${message}\n\nCheck console for detailed results and recommendations.`);
    } catch (error) {
      console.error('❌ Panel diagnostics failed:', error);
      alert('❌ Panel diagnostics failed. Check console for details.');
    }
  };

  useEffect(() => {
    // Ensure links are loaded on mount
    void loadLinks();
  }, [loadLinks]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + A for select all
      if ((e.ctrlKey || e.metaKey) && e.key === 'a' && !e.shiftKey) {
        e.preventDefault();
        if (storeLinks && storeLinks.length > 0) {
          const allIds = storeLinks.map(link => link.id);
          setSelectedIds(allIds);
        }
        return;
      }
      
      // Ctrl/Cmd + Delete for bulk delete
      if ((e.ctrlKey || e.metaKey) && e.key === 'Delete' && selectedIds.length > 0) {
        e.preventDefault();
        setBulkDeleteConfirmOpen(true);
        return;
      }
      
      // Escape to clear selection
      if (e.key === 'Escape' && selectedIds.length > 0) {
        e.preventDefault();
        setSelectedIds([]);
        return;
      }
      
      // Ctrl/Cmd + E for bulk edit
      if ((e.ctrlKey || e.metaKey) && e.key === 'e' && selectedIds.length > 0) {
        e.preventDefault();
        setBulkEditOpen(true);
        return;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedIds.length, storeLinks]);

  useEffect(() => {
    // Only run this check if we have links and it's not already running
    if (!storeLinks || storeLinks.length === 0) {
      setPendingSummaries(0);
      return;
    }

    let isMounted = true;

    (async () => {
      try {
        let count = 0;
        // Process links in batches to avoid overwhelming the system
        const batchSize = 5;
        for (let i = 0; i < storeLinks.length; i += batchSize) {
          const batch = storeLinks.slice(i, i + batchSize);
          const promises = batch.map(async (l) => {
            try {
              const sums = await aiSummaryService.getByLink(l.id);
              return !sums.some((s) => s.kind === 'tldr');
            } catch (error) {
              console.warn('Failed to check summaries for link:', l.id, error);
              return false; // Assume it has a summary if we can't check
            }
          });

          const results = await Promise.all(promises);
          count += results.filter(Boolean).length;

          // Check if component is still mounted
          if (!isMounted) return;

          // Small delay between batches to prevent blocking
          if (i + batchSize < storeLinks.length) {
            await new Promise((resolve) => setTimeout(resolve, 100));
          }
        }

        if (isMounted) {
          setPendingSummaries(count);
        }
      } catch (error) {
        console.error('Error checking pending summaries:', error);
        if (isMounted) {
          setPendingSummaries(0);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [storeLinks]);

  const toggleSelectAll = (checked: boolean, visibleLinks: Link[]) => {
    if (!visibleLinks) return;
    if (checked) {
      setSelectedIds((prev) => [
        ...prev,
        ...visibleLinks.map((l) => l.id).filter((id) => !prev.includes(id)),
      ]);
    } else {
      setSelectedIds((prev) =>
        prev.filter((id) => !visibleLinks.some((l) => l.id === id))
      );
    }
  };

  const startChat = () => {
    console.log('[Dashboard] startChat function called');
    const selected = getSelectedLinks();
    console.log('[Dashboard] Starting chat with links:', selected);
    if (selected.length) {
      // determine anchor label from last selected link
      const lastId = selectedIds[selectedIds.length - 1];
      const lastLink = storeLinks?.find((l) => l.id === lastId);
      let lbl: string | null = null;
      if (lastLink && lastLink.labels) {
        lbl =
          lastLink.labels && lastLink.labels.length
            ? lastLink.labels[0]
            : 'Unlabeled';
      }
      setAnchorLabel(lbl);

      setChatLinks(selected);
      setSelectedIds([]);
    } else {
      console.log('[Dashboard] No links selected for chat');
    }
  };

  const copySelectedLinksInfo = async () => {
    const selected = getSelectedLinks();
    console.log('[Dashboard] Copying links:', selected);
    if (selected.length) {
      // Create rich copy format with images
      const richCopyData = selected
        .map((link) => {
          const hasImage =
            link.metadata.image && link.metadata.image !== 'No image';
          const isGitHub = link.url.includes('github.com');

          // Enhanced format with image preview
          const richData = {
            id: link.id,
            url: link.url,
            metadata: {
              title: (link.metadata && link.metadata.title) || 'Untitled',
              description:
                (link.metadata && link.metadata.description) ||
                'No description',
              image: (link.metadata && link.metadata.image) || 'No image',
              hasImage: hasImage,
              isGitHub: isGitHub,
            },
            summary: link.summary || 'No summary',
            labels: link.labels,
            priority: link.priority,
            status: link.status,
            boardId: link.boardId || null,
            createdAt: link.createdAt,
            updatedAt: link.updatedAt,
          };

          return JSON.stringify(richData, null, 2);
        })
        .join('\n\n---\n\n');

      try {
        // Try to copy rich content with images
        if (selected.length === 1) {
          const link = selected[0];
          const hasImage =
            link.metadata.image && link.metadata.image !== 'No image';
          const isGitHub = link.url.includes('github.com');
          let htmlContent = '';

          // Special GitHub repository preview
          if (isGitHub) {
            const repoPath = link.url.replace('https://github.com/', '');
            const [owner, repo] = repoPath.split('/');

            // Create a simpler, more compatible GitHub preview
            htmlContent = `
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', Helvetica, Arial, sans-serif; max-width: 400px; border: 1px solid #d0d7de; border-radius: 6px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.12); background: white;">
                <div style="background: #f6f8fa; padding: 16px; border-bottom: 1px solid #d0d7de;">
                  <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                    <span style="font-size: 20px;">🐙</span>
                    <span style="color: #0969da; font-weight: 600; font-size: 14px;">${owner}/${repo}</span>
                  </div>
                  <p style="margin: 0; color: #656d76; font-size: 14px; line-height: 1.4;">${link.metadata.description || 'GitHub repository'}</p>
                </div>
                <div style="padding: 16px;">
                  <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 12px;">
                    <span style="color: #656d76; font-size: 12px;">📁 Repository</span>
                    <span style="color: #656d76; font-size: 12px;">⭐ Star</span>
                    <span style="color: #656d76; font-size: 12px;">🍴 Fork</span>
                  </div>
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="color: #656d76; font-size: 14px;">🔗</span>
                    <span style="color: #0969da; font-size: 14px; text-decoration: none;">${link.url}</span>
                  </div>
                  ${
                    link.labels && link.labels.length > 0
                      ? `<div style="margin-top: 12px; display: flex; gap: 4px; flex-wrap: wrap;">
                    ${link.labels.map((label: string) => `<span style="background: #f6f8fa; color: #656d76; padding: 2px 8px; border-radius: 12px; font-size: 12px; border: 1px solid #d0d7de;">${label}</span>`).join('')}
                  </div>`
                      : ''
                  }
                </div>
              </div>
            `;

            // Also create a plain text version for better compatibility
            const plainTextVersion = `🐙 GitHub Repository: ${owner}/${repo}\n${link.metadata.description || 'GitHub repository'}\n🔗 ${link.url}${link.labels && link.labels.length > 0 ? `\n🏷️ Labels: ${link.labels.join(', ')}` : ''}`;

            console.log('GitHub link detected:', link.url);
            console.log('Repository info:', {
              owner,
              repo,
              description: link.metadata.description,
            });

            try {
              const clipboardItem = new ClipboardItem({
                'text/plain': new Blob([plainTextVersion], {
                  type: 'text/plain',
                }),
                'text/html': new Blob([htmlContent], { type: 'text/html' }),
              });

              await navigator.clipboard.write([clipboardItem]);
              console.log('GitHub preview copied successfully');
            } catch (err) {
              console.error('Failed to copy GitHub preview:', err);
              // Fallback to text-only
              await navigator.clipboard.writeText(plainTextVersion);
            }
          } else if (hasImage) {
            // Regular image preview for non-GitHub links
            htmlContent = `
              <div style="font-family: Arial, sans-serif; max-width: 400px; border: 1px solid #e1e5e9; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                <img src="${link.metadata.image}" style="width: 100%; height: 200px; object-fit: cover;" alt="${link.metadata.title || 'Link preview'}">
                <div style="padding: 16px;">
                  <h3 style="margin: 0 0 8px 0; color: #24292f; font-size: 16px;">${link.metadata.title || 'Untitled'}</h3>
                  <p style="margin: 0 0 12px 0; color: #656d76; font-size: 14px; line-height: 1.4;">${link.metadata.description || 'No description'}</p>
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="color: #656d76;">
                      <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/>
                    </svg>
                    <span style="color: #0969da; font-size: 14px; text-decoration: none;">${link.url}</span>
                  </div>
                  ${
                    link.labels.length > 0
                      ? `<div style="margin-top: 12px; display: flex; gap: 4px; flex-wrap: wrap;">
                    ${link.labels.map((label: string) => `<span style="background: #f6f8fa; color: #656d76; padding: 2px 8px; border-radius: 12px; font-size: 12px;">${label}</span>`).join('')}
                  </div>`
                      : ''
                  }
                </div>
              </div>
            `;

            try {
              const clipboardItem = new ClipboardItem({
                'text/plain': new Blob([richCopyData], { type: 'text/plain' }),
                'text/html': new Blob([htmlContent], { type: 'text/html' }),
              });

              await navigator.clipboard.write([clipboardItem]);
            } catch (err) {
              console.error('Failed to copy image preview:', err);
              // Fallback to text-only
              await navigator.clipboard.writeText(richCopyData);
            }
          } else {
            // Text-only copy for links without images
            await navigator.clipboard.writeText(richCopyData);
          }
        } else {
          // Multiple links - just copy text
          await navigator.clipboard.writeText(richCopyData);
        }

        // Show visual feedback
        const button = document.querySelector(
          '[data-copy-button="bulk"]'
        ) as HTMLButtonElement;
        if (button) {
          const originalText = button.innerHTML;
          const hasImage = selected.some(
            (link) => link.metadata.image && link.metadata.image !== 'No image'
          );
          const hasGitHub = selected.some((link) =>
            link.url.includes('github.com')
          );
          let icon = '✓';
          if (hasGitHub) {
            icon = '🐙'; // GitHub octopus icon
          } else if (hasImage) {
            icon = '🖼️';
          }
          button.innerHTML = `<span style="display: flex; align-items: center; gap: 2px;">${icon} Copied!</span>`;
          button.disabled = true;
          setTimeout(() => {
            button.innerHTML = originalText;
            button.disabled = false;
          }, 2000);
        }
        console.log('Rich link data copied to clipboard');
      } catch (err) {
        console.error('Failed to copy to clipboard:', err);
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = richCopyData;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
    }
  };

  const copySingleLinkInfo = async (link: Link) => {
    const hasImage = link.metadata.image && link.metadata.image !== 'No image';
    const isGitHub = link.url.includes('github.com');

    const richData = {
      id: link.id,
      url: link.url,
      metadata: {
        title: link.metadata.title || 'Untitled',
        description: link.metadata.description || 'No description',
        image: link.metadata.image || 'No image',
        hasImage: hasImage,
        isGitHub: isGitHub,
      },
      summary: link.summary || 'No summary',
      labels: link.labels,
      priority: link.priority,
      status: link.status,
      boardId: link.boardId || null,
      createdAt: link.createdAt,
      updatedAt: link.updatedAt,
    };

    const linkInfo = JSON.stringify(richData, null, 2);

    try {
      // Try to copy rich content with image preview
      let htmlContent = '';

      // Special GitHub repository preview
      if (isGitHub) {
        const repoPath = link.url.replace('https://github.com/', '');
        const [owner, repo] = repoPath.split('/');

        // Create a simpler, more compatible GitHub preview
        htmlContent = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', Helvetica, Arial, sans-serif; max-width: 400px; border: 1px solid #d0d7de; border-radius: 6px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.12); background: white;">
            <div style="background: #f6f8fa; padding: 16px; border-bottom: 1px solid #d0d7de;">
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                <span style="font-size: 20px;">🐙</span>
                <span style="color: #0969da; font-weight: 600; font-size: 14px;">${owner}/${repo}</span>
              </div>
              <p style="margin: 0; color: #656d76; font-size: 14px; line-height: 1.4;">${link.metadata.description || 'GitHub repository'}</p>
            </div>
            <div style="padding: 16px;">
              <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 12px;">
                <span style="color: #656d76; font-size: 12px;">📁 Repository</span>
                <span style="color: #656d76; font-size: 12px;">⭐ Star</span>
                <span style="color: #656d76; font-size: 12px;">🍴 Fork</span>
              </div>
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="color: #656d76; font-size: 14px;">🔗</span>
                <span style="color: #0969da; font-size: 14px; text-decoration: none;">${link.url}</span>
              </div>
              ${
                link.labels && link.labels.length > 0
                  ? `<div style="margin-top: 12px; display: flex; gap: 4px; flex-wrap: wrap;">
                ${link.labels.map((label: string) => `<span style="background: #f6f8fa; color: #656d76; padding: 2px 8px; border-radius: 12px; font-size: 12px; border: 1px solid #d0d7de;">${label}</span>`).join('')}
              </div>`
                  : ''
              }
            </div>
          </div>
        `;

        // Also create a plain text version for better compatibility
        const plainTextVersion = `🐙 GitHub Repository: ${owner}/${repo}\n${link.metadata.description || 'GitHub repository'}\n🔗 ${link.url}${link.labels && link.labels.length > 0 ? `\n🏷️ Labels: ${link.labels.join(', ')}` : ''}`;

        console.log('Single GitHub link detected:', link.url);
        console.log('Repository info:', {
          owner,
          repo,
          description: link.metadata.description,
        });

        try {
          const clipboardItem = new ClipboardItem({
            'text/plain': new Blob([plainTextVersion], { type: 'text/plain' }),
            'text/html': new Blob([htmlContent], { type: 'text/html' }),
          });

          await navigator.clipboard.write([clipboardItem]);
          console.log('Single GitHub preview copied successfully');
          showCopyFeedback('✨ GitHub preview copied!', 'success');
        } catch (err) {
          console.error('Failed to copy single GitHub preview:', err);
          // Fallback to text-only
          await navigator.clipboard.writeText(plainTextVersion);
          showCopyFeedback('📋 Link info copied!', 'success');
        }
      } else if (hasImage) {
        // Regular image preview for non-GitHub links
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 400px; border: 1px solid #e1e5e9; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <img src="${link.metadata.image}" style="width: 100%; height: 200px; object-fit: cover;" alt="${link.metadata.title || 'Link preview'}">
            <div style="padding: 16px;">
              <h3 style="margin: 0 0 8px 0; color: #24292f; font-size: 16px;">${link.metadata.title || 'Untitled'}</h3>
              <p style="margin: 0 0 12px 0; color: #656d76; font-size: 14px; line-height: 1.4;">${link.metadata.description || 'No description'}</p>
              <div style="display: flex; align-items: center; gap: 8px;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="color: #656d76;">
                  <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/>
                </svg>
                <span style="color: #0969da; font-size: 14px; text-decoration: none;">${link.url}</span>
              </div>
              ${
                link.labels.length > 0
                  ? `<div style="margin-top: 12px; display: flex; gap: 4px; flex-wrap: wrap;">
                ${link.labels.map((label: string) => `<span style="background: #f6f8fa; color: #656d76; padding: 2px 8px; border-radius: 12px; font-size: 12px;">${label}</span>`).join('')}
              </div>`
                  : ''
              }
            </div>
          </div>
        `;

        try {
          const clipboardItem = new ClipboardItem({
            'text/plain': new Blob([linkInfo], { type: 'text/plain' }),
            'text/html': new Blob([htmlContent], { type: 'text/html' }),
          });

          await navigator.clipboard.write([clipboardItem]);
          showCopyFeedback('🖼️ Image preview copied!', 'success');
        } catch (err) {
          console.error('Failed to copy image preview:', err);
          // Fallback to text-only
          await navigator.clipboard.writeText(linkInfo);
          showCopyFeedback('📋 Link info copied!', 'success');
        }
      } else {
        // Text-only copy for links without images
        await navigator.clipboard.writeText(linkInfo);
        showCopyFeedback('📋 Link info copied!', 'success');
      }
    } catch (err) {
      console.error('Failed to copy link info:', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = linkInfo;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      showCopyFeedback('📋 Link info copied!', 'success');
    }
  };

  const startChatWithSingleLink = (link: Link) => {
    setChatLinks([link]);
    setAnchorLabel(
      link.labels && link.labels.length ? link.labels[0] : 'Unlabeled'
    );
  };

  const showCopyFeedback = (
    message: string,
    type: 'success' | 'error' = 'success'
  ) => {
    setCopyFeedback({ show: true, message, type });
    setTimeout(() => {
      setCopyFeedback({ show: false, message: '', type: 'success' });
    }, 3000);
  };

  // Helper function to get selected links
  const getSelectedLinks = () => {
    const selected = (storeLinks || []).filter((link) =>
      selectedIds.includes(link.id)
    );
    console.log('[Dashboard] Selected links:', selected);
    console.log('[Dashboard] Selected IDs:', selectedIds);
    console.log('[Dashboard] Available links:', storeLinks?.length || 0);
    return selected;
  };

  // Context menu reset helper
  const resetContextMenu = () => {
    setContextMenu({ show: false, x: 0, y: 0, link: null });
  };

  // ChatGPT export button styling
  const chatGPTExportButtonClass =
    'group flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 font-semibold';

  // ChatGPT export handler function
  const handleChatGPTExport = async (linksToExport: Link[]) => {
    console.log('[Dashboard] Exporting to ChatGPT:', linksToExport);
    if (linksToExport.length === 0) {
      alert('Please select at least one link to export.');
      return;
    }
    // Directly trigger copy + open for faster UX; keep modal as fallback if needed
    try {
      await openChatGPTWithLinksAndCopy(linksToExport, {
        includeSummaries: false,
        includeRawContent: false,
        format: 'markdown',
      });
    } catch (e) {
      console.warn('Direct export failed, falling back to modal', e);
      setChatGPTExportLinks(linksToExport);
      setChatGPTExportOpen(true);
    }
  };

  // Define modals function that will be called later (after all state is defined)
  const renderModals = () => {
    console.log('🎬 renderModals() called, bulkDeleteModalOpen:', bulkDeleteModalOpen);
    return (
      <>
        {/* Single Link Edit Modal */}
        <Modal isOpen={editOpen} onClose={() => setEditOpen(false)} title="Edit Link">
        {editingLink && (
          <LinkForm
            existing={editingLink}
            onSuccess={() => {
              console.debug('[Links] Edit saved – closing modal');
              setEditOpen(false);
              setEditingLink(null);
            }}
          />
        )}
      </Modal>

      {/* ChatGPT Export Modal */}
      <ChatGPTExportModal
        isOpen={chatGPTExportOpen}
        onClose={() => setChatGPTExportOpen(false)}
        links={chatGPTExportLinks}
      />

      {/* Bulk Edit Modal */}
      <Modal isOpen={bulkEditOpen} onClose={() => setBulkEditOpen(false)} title="Bulk Edit Selected Links">
        <BulkEditForm 
          selectedLinks={getSelectedLinks()} 
          onSave={bulkEditSelected}
          onCancel={() => setBulkEditOpen(false)}
        />
      </Modal>

      {/* Bulk Delete Confirmation Modal */}
      {console.log('🔍 Rendering DeleteConfirmationModal with isOpen:', bulkDeleteModalOpen)}
      <DeleteConfirmationModal
        isOpen={bulkDeleteModalOpen}
        onClose={() => setBulkDeleteModalOpen(false)}
        onConfirm={deleteSelected}
        links={getSelectedLinks()}
        title="Delete Selected Links"
      />
    </>
    );
  };

  if (loading)
    return (
      <>
        {renderModals()}
        <div className="border border-gray-200">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-10 w-full border-b border-gray-100" />
          ))}
        </div>
      </>
    );

  // Error handling is done through the loading state and null checks

  // Function to get column width with constraints
  const getColumnWidth = (col: string) => {
    const defaultWidths: Record<string, number> = {
      name: 400, // Much wider for names to prevent truncation
      url: 300, // Wider for URLs
      labels: 200, // Wider for multiple labels
      status: 120, // Adequate for status
      priority: 120, // Adequate for priority
      created: 140, // Adequate for dates
    };

    // Use preview width if currently resizing this column
    if (resizingColumn === col && previewWidths[col] !== undefined) {
      return Math.max(100, Math.min(previewWidths[col], 800)); // Min 100px, Max 800px
    }

    const customWidth = columnWidths[col];
    const defaultWidth = defaultWidths[col] || 200;
    const width = customWidth || defaultWidth;

    // Ensure reasonable constraints to prevent content cutoff
    return Math.max(100, Math.min(width, 800)); // Min 100px, Max 800px
  };

  // Calculate total table width
  const getTotalTableWidth = () => {
    const checkboxWidth = 40; // Fixed checkbox column width
    const totalColumnWidths = columns
      .filter((col) => visibleColumns[col])
      .reduce((sum, col) => sum + getColumnWidth(col), 0);
    return checkboxWidth + totalColumnWidths;
  };

  // Function to toggle column visibility
  const toggleColumnVisibility = (column: string) => {
    setVisibleColumns((prev) => {
      const newVisibility = { ...prev, [column]: !prev[column] };
      localStorage.setItem('linkVisibleColumns', JSON.stringify(newVisibility));
      return newVisibility;
    });
  };

  // Function to set text presentation mode
  const updateTextPresentationMode = (
    column: string,
    mode: 'wrap' | 'clip' | 'words'
  ) => {
    setTextPresentationMode((prev) => {
      const newMode = { ...prev, [column]: mode };
      localStorage.setItem('linkTextPresentationMode', JSON.stringify(newMode));
      return newMode;
    });
  };

  // Function to set best view preset
  const setBestView = () => {
    const bestViewVisibility = {
      name: true, // Always show name - most important
      url: true, // Show URL for better context
      description: true, // Show description for context
      labels: true, // Show labels for categorization
      status: true, // Show status for quick overview
      priority: true, // Show priority for task management
      created: true, // Show created date for timeline context
    };

    const bestViewWidths = {
      name: 450, // Much wider for titles to prevent truncation
      url: 300, // Good for URLs
      description: 250, // Good width for description text
      labels: 200, // Good for multiple labels
      status: 120, // Adequate for status
      priority: 120, // Adequate for priority
      created: 140, // Adequate for dates
    };

    const bestViewTextMode = {
      name: 'words' as const, // Show first 4 words for names
      description: 'words' as const, // Show first few words for description
      labels: 'wrap' as const, // Full labels
      status: 'wrap' as const, // Full status
      priority: 'wrap' as const, // Full priority
    };

    setVisibleColumns(bestViewVisibility);
    setColumnWidths(bestViewWidths);
    setTextPresentationMode(bestViewTextMode);
    localStorage.setItem(
      'linkVisibleColumns',
      JSON.stringify(bestViewVisibility)
    );
    localStorage.setItem('linkColumnWidths', JSON.stringify(bestViewWidths));
    localStorage.setItem(
      'linkTextPresentationMode',
      JSON.stringify(bestViewTextMode)
    );

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
    setVisibleColumns(
      DEFAULT_COLUMNS.reduce(
        (acc, col) => {
          acc[col] = true;
          return acc;
        },
        {} as Record<string, boolean>
      )
    );
    localStorage.removeItem('linkVisibleColumns');

    // Reset text presentation mode
    setTextPresentationMode(
      DEFAULT_COLUMNS.reduce(
        (acc, col) => {
          acc[col] = 'wrap';
          return acc;
        },
        {} as Record<string, 'wrap' | 'clip' | 'words'>
      )
    );
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
              title={(link.metadata && link.metadata.title) || link.url}
            >
              {formatText(
                (link.metadata && link.metadata.title) || 'Untitled',
                col
              )}
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
              <Copy className="w-4 h-4" />
            </button>
            <button
              type="button"
              aria-label="Edit link"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.debug('[Links] Inline edit button clicked for id', link.id);
                openEditor(link);
              }}
              className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-blue-600"
              title="Edit link"
              data-edit-button="inline"
              data-link-id={link.id}
            >
              <Edit2 className="w-4 h-4" />
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
      case 'labels':
        return (
          <div className="flex flex-wrap gap-1">
            {link.labels &&
              link.labels.map((label) => (
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
          <span
            className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
              link.status === 'active'
                ? 'bg-green-100 text-green-800'
                : link.status === 'archived'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-red-100 text-red-800'
            }`}
          >
            {link.status}
          </span>
        );
      case 'priority':
        return (
          <span
            className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
              link.priority === 'high'
                ? 'bg-red-100 text-red-800'
                : link.priority === 'medium'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-green-100 text-green-800'
            }`}
          >
            {link.priority}
          </span>
        );
      case 'created': {
        let dateStr = '';
        if (link.createdAt) {
          const d = new Date(link.createdAt);
          if (!isNaN(d.getTime())) {
            dateStr = d.toLocaleDateString();
          }
        }
        return <span className="text-sm text-gray-500">{dateStr || '—'}</span>;
      }
      default:
        return null;
    }
  };

  // Function to sort links within a group
  const sortGroupLinks = (groupLinks: Link[]) => {
    return [...groupLinks].sort((a, b) => {
      let cmp = 0;

      switch (localSortKey) {
        case 'name':
          const aTitle = (a.metadata && a.metadata.title) || '';
          const bTitle = (b.metadata && b.metadata.title) || '';
          cmp = aTitle.localeCompare(bTitle);
          break;
        case 'url':
          cmp = a.url.localeCompare(b.url);
          break;
        case 'description':
          const aDesc = (a.metadata && a.metadata.description) || '';
          const bDesc = (b.metadata && b.metadata.description) || '';
          cmp = aDesc.localeCompare(bDesc);
          break;
        case 'labels':
          const aLabels =
            a.labels && a.labels.length ? a.labels.join(', ') : '';
          const bLabels =
            b.labels && b.labels.length ? b.labels.join(', ') : '';
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
          cmp =
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        default:
          cmp = 0;
      }

      return localSortDir === 'asc' ? cmp : -cmp;
    });
  };

  const SortHeader: React.FC<{ col: string; label: string }> = ({
    col,
    label,
  }) => {
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
            setLocalSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
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
      <div className="flex items-center gap-1.5 w-full">
        <button
          onClick={handleSort}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              handleSort(e);
            }
          }}
          className={`flex items-center gap-1.5 rounded-md px-1.5 py-1 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
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
          <span className="font-semibold text-xs">{label}</span>
          {is ? (
            currentSortDir === 'asc' ? (
              <ChevronUp size={12} className="text-blue-600" />
            ) : (
              <ChevronDown size={12} className="text-blue-600" />
            )
          ) : (
            <div className="w-3 h-3 opacity-30" />
          )}
        </button>
      </div>
    );
  };

  const SelectionBanner: React.FC<{ count: number }> = ({ count }) => (
    <div className="flex flex-wrap items-center justify-between gap-4 p-3 bg-blue-50/80 border border-blue-200 rounded-lg shadow-md backdrop-blur-sm">
      <span className="text-sm font-semibold text-blue-900">
        {count} link{count === 1 ? '' : 's'} selected
      </span>
      <div className="flex flex-wrap items-center gap-5 ml-auto pr-2">
        <Button
          size="md"
          variant="primary"
          onClick={startChat}
          title="Start AI chat"
        >
          <MessageSquare className="w-4 h-4" />
          Chat
        </Button>
        <Button
          size="md"
          variant="success"
          onClick={copySelectedLinksInfo}
          title="Copy info"
        >
          <Copy className="w-4 h-4" />
          Copy
        </Button>
        <Button
          size="md"
          variant="warning"
          className="inline-flex items-center gap-2"
          onClick={() => handleChatGPTExport(getSelectedLinks())}
          title="Export to ChatGPT"
        >
          <ExternalLink className="w-4 h-4" />
          GPT
        </Button>
        <Button
          size="md"
          variant="secondary"
          onClick={archiveSelected}
          title="Archive"
        >
          <Archive className="w-4 h-4" />
          Archive
        </Button>
      </div>
    </div>
  );

  // Grouping view when sorted by labels
  if (sortKey === 'labels') {
    // Build groups; include 'Unlabeled' for none
    const groups: Record<string, Link[]> = {};
    const archivedArr: Link[] = [];
    const deletedArr: Link[] = [];
    for (const link of storeLinks) {
      if (link.status === 'archived') {
        archivedArr.push(link);
        continue;
      }
      if (link.status === 'deleted') {
        deletedArr.push(link);
        continue;
      }
      // active links grouped by labels
      if (!link.labels || link.labels.length === 0) {
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
      const customOrdered = groupOrder.filter((k) =>
        sortedLabelKeys.includes(k)
      );
      const remaining = sortedLabelKeys.filter((k) => !groupOrder.includes(k));
      sortedLabelKeys = [...customOrdered, ...remaining];
    }

    // update ref for callbacks
    groupKeysRef.current = sortedLabelKeys;

    const gridTemplate = {
      gridTemplateColumns: `40px repeat(${columns.length}, 1fr)`,
      gap: '0',
    } as React.CSSProperties;

    const labelMap: Record<string, string> = {
      name: 'Name',
      url: 'Link',
      description: 'Description',
      labels: 'Labels',
      priority: 'Priority',
      status: 'Status',
      created: 'Created',
    };

    return (
      <div className="space-y-6">
        {/* Clean Table Settings Bar */}
        <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-600">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
              <span className="font-medium text-green-700">
                Settings auto-saved
              </span>
            </span>
            <button
              onClick={setBestView}
              className="group flex items-center gap-1.5 px-2 py-1 bg-green-100 hover:bg-green-200 text-green-700 hover:text-green-800 rounded-md transition-colors duration-200"
              title="Apply recommended table layout"
            >
              <div className="w-1.5 h-1.5 bg-green-600 rounded-full"></div>
              <span className="font-medium">Best View</span>
            </button>
            <button
              onClick={() => setShowColumnSettings(!showColumnSettings)}
              className="group flex items-center gap-1.5 px-2 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 hover:text-blue-800 rounded-md transition-colors duration-200"
              title="Toggle column visibility settings"
            >
              <Settings
                size={12}
                className="group-hover:rotate-180 transition-transform duration-200"
              />
              <span className="font-medium">Columns</span>
            </button>
            <button
              onClick={resetTableSettings}
              className="group flex items-center gap-1.5 px-2 py-1 bg-red-100 hover:bg-red-200 text-red-700 hover:text-red-800 rounded-md transition-colors duration-200"
              title="Reset all table settings to defaults"
            >
              <span className="font-medium">Reset Settings</span>
            </button>
            <button
              onClick={() => {
                console.log('[Dashboard] Debug: Current store state:', {
                  rawLinks: storeLinks?.length || 0,
                  loading,
                  error: useLinkStore.getState().error
                });
                
                // Test extension communication
                if (typeof window !== 'undefined' && (window as any).chrome?.storage) {
                  (window as any).chrome.storage.local.get(['links'], (result: any) => {
                    console.log('[Dashboard] Debug: Chrome storage result:', result);
                    alert(`Chrome storage contains ${result.links?.length || 0} links`);
                  });
                } else {
                  console.log('[Dashboard] Debug: Chrome storage not available');
                  alert('Chrome storage not available');
                }
              }}
              className="group flex items-center gap-1.5 px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-gray-800 rounded-md transition-colors duration-200"
              title="Debug extension communication"
            >
              <span className="font-medium">🐛 Debug</span>
            </button>
          </div>
          {/* Hint removed per request */}
        </div>

        {/* Clean Column Visibility Settings */}
        {showColumnSettings && (
          <div className="px-3 py-3 bg-white border border-gray-200 rounded-lg shadow-md">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900">
                Column Visibility
              </h3>
              <button
                onClick={() => setShowColumnSettings(false)}
                className="w-5 h-5 bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-800 rounded flex items-center justify-center transition-colors duration-200"
              >
                ×
              </button>
            </div>

            {/* Clean Best View Preset Button */}
            <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-blue-900">
                    Recommended View
                  </h4>
                  <p className="text-xs text-blue-700 mt-0.5">
                    Optimized layout for best readability
                  </p>
                </div>
                <button
                  onClick={setBestView}
                  className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors duration-200"
                >
                  Apply Best View
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-1">
              {DEFAULT_COLUMNS.map((col) => (
                <div key={col} className="space-y-1">
                  {/* Column Visibility */}
                  <button
                    onClick={() => toggleColumnVisibility(col)}
                    className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors duration-200 w-full ${
                      visibleColumns[col]
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'bg-gray-50 text-gray-500 border border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    {visibleColumns[col] ? (
                      <Eye size={10} className="text-blue-600" />
                    ) : (
                      <EyeOff size={10} className="text-gray-400" />
                    )}
                    <span>{labelMap[col] || col}</span>
                  </button>

                  {/* Text Presentation Mode - only show if column is visible */}
                  {visibleColumns[col] && (
                    <div className="flex gap-1">
                      <button
                        onClick={() => updateTextPresentationMode(col, 'wrap')}
                        className={`px-1 py-0.5 text-xs rounded transition-colors duration-200 ${
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
                        className={`px-1 py-0.5 text-xs rounded transition-colors duration-200 ${
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
                        className={`px-1 py-0.5 text-xs rounded transition-colors duration-200 ${
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
          <div className="flex flex-wrap items-center justify-between gap-4 p-3 bg-blue-50/80 border border-blue-200 rounded-lg shadow-md backdrop-blur-sm fixed top-2 left-4 right-4 z-20">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-md">
                  <CheckCircle className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="text-sm font-bold text-blue-900">
                    {selectedIds.length} link
                    {selectedIds.length === 1 ? '' : 's'} selected
                  </div>
                  <div className="text-xs text-blue-600 font-medium">
                    ✨ Ready for AI analysis • Right-click for individual actions • <kbd className="px-1 py-0.5 bg-blue-100 rounded text-xs">Ctrl+E</kbd> to edit • <kbd className="px-1 py-0.5 bg-blue-100 rounded text-xs">Ctrl+Delete</kbd> to delete • <kbd className="px-1 py-0.5 bg-blue-100 rounded text-xs">Esc</kbd> to clear
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-5 ml-auto pr-2">
              <Button
                variant="primary"
                size="md"
                onClick={startChat}
                className="inline-flex items-center gap-2"
                title="Start AI chat with selected links"
              >
                <MessageSquare className="w-4 h-4" />
                Start AI Chat
              </Button>
              <Button
                variant="success"
                size="md"
                onClick={copySelectedLinksInfo}
                className="inline-flex items-center gap-2"
                title="Copy all link information to clipboard"
                data-copy-button="bulk"
              >
                <Copy className="w-4 h-4" />
                Copy Info
              </Button>
              <Button
                variant="warning"
                size="md"
                onClick={() => handleChatGPTExport(getSelectedLinks())}
                className="inline-flex items-center gap-2"
                title="Export selected links to ChatGPT for analysis"
              >
                <ExternalLink className="w-4 h-4" />
                Export to ChatGPT
              </Button>
              <Button
                variant="secondary"
                size="md"
                onClick={() => setBulkEditOpen(true)}
                className="inline-flex items-center gap-2"
                title="Edit selected links"
              >
                <Edit2 className="w-4 h-4" />
                Edit
              </Button>
              <Button
                variant="secondary"
                size="md"
                onClick={archiveSelected}
                className="inline-flex items-center gap-2"
                title="Archive selected links"
              >
                <Archive className="w-4 h-4" />
                Archive
              </Button>
              <Button
                variant="danger"
                size="md"
                onClick={() => {
                  console.log('🗑️ Delete button clicked, selectedIds:', selectedIds);
                  console.log('🗑️ Current modal state from component:', bulkDeleteModalOpen);
                  console.log('🗑️ Current modal state from store:', useLinkStore.getState().bulkDeleteModalOpen);
                  setBulkDeleteModalOpen(true);
                  console.log('🗑️ Modal state from store after set:', useLinkStore.getState().bulkDeleteModalOpen);
                  setTimeout(() => {
                    console.log('🗑️ Modal state from store after 100ms:', useLinkStore.getState().bulkDeleteModalOpen);
                  }, 100);
                }}
                className="inline-flex items-center gap-2"
                title="Delete selected links permanently"
              >
                <Trash className="w-4 h-4" />
                Delete
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
            {/* Selection banner is shown globally at the top; avoid duplicating per-group banners */}
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-3 text-sm font-bold flex items-center justify-between group-header border-b border-gray-200">
              <span className="text-gray-800 flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                {label.charAt(0).toUpperCase() + label.slice(1)}
              </span>
              <span className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <button
                  type="button"
                  aria-label="Move up"
                  className="p-2 hover:bg-white rounded-lg transition-all duration-200 hover:shadow-md transform hover:scale-110"
                  onClick={() => moveGroup(label, 'up')}
                >
                  <ChevronUp size={14} className="text-gray-600" />
                </button>
                <button
                  type="button"
                  aria-label="Move down"
                  className="p-2 hover:bg-white rounded-lg transition-all duration-200 hover:shadow-md transform hover:scale-110"
                  onClick={() => moveGroup(label, 'down')}
                >
                  <ChevronDown size={14} className="text-gray-600" />
                </button>
              </span>
            </div>
            {/* Single table for perfect alignment */}
            <div className="overflow-x-auto">
              <table className="w-full min-w-full table-fixed">
                <thead>
                  <tr className="bg-gray-50 text-xs font-semibold uppercase text-gray-600 border-b border-gray-200 text-left">
                    {/* select all checkbox */}
                    <th className="w-10 px-3 py-3 border-r align-top">
                      <div className="flex items-center justify-center">
                        <HeaderCheckbox
                          groupLinks={groups[label] as any}
                          selectedIds={selectedIds}
                          toggleSelectAll={toggleSelectAll}
                        />
                      </div>
                    </th>
                    {columns
                      .filter((col) => visibleColumns[col])
                      .map((col) => (
                        <th
                          key={col}
                          style={{ minWidth: getColumnWidth(col) }}
                          className={`px-4 py-3 border-r select-none cursor-move transition-all duration-150 relative text-left ${
                            resizingColumn === col
                              ? 'bg-blue-50 border-blue-300 shadow-sm'
                              : dragOverColumn === col
                                ? 'bg-blue-200 border-blue-400 shadow-lg ring-2 ring-blue-300'
                                : 'hover:bg-gray-50'
                          }`}
                          onDragEnter={(e) => onDragEnter(e, col)}
                          onDragOver={(e) => onDragOver(e)}
                          onDrop={(e) => onDrop(e, col)}
                          onDragLeave={(e) => setDragOverColumn(null)}
                          onMouseDown={(e) => {
                            // Only prevent drag when clicking the sort button, allow drag handle
                            if (
                              (e.target as HTMLElement).closest('button') &&
                              !(e.target as HTMLElement).closest(
                                '[data-drag-handle="true"]'
                              )
                            ) {
                              e.preventDefault();
                            }
                          }}
                        >
                          <div className="flex items-center gap-2">
                            {/* Dedicated drag handle */}
                            <div
                              className="p-2 rounded bg-blue-50 hover:bg-blue-100 transition-colors duration-200 cursor-move border border-blue-200 hover:border-blue-300"
                              title="Drag to reorder column"
                              data-drag-handle="true"
                              draggable
                              onDragStart={(e) => onDragStart(e as any, col)}
                              onDragEnd={(e) => onDragEnd(e as any)}
                              style={{ touchAction: 'none' }}
                            >
                              <GripVertical
                                size={16}
                                className="text-blue-600"
                              />
                            </div>
                            <div className="flex-1">
                              <SortHeader col={col} label={labelMap[col]} />
                            </div>
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
                    <tr
                      key={l.id}
                      className="group relative hover:bg-gray-50 transition-all duration-200"
                    >
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
                                link: l,
                              });
                            }}
                            title={
                              l.status === 'archived'
                                ? 'Done – right-click for more options / left-click to select'
                                : selectedIds.includes(l.id)
                                  ? 'Selected – right-click for more options'
                                  : 'Left-click to select / right-click for more options'
                            }
                            className="p-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded-md transition-all duration-200 hover:bg-gray-100"
                          >
                            {l.status === 'archived' ? (
                              <CheckCircle
                                size={16}
                                className="text-green-600"
                              />
                            ) : selectedIds.includes(l.id) ? (
                              <CheckSquare
                                size={16}
                                className="text-blue-600"
                              />
                            ) : (
                              <Square
                                size={16}
                                className="text-gray-400 group-hover:text-gray-600"
                              />
                            )}
                          </button>
                        </div>
                      </td>
                      {/* Data columns */}
                      {columns
                        .filter((c) => visibleColumns[c])
                        .map((c) => (
                          <td
                            key={c}
                            style={{ minWidth: getColumnWidth(c) }}
                            className="px-4 py-3 border-r border-gray-100 text-left"
                          >
                            <div
                              className={`${getTextPresentationClass(c)} text-left`}
                            >
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
              <div className="px-2 py-3 bg-gray-50 border-t">
                <MultiChatPanel
                  links={chatLinks}
                  onClose={() => setChatLinks(null)}
                />
              </div>
            )}
          </div>
        ))}
        {/* fallback: if anchor label missing (e.g., selection cleared) render at end */}
        {chatLinks && !anchorLabel && (
          <div className="mt-4">
            <MultiChatPanel
              links={chatLinks}
              onClose={() => setChatLinks(null)}
            />
          </div>
        )}

        {/* Context Menu */}
        {contextMenu.show && contextMenu.link && (
          <div
            className="fixed z-50 bg-white border border-gray-200 rounded-md shadow-md py-1 min-w-[160px]"
            style={{
              left: contextMenu.x,
              top: contextMenu.y,
            }}
            onMouseLeave={resetContextMenu}
          >
            <button
              onClick={() => {
                startChatWithSingleLink(contextMenu.link!);
                resetContextMenu();
              }}
              className="w-full px-2 py-1 text-left text-xs hover:bg-blue-50 flex items-center gap-1.5"
            >
              <MessageSquare className="w-3 h-3 text-blue-600" />
              Start Chat
            </button>
            <button
              onClick={() => {
                setOpen(true);
                // Set the existing link for editing
                const linkToEdit = contextMenu.link!;
                // You can add state to track which link is being edited
                resetContextMenu();
              }}
              className="w-full px-2 py-1 text-left text-xs hover:bg-green-50 flex items-center gap-1.5"
            >
              <Edit2 className="w-3 h-3 text-green-600" />
              Edit Link
            </button>
            <button
              onClick={() => {
                copySingleLinkInfo(contextMenu.link!);
                resetContextMenu();
              }}
              className="w-full px-2 py-1 text-left text-xs hover:bg-green-50 flex items-center gap-1.5"
              data-context-menu="copy"
            >
              <Copy className="w-3 h-3 text-green-600" />
              Copy Info
            </button>
            <button
              onClick={() => {
                handleChatGPTExport([contextMenu.link!]);
                resetContextMenu();
              }}
              className="w-full px-2 py-1 text-left text-xs hover:bg-orange-50 flex items-center gap-1.5"
            >
              <ExternalLink className="w-3 h-3 text-orange-600" />
              Export to ChatGPT
            </button>
            <button
              onClick={() => {
                // Update extension storage directly
                window.postMessage(
                  {
                    type: 'SRT_UPDATE_LINKS_STATUS',
                    links: [
                      {
                        id: contextMenu.link!.id,
                        status:
                          contextMenu.link!.status === 'archived'
                            ? 'active'
                            : 'archived',
                      },
                    ],
                  },
                  '*'
                );
                resetContextMenu();
                // Refresh the links to show updated status
                setTimeout(() => {
                  loadLinks();
                }, 500);
              }}
              className="w-full px-2 py-1 text-left text-xs hover:bg-gray-50 flex items-center gap-1.5"
            >
              <Archive className="w-3 h-3 text-gray-600" />
              {contextMenu.link!.status === 'archived'
                ? 'Mark Active'
                : 'Mark Archived'}
            </button>
            <hr className="my-1" />
            <button
              onClick={() => {
                setSelectedIds((prev) =>
                  prev.includes(contextMenu.link!.id)
                    ? prev.filter((id) => id !== contextMenu.link!.id)
                    : [...prev, contextMenu.link!.id]
                );
                resetContextMenu();
              }}
              className="w-full px-2 py-1 text-left text-xs hover:bg-purple-50 flex items-center gap-1.5"
            >
              <CheckSquare className="w-3 h-3 text-purple-600" />
              {selectedIds.includes(contextMenu.link!.id)
                ? 'Deselect'
                : 'Select'}
            </button>
          </div>
        )}

        {/* Click outside to close context menu */}
        {contextMenu.show && (
          <div className="fixed inset-0 z-40" onClick={resetContextMenu} />
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
    <div
      ref={rootRef}
      className="bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden"
    >
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
          <button
            onClick={() => {
              console.log('[Dashboard] Debug: Current store state:', {
                rawLinks: storeLinks?.length || 0,
                loading,
                error: useLinkStore.getState().error
              });
              
              // Test extension communication
              if (typeof window !== 'undefined' && (window as any).chrome?.storage) {
                (window as any).chrome.storage.local.get(['links'], (result: any) => {
                  console.log('[Dashboard] Debug: Chrome storage result:', result);
                  alert(`Chrome storage contains ${result.links?.length || 0} links`);
                });
              } else {
                console.log('[Dashboard] Debug: Chrome storage not available');
                alert('Chrome storage not available');
              }
            }}
            className="text-gray-500 hover:text-gray-700 transition-colors duration-200"
            title="Debug extension communication"
          >
            🐛 Debug
          </button>
        </div>
        {/* helper hint removed */}
      </div>

      {/* Column Visibility Settings */}
      {showColumnSettings && (
        <div className="px-4 py-3 bg-white border border-gray-200 rounded-lg shadow-sm mx-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-700">
              Column Visibility
            </h3>
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
                <h4 className="text-sm font-medium text-blue-800">
                  Recommended View
                </h4>
                <p className="text-xs text-blue-600 mt-1">
                  Optimized layout for best readability
                </p>
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
        <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg shadow-sm">
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                <MessageSquare size={16} className="text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  Selected for AI Chat
                </h3>
                <p className="text-gray-600 text-sm">
                  Ready to analyze your research
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-xs text-gray-500">Selected</div>
              <div className="text-lg font-semibold text-gray-900">
                {selectedIds.length} link{selectedIds.length === 1 ? '' : 's'}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-5 ml-auto pr-2">
              <Button
                variant="secondary"
                size="md"
                onClick={archiveSelected}
                className="bg-white hover:bg-gray-50 text-gray-700 border-gray-300 hover:border-gray-400"
              >
                <Archive size={14} className="mr-1.5" />
                Archive
              </Button>

              <Button
                variant="secondary"
                size="md"
                onClick={copySelectedLinksInfo}
                className="bg-green-100 hover:bg-green-200 text-green-700 border-green-200 hover:border-green-300"
                data-copy-button="bulk"
              >
                <Copy size={14} className="mr-1.5" />
                Copy Info
              </Button>

              <Button
                variant="warning"
                size="md"
                onClick={() => handleChatGPTExport(getSelectedLinks())}
                className="inline-flex items-center gap-2"
                title="Export selected links to ChatGPT for analysis"
              >
                <ExternalLink className="w-4 h-4" />
                Export to ChatGPT
              </Button>

              <Button
                variant="primary"
                size="md"
                onClick={startChat}
                className="bg-blue-600 hover:bg-blue-700 text-white border-blue-600 hover:border-blue-700"
              >
                <MessageSquare size={14} className="mr-1.5" />
                Start AI Chat
              </Button>
            </div>
          </div>
        </div>
      )}

      {!storeLinks ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading links...</p>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full table-fixed">
            <thead>
              <tr className="bg-gray-50 text-xs font-semibold uppercase text-gray-600 border-b border-gray-200 text-left">
                {/* select all checkbox header */}
                <th className="w-10 px-3 py-3 border-r">
                  <div className="flex items-center justify-center">
                    <input
                      type="checkbox"
                      onChange={(e) =>
                        toggleSelectAll(e.target.checked, storeLinks || [])
                      }
                      checked={
                        storeLinks &&
                        storeLinks.length > 0 &&
                        storeLinks.every((l) => selectedIds.includes(l.id))
                      }
                      className="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                    />
                  </div>
                </th>
                {columns
                  .filter((col) => visibleColumns[col])
                  .map((col, index) => (
                    <th
                      key={col}
                      style={{ minWidth: getColumnWidth(col) }}
                      className={`px-4 py-3 border-r select-none cursor-move transition-all duration-150 relative text-left align-top ${
                        resizingColumn === col
                          ? 'bg-blue-50 border-blue-300 shadow-sm'
                          : draggedColumn === col
                            ? 'bg-yellow-100 border-yellow-400 shadow-lg ring-2 ring-yellow-300'
                            : dragOverColumn === col
                              ? 'bg-blue-200 border-blue-400 shadow-lg ring-2 ring-blue-300'
                              : 'hover:bg-gray-50'
                      }`}
                      onDragEnter={(e) => onDragEnter(e, col)}
                      onDragOver={(e) => onDragOver(e)}
                      onDrop={(e) => onDrop(e, col)}
                      onDragLeave={(e) => onDragLeave(e)}
                      onMouseDown={(e) => {
                        // Only prevent drag when clicking the sort button, allow drag handle
                        if (
                          (e.target as HTMLElement).closest('button') &&
                          !(e.target as HTMLElement).closest(
                            '[data-drag-handle="true"]'
                          )
                        ) {
                          e.preventDefault();
                        }
                      }}
                    >
                      <div className="flex items-center gap-2">
                        {/* Dedicated drag handle */}
                        <div
                          className="p-2 rounded bg-blue-50 hover:bg-blue-100 transition-colors duration-200 cursor-move border border-blue-200 hover:border-blue-300"
                          title="Drag to reorder column"
                          data-drag-handle="true"
                          draggable
                          onDragStart={(e) => onDragStart(e as any, col)}
                          onDragEnd={(e) => onDragEnd(e as any)}
                          style={{ touchAction: 'none' }}
                        >
                          <GripVertical size={16} className="text-blue-600" />
                        </div>

                        {/* Column label and sort button */}
                        <div className="flex-1">
                          <SortHeader col={col} label={labelMap[col]} />
                        </div>
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
              {storeLinks?.map((l, index) => (
                <tr
                  key={l.id}
                  className="group relative hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-300 border-l-4 border-l-transparent hover:border-l-blue-500"
                >
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
                          // Update extension storage directly
                          window.postMessage(
                            {
                              type: 'SRT_UPDATE_LINKS_STATUS',
                              links: [
                                {
                                  id: l.id,
                                  status:
                                    l.status === 'archived'
                                      ? 'active'
                                      : 'archived',
                                },
                              ],
                            },
                            '*'
                          );
                          // Refresh the links to show updated status
                          setTimeout(() => {
                            loadLinks();
                          }, 500);
                        }}
                        title={
                          l.status === 'archived'
                            ? 'Done – right-click to mark active / left-click to select'
                            : selectedIds.includes(l.id)
                              ? 'Selected – right-click to mark done'
                              : 'Left-click to select / right-click to mark done'
                        }
                        className="p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg transition-all duration-300 hover:bg-blue-100 hover:scale-110 transform"
                      >
                        {l.status === 'archived' ? (
                          <CheckCircle size={18} className="text-green-600" />
                        ) : selectedIds.includes(l.id) ? (
                          <CheckSquare size={18} className="text-blue-600" />
                        ) : (
                          <Square
                            size={18}
                            className="text-gray-400 group-hover:text-gray-600"
                          />
                        )}
                      </button>
                    </div>
                  </td>
                  {/* Data columns */}
                  {columns
                    .filter((c) => visibleColumns[c])
                    .map((c) => (
                      <td
                        key={c}
                        style={{ minWidth: getColumnWidth(c) }}
                        className="px-4 py-3 border-r border-gray-100 text-left align-top"
                      >
                        <div
                          className={`${getTextPresentationClass(c)} text-left`}
                        >
                          {renderCellContent(l, c)}
                        </div>
                      </td>
                    ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Empty state is now handled by the parent component */}
      {chatLinks && (
        <div className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm">
          <div className="absolute inset-4 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
            <MultiChatPanel
              links={chatLinks}
              onClose={() => setChatLinks(null)}
            />
          </div>
        </div>
      )}
      {pendingSummaries > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-full shadow-lg border border-blue-500">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
            <span className="font-medium">
              AI is generating summaries for {pendingSummaries} link
              {pendingSummaries === 1 ? '' : 's'}…
            </span>
            <button
              onClick={() => setPendingSummaries(0)}
              className="ml-2 text-white/80 hover:text-white text-sm underline"
              title="Dismiss this notification"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Copy Feedback Toast */}
      {copyFeedback.show && (
        <div
          className={`fixed top-6 right-6 z-50 px-6 py-4 rounded-xl shadow-2xl border-2 backdrop-blur-sm transform transition-all duration-300 ${
            copyFeedback.type === 'success'
              ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white border-green-400'
              : 'bg-gradient-to-r from-red-500 to-pink-500 text-white border-red-400'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center ${
                copyFeedback.type === 'success' ? 'bg-green-400' : 'bg-red-400'
              }`}
            >
              {copyFeedback.type === 'success' ? (
                <CheckCircle size={16} className="text-white" />
              ) : (
                <X size={16} className="text-white" />
              )}
            </div>
            <span className="font-semibold">{copyFeedback.message}</span>
          </div>
        </div>
      )}
      {/* Add Link Modal */}
      <Modal isOpen={open} onClose={() => setOpen(false)} title="Add Link" dataId="add-link-modal" maxWidthClass="max-w-md">
        <LinkForm onSuccess={() => setOpen(false)} />
      </Modal>
      
      {/* All other modals */}
      {renderModals()}

      {/* Clean Filters and Actions Bar */}
      <div className="bg-white/90 backdrop-blur-sm rounded-lg border border-gray-200/50 p-3 mb-4 shadow-sm relative z-50">
        <div className="flex items-center justify-between">
          <LinkFilters />
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                console.log('[Dashboard] Debug: Current store state:', {
                  rawLinks: storeLinks?.length || 0,
                  loading,
                  error: useLinkStore.getState().error
                });
                
                // Test extension communication
                if (typeof window !== 'undefined' && (window as any).chrome?.storage) {
                  (window as any).chrome.storage.local.get(['links'], (result: any) => {
                    console.log('[Dashboard] Debug: Chrome storage result:', result);
                    alert(`Chrome storage contains ${result.links?.length || 0} links`);
                  });
                } else {
                  console.log('[Dashboard] Debug: Chrome storage not available');
                  alert('Chrome storage not available');
                }
              }}
              className="px-3 py-2 bg-gray-500 hover:bg-gray-600 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
            >
              🐛 Debug
            </button>
            <button
              onClick={runPanelDiagnostics}
              className="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
            >
              🔧 Panel Test
            </button>
            <button
              onClick={() => {
                console.log('[Dashboard] Test button clicked - buttons are working!');
                alert('Test button works! If you see this, button clicks are functioning.');
              }}
              className="px-3 py-2 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
            >
              ✅ Test Click
            </button>


          </div>
        </div>
      </div>

      {editOpen && showEditFallback && (
        <div
          id="edit-link-modal-fallback"
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50"
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 2147483647, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => {
            console.debug('[Links] Fallback modal backdrop click – closing');
            setEditOpen(false);
            setEditingLink(null);
          }}
        >
          {/* Debug: Rendering fallback edit overlay */}
          <div
            className="bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-xl mx-4"
            style={{ background: '#fff', borderRadius: 12, width: '100%', maxWidth: 480, margin: '0 16px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Edit Link</h3>
              <button
                aria-label="Close"
                className="p-2 rounded hover:bg-gray-100"
                onClick={() => {
                  console.debug('[Links] Fallback modal close button');
                  setEditOpen(false);
                  setEditingLink(null);
                }}
              >
                ×
              </button>
            </div>
            <div className="px-6 py-6">
              {editingLink && (
                <LinkForm
                  existing={editingLink}
                  onSuccess={() => {
                    console.debug('[Links] Fallback edit saved – closing');
                    setEditOpen(false);
                    setEditingLink(null);
                  }}
                />
              )}
            </div>
          </div>
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
  const isChecked =
    groupLinks.every((l) => selectedIds.includes(l.id)) &&
    groupLinks.length > 0;
  const isIndeterminate =
    !isChecked && groupLinks.some((l) => selectedIds.includes(l.id));
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

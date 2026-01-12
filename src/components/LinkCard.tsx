import React, { useState, memo } from 'react'
import { logger } from '../utils/logger'
import { 
  ExternalLink, 
  Tag, 
  Star, 
  Archive, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Copy,
  Calendar,
  Eye,
  Folder,
  GripVertical
} from 'lucide-react'
import { Link, Collection } from '../types/Link'

interface LinkCardProps {
  link: Link
  viewMode: 'grid' | 'list'
  isSelected: boolean
  onSelect: () => void
  onAction: (linkId: string, action: string, data?: any) => void
  onDragStart?: (e: React.DragEvent) => void
  onDragEnd?: (e: React.DragEvent) => void
  collections?: Collection[]
  onCardClick?: () => void // Open edit modal when clicking card
  dragHandleProps?: any // Props from @hello-pangea/dnd for drag handle
}

const LinkCardComponent: React.FC<LinkCardProps> = ({ 
  link, 
  viewMode, 
  isSelected, 
  onSelect, 
  onAction,
  onDragStart,
  onDragEnd,
  collections = [],
  onCardClick,
  dragHandleProps
}) => {
  const [showActions, setShowActions] = useState(false)
  const [showMoveToProject, setShowMoveToProject] = useState(false)
  const [isDraggingToProject, setIsDraggingToProject] = useState(false)

  const handleAction = (action: string, data?: any) => {
    onAction(link.id, action, data)
    setShowActions(false)
    setShowMoveToProject(false)
  }

  // Handle moving link to a different project/collection
  const handleMoveToProject = (collectionId: string | null) => {
    handleAction('moveToProject', { collectionId })
    setShowMoveToProject(false)
    setShowActions(false)
  }

  // ✅ Native HTML5 drag handlers for dragging to sidebar projects
  // This is separate from @hello-pangea/dnd which handles reordering
  const handleProjectDragStart = (e: React.DragEvent) => {
    // CRITICAL: Stop all propagation to prevent @hello-pangea/dnd from capturing
    e.stopPropagation()
    e.nativeEvent.stopImmediatePropagation()
    
    // Set drag data
    e.dataTransfer.setData('text/plain', link.id)
    e.dataTransfer.setData('application/x-link-id', link.id)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.dropEffect = 'move'
    
    // Create a custom drag image
    const dragImage = document.createElement('div')
    dragImage.textContent = `📁 ${link.title?.substring(0, 30) || 'Link'}...`
    dragImage.style.cssText = 'position: absolute; top: -1000px; padding: 8px 12px; background: #3b82f6; color: white; border-radius: 8px; font-size: 14px; font-weight: 500; box-shadow: 0 4px 12px rgba(0,0,0,0.3);'
    document.body.appendChild(dragImage)
    e.dataTransfer.setDragImage(dragImage, 0, 0)
    setTimeout(() => document.body.removeChild(dragImage), 0)
    
    setIsDraggingToProject(true)
    console.log('📦 [DragToProject] Started dragging link:', link.id, link.title)
  }

  const handleProjectDragEnd = (_e: React.DragEvent) => {
    setIsDraggingToProject(false)
    console.log('📦 [DragToProject] Drag ended for link:', link.id)
  }

  // Handle card click to open settings (edit modal)
  const handleCardClick = (e: React.MouseEvent) => {
    // Ignore clicks on interactive elements
    const target = e.target as HTMLElement
    if (
      target.closest('button') ||
      target.closest('a') ||
      target.closest('input[type="checkbox"]') ||
      target.tagName === 'A' ||
      target.tagName === 'BUTTON' ||
      target.tagName === 'INPUT'
    ) {
      return
    }
    
    // Open edit modal when clicking anywhere else on the card
    if (onCardClick) {
      onCardClick()
    }
  }

  const [copied, setCopied] = useState(false)
  
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(link.url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      logger.error('Failed to copy URL', { component: 'LinkCard', metadata: { url: link.url } }, error as Error)
    }
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(new Date(date))
  }

  const getContentTypeIcon = (contentType: string) => {
    switch (contentType) {
      case 'pdf':
        return '📄'
      case 'video':
        return '🎥'
      case 'image':
        return '🖼️'
      case 'article':
        return '📰'
      case 'document':
        return '📋'
      default:
        return '🌐'
    }
  }

  const getCollectionName = (collectionId?: string) => {
    if (!collectionId) return null
    return collections.find(c => c.id === collectionId)?.name
  }

      if (viewMode === 'grid') {
        return (
          <div 
            className={`card p-3 sm:p-5 transition-all duration-300 hover:shadow-xl sm:hover:-translate-y-1 hover:border-blue-300 cursor-pointer group relative overflow-hidden touch-manipulation ${
              isSelected ? 'ring-2 ring-blue-500 bg-gradient-to-br from-blue-50 to-purple-50 sm:scale-[1.02] border-blue-300' : 'border-gray-200'
            } ${isDraggingToProject ? 'ring-2 ring-green-500 opacity-70' : ''}`}
            onClick={handleCardClick}
            title="Click to edit, drag to move to project"
            role="article"
            aria-label={`Link: ${link.title}`}
            // ✅ Make entire card draggable for moving to projects
            draggable={collections.length > 0}
            onDragStart={collections.length > 0 ? handleProjectDragStart : undefined}
            onDragEnd={collections.length > 0 ? handleProjectDragEnd : undefined}
          >
            {/* ✅ SENIOR UX: Selection indicator */}
            {isSelected && (
              <div className="absolute top-2 left-2 w-2 h-2 bg-blue-500 rounded-full animate-pulse" aria-hidden="true" />
            )}
        {/* ✅ MOBILE RESPONSIVE: Selection checkbox with better touch targets */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-1">
            {/* Drag Handle for reordering (via @hello-pangea/dnd) - stops native drag */}
            {dragHandleProps && (
              <div
                {...dragHandleProps}
                className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 rounded transition-colors touch-manipulation"
                title="Drag to reorder within category"
                draggable={false}
                onDragStart={(e) => e.preventDefault()}
              >
                <GripVertical className="w-4 h-4 text-gray-400 hover:text-gray-600" />
              </div>
            )}
            <label className="flex items-center cursor-pointer group touch-manipulation">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={onSelect}
                className="w-5 h-5 sm:w-4 sm:h-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all cursor-pointer"
                aria-label={`Select ${link.title}`}
              />
              <span className="ml-2 text-xs text-gray-500 group-hover:text-gray-700 transition-colors sr-only">
                Select link
              </span>
            </label>
          </div>
          <div className="relative">
            <button
              onClick={() => setShowActions(!showActions)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') setShowActions(false)
              }}
              className="p-2.5 sm:p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center"
              aria-label="More actions"
              aria-expanded={showActions}
              aria-haspopup="true"
            >
              <MoreVertical className="w-5 h-5 sm:w-4 sm:h-4" />
            </button>
            
            {/* ✅ MOBILE RESPONSIVE: Dropdown menu with better mobile positioning */}
            {showActions && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setShowActions(false)}
                  aria-hidden="true"
                />
                <div 
                  className="absolute right-0 top-10 sm:top-10 w-56 sm:w-56 bg-white border border-gray-200 rounded-lg shadow-xl z-20 animate-in fade-in slide-in-from-top-2 duration-200 max-h-[calc(100vh-120px)] overflow-y-auto"
                  role="menu"
                  aria-orientation="vertical"
                >
                  <div className="py-1.5">
                    <button
                      onClick={() => handleAction('toggleFavorite')}
                      className="w-full flex items-center gap-3 px-4 py-3 sm:py-2.5 text-sm text-gray-700 hover:bg-yellow-50 hover:text-yellow-700 active:bg-yellow-100 transition-colors focus:outline-none focus:bg-yellow-50 min-h-[44px] sm:min-h-0 touch-manipulation"
                      role="menuitem"
                    >
                      <Star className={`w-5 h-5 sm:w-4 sm:h-4 flex-shrink-0 ${link.isFavorite ? 'fill-current text-yellow-500' : ''}`} />
                      <span className="text-left">{link.isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}</span>
                    </button>
                    <button
                      onClick={() => handleAction('toggleArchive')}
                      className="w-full flex items-center gap-3 px-4 py-3 sm:py-2.5 text-sm text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition-colors focus:outline-none focus:bg-gray-50 min-h-[44px] sm:min-h-0 touch-manipulation"
                      role="menuitem"
                    >
                      <Archive className={`w-5 h-5 sm:w-4 sm:h-4 flex-shrink-0 ${link.isArchived ? 'text-orange-500' : ''}`} />
                      <span className="text-left">{link.isArchived ? 'Unarchive' : 'Archive'}</span>
                    </button>
                    <div className="my-1 h-px bg-gray-100" />
                    <button
                      onClick={copyToClipboard}
                      className="w-full flex items-center gap-3 px-4 py-3 sm:py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 active:bg-blue-100 transition-colors focus:outline-none focus:bg-blue-50 min-h-[44px] sm:min-h-0 touch-manipulation"
                      role="menuitem"
                    >
                      {copied ? (
                        <>
                          <div className="w-5 h-5 sm:w-4 sm:h-4 rounded-full bg-green-500 flex items-center justify-center animate-in zoom-in duration-200 flex-shrink-0">
                            <span className="text-white text-xs">✓</span>
                          </div>
                          <span className="text-green-600 font-medium text-left">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-5 h-5 sm:w-4 sm:h-4 flex-shrink-0" />
                          <span className="text-left">Copy URL</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleAction('update')}
                      className="w-full flex items-center gap-3 px-4 py-3 sm:py-2.5 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 active:bg-indigo-100 transition-colors focus:outline-none focus:bg-indigo-50 min-h-[44px] sm:min-h-0 touch-manipulation"
                      role="menuitem"
                    >
                      <Edit className="w-5 h-5 sm:w-4 sm:h-4 flex-shrink-0" />
                      <span className="text-left">Edit</span>
                    </button>
                    
                    {/* ✅ Move to Project submenu */}
                    <div className="relative">
                      <button
                        onClick={() => setShowMoveToProject(!showMoveToProject)}
                        className="w-full flex items-center gap-3 px-4 py-3 sm:py-2.5 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 active:bg-green-100 transition-colors focus:outline-none focus:bg-green-50 min-h-[44px] sm:min-h-0 touch-manipulation"
                        role="menuitem"
                      >
                        <Folder className="w-5 h-5 sm:w-4 sm:h-4 flex-shrink-0" />
                        <span className="flex-1 text-left">Move to Project</span>
                        <span className="text-gray-400 text-xs">›</span>
                      </button>
                      
                      {/* Submenu */}
                      {showMoveToProject && (
                        <div className="absolute left-full top-0 ml-1 w-48 bg-white border border-gray-200 rounded-lg shadow-xl z-30 animate-in fade-in slide-in-from-left-2 duration-200 max-h-60 overflow-y-auto">
                          <div className="py-1.5">
                            {/* Remove from project option */}
                            {link.collectionId && (
                              <>
                                <button
                                  onClick={() => handleMoveToProject(null)}
                                  className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-orange-600 hover:bg-orange-50 transition-colors"
                                >
                                  <span className="text-base">✕</span>
                                  <span>Remove from Project</span>
                                </button>
                                <div className="my-1 h-px bg-gray-100" />
                              </>
                            )}
                            
                            {/* List of projects */}
                            {collections.length > 0 ? (
                              collections
                                .filter(c => c.id !== link.collectionId) // Don't show current collection
                                .map(collection => (
                                  <button
                                    key={collection.id}
                                    onClick={() => handleMoveToProject(collection.id)}
                                    className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 transition-colors"
                                  >
                                    <div 
                                      className="w-3 h-3 rounded-full flex-shrink-0"
                                      style={{ backgroundColor: collection.color || '#6366f1' }}
                                    />
                                    <span className="truncate">{collection.name}</span>
                                  </button>
                                ))
                            ) : (
                              <div className="px-3 py-2 text-sm text-gray-500 italic">
                                No projects yet
                              </div>
                            )}
                            
                            {collections.length > 0 && collections.every(c => c.id === link.collectionId) && (
                              <div className="px-3 py-2 text-sm text-gray-500 italic">
                                Already in only project
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="my-1 h-px bg-gray-100" />
                    <button
                      onClick={() => {
                        if (window.confirm(`Are you sure you want to delete "${link.title}"?`)) {
                          handleAction('delete')
                        }
                        setShowActions(false)
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 sm:py-2.5 text-sm text-red-600 hover:bg-red-50 active:bg-red-100 transition-colors focus:outline-none focus:bg-red-50 min-h-[44px] sm:min-h-0 touch-manipulation"
                      role="menuitem"
                    >
                      <Trash2 className="w-5 h-5 sm:w-4 sm:h-4 flex-shrink-0" />
                      <span className="text-left">Delete</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* ✅ MOBILE RESPONSIVE: Thumbnail with better mobile sizing, smaller on mobile */}
        {link.thumbnail && (
          <div className="mb-2 sm:mb-3">
            <img
              src={link.thumbnail}
              alt={link.title}
              className="w-full h-20 sm:h-32 object-cover rounded-lg"
              loading="lazy"
            />
          </div>
        )}

        {/* Content */}
        <div className="space-y-1.5 sm:space-y-2">
          <div className="flex items-start gap-1.5 sm:gap-2">
            <span className="text-base sm:text-lg">{getContentTypeIcon(link.contentType)}</span>
            <div className="flex-1 min-w-0">
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-700 hover:underline font-medium text-xs sm:text-sm line-clamp-2 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded"
                title={link.title}
                aria-label={`Open ${link.title} in new tab`}
              >
                {link.title}
              </a>
              <p className="text-gray-500 text-xs truncate mt-0.5 sm:mt-1" title={link.url}>
                {link.url}
              </p>
            </div>
          </div>

          {/* ✅ UX IMPROVED: Description - only show if exists (progressive disclosure), smaller on mobile */}
          {link.description && (
            <p className="text-gray-600 text-xs line-clamp-2 mt-1 sm:mt-1.5" title={link.description}>
              {link.description}
            </p>
          )}

          {/* ✅ UX IMPROVED: Metadata badges - cleaner grouping, smaller on mobile */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap mt-2 sm:mt-3">
            {/* Category Badge */}
            {link.category && (
              <span className="inline-flex items-center gap-1 px-1.5 sm:px-2.5 py-0.5 sm:py-1 bg-gradient-to-r from-purple-50 to-purple-100 text-purple-700 text-xs font-medium rounded-md border border-purple-200/50">
                <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-purple-500 rounded-full"></span>
                {link.category}
              </span>
            )}
            
            {/* Collection/Project Badge */}
            {link.collectionId && (
              <span className="inline-flex items-center gap-1 px-1.5 sm:px-2.5 py-0.5 sm:py-1 bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 text-xs font-medium rounded-md border border-green-200/50">
                <Folder className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                {getCollectionName(link.collectionId) || 'Project'}
              </span>
            )}
          </div>

          {/* ✅ UX IMPROVED: Tags - only show if they exist (no "No tags" text), smaller on mobile */}
          {link.tags && link.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 sm:gap-1.5 mt-1.5 sm:mt-2">
              {link.tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-medium rounded-md border border-blue-200/50 hover:bg-blue-100 transition-colors"
                  title={tag}
                >
                  <Tag className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* ✅ UX IMPROVED: Footer with better date and favorite display, smaller on mobile */}
          <div className="flex items-center justify-between mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-gray-100">
            <span className="text-xs text-gray-500 font-medium">{formatDate(link.createdAt)}</span>
            <div className="flex items-center gap-1.5 sm:gap-2">
              {link.isFavorite && (
                <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-yellow-500 fill-current" />
              )}
              {link.isArchived && (
                <Archive className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-gray-400" />
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

      // ✅ MOBILE RESPONSIVE: List view with better touch interactions, more compact on mobile
      return (
        <div 
          className={`card p-3 sm:p-5 transition-all duration-300 hover:shadow-xl hover:border-blue-300 hover:bg-blue-50/30 cursor-pointer group relative touch-manipulation ${
            isSelected ? 'ring-2 ring-blue-500 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-300' : 'border-gray-200'
          } ${isDraggingToProject ? 'ring-2 ring-green-500 opacity-70' : ''}`}
          onClick={handleCardClick}
          title="Click to edit, drag to move to project"
          role="article"
          aria-label={`Link: ${link.title}`}
          // ✅ Make entire card draggable for moving to projects
          draggable={collections.length > 0}
          onDragStart={collections.length > 0 ? handleProjectDragStart : undefined}
          onDragEnd={collections.length > 0 ? handleProjectDragEnd : undefined}
        >
          {/* ✅ MOBILE RESPONSIVE: Selection indicator */}
          {isSelected && (
            <div className="absolute top-2.5 left-2.5 sm:top-4 sm:left-4 w-2 h-2 sm:w-2 sm:h-2 bg-blue-500 rounded-full animate-pulse" aria-hidden="true" />
          )}
      <div className="flex items-start gap-2.5 sm:gap-4">
        {/* Drag Handle for reordering (via @hello-pangea/dnd) - stops native drag */}
        {dragHandleProps && (
          <div
            {...dragHandleProps}
            className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 rounded transition-colors touch-manipulation mt-0.5 sm:mt-1"
            title="Drag to reorder within category"
            draggable={false}
            onDragStart={(e) => e.preventDefault()}
          >
            <GripVertical className="w-4 h-4 text-gray-400 hover:text-gray-600" />
          </div>
        )}
        {/* ✅ MOBILE RESPONSIVE: Selection checkbox with better touch targets */}
        <label className="flex items-center cursor-pointer group mt-0.5 sm:mt-1 touch-manipulation">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onSelect}
            className="w-4 h-4 sm:w-4 sm:h-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all cursor-pointer"
            aria-label={`Select ${link.title}`}
          />
          <span className="sr-only">Select link</span>
        </label>

        {/* ✅ MOBILE RESPONSIVE: Favicon/Thumbnail with better sizing, smaller on mobile */}
        <div className="flex-shrink-0">
          {link.thumbnail ? (
            <img
              src={link.thumbnail}
              alt={link.title}
              className="w-12 h-12 sm:w-12 sm:h-12 object-cover rounded-lg"
              loading="lazy"
            />
          ) : link.favicon ? (
            <img
              src={link.favicon}
              alt={link.title}
              className="w-8 h-8 sm:w-8 sm:h-8"
              loading="lazy"
            />
          ) : (
            <div className="w-10 h-10 sm:w-8 sm:h-8 bg-gray-200 rounded flex items-center justify-center">
              <span className="text-xl sm:text-lg">{getContentTypeIcon(link.contentType)}</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-700 hover:underline font-medium text-sm sm:text-lg flex items-start sm:items-center gap-1.5 sm:gap-2 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded py-0.5 -my-0.5 sm:py-1 sm:-my-1"
                title={link.title}
                aria-label={`Open ${link.title} in new tab`}
              >
                <span className="line-clamp-2 flex-1">{link.title}</span>
                <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0 opacity-70 group-hover:opacity-100 transition-opacity mt-0.5 sm:mt-0" />
              </a>
              <p className="text-gray-500 text-xs truncate mt-0.5 sm:mt-1" title={link.url}>
                {link.url}
              </p>
              
              {/* ✅ UX IMPROVED: Description - only show if exists, smaller on mobile */}
              {link.description && (
                <p className="text-gray-600 text-xs sm:text-sm line-clamp-2 mt-1 sm:mt-2" title={link.description}>
                  {link.description}
                </p>
              )}

              {/* ✅ UX IMPROVED: Metadata badges - cleaner grouping, smaller on mobile */}
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap mt-2 sm:mt-3">
                {/* Category Badge */}
                {link.category && (
                  <span className="inline-flex items-center gap-1 px-1.5 sm:px-2.5 py-0.5 sm:py-1 bg-gradient-to-r from-purple-50 to-purple-100 text-purple-700 text-xs font-medium rounded-md border border-purple-200/50">
                    <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-purple-500 rounded-full"></span>
                    {link.category}
                  </span>
                )}
                
                {/* Collection/Project Badge */}
                {link.collectionId && (
                  <span className="inline-flex items-center gap-1 px-1.5 sm:px-2.5 py-0.5 sm:py-1 bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 text-xs font-medium rounded-md border border-green-200/50">
                    <Folder className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                    {getCollectionName(link.collectionId) || 'Project'}
                  </span>
                )}
              </div>

              {/* ✅ UX IMPROVED: Tags - only show if they exist, smaller on mobile */}
              {link.tags && link.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 sm:gap-1.5 mt-1.5 sm:mt-2">
                  {link.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-medium rounded-md border border-blue-200/50 hover:bg-blue-100 transition-colors"
                      title={tag}
                    >
                      <Tag className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-3 sm:gap-4 mt-2 sm:mt-3 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Calendar className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                  {formatDate(link.createdAt)}
                </span>
                {link.clickCount > 0 && (
                  <span className="flex items-center gap-1">
                    <Eye className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                    {link.clickCount} views
                  </span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 ml-4">
              {link.isFavorite && (
                <Star className="w-4 h-4 text-yellow-500 fill-current" />
              )}
              {link.isArchived && (
                <Archive className="w-4 h-4 text-gray-500" />
              )}
              
              {/* ✅ MOBILE RESPONSIVE: Actions menu with better touch targets */}
              <div className="relative">
                <button
                  onClick={() => setShowActions(!showActions)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') setShowActions(false)
                  }}
                  className="p-2.5 sm:p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center touch-manipulation"
                  aria-label="More actions"
                  aria-expanded={showActions}
                  aria-haspopup="true"
                >
                  <MoreVertical className="w-5 h-5 sm:w-4 sm:h-4" />
                </button>
                
                {/* ✅ MOBILE RESPONSIVE: Dropdown menu with better mobile positioning */}
                {showActions && (
                  <>
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setShowActions(false)}
                      aria-hidden="true"
                    />
                    <div className="absolute right-0 top-12 sm:top-10 w-56 bg-white border border-gray-200 rounded-lg shadow-xl z-20 animate-in fade-in slide-in-from-top-2 duration-200 max-h-[calc(100vh-120px)] overflow-y-auto">
                      <div className="py-1.5">
                        <button
                          onClick={() => handleAction('toggleFavorite')}
                          className="w-full flex items-center gap-3 px-4 py-3 sm:py-2.5 text-sm text-gray-700 hover:bg-yellow-50 hover:text-yellow-700 active:bg-yellow-100 transition-colors focus:outline-none focus:bg-yellow-50 min-h-[44px] sm:min-h-0 touch-manipulation"
                          role="menuitem"
                        >
                          <Star className={`w-5 h-5 sm:w-4 sm:h-4 flex-shrink-0 ${link.isFavorite ? 'fill-current text-yellow-500' : ''}`} />
                          <span className="text-left">{link.isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}</span>
                        </button>
                        <button
                          onClick={() => handleAction('toggleArchive')}
                          className="w-full flex items-center gap-3 px-4 py-3 sm:py-2.5 text-sm text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition-colors focus:outline-none focus:bg-gray-50 min-h-[44px] sm:min-h-0 touch-manipulation"
                          role="menuitem"
                        >
                          <Archive className={`w-5 h-5 sm:w-4 sm:h-4 flex-shrink-0 ${link.isArchived ? 'text-orange-500' : ''}`} />
                          <span className="text-left">{link.isArchived ? 'Unarchive' : 'Archive'}</span>
                        </button>
                        <div className="my-1 h-px bg-gray-100" />
                        <button
                          onClick={copyToClipboard}
                          className="w-full flex items-center gap-3 px-4 py-3 sm:py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 active:bg-blue-100 transition-colors focus:outline-none focus:bg-blue-50 min-h-[44px] sm:min-h-0 touch-manipulation"
                          role="menuitem"
                        >
                          {copied ? (
                            <>
                              <div className="w-5 h-5 sm:w-4 sm:h-4 rounded-full bg-green-500 flex items-center justify-center animate-in zoom-in duration-200 flex-shrink-0">
                                <span className="text-white text-xs">✓</span>
                              </div>
                              <span className="text-green-600 font-medium text-left">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-5 h-5 sm:w-4 sm:h-4 flex-shrink-0" />
                              <span className="text-left">Copy URL</span>
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => handleAction('update')}
                          className="w-full flex items-center gap-3 px-4 py-3 sm:py-2.5 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 active:bg-indigo-100 transition-colors focus:outline-none focus:bg-indigo-50 min-h-[44px] sm:min-h-0 touch-manipulation"
                          role="menuitem"
                        >
                          <Edit className="w-5 h-5 sm:w-4 sm:h-4 flex-shrink-0" />
                          <span className="text-left">Edit</span>
                        </button>
                        
                        {/* ✅ Move to Project submenu (List View) */}
                        <div className="relative">
                          <button
                            onClick={() => setShowMoveToProject(!showMoveToProject)}
                            className="w-full flex items-center gap-3 px-4 py-3 sm:py-2.5 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 active:bg-green-100 transition-colors focus:outline-none focus:bg-green-50 min-h-[44px] sm:min-h-0 touch-manipulation"
                            role="menuitem"
                          >
                            <Folder className="w-5 h-5 sm:w-4 sm:h-4 flex-shrink-0" />
                            <span className="flex-1 text-left">Move to Project</span>
                            <span className="text-gray-400 text-xs">›</span>
                          </button>
                          
                          {/* Submenu */}
                          {showMoveToProject && (
                            <div className="absolute left-full top-0 ml-1 w-48 bg-white border border-gray-200 rounded-lg shadow-xl z-30 animate-in fade-in slide-in-from-left-2 duration-200 max-h-60 overflow-y-auto">
                              <div className="py-1.5">
                                {/* Remove from project option */}
                                {link.collectionId && (
                                  <>
                                    <button
                                      onClick={() => handleMoveToProject(null)}
                                      className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-orange-600 hover:bg-orange-50 transition-colors"
                                    >
                                      <span className="text-base">✕</span>
                                      <span>Remove from Project</span>
                                    </button>
                                    <div className="my-1 h-px bg-gray-100" />
                                  </>
                                )}
                                
                                {/* List of projects */}
                                {collections.length > 0 ? (
                                  collections
                                    .filter(c => c.id !== link.collectionId)
                                    .map(collection => (
                                      <button
                                        key={collection.id}
                                        onClick={() => handleMoveToProject(collection.id)}
                                        className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 transition-colors"
                                      >
                                        <div 
                                          className="w-3 h-3 rounded-full flex-shrink-0"
                                          style={{ backgroundColor: collection.color || '#6366f1' }}
                                        />
                                        <span className="truncate">{collection.name}</span>
                                      </button>
                                    ))
                                ) : (
                                  <div className="px-3 py-2 text-sm text-gray-500 italic">
                                    No projects yet
                                  </div>
                                )}
                                
                                {collections.length > 0 && collections.every(c => c.id === link.collectionId) && (
                                  <div className="px-3 py-2 text-sm text-gray-500 italic">
                                    Already in only project
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <div className="my-1 h-px bg-gray-100" />
                        <button
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to delete "${link.title}"?`)) {
                              handleAction('delete')
                            }
                            setShowActions(false)
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 sm:py-2.5 text-sm text-red-600 hover:bg-red-50 active:bg-red-100 transition-colors focus:outline-none focus:bg-red-50 min-h-[44px] sm:min-h-0 touch-manipulation"
                          role="menuitem"
                        >
                          <Trash2 className="w-5 h-5 sm:w-4 sm:h-4 flex-shrink-0" />
                          <span className="text-left">Delete</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Memoize component to prevent unnecessary re-renders
// Only re-render if key props change
export const LinkCard = memo(LinkCardComponent, (prevProps, nextProps) => {
  return (
    prevProps.link.id === nextProps.link.id &&
    prevProps.link.isArchived === nextProps.link.isArchived &&
    prevProps.link.isFavorite === nextProps.link.isFavorite &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.viewMode === nextProps.viewMode
  )
})

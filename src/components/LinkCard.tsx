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
  Folder,
  GripVertical,
  FolderPlus,
  Clock,
  Globe,
  StickyNote
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
  onCardClick?: () => void
  dragHandleProps?: any
}

const LinkCardComponent: React.FC<LinkCardProps> = ({ 
  link, 
  viewMode, 
  isSelected, 
  onSelect, 
  onAction,
  onDragStart: _onDragStart,
  onDragEnd: _onDragEnd,
  collections = [],
  onCardClick,
  dragHandleProps
}) => {
  const [showActions, setShowActions] = useState(false)
  const [showMoveToProject, setShowMoveToProject] = useState(false)
  const [isDraggingToProject, setIsDraggingToProject] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleAction = (action: string, data?: any) => {
    onAction(link.id, action, data)
    setShowActions(false)
    setShowMoveToProject(false)
  }

  const handleMoveToProject = (collectionId: string | null) => {
    handleAction('moveToProject', { collectionId })
    setShowMoveToProject(false)
    setShowActions(false)
  }

  // Native HTML5 drag handlers for dragging to sidebar projects
  const handleProjectDragStart = (e: React.DragEvent) => {
    e.stopPropagation()
    e.nativeEvent.stopImmediatePropagation()
    
    e.dataTransfer.setData('text/plain', link.id)
    e.dataTransfer.setData('application/x-link-id', link.id)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.dropEffect = 'move'
    
    // Custom drag image
    const dragImage = document.createElement('div')
    dragImage.textContent = `📁 ${link.title?.substring(0, 30) || 'Link'}...`
    dragImage.style.cssText = 'position: absolute; top: -1000px; padding: 8px 16px; background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); color: white; border-radius: 8px; font-size: 14px; font-weight: 500; box-shadow: 0 4px 12px rgba(0,0,0,0.3);'
    document.body.appendChild(dragImage)
    e.dataTransfer.setDragImage(dragImage, 0, 0)
    setTimeout(() => document.body.removeChild(dragImage), 0)
    
    setIsDraggingToProject(true)
  }

  const handleProjectDragEnd = (_e: React.DragEvent) => {
    setIsDraggingToProject(false)
  }

  const handleCardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    if (
      target.closest('button') ||
      target.closest('a') ||
      target.closest('input[type="checkbox"]') ||
      target.closest('[data-drag-handle]') ||
      target.tagName === 'A'
    ) {
      return
    }
    onCardClick?.()
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(link.url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      logger.error('Failed to copy', { component: 'LinkCard' }, err as Error)
    }
  }

  const formatDate = (date: Date | string) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
    }).format(new Date(date))
  }

  const getDomain = (url: string) => {
    try {
      return new URL(url).hostname.replace('www.', '')
    } catch {
      return url
    }
  }

  const getCollectionName = (collectionId?: string | null) => {
    if (!collectionId) return null
    return collections.find(c => c.id === collectionId)?.name
  }

  // ============ LIST VIEW ============
  if (viewMode === 'list') {
    return (
      <div 
        className={`group bg-white rounded-xl border transition-all duration-200 hover:shadow-md hover:border-blue-200 cursor-pointer relative ${
          isSelected ? 'ring-2 ring-blue-500 border-blue-300 bg-blue-50/30' : 'border-gray-200'
        } ${isDraggingToProject ? 'ring-2 ring-purple-500 opacity-70 scale-[0.98]' : ''}`}
        onClick={handleCardClick}
        role="article"
        aria-label={`Link: ${link.title}`}
      >
        <div className="flex items-center gap-3 p-4">
          {/* Left: Drag Handle + Checkbox */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {dragHandleProps && (
              <div
                {...dragHandleProps}
                className="cursor-grab active:cursor-grabbing p-1 text-gray-300 hover:text-gray-500 hover:bg-gray-100 rounded transition-colors opacity-0 group-hover:opacity-100"
                title="Drag to reorder"
              >
                <GripVertical className="w-4 h-4" />
              </div>
            )}
            <input
              type="checkbox"
              checked={isSelected}
              onChange={onSelect}
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 cursor-pointer"
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {/* Favicon */}
          <div className="flex-shrink-0">
            {link.favicon ? (
              <img src={link.favicon} alt="" className="w-8 h-8 rounded-lg object-cover bg-gray-100" />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                <Globe className="w-4 h-4 text-gray-400" />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-gray-900 truncate text-sm">
                {link.title}
              </h3>
              {link.description && <span title="Has notes"><StickyNote className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" /></span>}
              {link.isFavorite && <Star className="w-3.5 h-3.5 text-amber-400 fill-current flex-shrink-0" />}
              {link.isArchived && <Archive className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />}
            </div>
            <p className="text-xs text-gray-500 truncate mt-0.5">{getDomain(link.url)}</p>
          </div>

          {/* Tags & Category */}
          <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
            {link.category && (
              <span className="px-2 py-0.5 bg-purple-50 text-purple-700 text-xs font-medium rounded-full">
                {link.category}
              </span>
            )}
            {link.collectionId && (
              <span className="px-2 py-0.5 bg-green-50 text-green-700 text-xs font-medium rounded-full flex items-center gap-1">
                <Folder className="w-3 h-3" />
                {getCollectionName(link.collectionId)}
              </span>
            )}
          </div>

          {/* Date */}
          <div className="hidden md:flex items-center gap-1 text-xs text-gray-400 flex-shrink-0">
            <Clock className="w-3 h-3" />
            {formatDate(link.createdAt)}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {/* Drag to Project Handle */}
            {collections.length > 0 && (
              <div
                draggable
                onDragStart={handleProjectDragStart}
                onDragEnd={handleProjectDragEnd}
                onMouseDown={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
                data-drag-handle
                data-rbd-drag-handle-context-id="disabled"
                className={`p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg cursor-grab active:cursor-grabbing transition-colors ${isDraggingToProject ? 'text-purple-600 bg-purple-100' : ''}`}
                title="Drag to move to project"
              >
                <FolderPlus className="w-4 h-4" />
              </div>
            )}
            
            {/* Open Link */}
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              onClick={(e) => e.stopPropagation()}
              title="Open link"
            >
              <ExternalLink className="w-4 h-4" />
            </a>

            {/* More Actions */}
            <div className="relative">
              <button
                onClick={(e) => { e.stopPropagation(); setShowActions(!showActions) }}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="More actions"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
              
              {showActions && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowActions(false)} />
                  <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-xl shadow-lg z-20 py-1 overflow-hidden">
                    <button
                      onClick={() => handleAction('toggleFavorite')}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <Star className={`w-4 h-4 ${link.isFavorite ? 'fill-current text-amber-400' : ''}`} />
                      {link.isFavorite ? 'Unfavorite' : 'Favorite'}
                    </button>
                    <button
                      onClick={() => handleAction('toggleArchive')}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <Archive className="w-4 h-4" />
                      {link.isArchived ? 'Unarchive' : 'Archive'}
                    </button>
                    <button
                      onClick={copyToClipboard}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <Copy className="w-4 h-4" />
                      {copied ? 'Copied!' : 'Copy URL'}
                    </button>
                    <hr className="my-1 border-gray-100" />
                    <button
                      onClick={() => handleAction('edit')}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </button>
                    
                    {/* Move to Project Submenu */}
                    {collections.length > 0 && (
                      <div className="relative">
                        <button
                          onClick={(e) => { e.stopPropagation(); setShowMoveToProject(!showMoveToProject) }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <Folder className="w-4 h-4" />
                          <span className="flex-1 text-left">Move to Project</span>
                          <span className="text-gray-400">›</span>
                        </button>
                        
                        {showMoveToProject && (
                          <div className="absolute left-full top-0 ml-1 w-44 bg-white border border-gray-200 rounded-xl shadow-lg z-30 py-1">
                            <button
                              onClick={() => handleMoveToProject(null)}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-500 hover:bg-gray-50"
                            >
                              None
                            </button>
                            {collections.map((c) => (
                              <button
                                key={c.id}
                                onClick={() => handleMoveToProject(c.id)}
                                className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 ${
                                  link.collectionId === c.id ? 'text-purple-600 bg-purple-50' : 'text-gray-700'
                                }`}
                              >
                                <Folder className="w-4 h-4" />
                                {c.name}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    
                    <hr className="my-1 border-gray-100" />
                    <button
                      onClick={() => handleAction('delete')}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ============ GRID VIEW ============
  return (
    <div 
      className={`group bg-white rounded-xl border transition-all duration-200 hover:shadow-lg hover:border-blue-200 hover:-translate-y-0.5 cursor-pointer relative overflow-hidden ${
        isSelected ? 'ring-2 ring-blue-500 border-blue-300 bg-blue-50/30' : 'border-gray-200'
      } ${isDraggingToProject ? 'ring-2 ring-purple-500 opacity-70 scale-[0.98]' : ''}`}
      onClick={handleCardClick}
      role="article"
      aria-label={`Link: ${link.title}`}
    >
      {/* Thumbnail */}
      {link.thumbnail && (
        <div className="aspect-video w-full overflow-hidden bg-gray-100">
          <img 
            src={link.thumbnail} 
            alt="" 
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
      )}

      <div className="p-4">
        {/* Header Row */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 min-w-0">
            {/* Favicon */}
            {link.favicon ? (
              <img src={link.favicon} alt="" className="w-5 h-5 rounded flex-shrink-0" />
            ) : (
              <div className="w-5 h-5 rounded bg-gray-200 flex items-center justify-center flex-shrink-0">
                <Globe className="w-3 h-3 text-gray-400" />
              </div>
            )}
            {/* Domain */}
            <span className="text-xs text-gray-500 truncate">{getDomain(link.url)}</span>
          </div>

          {/* Header Actions */}
          <div className="flex items-center gap-0.5 flex-shrink-0">
            {/* Reorder Handle (visible on hover) */}
            {dragHandleProps && (
              <div
                {...dragHandleProps}
                className="p-1 text-gray-300 hover:text-gray-500 hover:bg-gray-100 rounded cursor-grab active:cursor-grabbing transition-colors opacity-0 group-hover:opacity-100"
                title="Drag to reorder"
              >
                <GripVertical className="w-3.5 h-3.5" />
              </div>
            )}
            
            {/* Checkbox (visible on hover or when selected) */}
            <div className={`transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
              <input
                type="checkbox"
                checked={isSelected}
                onChange={onSelect}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
        </div>

        {/* Title */}
        <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 mb-1 leading-snug">
          {link.title}
        </h3>

        {/* Note/Description */}
        {link.description && (
          <div className="mb-3 p-2 bg-amber-50/70 border border-amber-100 rounded-lg">
            <div className="flex items-start gap-1.5">
              <StickyNote className="w-3 h-3 text-amber-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-amber-800 line-clamp-2 leading-relaxed">
                {link.description}
              </p>
            </div>
          </div>
        )}

        {/* Tags Row */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {link.category && (
            <span className="px-2 py-0.5 bg-purple-50 text-purple-700 text-xs font-medium rounded-full">
              {link.category}
            </span>
          )}
          {link.collectionId && (
            <span className="px-2 py-0.5 bg-green-50 text-green-700 text-xs font-medium rounded-full flex items-center gap-1">
              <Folder className="w-3 h-3" />
              {getCollectionName(link.collectionId)}
            </span>
          )}
          {link.tags?.slice(0, 2).map((tag, i) => (
            <span key={i} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full flex items-center gap-1">
              <Tag className="w-3 h-3" />
              {tag}
            </span>
          ))}
          {(link.tags?.length || 0) > 2 && (
            <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full">
              +{link.tags!.length - 2}
            </span>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          {/* Left: Date & Status */}
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span>{formatDate(link.createdAt)}</span>
            {link.isFavorite && <Star className="w-3.5 h-3.5 text-amber-400 fill-current" />}
            {link.isArchived && <Archive className="w-3.5 h-3.5 text-gray-400" />}
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-0.5">
            {/* Drag to Project */}
            {collections.length > 0 && (
              <div
                draggable
                onDragStart={handleProjectDragStart}
                onDragEnd={handleProjectDragEnd}
                onMouseDown={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
                data-drag-handle
                data-rbd-drag-handle-context-id="disabled"
                className={`p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg cursor-grab active:cursor-grabbing transition-colors ${isDraggingToProject ? 'text-purple-600 bg-purple-100' : ''}`}
                title="Drag to move to project"
              >
                <FolderPlus className="w-4 h-4" />
              </div>
            )}

            {/* Open Link */}
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              onClick={(e) => e.stopPropagation()}
              title="Open link"
            >
              <ExternalLink className="w-4 h-4" />
            </a>

            {/* More Actions */}
            <div className="relative">
              <button
                onClick={(e) => { e.stopPropagation(); setShowActions(!showActions) }}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="More actions"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
              
              {showActions && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowActions(false)} />
                  <div className="absolute right-0 bottom-full mb-1 w-48 bg-white border border-gray-200 rounded-xl shadow-lg z-20 py-1 overflow-hidden">
                    <button
                      onClick={() => handleAction('toggleFavorite')}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <Star className={`w-4 h-4 ${link.isFavorite ? 'fill-current text-amber-400' : ''}`} />
                      {link.isFavorite ? 'Unfavorite' : 'Favorite'}
                    </button>
                    <button
                      onClick={() => handleAction('toggleArchive')}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <Archive className="w-4 h-4" />
                      {link.isArchived ? 'Unarchive' : 'Archive'}
                    </button>
                    <button
                      onClick={copyToClipboard}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <Copy className="w-4 h-4" />
                      {copied ? 'Copied!' : 'Copy URL'}
                    </button>
                    <hr className="my-1 border-gray-100" />
                    <button
                      onClick={() => handleAction('edit')}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </button>
                    
                    {/* Move to Project Submenu */}
                    {collections.length > 0 && (
                      <div className="relative">
                        <button
                          onClick={(e) => { e.stopPropagation(); setShowMoveToProject(!showMoveToProject) }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <Folder className="w-4 h-4" />
                          <span className="flex-1 text-left">Move to Project</span>
                          <span className="text-gray-400">›</span>
                        </button>
                        
                        {showMoveToProject && (
                          <div className="absolute left-full top-0 ml-1 w-44 bg-white border border-gray-200 rounded-xl shadow-lg z-30 py-1">
                            <button
                              onClick={() => handleMoveToProject(null)}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-500 hover:bg-gray-50"
                            >
                              None
                            </button>
                            {collections.map((c) => (
                              <button
                                key={c.id}
                                onClick={() => handleMoveToProject(c.id)}
                                className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 ${
                                  link.collectionId === c.id ? 'text-purple-600 bg-purple-50' : 'text-gray-700'
                                }`}
                              >
                                <Folder className="w-4 h-4" />
                                {c.name}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    
                    <hr className="my-1 border-gray-100" />
                    <button
                      onClick={() => handleAction('delete')}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export const LinkCard = memo(LinkCardComponent)

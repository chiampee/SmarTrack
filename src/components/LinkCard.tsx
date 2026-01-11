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
  Folder
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
}

const LinkCardComponent: React.FC<LinkCardProps> = ({ 
  link, 
  viewMode, 
  isSelected, 
  onSelect, 
  onAction,
  onDragStart,
  onDragEnd,
  collections = []
}) => {
  const [showActions, setShowActions] = useState(false)

  const handleAction = (action: string, data?: any) => {
    onAction(link.id, action, data)
    setShowActions(false)
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
            className={`card p-5 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-move group ${
              isSelected ? 'ring-2 ring-blue-500 bg-gradient-to-br from-blue-50 to-purple-50 scale-[1.02]' : ''
            }`}
            draggable
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            title="Drag to add to a collection"
          >
        {/* Selection checkbox */}
        <div className="flex items-start justify-between mb-3">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onSelect}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <div className="relative">
            <button
              onClick={() => setShowActions(!showActions)}
              className="p-1 text-gray-400 hover:text-gray-600"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
            
            {showActions && (
              <div className="absolute right-0 top-8 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                <div className="py-1">
                  <button
                    onClick={() => handleAction('toggleFavorite')}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <Star className="w-4 h-4" />
                    {link.isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
                  </button>
                  <button
                    onClick={() => handleAction('toggleArchive')}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <Archive className="w-4 h-4" />
                    {link.isArchived ? 'Unarchive' : 'Archive'}
                  </button>
                  <button
                    onClick={copyToClipboard}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    {copied ? (
                      <>
                        <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
                          <span className="text-white text-xs">✓</span>
                        </div>
                        <span className="text-green-600 font-medium">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Copy URL</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleAction('update')}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleAction('delete')}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Thumbnail */}
        {link.thumbnail && (
          <div className="mb-3">
            <img
              src={link.thumbnail}
              alt={link.title}
              className="w-full h-32 object-cover rounded-lg"
            />
          </div>
        )}

        {/* Content */}
        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <span className="text-lg">{getContentTypeIcon(link.contentType)}</span>
            <div className="flex-1 min-w-0">
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline font-medium text-sm line-clamp-2"
              >
                {link.title}
              </a>
              <p className="text-gray-500 text-xs truncate mt-1">{link.url}</p>
            </div>
          </div>

          {/* ✅ UX IMPROVED: Description - only show if exists (progressive disclosure) */}
          {link.description && (
            <p className="text-gray-600 text-xs line-clamp-2 mt-1.5" title={link.description}>
              {link.description}
            </p>
          )}

          {/* ✅ UX IMPROVED: Metadata badges - cleaner grouping */}
          <div className="flex items-center gap-2 flex-wrap mt-3">
            {/* Category Badge */}
            {link.category && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-purple-50 to-purple-100 text-purple-700 text-xs font-medium rounded-md border border-purple-200/50">
                <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
                {link.category}
              </span>
            )}
            
            {/* Collection/Project Badge */}
            {link.collectionId && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 text-xs font-medium rounded-md border border-green-200/50">
                <Folder className="w-3 h-3" />
                {getCollectionName(link.collectionId) || 'Project'}
              </span>
            )}
          </div>

          {/* ✅ UX IMPROVED: Tags - only show if they exist (no "No tags" text) */}
          {link.tags && link.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {link.tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-medium rounded-md border border-blue-200/50 hover:bg-blue-100 transition-colors"
                  title={tag}
                >
                  <Tag className="w-3 h-3" />
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* ✅ UX IMPROVED: Footer with better date and favorite display */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
            <span className="text-xs text-gray-500 font-medium">{formatDate(link.createdAt)}</span>
            <div className="flex items-center gap-2">
              {link.isFavorite && (
                <Star className="w-3.5 h-3.5 text-yellow-500 fill-current" />
              )}
              {link.isArchived && (
                <Archive className="w-3.5 h-3.5 text-gray-400" />
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

      // List view
      return (
        <div 
          className={`card p-5 transition-all duration-300 hover:shadow-xl hover:border-blue-200 cursor-move group ${
            isSelected ? 'ring-2 ring-blue-500 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-300' : 'border-gray-200'
          }`}
          draggable
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          title="Drag to add to a collection"
        >
      <div className="flex items-start gap-4">
        {/* Selection checkbox */}
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onSelect}
          className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />

        {/* Favicon/Thumbnail */}
        <div className="flex-shrink-0">
          {link.thumbnail ? (
            <img
              src={link.thumbnail}
              alt={link.title}
              className="w-12 h-12 object-cover rounded-lg"
            />
          ) : link.favicon ? (
            <img
              src={link.favicon}
              alt={link.title}
              className="w-8 h-8"
            />
          ) : (
            <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center">
              <span className="text-lg">{getContentTypeIcon(link.contentType)}</span>
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
                className="text-blue-600 hover:underline font-medium text-lg flex items-center gap-2"
              >
                {link.title}
                <ExternalLink className="w-4 h-4 flex-shrink-0" />
              </a>
              <p className="text-gray-500 text-sm truncate mt-1">{link.url}</p>
              
              {/* ✅ UX IMPROVED: Description - only show if exists */}
              {link.description && (
                <p className="text-gray-600 text-sm line-clamp-2 mt-2" title={link.description}>
                  {link.description}
                </p>
              )}

              {/* ✅ UX IMPROVED: Metadata badges - cleaner grouping */}
              <div className="flex items-center gap-2 flex-wrap mt-3">
                {/* Category Badge */}
                {link.category && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-purple-50 to-purple-100 text-purple-700 text-xs font-medium rounded-md border border-purple-200/50">
                    <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
                    {link.category}
                  </span>
                )}
                
                {/* Collection/Project Badge */}
                {link.collectionId && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 text-xs font-medium rounded-md border border-green-200/50">
                    <Folder className="w-3 h-3" />
                    {getCollectionName(link.collectionId) || 'Project'}
                  </span>
                )}
              </div>

              {/* ✅ UX IMPROVED: Tags - only show if they exist */}
              {link.tags && link.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {link.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-medium rounded-md border border-blue-200/50 hover:bg-blue-100 transition-colors"
                      title={tag}
                    >
                      <Tag className="w-3 h-3" />
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formatDate(link.createdAt)}
                </span>
                {link.clickCount > 0 && (
                  <span className="flex items-center gap-1">
                    <Eye className="w-3 h-3" />
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
              
              <div className="relative">
                <button
                  onClick={() => setShowActions(!showActions)}
                  className="p-1 text-gray-400 hover:text-gray-600"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
                
                {showActions && (
                  <div className="absolute right-0 top-8 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                    <div className="py-1">
                      <button
                        onClick={() => handleAction('toggleFavorite')}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <Star className="w-4 h-4" />
                        {link.isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
                      </button>
                      <button
                        onClick={() => handleAction('toggleArchive')}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <Archive className="w-4 h-4" />
                        {link.isArchived ? 'Unarchive' : 'Archive'}
                      </button>
                      <button
                        onClick={copyToClipboard}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <Copy className="w-4 h-4" />
                        Copy URL
                      </button>
                      <button
                        onClick={() => handleAction('update')}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <Edit className="w-4 h-4" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleAction('delete')}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </div>
                  </div>
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

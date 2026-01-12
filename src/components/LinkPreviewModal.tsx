import React from 'react'
import { 
  X, 
  ExternalLink, 
  Star, 
  Archive, 
  Copy, 
  Edit, 
  Folder, 
  Tag, 
  Clock, 
  Globe,
  FileText,
  MousePointer
} from 'lucide-react'
import { Link, Collection } from '../types/Link'

interface LinkPreviewModalProps {
  link: Link | null
  isOpen: boolean
  onClose: () => void
  onEdit: () => void
  onAction: (action: string) => void
  collections?: Collection[]
}

export const LinkPreviewModal: React.FC<LinkPreviewModalProps> = ({
  link,
  isOpen,
  onClose,
  onEdit,
  onAction,
  collections = []
}) => {
  const [copied, setCopied] = React.useState(false)

  if (!isOpen || !link) return null

  const formatDate = (date: Date | string) => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
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

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(link.url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-in fade-in duration-200"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div 
          className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-hidden pointer-events-auto animate-in zoom-in-95 fade-in duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header with Thumbnail */}
          {link.thumbnail ? (
            <div className="relative aspect-video w-full bg-gray-100">
              <img 
                src={link.thumbnail} 
                alt="" 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <button
                onClick={onClose}
                className="absolute top-3 right-3 p-2 bg-black/30 hover:bg-black/50 text-white rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              {/* Status badges on thumbnail */}
              <div className="absolute top-3 left-3 flex gap-2">
                {link.isFavorite && (
                  <span className="px-2 py-1 bg-amber-500 text-white text-xs font-medium rounded-full flex items-center gap-1">
                    <Star className="w-3 h-3 fill-current" /> Favorite
                  </span>
                )}
                {link.isArchived && (
                  <span className="px-2 py-1 bg-gray-600 text-white text-xs font-medium rounded-full flex items-center gap-1">
                    <Archive className="w-3 h-3" /> Archived
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="relative p-4 pb-0">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 hover:bg-gray-100 text-gray-500 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Content */}
          <div className="p-5 overflow-y-auto max-h-[50vh]">
            {/* Domain & Favicon */}
            <div className="flex items-center gap-2 mb-3">
              {link.favicon ? (
                <img src={link.favicon} alt="" className="w-5 h-5 rounded" />
              ) : (
                <div className="w-5 h-5 rounded bg-gray-200 flex items-center justify-center">
                  <Globe className="w-3 h-3 text-gray-400" />
                </div>
              )}
              <span className="text-sm text-gray-500">{getDomain(link.url)}</span>
              
              {/* Status badges if no thumbnail */}
              {!link.thumbnail && (
                <div className="flex gap-2 ml-auto">
                  {link.isFavorite && (
                    <Star className="w-4 h-4 text-amber-400 fill-current" />
                  )}
                  {link.isArchived && (
                    <Archive className="w-4 h-4 text-gray-400" />
                  )}
                </div>
              )}
            </div>

            {/* Title */}
            <h2 className="text-xl font-bold text-gray-900 mb-3 leading-tight">
              {link.title}
            </h2>

            {/* Description/Notes */}
            {link.description && (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-100 rounded-lg">
                <div className="flex items-center gap-2 text-amber-700 text-xs font-medium mb-1">
                  <FileText className="w-3.5 h-3.5" />
                  Notes
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {link.description}
                </p>
              </div>
            )}

            {/* URL */}
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm text-gray-600 truncate flex-1">{link.url}</p>
                <button
                  onClick={copyToClipboard}
                  className={`p-1.5 rounded-lg transition-colors flex-shrink-0 ${
                    copied ? 'bg-green-100 text-green-600' : 'hover:bg-gray-200 text-gray-500'
                  }`}
                  title="Copy URL"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
              {copied && (
                <p className="text-xs text-green-600 mt-1">Copied to clipboard!</p>
              )}
            </div>

            {/* Metadata Grid */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              {/* Category */}
              {link.category && (
                <div className="p-3 bg-purple-50 rounded-lg">
                  <div className="text-xs text-purple-600 font-medium mb-1">Category</div>
                  <div className="text-sm text-purple-800 font-medium">{link.category}</div>
                </div>
              )}
              
              {/* Project */}
              {link.collectionId && (
                <div className="p-3 bg-green-50 rounded-lg">
                  <div className="text-xs text-green-600 font-medium mb-1 flex items-center gap-1">
                    <Folder className="w-3 h-3" /> Project
                  </div>
                  <div className="text-sm text-green-800 font-medium">
                    {getCollectionName(link.collectionId)}
                  </div>
                </div>
              )}
              
              {/* Created */}
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-xs text-gray-500 font-medium mb-1 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Added
                </div>
                <div className="text-sm text-gray-700">{formatDate(link.createdAt)}</div>
              </div>
              
              {/* Clicks */}
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="text-xs text-blue-600 font-medium mb-1 flex items-center gap-1">
                  <MousePointer className="w-3 h-3" /> Clicks
                </div>
                <div className="text-sm text-blue-800 font-medium">{link.clickCount || 0}</div>
              </div>
            </div>

            {/* Tags */}
            {link.tags && link.tags.length > 0 && (
              <div className="mb-4">
                <div className="text-xs text-gray-500 font-medium mb-2 flex items-center gap-1">
                  <Tag className="w-3 h-3" /> Tags
                </div>
                <div className="flex flex-wrap gap-2">
                  {link.tags.map((tag, i) => (
                    <span 
                      key={i} 
                      className="px-2.5 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex items-center gap-2">
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Open Link
            </a>
            
            <button
              onClick={() => onAction('toggleFavorite')}
              className={`p-2.5 rounded-lg transition-colors ${
                link.isFavorite 
                  ? 'bg-amber-100 text-amber-600 hover:bg-amber-200' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title={link.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Star className={`w-5 h-5 ${link.isFavorite ? 'fill-current' : ''}`} />
            </button>
            
            <button
              onClick={() => onAction('toggleArchive')}
              className={`p-2.5 rounded-lg transition-colors ${
                link.isArchived 
                  ? 'bg-orange-100 text-orange-600 hover:bg-orange-200' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title={link.isArchived ? 'Unarchive' : 'Archive'}
            >
              <Archive className="w-5 h-5" />
            </button>
            
            <button
              onClick={onEdit}
              className="p-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition-colors"
              title="Edit all details"
            >
              <Edit className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

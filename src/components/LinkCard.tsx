import React, { useState, memo } from 'react'
import { logger } from '../utils/logger'
import { 
  ExternalLink, 
  Tag, 
  Star, 
  Archive, 
  Edit, 
  Trash2, 
  Copy,
  Folder,
  Clock,
  Globe,
  StickyNote,
  ChevronDown,
  ChevronUp,
  MousePointer,
  Save,
  X,
  Plus,
  FileText,
  Video,
  Image,
  File,
  Newspaper,
  Link2
} from 'lucide-react'
import { Link, Collection } from '../types/Link'

interface LinkCardProps {
  link: Link
  viewMode: 'grid' | 'list'
  isSelected: boolean
  onSelect: () => void
  onAction: (linkId: string, action: string, data?: any) => void
  collections?: Collection[]
  onCardClick?: () => void
}

const LinkCardComponent: React.FC<LinkCardProps> = ({ 
  link, 
  viewMode, 
  isSelected, 
  onSelect, 
  onAction,
  collections = [],
  onCardClick
}) => {
  const [copied, setCopied] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  
  // Edit form state
  const [editTitle, setEditTitle] = useState(link.title)
  const [editDescription, setEditDescription] = useState(link.description || '')
  const [editCategory, setEditCategory] = useState(link.category || '')
  const [editTags, setEditTags] = useState(link.tags?.join(', ') || '')
  const [editCollectionId, setEditCollectionId] = useState(link.collectionId || '')
  const [newTag, setNewTag] = useState('')

  const handleAction = (action: string, data?: any) => {
    onAction(link.id, action, data)
  }

  const startEditing = () => {
    setEditTitle(link.title)
    setEditDescription(link.description || '')
    setEditCategory(link.category || '')
    setEditTags(link.tags?.join(', ') || '')
    setEditCollectionId(link.collectionId || '')
    setIsEditing(true)
  }

  const cancelEditing = () => {
    setIsEditing(false)
    setNewTag('')
  }

  const saveEdits = () => {
    const tagsArray = editTags
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0)

    handleAction('quickEdit', {
      title: editTitle,
      description: editDescription || undefined,
      category: editCategory || undefined,
      tags: tagsArray,
      collectionId: editCollectionId || null,
    })
    setIsEditing(false)
  }

  const addTag = () => {
    if (newTag.trim()) {
      const currentTags = editTags ? editTags.split(',').map(t => t.trim()).filter(t => t) : []
      if (!currentTags.includes(newTag.trim())) {
        setEditTags([...currentTags, newTag.trim()].join(', '))
      }
      setNewTag('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    const currentTags = editTags.split(',').map(t => t.trim()).filter(t => t && t !== tagToRemove)
    setEditTags(currentTags.join(', '))
  }

  // Toggle accordion when clicking on the card (except on interactive elements)
  const handleCardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    if (
      target.closest('button') ||
      target.closest('a') ||
      target.closest('input') ||
      target.closest('textarea') ||
      target.closest('select') ||
      target.closest('[data-link-title]') ||
      target.tagName === 'A'
    ) {
      return
    }
    if (!isEditing) {
      setIsExpanded(!isExpanded)
    }
  }

  // Open link when clicking on title
  const handleTitleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    window.open(link.url, '_blank', 'noopener,noreferrer')
    handleAction('click') // Track click
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
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(date))
  }

  const formatFullDate = (date: Date | string) => {
    return new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(date))
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

  // Get content type label and styling
  const getContentTypeInfo = (contentType?: string) => {
    switch (contentType) {
      case 'article':
        return { icon: Newspaper, label: 'Article', color: 'bg-blue-50 text-blue-700' }
      case 'video':
        return { icon: Video, label: 'Video', color: 'bg-red-50 text-red-700' }
      case 'image':
        return { icon: Image, label: 'Image', color: 'bg-pink-50 text-pink-700' }
      case 'pdf':
        return { icon: FileText, label: 'PDF', color: 'bg-orange-50 text-orange-700' }
      case 'document':
        return { icon: File, label: 'Document', color: 'bg-yellow-50 text-yellow-700' }
      case 'webpage':
        return { icon: Globe, label: 'Webpage', color: 'bg-cyan-50 text-cyan-700' }
      default:
        return { icon: Link2, label: 'Link', color: 'bg-gray-50 text-gray-600' }
    }
  }

  const contentTypeInfo = getContentTypeInfo(link.contentType)

  const currentTags = editTags.split(',').map(t => t.trim()).filter(t => t)

  // ============ LIST VIEW ============
  if (viewMode === 'list') {
    return (
      <div 
        className={`group bg-white rounded-xl border transition-all duration-200 cursor-pointer relative touch-manipulation ${
          isSelected ? 'ring-2 ring-blue-500 border-blue-300 bg-blue-50/30' : 'border-gray-200 hover:shadow-md hover:border-blue-200 active:bg-gray-50'
        }`}
        role="article"
        onClick={handleCardClick}
      >
        {/* Main Row - Enhanced for mobile */}
        <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4">
          {/* Checkbox with larger touch target */}
          <div className="flex items-center flex-shrink-0">
            <label className="p-2 -m-2 cursor-pointer touch-manipulation">
              <input 
                type="checkbox" 
                checked={isSelected} 
                onChange={onSelect} 
                className="w-5 h-5 sm:w-4 sm:h-4 rounded border-gray-300 text-blue-600 cursor-pointer" 
                onClick={(e) => e.stopPropagation()} 
              />
            </label>
          </div>

          {/* Favicon */}
          <div className="flex-shrink-0">
            {link.favicon ? (
              <img src={link.favicon} alt="" className="w-10 h-10 sm:w-8 sm:h-8 rounded-lg object-cover bg-gray-100" />
            ) : (
              <div className="w-10 h-10 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                <Globe className="w-5 h-5 sm:w-4 sm:h-4 text-gray-400" />
              </div>
            )}
          </div>

          {/* Title & Domain */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <h3 
                data-link-title
                onClick={handleTitleClick}
                className="font-medium text-blue-600 hover:text-blue-800 active:text-blue-900 hover:underline text-base sm:text-sm cursor-pointer line-clamp-1 touch-manipulation"
                title="Click to open link"
              >
                {link.title}
              </h3>
              <div className="flex items-center gap-1 flex-shrink-0">
                {link.description && <span title="Has notes"><StickyNote className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-amber-400" /></span>}
                {link.isFavorite && <Star className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-amber-400 fill-current" />}
                {link.isArchived && <Archive className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-gray-400" />}
              </div>
            </div>
            <p className="text-xs text-gray-500 truncate mt-0.5">{getDomain(link.url)}</p>
            
            {/* Mobile: Show badges below domain */}
            <div className="flex flex-wrap gap-1.5 mt-2 sm:hidden">
              <span className={`px-2 py-0.5 text-xs font-medium rounded-full flex items-center gap-1 ${contentTypeInfo.color}`}>
                <contentTypeInfo.icon className="w-3 h-3" />{contentTypeInfo.label}
              </span>
              {link.category && <span className="px-2 py-0.5 bg-purple-50 text-purple-700 text-xs font-medium rounded-full">{link.category}</span>}
            </div>
          </div>

          {/* Desktop: Badges */}
          <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
            <span className={`px-2 py-0.5 text-xs font-medium rounded-full flex items-center gap-1 ${contentTypeInfo.color}`}>
              <contentTypeInfo.icon className="w-3 h-3" />{contentTypeInfo.label}
            </span>
            {link.category && <span className="px-2 py-0.5 bg-purple-50 text-purple-700 text-xs font-medium rounded-full">{link.category}</span>}
            {link.collectionId && (
              <span className="px-2 py-0.5 bg-green-50 text-green-700 text-xs font-medium rounded-full flex items-center gap-1">
                <Folder className="w-3 h-3" />{getCollectionName(link.collectionId)}
              </span>
            )}
          </div>

          {/* Date - hide on small screens */}
          <div className="hidden lg:flex items-center gap-1 text-xs text-gray-400 flex-shrink-0">
            <Clock className="w-3 h-3" />{formatDate(link.createdAt)}
          </div>

          {/* Expand/Collapse - larger touch target */}
          <button 
            className="flex-shrink-0 p-2 -m-1 rounded-lg hover:bg-gray-100 active:bg-gray-200 touch-manipulation"
            onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded) }}
          >
            {isExpanded ? <ChevronUp className="w-5 h-5 sm:w-4 sm:h-4 text-gray-500" /> : <ChevronDown className="w-5 h-5 sm:w-4 sm:h-4 text-gray-400" />}
          </button>
        </div>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="px-3 sm:px-4 pb-4 pt-0 border-t border-gray-100 animate-in slide-in-from-top-2 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="pt-4 space-y-4">
              {isEditing ? (
                /* ===== EDIT MODE ===== */
                <>
                  <div>
                    <label className="text-sm font-medium text-gray-600 mb-1.5 block">Title</label>
                    <input 
                      type="text" 
                      value={editTitle} 
                      onChange={(e) => setEditTitle(e.target.value)} 
                      className="w-full px-3 py-3 sm:py-2 text-base sm:text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-600 mb-1.5 block">Notes</label>
                    <textarea 
                      value={editDescription} 
                      onChange={(e) => setEditDescription(e.target.value)} 
                      rows={3} 
                      className="w-full px-3 py-3 sm:py-2 text-base sm:text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none" 
                      placeholder="Add notes..." 
                    />
                  </div>

                  {/* Stacked on mobile, side by side on desktop */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-3">
                    <div>
                      <label className="text-sm font-medium text-gray-600 mb-1.5 block">Category</label>
                      <input 
                        type="text" 
                        value={editCategory} 
                        onChange={(e) => setEditCategory(e.target.value)} 
                        className="w-full px-3 py-3 sm:py-2 text-base sm:text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                        placeholder="e.g. tools, research" 
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600 mb-1.5 block">Project</label>
                      <select 
                        value={editCollectionId} 
                        onChange={(e) => setEditCollectionId(e.target.value)} 
                        className="w-full px-3 py-3 sm:py-2 text-base sm:text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                      >
                        <option value="">None</option>
                        {collections.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-600 mb-1.5 block">Tags</label>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {currentTags.map((tag, i) => (
                        <span key={i} className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-full flex items-center gap-1.5">
                          {tag}
                          <button onClick={() => removeTag(tag)} className="p-0.5 hover:text-red-500 touch-manipulation"><X className="w-4 h-4" /></button>
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={newTag} 
                        onChange={(e) => setNewTag(e.target.value)} 
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }} 
                        className="flex-1 px-3 py-3 sm:py-2 text-base sm:text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                        placeholder="Add tag..." 
                      />
                      <button onClick={addTag} className="px-4 py-3 sm:py-2 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-700 rounded-lg touch-manipulation">
                        <Plus className="w-5 h-5 sm:w-4 sm:h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Action buttons - full width on mobile */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-2">
                    <button onClick={saveEdits} className="flex items-center justify-center gap-2 px-4 py-3 sm:py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-base sm:text-sm font-medium rounded-lg touch-manipulation">
                      <Save className="w-5 h-5 sm:w-4 sm:h-4" /> Save Changes
                    </button>
                    <button onClick={cancelEditing} className="flex items-center justify-center gap-2 px-4 py-3 sm:py-2 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-700 text-base sm:text-sm font-medium rounded-lg touch-manipulation">
                      <X className="w-5 h-5 sm:w-4 sm:h-4" /> Cancel
                    </button>
                  </div>
                </>
              ) : (
                /* ===== VIEW MODE ===== */
                <>
                  {link.description && (
                    <div className="p-3 sm:p-3 bg-amber-50 border border-amber-100 rounded-lg">
                      <div className="flex items-center gap-2 text-amber-700 text-sm font-medium mb-1"><StickyNote className="w-4 h-4" /> Notes</div>
                      <p className="text-base sm:text-sm text-gray-700 leading-relaxed">{link.description}</p>
                    </div>
                  )}

                  {/* URL with copy button */}
                  <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 truncate flex-1">{link.url}</p>
                    <button 
                      onClick={copyToClipboard} 
                      className={`p-2.5 sm:p-2 rounded-lg transition-colors touch-manipulation ${copied ? 'bg-green-100 text-green-600' : 'bg-white hover:bg-gray-100 active:bg-gray-200 text-gray-500 border border-gray-200'}`}
                    >
                      <Copy className="w-5 h-5 sm:w-4 sm:h-4" />
                    </button>
                    {copied && <span className="text-sm text-green-600 font-medium">Copied!</span>}
                  </div>

                  {/* Metadata badges */}
                  <div className="flex flex-wrap gap-2">
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm ${contentTypeInfo.color}`}>
                      <contentTypeInfo.icon className="w-4 h-4" />{contentTypeInfo.label}
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 rounded-full text-sm text-gray-600">
                      <Clock className="w-4 h-4" />{formatFullDate(link.createdAt)}
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 rounded-full text-sm text-blue-600">
                      <MousePointer className="w-4 h-4" />{link.clickCount || 0} clicks
                    </div>
                    {link.collectionId && (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 rounded-full text-sm text-green-700">
                        <Folder className="w-4 h-4" />{getCollectionName(link.collectionId)}
                      </div>
                    )}
                  </div>

                  {/* Tags */}
                  {link.tags && link.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {link.tags.map((tag, i) => (
                        <span key={i} className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full flex items-center gap-1.5">
                          <Tag className="w-3.5 h-3.5" />{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Action buttons - larger on mobile */}
                  <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 pt-2">
                    <a 
                      href={link.url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="flex items-center justify-center gap-2 px-4 py-3 sm:py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-base sm:text-sm font-medium rounded-lg col-span-2 touch-manipulation"
                    >
                      <ExternalLink className="w-5 h-5 sm:w-4 sm:h-4" /> Open Link
                    </a>
                    <button 
                      onClick={() => handleAction('toggleFavorite')} 
                      className={`flex items-center justify-center gap-2 p-3 sm:p-2 rounded-lg transition-colors touch-manipulation ${link.isFavorite ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 active:bg-gray-300'}`}
                    >
                      <Star className={`w-5 h-5 sm:w-4 sm:h-4 ${link.isFavorite ? 'fill-current' : ''}`} />
                      <span className="sm:hidden">{link.isFavorite ? 'Favorited' : 'Favorite'}</span>
                    </button>
                    <button 
                      onClick={() => handleAction('toggleArchive')} 
                      className={`flex items-center justify-center gap-2 p-3 sm:p-2 rounded-lg transition-colors touch-manipulation ${link.isArchived ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 active:bg-gray-300'}`}
                    >
                      <Archive className="w-5 h-5 sm:w-4 sm:h-4" />
                      <span className="sm:hidden">{link.isArchived ? 'Archived' : 'Archive'}</span>
                    </button>
                    <button 
                      onClick={startEditing} 
                      className="flex items-center justify-center gap-2 px-4 py-3 sm:py-2 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-700 text-base sm:text-sm font-medium rounded-lg touch-manipulation"
                    >
                      <Edit className="w-5 h-5 sm:w-4 sm:h-4" /> Edit
                    </button>
                    <button 
                      onClick={() => handleAction('delete')} 
                      className="flex items-center justify-center gap-2 p-3 sm:p-2 bg-gray-100 hover:bg-red-50 active:bg-red-100 text-gray-600 hover:text-red-600 rounded-lg touch-manipulation"
                    >
                      <Trash2 className="w-5 h-5 sm:w-4 sm:h-4" />
                      <span className="sm:hidden">Delete</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }

  // ============ GRID VIEW ============
  return (
    <div 
      className={`group bg-white rounded-xl border transition-all duration-200 cursor-pointer relative overflow-hidden touch-manipulation ${
        isSelected ? 'ring-2 ring-blue-500 border-blue-300 bg-blue-50/30' : 'border-gray-200 hover:shadow-lg hover:border-blue-200 active:bg-gray-50'
      } ${!isExpanded ? 'hover:-translate-y-0.5' : ''}`}
      role="article"
      onClick={handleCardClick}
    >
      <div>
        {link.thumbnail && (
          <div className="aspect-video w-full overflow-hidden bg-gray-100">
            <img src={link.thumbnail} alt="" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
          </div>
        )}

        <div className="p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-2 min-w-0">
              {link.favicon ? (
                <img src={link.favicon} alt="" className="w-6 h-6 sm:w-5 sm:h-5 rounded flex-shrink-0" />
              ) : (
                <div className="w-6 h-6 sm:w-5 sm:h-5 rounded bg-gray-200 flex items-center justify-center flex-shrink-0">
                  <Globe className="w-4 h-4 sm:w-3 sm:h-3 text-gray-400" />
                </div>
              )}
              <span className="text-sm sm:text-xs text-gray-500 truncate">{getDomain(link.url)}</span>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <label className={`p-1 cursor-pointer transition-opacity touch-manipulation ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                <input 
                  type="checkbox" 
                  checked={isSelected} 
                  onChange={onSelect} 
                  className="w-5 h-5 sm:w-4 sm:h-4 rounded border-gray-300 text-blue-600 cursor-pointer" 
                  onClick={(e) => e.stopPropagation()} 
                />
              </label>
              <button 
                className="p-1.5 rounded hover:bg-gray-100 active:bg-gray-200 touch-manipulation"
                onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded) }}
              >
                {isExpanded ? <ChevronUp className="w-5 h-5 sm:w-4 sm:h-4 text-gray-500" /> : <ChevronDown className="w-5 h-5 sm:w-4 sm:h-4 text-gray-400" />}
              </button>
            </div>
          </div>

          {/* Title is the clickable link */}
          <h3 
            data-link-title
            onClick={handleTitleClick}
            className="font-semibold text-blue-600 hover:text-blue-800 active:text-blue-900 hover:underline text-base sm:text-sm line-clamp-2 mb-2 leading-snug cursor-pointer touch-manipulation"
            title="Click to open link"
          >
            {link.title}
          </h3>

          {link.description && !isExpanded && (
            <div className="mb-3 p-2.5 sm:p-2 bg-amber-50/70 border border-amber-100 rounded-lg">
              <div className="flex items-start gap-2">
                <StickyNote className="w-4 h-4 sm:w-3 sm:h-3 text-amber-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm sm:text-xs text-amber-800 line-clamp-2">{link.description}</p>
              </div>
            </div>
          )}

          {!isExpanded && (
            <>
              <div className="flex flex-wrap gap-1.5 mb-3">
                <span className={`px-2.5 py-1 sm:px-2 sm:py-0.5 text-sm sm:text-xs font-medium rounded-full flex items-center gap-1 ${contentTypeInfo.color}`}>
                  <contentTypeInfo.icon className="w-3.5 h-3.5 sm:w-3 sm:h-3" />{contentTypeInfo.label}
                </span>
                {link.category && (
                  <span className="px-2.5 py-1 sm:px-2 sm:py-0.5 bg-purple-50 text-purple-700 text-sm sm:text-xs font-medium rounded-full">
                    {link.category}
                  </span>
                )}
                {link.collectionId && (
                  <span className="px-2.5 py-1 sm:px-2 sm:py-0.5 bg-green-50 text-green-700 text-sm sm:text-xs font-medium rounded-full flex items-center gap-1">
                    <Folder className="w-3.5 h-3.5 sm:w-3 sm:h-3" />{getCollectionName(link.collectionId)}
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <div className="flex items-center gap-2 text-sm sm:text-xs text-gray-400">
                  <span>{formatDate(link.createdAt)}</span>
                  {link.isFavorite && <Star className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-amber-400 fill-current" />}
                  {link.isArchived && <Archive className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-gray-400" />}
                </div>
                <div className="text-sm sm:text-xs text-blue-500 font-medium">Tap for details →</div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-gray-100 animate-in slide-in-from-top-2 duration-200" onClick={(e) => e.stopPropagation()}>
          <div className="pt-4 space-y-4">
            {isEditing ? (
              /* ===== EDIT MODE ===== */
              <>
                <div>
                  <label className="text-sm font-medium text-gray-600 mb-1.5 block">Title</label>
                  <input 
                    type="text" 
                    value={editTitle} 
                    onChange={(e) => setEditTitle(e.target.value)} 
                    className="w-full px-3 py-3 sm:py-2 text-base sm:text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500" 
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600 mb-1.5 block">Notes</label>
                  <textarea 
                    value={editDescription} 
                    onChange={(e) => setEditDescription(e.target.value)} 
                    rows={3} 
                    className="w-full px-3 py-3 sm:py-2 text-base sm:text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none" 
                    placeholder="Add notes..." 
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-3">
                  <div>
                    <label className="text-sm font-medium text-gray-600 mb-1.5 block">Category</label>
                    <input 
                      type="text" 
                      value={editCategory} 
                      onChange={(e) => setEditCategory(e.target.value)} 
                      className="w-full px-3 py-3 sm:py-2 text-base sm:text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500" 
                      placeholder="e.g. tools" 
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600 mb-1.5 block">Project</label>
                    <select 
                      value={editCollectionId} 
                      onChange={(e) => setEditCollectionId(e.target.value)} 
                      className="w-full px-3 py-3 sm:py-2 text-base sm:text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      <option value="">None</option>
                      {collections.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600 mb-1.5 block">Tags</label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {currentTags.map((tag, i) => (
                      <span key={i} className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-full flex items-center gap-1.5">
                        {tag}
                        <button onClick={() => removeTag(tag)} className="p-0.5 hover:text-red-500 touch-manipulation"><X className="w-4 h-4" /></button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={newTag} 
                      onChange={(e) => setNewTag(e.target.value)} 
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }} 
                      className="flex-1 px-3 py-3 sm:py-2 text-base sm:text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500" 
                      placeholder="Add tag..." 
                    />
                    <button onClick={addTag} className="px-4 py-3 sm:py-2 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-700 rounded-lg touch-manipulation">
                      <Plus className="w-5 h-5 sm:w-4 sm:h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-2">
                  <button onClick={saveEdits} className="flex items-center justify-center gap-2 px-4 py-3 sm:py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-base sm:text-sm font-medium rounded-lg touch-manipulation">
                    <Save className="w-5 h-5 sm:w-4 sm:h-4" /> Save Changes
                  </button>
                  <button onClick={cancelEditing} className="flex items-center justify-center gap-2 px-4 py-3 sm:py-2 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-700 text-base sm:text-sm font-medium rounded-lg touch-manipulation">
                    <X className="w-5 h-5 sm:w-4 sm:h-4" /> Cancel
                  </button>
                </div>
              </>
            ) : (
              /* ===== VIEW MODE ===== */
              <>
                {link.description && (
                  <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg">
                    <div className="flex items-center gap-2 text-amber-700 text-sm font-medium mb-1"><StickyNote className="w-4 h-4" /> Notes</div>
                    <p className="text-base sm:text-sm text-gray-700 leading-relaxed">{link.description}</p>
                  </div>
                )}

                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 truncate flex-1">{link.url}</p>
                  <button 
                    onClick={copyToClipboard} 
                    className={`p-2.5 sm:p-2 rounded-lg transition-colors touch-manipulation ${copied ? 'bg-green-100 text-green-600' : 'bg-white hover:bg-gray-100 active:bg-gray-200 text-gray-500 border border-gray-200'}`}
                  >
                    <Copy className="w-5 h-5 sm:w-4 sm:h-4" />
                  </button>
                  {copied && <span className="text-sm text-green-600 font-medium">Copied!</span>}
                </div>

                {/* Metadata grid - single column on mobile */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-2">
                  <div className={`p-3 rounded-lg ${contentTypeInfo.color.replace('text-', 'bg-').split(' ')[0]}`}>
                    <div className={`font-medium mb-0.5 flex items-center gap-1.5 text-sm ${contentTypeInfo.color.split(' ')[1]}`}>
                      <contentTypeInfo.icon className="w-4 h-4" /> Type
                    </div>
                    <div className={`text-base sm:text-sm ${contentTypeInfo.color.split(' ')[1]}`}>{contentTypeInfo.label}</div>
                  </div>
                  {link.category && (
                    <div className="p-3 bg-purple-50 rounded-lg">
                      <div className="text-purple-600 font-medium mb-0.5 text-sm">Category</div>
                      <div className="text-purple-800 text-base sm:text-sm">{link.category}</div>
                    </div>
                  )}
                  {link.collectionId && (
                    <div className="p-3 bg-green-50 rounded-lg">
                      <div className="text-green-600 font-medium mb-0.5 flex items-center gap-1.5 text-sm"><Folder className="w-4 h-4" /> Project</div>
                      <div className="text-green-800 text-base sm:text-sm">{getCollectionName(link.collectionId)}</div>
                    </div>
                  )}
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="text-gray-500 font-medium mb-0.5 flex items-center gap-1.5 text-sm"><Clock className="w-4 h-4" /> Added</div>
                    <div className="text-gray-700 text-base sm:text-sm">{formatFullDate(link.createdAt)}</div>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="text-blue-600 font-medium mb-0.5 flex items-center gap-1.5 text-sm"><MousePointer className="w-4 h-4" /> Clicks</div>
                    <div className="text-blue-800 text-base sm:text-sm">{link.clickCount || 0}</div>
                  </div>
                </div>

                {link.tags && link.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {link.tags.map((tag, i) => (
                      <span key={i} className="px-3 py-1.5 bg-gray-100 text-gray-600 text-sm rounded-full flex items-center gap-1.5">
                        <Tag className="w-4 h-4" />{tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Action buttons - stacked on mobile */}
                <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 pt-2">
                  <a 
                    href={link.url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="flex items-center justify-center gap-2 px-4 py-3 sm:py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-base sm:text-sm font-medium rounded-lg col-span-2 touch-manipulation"
                  >
                    <ExternalLink className="w-5 h-5 sm:w-4 sm:h-4" /> Open Link
                  </a>
                  <button 
                    onClick={() => handleAction('toggleFavorite')} 
                    className={`flex items-center justify-center gap-2 p-3 sm:p-2 rounded-lg transition-colors touch-manipulation ${link.isFavorite ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 active:bg-gray-300'}`}
                  >
                    <Star className={`w-5 h-5 sm:w-4 sm:h-4 ${link.isFavorite ? 'fill-current' : ''}`} />
                    <span className="sm:hidden">{link.isFavorite ? 'Favorited' : 'Favorite'}</span>
                  </button>
                  <button 
                    onClick={() => handleAction('toggleArchive')} 
                    className={`flex items-center justify-center gap-2 p-3 sm:p-2 rounded-lg transition-colors touch-manipulation ${link.isArchived ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 active:bg-gray-300'}`}
                  >
                    <Archive className="w-5 h-5 sm:w-4 sm:h-4" />
                    <span className="sm:hidden">{link.isArchived ? 'Archived' : 'Archive'}</span>
                  </button>
                  <button 
                    onClick={startEditing} 
                    className="flex items-center justify-center gap-2 px-4 py-3 sm:py-2 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-700 text-base sm:text-sm font-medium rounded-lg touch-manipulation"
                  >
                    <Edit className="w-5 h-5 sm:w-4 sm:h-4" /> Edit
                  </button>
                  <button 
                    onClick={() => handleAction('delete')} 
                    className="flex items-center justify-center gap-2 p-3 sm:p-2 bg-gray-100 hover:bg-red-50 active:bg-red-100 text-gray-600 hover:text-red-600 rounded-lg touch-manipulation"
                  >
                    <Trash2 className="w-5 h-5 sm:w-4 sm:h-4" />
                    <span className="sm:hidden">Delete</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export const LinkCard = memo(LinkCardComponent)

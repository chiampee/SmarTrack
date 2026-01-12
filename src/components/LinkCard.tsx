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
  GripVertical,
  Clock,
  Globe,
  StickyNote,
  ChevronDown,
  ChevronUp,
  MousePointer,
  Save,
  X,
  Plus
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
  dragHandleProps?: any
}

const LinkCardComponent: React.FC<LinkCardProps> = ({ 
  link, 
  viewMode, 
  isSelected, 
  onSelect, 
  onAction,
  collections = [],
  onCardClick,
  dragHandleProps
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
      target.closest('[data-drag-handle]') ||
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

  const currentTags = editTags.split(',').map(t => t.trim()).filter(t => t)

  // ============ LIST VIEW ============
  if (viewMode === 'list') {
    return (
      <div 
        className={`group bg-white rounded-xl border transition-all duration-200 cursor-pointer relative ${
          isSelected ? 'ring-2 ring-blue-500 border-blue-300 bg-blue-50/30' : 'border-gray-200 hover:shadow-md hover:border-blue-200'
        }`}
        role="article"
        onClick={handleCardClick}
      >
        {/* Main Row */}
        <div className="flex items-center gap-3 p-4">
          <div className="flex items-center gap-2 flex-shrink-0">
            {dragHandleProps && (
              <div {...dragHandleProps} data-drag-handle className="cursor-grab active:cursor-grabbing p-1 text-gray-300 hover:text-gray-500 hover:bg-gray-100 rounded transition-colors opacity-0 group-hover:opacity-100">
                <GripVertical className="w-4 h-4" />
              </div>
            )}
            <input type="checkbox" checked={isSelected} onChange={onSelect} className="w-4 h-4 rounded border-gray-300 text-blue-600 cursor-pointer" onClick={(e) => e.stopPropagation()} />
          </div>

          <div className="flex-shrink-0">
            {link.favicon ? (
              <img src={link.favicon} alt="" className="w-8 h-8 rounded-lg object-cover bg-gray-100" />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                <Globe className="w-4 h-4 text-gray-400" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              {/* Title is the clickable link */}
              <h3 
                data-link-title
                onClick={handleTitleClick}
                className="font-medium text-blue-600 hover:text-blue-800 hover:underline truncate text-sm cursor-pointer"
                title="Click to open link"
              >
                {link.title}
              </h3>
              {link.description && <span title="Has notes"><StickyNote className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" /></span>}
              {link.isFavorite && <Star className="w-3.5 h-3.5 text-amber-400 fill-current flex-shrink-0" />}
              {link.isArchived && <Archive className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />}
            </div>
            <p className="text-xs text-gray-500 truncate mt-0.5">{getDomain(link.url)}</p>
          </div>

          <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
            {link.category && <span className="px-2 py-0.5 bg-purple-50 text-purple-700 text-xs font-medium rounded-full">{link.category}</span>}
            {link.collectionId && (
              <span className="px-2 py-0.5 bg-green-50 text-green-700 text-xs font-medium rounded-full flex items-center gap-1">
                <Folder className="w-3 h-3" />{getCollectionName(link.collectionId)}
              </span>
            )}
          </div>

          <div className="hidden md:flex items-center gap-1 text-xs text-gray-400 flex-shrink-0">
            <Clock className="w-3 h-3" />{formatDate(link.createdAt)}
          </div>

          <div className="flex-shrink-0 p-1">
            {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
          </div>
        </div>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="px-4 pb-4 pt-0 border-t border-gray-100 animate-in slide-in-from-top-2 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="pt-4 space-y-3">
              {isEditing ? (
                /* ===== EDIT MODE ===== */
                <>
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">Title</label>
                    <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">Notes</label>
                    <textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} rows={3} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none" placeholder="Add notes..." />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-gray-600 mb-1 block">Category</label>
                      <input type="text" value={editCategory} onChange={(e) => setEditCategory(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="e.g. tools, research" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600 mb-1 block">Project</label>
                      <select value={editCollectionId} onChange={(e) => setEditCollectionId(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white">
                        <option value="">None</option>
                        {collections.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">Tags</label>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {currentTags.map((tag, i) => (
                        <span key={i} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full flex items-center gap-1">
                          {tag}
                          <button onClick={() => removeTag(tag)} className="hover:text-red-500"><X className="w-3 h-3" /></button>
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input type="text" value={newTag} onChange={(e) => setNewTag(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }} className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Add tag..." />
                      <button onClick={addTag} className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-lg"><Plus className="w-4 h-4" /></button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <button onClick={saveEdits} className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg"><Save className="w-4 h-4" /> Save</button>
                    <button onClick={cancelEditing} className="flex items-center gap-1.5 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg"><X className="w-4 h-4" /> Cancel</button>
                  </div>
                </>
              ) : (
                /* ===== VIEW MODE ===== */
                <>
                  {link.description && (
                    <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg">
                      <div className="flex items-center gap-2 text-amber-700 text-xs font-medium mb-1"><StickyNote className="w-3.5 h-3.5" /> Notes</div>
                      <p className="text-sm text-gray-700 leading-relaxed">{link.description}</p>
                    </div>
                  )}

                  <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-600 truncate flex-1">{link.url}</p>
                    <button onClick={copyToClipboard} className={`p-1.5 rounded transition-colors ${copied ? 'bg-green-100 text-green-600' : 'hover:bg-gray-200 text-gray-500'}`}><Copy className="w-3.5 h-3.5" /></button>
                    {copied && <span className="text-xs text-green-600">Copied!</span>}
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs">
                    <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full text-gray-600"><Clock className="w-3 h-3" />{formatFullDate(link.createdAt)}</div>
                    <div className="flex items-center gap-1 px-2 py-1 bg-blue-50 rounded-full text-blue-600"><MousePointer className="w-3 h-3" />{link.clickCount || 0} clicks</div>
                  </div>

                  {link.tags && link.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {link.tags.map((tag, i) => <span key={i} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full flex items-center gap-1"><Tag className="w-3 h-3" />{tag}</span>)}
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-2 flex-wrap">
                    <a href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg"><ExternalLink className="w-3.5 h-3.5" /> Open</a>
                    <button onClick={() => handleAction('toggleFavorite')} className={`p-1.5 rounded-lg transition-colors ${link.isFavorite ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}><Star className={`w-4 h-4 ${link.isFavorite ? 'fill-current' : ''}`} /></button>
                    <button onClick={() => handleAction('toggleArchive')} className={`p-1.5 rounded-lg transition-colors ${link.isArchived ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}><Archive className="w-4 h-4" /></button>
                    <div className="flex-1" />
                    <button onClick={startEditing} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg"><Edit className="w-3.5 h-3.5" /> Edit</button>
                    <button onClick={() => onCardClick?.()} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg" title="Open full edit modal"><Edit className="w-3.5 h-3.5" /> Full</button>
                    <button onClick={() => handleAction('delete')} className="p-1.5 bg-gray-100 hover:bg-red-50 text-gray-600 hover:text-red-600 rounded-lg"><Trash2 className="w-4 h-4" /></button>
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
      className={`group bg-white rounded-xl border transition-all duration-200 cursor-pointer relative overflow-hidden ${
        isSelected ? 'ring-2 ring-blue-500 border-blue-300 bg-blue-50/30' : 'border-gray-200 hover:shadow-lg hover:border-blue-200'
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
              {link.favicon ? <img src={link.favicon} alt="" className="w-5 h-5 rounded flex-shrink-0" /> : <div className="w-5 h-5 rounded bg-gray-200 flex items-center justify-center flex-shrink-0"><Globe className="w-3 h-3 text-gray-400" /></div>}
              <span className="text-xs text-gray-500 truncate">{getDomain(link.url)}</span>
            </div>
            <div className="flex items-center gap-0.5 flex-shrink-0">
              {dragHandleProps && <div {...dragHandleProps} data-drag-handle className="p-1 text-gray-300 hover:text-gray-500 hover:bg-gray-100 rounded cursor-grab opacity-0 group-hover:opacity-100"><GripVertical className="w-3.5 h-3.5" /></div>}
              <div className={`transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                <input type="checkbox" checked={isSelected} onChange={onSelect} className="w-4 h-4 rounded border-gray-300 text-blue-600 cursor-pointer" onClick={(e) => e.stopPropagation()} />
              </div>
              <div className="p-1">
                {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
              </div>
            </div>
          </div>

          {/* Title is the clickable link */}
          <h3 
            data-link-title
            onClick={handleTitleClick}
            className="font-semibold text-blue-600 hover:text-blue-800 hover:underline text-sm line-clamp-2 mb-1 leading-snug cursor-pointer"
            title="Click to open link"
          >
            {link.title}
          </h3>

          {link.description && !isExpanded && (
            <div className="mb-3 p-2 bg-amber-50/70 border border-amber-100 rounded-lg">
              <div className="flex items-start gap-1.5">
                <StickyNote className="w-3 h-3 text-amber-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-amber-800 line-clamp-1">{link.description}</p>
              </div>
            </div>
          )}

          {!isExpanded && (
            <>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {link.category && <span className="px-2 py-0.5 bg-purple-50 text-purple-700 text-xs font-medium rounded-full">{link.category}</span>}
                {link.collectionId && <span className="px-2 py-0.5 bg-green-50 text-green-700 text-xs font-medium rounded-full flex items-center gap-1"><Folder className="w-3 h-3" />{getCollectionName(link.collectionId)}</span>}
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <span>{formatDate(link.createdAt)}</span>
                  {link.isFavorite && <Star className="w-3.5 h-3.5 text-amber-400 fill-current" />}
                  {link.isArchived && <Archive className="w-3.5 h-3.5 text-gray-400" />}
                </div>
                <div className="text-xs text-gray-400">Click card for details</div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-gray-100 animate-in slide-in-from-top-2 duration-200" onClick={(e) => e.stopPropagation()}>
          <div className="pt-4 space-y-3">
            {isEditing ? (
              /* ===== EDIT MODE ===== */
              <>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Title</label>
                  <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Notes</label>
                  <textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} rows={3} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none" placeholder="Add notes..." />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">Category</label>
                    <input type="text" value={editCategory} onChange={(e) => setEditCategory(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="e.g. tools" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">Project</label>
                    <select value={editCollectionId} onChange={(e) => setEditCollectionId(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white">
                      <option value="">None</option>
                      {collections.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Tags</label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {currentTags.map((tag, i) => (
                      <span key={i} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full flex items-center gap-1">
                        {tag}
                        <button onClick={() => removeTag(tag)} className="hover:text-red-500"><X className="w-3 h-3" /></button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input type="text" value={newTag} onChange={(e) => setNewTag(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }} className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Add tag..." />
                    <button onClick={addTag} className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-lg"><Plus className="w-4 h-4" /></button>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button onClick={saveEdits} className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg"><Save className="w-4 h-4" /> Save</button>
                  <button onClick={cancelEditing} className="flex items-center gap-1.5 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg"><X className="w-4 h-4" /> Cancel</button>
                </div>
              </>
            ) : (
              /* ===== VIEW MODE ===== */
              <>
                {link.description && (
                  <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg">
                    <div className="flex items-center gap-2 text-amber-700 text-xs font-medium mb-1"><StickyNote className="w-3.5 h-3.5" /> Notes</div>
                    <p className="text-sm text-gray-700 leading-relaxed">{link.description}</p>
                  </div>
                )}

                <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-600 truncate flex-1">{link.url}</p>
                  <button onClick={copyToClipboard} className={`p-1.5 rounded transition-colors ${copied ? 'bg-green-100 text-green-600' : 'hover:bg-gray-200 text-gray-500'}`}><Copy className="w-3.5 h-3.5" /></button>
                  {copied && <span className="text-xs text-green-600">Copied!</span>}
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  {link.category && <div className="p-2 bg-purple-50 rounded-lg"><div className="text-purple-600 font-medium mb-0.5">Category</div><div className="text-purple-800">{link.category}</div></div>}
                  {link.collectionId && <div className="p-2 bg-green-50 rounded-lg"><div className="text-green-600 font-medium mb-0.5 flex items-center gap-1"><Folder className="w-3 h-3" /> Project</div><div className="text-green-800">{getCollectionName(link.collectionId)}</div></div>}
                  <div className="p-2 bg-gray-50 rounded-lg"><div className="text-gray-500 font-medium mb-0.5 flex items-center gap-1"><Clock className="w-3 h-3" /> Added</div><div className="text-gray-700">{formatFullDate(link.createdAt)}</div></div>
                  <div className="p-2 bg-blue-50 rounded-lg"><div className="text-blue-600 font-medium mb-0.5 flex items-center gap-1"><MousePointer className="w-3 h-3" /> Clicks</div><div className="text-blue-800">{link.clickCount || 0}</div></div>
                </div>

                {link.tags && link.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {link.tags.map((tag, i) => <span key={i} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full flex items-center gap-1"><Tag className="w-3 h-3" />{tag}</span>)}
                  </div>
                )}

                <div className="flex items-center gap-2 pt-2 flex-wrap">
                  <a href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg"><ExternalLink className="w-3.5 h-3.5" /> Open</a>
                  <button onClick={() => handleAction('toggleFavorite')} className={`p-1.5 rounded-lg transition-colors ${link.isFavorite ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}><Star className={`w-4 h-4 ${link.isFavorite ? 'fill-current' : ''}`} /></button>
                  <button onClick={() => handleAction('toggleArchive')} className={`p-1.5 rounded-lg transition-colors ${link.isArchived ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}><Archive className="w-4 h-4" /></button>
                  <div className="flex-1" />
                  <button onClick={startEditing} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg"><Edit className="w-3.5 h-3.5" /> Edit</button>
                  <button onClick={() => onCardClick?.()} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg" title="Open full edit modal"><Edit className="w-3.5 h-3.5" /> Full</button>
                  <button onClick={() => handleAction('delete')} className="p-1.5 bg-gray-100 hover:bg-red-50 text-gray-600 hover:text-red-600 rounded-lg"><Trash2 className="w-4 h-4" /></button>
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

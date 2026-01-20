import React, { useState, memo, useEffect, useRef } from 'react'
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
import { Link, Collection, Category } from '../types/Link'

interface LinkCardProps {
  link: Link
  viewMode: 'grid' | 'list'
  isSelected: boolean
  onSelect: (e?: React.MouseEvent) => void
  onAction: (linkId: string, action: string, data?: any) => void
  collections?: Collection[]
  categories?: Category[]
  allTags?: string[] // All existing tags from all links for suggestions
  onCardClick?: () => void
}

const LinkCardComponent: React.FC<LinkCardProps> = ({ 
  link, 
  viewMode, 
  isSelected, 
  onSelect, 
  onAction,
  collections = [],
  categories = [],
  allTags = [],
  onCardClick
}) => {
  // #region agent log
  React.useEffect(() => {
    console.log('[ClickTrack] LinkCard rendered:', {linkId:link.id,title:link.title,clickCount:link.clickCount});
  }, [link.id]);
  // #endregion
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
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [showTagSuggestions, setShowTagSuggestions] = useState(false)
  const tagInputRef = useRef<HTMLInputElement>(null)
  const tagSuggestionsRef = useRef<HTMLDivElement>(null)

  const handleAction = (action: string, data?: any) => {
    onAction(link.id, action, data)
  }

  const startEditing = () => {
    setEditTitle(link.title)
    setEditDescription(link.description || '')
    setEditCategory(link.category || '')
    setEditTags(link.tags?.join(', ') || '')
    setEditCollectionId(link.collectionId || '')
    setShowNewCategoryInput(false)
    setNewCategoryName('')
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

  // Get current tags array
  const currentTags = editTags.split(',').map(t => t.trim()).filter(t => t)
  
  // Filter tag suggestions based on input and exclude already added tags
  const tagSuggestions = newTag.trim()
    ? allTags
        .filter(tag => 
          tag.toLowerCase().includes(newTag.toLowerCase()) && 
          !currentTags.includes(tag)
        )
        .slice(0, 8)
    : allTags
        .filter(tag => !currentTags.includes(tag))
        .slice(0, 8)

  const addTag = (tagToAdd?: string) => {
    const tag = tagToAdd || newTag.trim()
    if (tag && !currentTags.includes(tag)) {
      setEditTags([...currentTags, tag].join(', '))
      setNewTag('')
      setShowTagSuggestions(false)
    }
  }

  const removeTag = (tagToRemove: string) => {
    const updatedTags = currentTags.filter(t => t !== tagToRemove)
    setEditTags(updatedTags.join(', '))
  }
  
  // Close tag suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        tagInputRef.current &&
        !tagInputRef.current.contains(event.target as Node) &&
        tagSuggestionsRef.current &&
        !tagSuggestionsRef.current.contains(event.target as Node)
      ) {
        setShowTagSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

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

  // Local state for optimistic click count update
  const [localClickCount, setLocalClickCount] = useState(link.clickCount || 0)

  // Update local click count when link prop changes (but only if it's higher, to preserve optimistic updates)
  React.useEffect(() => {
    const propCount = link.clickCount || 0
    setLocalClickCount(prev => {
      // Only update if prop value is higher (server confirmed update) or if we're initializing
      // This prevents resetting optimistic updates
      if (propCount > prev || prev === 0) {
        return propCount
      }
      return prev
    })
  }, [link.clickCount])

  // Open link when clicking on title
  const handleLinkClick = async (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault() // Prevent any default link behavior
    
    // Optimistically update UI
    setLocalClickCount(prev => prev + 1)
    
    // Track click using navigator.sendBeacon for reliable tracking
    // sendBeacon ensures the request is sent even if the tab closes/navigates immediately
    // Note: sendBeacon doesn't support custom headers, so we pass the token via FormData
    const authToken = localStorage.getItem('authToken')
    
    if (!authToken) {
      setLocalClickCount(prev => Math.max(0, prev - 1))
      window.open(link.url, '_blank', 'noopener,noreferrer')
      return
    }
    
    const apiBaseUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'
    const url = `${apiBaseUrl}/api/links/${link.id}/track-click`
    
    // Use sendBeacon with FormData to pass the auth token
    // sendBeacon is specifically designed for analytics/tracking that must complete even if page unloads
    const formData = new FormData()
    formData.append('token', authToken)
    
    try {
      // sendBeacon returns true if the request was queued successfully
      const beaconSent = navigator.sendBeacon(url, formData)
      
      if (!beaconSent) {
        // If sendBeacon fails (e.g., payload too large), fall back to fetch with keepalive
        console.warn('[ClickTrack] sendBeacon failed, falling back to fetch with keepalive')
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({}),
          keepalive: true,
        })
        
        if (response.ok) {
          const json = await response.json()
          const serverClickCount = typeof json.clickCount === 'number' ? json.clickCount : (link.clickCount ?? 0) + 1
          setLocalClickCount(serverClickCount)
          onAction(link.id, 'click', { clickCount: serverClickCount })
        } else {
          console.error('Failed to track click:', response.status, response.statusText)
          setLocalClickCount(prev => Math.max(0, prev - 1))
        }
      } else {
        // sendBeacon was queued successfully - the request will complete in the background
        // Since sendBeacon doesn't provide a response, we keep the optimistic update
        // The server will process the click asynchronously
        // Note: We can't get the updated clickCount from sendBeacon, so we rely on the
        // optimistic update and the next page load will show the correct count
      }
    } catch (error) {
      // Revert optimistic update on error
      console.error('Failed to track click:', error)
      setLocalClickCount(prev => Math.max(0, prev - 1))
    }
    
    // Open link
    window.open(link.url, '_blank', 'noopener,noreferrer')
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
            <label 
              className="p-2 -m-2 cursor-pointer touch-manipulation"
              onClick={(e) => {
                // Only handle if clicking directly on label (not checkbox)
                if (e.target === e.currentTarget || (e.target as HTMLElement).tagName !== 'INPUT') {
                  e.stopPropagation()
                  onSelect(e)
                }
              }}
            >
              <input 
                type="checkbox" 
                checked={isSelected} 
                readOnly
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  onSelect(e)
                }} 
                className="w-5 h-5 sm:w-4 sm:h-4 rounded border-gray-300 text-blue-600 cursor-pointer" 
              />
            </label>
          </div>

          {/* Favicon */}
          <div className="flex-shrink-0">
            {link.favicon && link.favicon.startsWith('http') ? (
              <img 
                src={link.favicon} 
                alt="" 
                className="w-10 h-10 sm:w-8 sm:h-8 rounded-lg object-cover bg-gray-100"
                referrerPolicy="no-referrer-when-downgrade"
                crossOrigin="anonymous"
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
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
                onClick={(e) => {
                  console.log('[ClickTrack] ⚡⚡⚡ TITLE CLICKED (LIST VIEW) ⚡⚡⚡');
                  alert('Click handler fired! Check console for [ClickTrack] logs.');
                  handleLinkClick(e);
                }}
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
                  {/* Form Header */}
                  <div className="pb-3 border-b border-gray-200">
                    <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                      <Edit className="w-4 h-4 text-blue-600" />
                      Edit Link
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">Update the link details below</p>
                  </div>

                  {/* Basic Information Section */}
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-semibold text-gray-700 mb-2 block flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-gray-500" />
                        Title
                        <span className="text-red-500">*</span>
                      </label>
                      <input 
                        type="text" 
                        value={editTitle} 
                        onChange={(e) => setEditTitle(e.target.value)} 
                        className="w-full px-4 py-3 text-base border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all" 
                        placeholder="Enter link title"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-semibold text-gray-700 mb-2 block flex items-center gap-1.5">
                        <StickyNote className="w-4 h-4 text-gray-500" />
                        Notes
                      </label>
                      <textarea 
                        value={editDescription} 
                        onChange={(e) => setEditDescription(e.target.value)} 
                        rows={4} 
                        className="w-full px-4 py-3 text-base border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none transition-all" 
                        placeholder="Add your thoughts, key takeaways, or summary..."
                      />
                      <p className="text-xs text-gray-500 mt-1.5">Optional: Add notes to help you remember why you saved this link</p>
                    </div>
                  </div>

                  {/* Organization Section */}
                  <div className="pt-2 border-t border-gray-100">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-1.5">
                      <Folder className="w-4 h-4 text-gray-500" />
                      Organization
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block flex items-center gap-1.5">
                          <Globe className="w-3.5 h-3.5 text-gray-500" />
                          Category
                        </label>
                      {!showNewCategoryInput ? (
                        <div className="space-y-2">
                          <select 
                            value={editCategory} 
                            onChange={(e) => {
                              if (e.target.value === '__add_new__') {
                                setShowNewCategoryInput(true)
                                setNewCategoryName('')
                              } else {
                                setEditCategory(e.target.value)
                              }
                            }} 
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all touch-manipulation"
                          >
                            <option value="">None</option>
                            {categories.map(cat => (
                              <option key={cat.id || cat.name} value={cat.name}>
                                {cat.name}
                              </option>
                            ))}
                            <option value="__add_new__">+ Add new category</option>
                          </select>
                        </div>
                      ) : (
                        <div className="flex flex-col sm:flex-row gap-2">
                          <input 
                            type="text" 
                            value={newCategoryName} 
                            onChange={(e) => setNewCategoryName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                if (newCategoryName.trim()) {
                                  setEditCategory(newCategoryName.trim())
                                  setShowNewCategoryInput(false)
                                  setNewCategoryName('')
                                }
                              } else if (e.key === 'Escape') {
                                setShowNewCategoryInput(false)
                                setNewCategoryName('')
                              }
                            }}
                            placeholder="Enter new category name" 
                            className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all touch-manipulation" 
                            autoFocus
                          />
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                if (newCategoryName.trim()) {
                                  setEditCategory(newCategoryName.trim())
                                  setShowNewCategoryInput(false)
                                  setNewCategoryName('')
                                }
                              }}
                              className="px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors touch-manipulation"
                            >
                              Add
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setShowNewCategoryInput(false)
                                setNewCategoryName('')
                              }}
                              className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors touch-manipulation"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block flex items-center gap-1.5">
                          <Folder className="w-3.5 h-3.5 text-gray-500" />
                          Project
                        </label>
                        <select 
                          value={editCollectionId} 
                          onChange={(e) => setEditCollectionId(e.target.value)} 
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all touch-manipulation"
                        >
                          <option value="">None</option>
                          {collections.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        {collections.length === 0 && (
                          <p className="text-xs text-gray-500 mt-1.5">No projects yet. Create one to organize your links.</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Tags Section */}
                  <div className="pt-2 border-t border-gray-100">
                    <label className="text-sm font-semibold text-gray-700 mb-2 block flex items-center gap-1.5">
                      <Tag className="w-4 h-4 text-gray-500" />
                      Tags
                    </label>
                    {/* Current Tags Display */}
                    {currentTags.length > 0 ? (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {currentTags.map((tag, i) => (
                          <span key={i} className="px-3 py-1.5 bg-blue-50 text-blue-700 text-sm rounded-full flex items-center gap-1.5 border border-blue-200">
                            <Tag className="w-3 h-3" />
                            {tag}
                            <button 
                              onClick={() => removeTag(tag)} 
                              className="ml-1 p-0.5 hover:bg-blue-100 rounded-full transition-colors touch-manipulation"
                              aria-label={`Remove ${tag} tag`}
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <div className="mb-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                        <p className="text-xs text-gray-500 flex items-center gap-1.5">
                          <Tag className="w-3.5 h-3.5" />
                          No tags yet. Add tags to organize and find your links easily.
                        </p>
                      </div>
                    )}
                    <div className="relative">
                      <div className="flex gap-2">
                        <div className="flex-1 relative">
                          <input 
                            ref={tagInputRef}
                            type="text" 
                            value={newTag} 
                            onChange={(e) => {
                              setNewTag(e.target.value)
                              setShowTagSuggestions(true)
                            }}
                            onFocus={() => setShowTagSuggestions(true)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault()
                                if (tagSuggestions.length > 0) {
                                  addTag(tagSuggestions[0])
                                } else {
                                  addTag()
                                }
                              } else if (e.key === 'Escape') {
                                setShowTagSuggestions(false)
                              }
                            }}
                            className="w-full px-4 py-3 text-base border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all" 
                            placeholder="Type to search or add new tag..." 
                          />
                          {/* Tag Suggestions Dropdown */}
                          {showTagSuggestions && tagSuggestions.length > 0 && (
                            <div
                              ref={tagSuggestionsRef}
                              className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto"
                            >
                              {tagSuggestions.map((suggestion) => (
                                <button
                                  key={suggestion}
                                  type="button"
                                  onClick={() => addTag(suggestion)}
                                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors first:rounded-t-lg last:rounded-b-lg flex items-center gap-2"
                                >
                                  <Tag className="w-3.5 h-3.5" />
                                  {suggestion}
                                </button>
                              ))}
                            </div>
                          )}
                          {/* Show message when typing new tag */}
                          {showTagSuggestions && newTag.trim() && tagSuggestions.length === 0 && (
                            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm text-gray-500">
                              Press Enter to add "{newTag.trim()}"
                            </div>
                          )}
                        </div>
                        <button 
                          onClick={() => addTag()} 
                          className="px-4 py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg touch-manipulation transition-colors shadow-sm hover:shadow"
                          aria-label="Add tag"
                        >
                          <Plus className="w-5 h-5" />
                        </button>
                      </div>
                      {/* Show existing tags as quick-add buttons when input is empty */}
                      {!newTag.trim() && allTags.length > 0 && currentTags.length < allTags.length && (
                        <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                          <p className="text-xs font-medium text-gray-700 mb-2 flex items-center gap-1.5">
                            <Tag className="w-3.5 h-3.5" />
                            Quick add existing tags:
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {allTags
                              .filter(tag => !currentTags.includes(tag))
                              .slice(0, 12)
                              .map((tag) => (
                                <button
                                  key={tag}
                                  type="button"
                                  onClick={() => addTag(tag)}
                                  className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 border border-gray-300 rounded-md transition-all shadow-sm hover:shadow"
                                >
                                  + {tag}
                                </button>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action buttons - full width on mobile */}
                  <div className="pt-3 border-t border-gray-200">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <button 
                        onClick={saveEdits} 
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-semibold rounded-lg touch-manipulation transition-all shadow-md hover:shadow-lg"
                      >
                        <Save className="w-4 h-4" /> 
                        Save Changes
                      </button>
                      <button 
                        onClick={cancelEditing} 
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 active:bg-gray-100 text-gray-700 border border-gray-300 text-sm font-medium rounded-lg touch-manipulation transition-all"
                      >
                        <X className="w-4 h-4" /> 
                        Cancel
                      </button>
                    </div>
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
                      <MousePointer className="w-4 h-4" />{localClickCount} clicks
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
        {link.thumbnail && link.thumbnail.startsWith('http') && (
          <div className="aspect-video w-full overflow-hidden bg-gray-100">
            <img 
              src={link.thumbnail} 
              alt="Post thumbnail" 
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              referrerPolicy="no-referrer-when-downgrade"
              crossOrigin="anonymous"
              loading="lazy"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                console.warn('[LinkCard] Failed to load thumbnail:', link.thumbnail);
              }}
              onLoad={() => {
                console.debug('[LinkCard] Thumbnail loaded successfully:', link.thumbnail);
              }}
            />
          </div>
        )}

        <div className="p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-2 min-w-0">
              {link.favicon && link.favicon.startsWith('http') ? (
                <img 
                  src={link.favicon} 
                  alt="" 
                  className="w-6 h-6 sm:w-5 sm:h-5 rounded flex-shrink-0"
                  referrerPolicy="no-referrer-when-downgrade"
                  crossOrigin="anonymous"
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-6 h-6 sm:w-5 sm:h-5 rounded bg-gray-200 flex items-center justify-center flex-shrink-0">
                  <Globe className="w-4 h-4 sm:w-3 sm:h-3 text-gray-400" />
                </div>
              )}
              <span className="text-sm sm:text-xs text-gray-500 truncate">{getDomain(link.url)}</span>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <label 
                className={`p-1 cursor-pointer transition-opacity touch-manipulation ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                onClick={(e) => {
                  // Only handle if clicking directly on label (not checkbox)
                  if (e.target === e.currentTarget || (e.target as HTMLElement).tagName !== 'INPUT') {
                    e.stopPropagation()
                    onSelect(e)
                  }
                }}
              >
                <input 
                  type="checkbox" 
                  checked={isSelected} 
                  readOnly
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    onSelect(e)
                  }} 
                  className="w-5 h-5 sm:w-4 sm:h-4 rounded border-gray-300 text-blue-600 cursor-pointer" 
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
            onClick={(e) => {
              console.log('[ClickTrack] ⚡⚡⚡ TITLE CLICKED (GRID VIEW) ⚡⚡⚡');
              alert('Click handler fired! Check console for [ClickTrack] logs.');
              handleLinkClick(e);
            }}
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
        <div className="px-4 pb-5 sm:pb-4 border-t border-gray-100 animate-in slide-in-from-top-2 duration-200" onClick={(e) => e.stopPropagation()}>
          <div className="pt-5 sm:pt-4 space-y-5 sm:space-y-4">
            {isEditing ? (
              /* ===== EDIT MODE ===== */
              <>
                  {/* Form Header */}
                  <div className="pb-3 border-b border-gray-200">
                    <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                      <Edit className="w-4 h-4 text-blue-600" />
                      Edit Link
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">Update the link details below</p>
                  </div>

                  {/* Basic Information Section */}
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-semibold text-gray-700 mb-2 block flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-gray-500" />
                        Title
                        <span className="text-red-500">*</span>
                      </label>
                      <input 
                        type="text" 
                        value={editTitle} 
                        onChange={(e) => setEditTitle(e.target.value)} 
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all touch-manipulation" 
                        placeholder="Enter link title"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-semibold text-gray-700 mb-2 block flex items-center gap-1.5">
                        <StickyNote className="w-4 h-4 text-gray-500" />
                        Notes
                      </label>
                      <textarea 
                        value={editDescription} 
                        onChange={(e) => setEditDescription(e.target.value)} 
                        rows={3} 
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none transition-all touch-manipulation" 
                        placeholder="Add your thoughts, key takeaways, or summary..."
                      />
                      <p className="text-xs text-gray-500 mt-1.5">Optional: Add notes to help you remember why you saved this link</p>
                    </div>
                  </div>

                  {/* Organization Section */}
                  <div className="pt-4 sm:pt-2 border-t border-gray-100">
                    <h4 className="text-base sm:text-sm font-semibold text-gray-700 mb-4 sm:mb-3 flex items-center gap-2">
                      <Folder className="w-5 h-5 sm:w-4 sm:h-4 text-gray-500" />
                      Organization
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-4">
                      <div>
                        <label className="text-base sm:text-sm font-medium text-gray-700 mb-2.5 sm:mb-2 block flex items-center gap-2">
                          <Globe className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-gray-500" />
                          Category
                        </label>
                        {!showNewCategoryInput ? (
                          <select 
                            value={editCategory} 
                            onChange={(e) => {
                              if (e.target.value === '__add_new__') {
                                setShowNewCategoryInput(true)
                                setNewCategoryName('')
                              } else {
                                setEditCategory(e.target.value)
                              }
                            }} 
                            className="w-full px-4 py-3.5 sm:py-3 text-base border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all touch-manipulation"
                          >
                            <option value="">None</option>
                            {categories.map(cat => (
                              <option key={cat.id || cat.name} value={cat.name}>
                                {cat.name}
                              </option>
                            ))}
                            <option value="__add_new__">+ Add new category</option>
                          </select>
                        ) : (
                          <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-2">
                            <input 
                              type="text" 
                              value={newCategoryName} 
                              onChange={(e) => setNewCategoryName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  if (newCategoryName.trim()) {
                                    setEditCategory(newCategoryName.trim())
                                    setShowNewCategoryInput(false)
                                    setNewCategoryName('')
                                  }
                                } else if (e.key === 'Escape') {
                                  setShowNewCategoryInput(false)
                                  setNewCategoryName('')
                                }
                              }}
                              placeholder="Enter new category name" 
                              className="flex-1 px-4 py-3.5 sm:py-3 text-base border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all touch-manipulation" 
                              autoFocus
                            />
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  if (newCategoryName.trim()) {
                                    setEditCategory(newCategoryName.trim())
                                    setShowNewCategoryInput(false)
                                    setNewCategoryName('')
                                  }
                                }}
                                className="flex-1 sm:flex-none px-5 py-3 sm:px-4 sm:py-2 text-base sm:text-sm font-medium text-blue-600 hover:text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors touch-manipulation active:bg-blue-100"
                              >
                                Add
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setShowNewCategoryInput(false)
                                  setNewCategoryName('')
                                }}
                                className="flex-1 sm:flex-none px-5 py-3 sm:px-4 sm:py-2 text-base sm:text-sm font-medium text-gray-600 hover:text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors touch-manipulation active:bg-gray-100"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="text-base sm:text-sm font-medium text-gray-700 mb-2.5 sm:mb-2 block flex items-center gap-2">
                          <Folder className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-gray-500" />
                          Project
                        </label>
                        <select 
                          value={editCollectionId} 
                          onChange={(e) => setEditCollectionId(e.target.value)} 
                          className="w-full px-4 py-3.5 sm:py-3 text-base border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all touch-manipulation"
                        >
                          <option value="">None</option>
                          {collections.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        {collections.length === 0 && (
                          <p className="text-sm sm:text-xs text-gray-500 mt-2 sm:mt-1.5">No projects yet. Create one to organize your links.</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Tags Section */}
                  <div className="pt-2 border-t border-gray-100">
                    <label className="text-sm font-semibold text-gray-700 mb-2 block flex items-center gap-1.5">
                      <Tag className="w-4 h-4 text-gray-500" />
                      Tags
                    </label>
                    {/* Current Tags Display */}
                    {currentTags.length > 0 ? (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {currentTags.map((tag, i) => (
                          <span key={i} className="px-2.5 py-1 bg-blue-50 text-blue-700 text-sm rounded-full flex items-center gap-1.5 border border-blue-200">
                            <Tag className="w-3 h-3" />
                            {tag}
                            <button 
                              onClick={() => removeTag(tag)} 
                              className="ml-1 p-0.5 hover:bg-blue-100 rounded-full transition-colors touch-manipulation"
                              aria-label={`Remove ${tag} tag`}
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <div className="mb-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                        <p className="text-xs text-gray-500 flex items-center gap-1.5">
                          <Tag className="w-3.5 h-3.5" />
                          No tags yet. Add tags to organize and find your links easily.
                        </p>
                      </div>
                    )}
                    <div className="relative">
                      <div className="flex gap-2">
                        <div className="flex-1 relative">
                          <input 
                            ref={tagInputRef}
                            type="text" 
                            value={newTag} 
                            onChange={(e) => {
                              setNewTag(e.target.value)
                              setShowTagSuggestions(true)
                            }}
                            onFocus={() => setShowTagSuggestions(true)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault()
                                if (tagSuggestions.length > 0) {
                                  addTag(tagSuggestions[0])
                                } else {
                                  addTag()
                                }
                              } else if (e.key === 'Escape') {
                                setShowTagSuggestions(false)
                              }
                            }}
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all touch-manipulation" 
                            placeholder="Type to search or add new tag..."
                          />
                          {/* Tag Suggestions Dropdown */}
                          {showTagSuggestions && tagSuggestions.length > 0 && (
                            <div
                              ref={tagSuggestionsRef}
                              className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto"
                            >
                              {tagSuggestions.map((suggestion) => (
                                <button
                                  key={suggestion}
                                  type="button"
                                  onClick={() => addTag(suggestion)}
                                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors first:rounded-t-lg last:rounded-b-lg flex items-center gap-2 touch-manipulation"
                                >
                                  <Tag className="w-3.5 h-3.5" />
                                  {suggestion}
                                </button>
                              ))}
                            </div>
                          )}
                          {/* Show message when typing new tag */}
                          {showTagSuggestions && newTag.trim() && tagSuggestions.length === 0 && (
                            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm text-gray-500">
                              Press Enter to add "{newTag.trim()}"
                            </div>
                          )}
                        </div>
                        <button 
                          onClick={() => addTag()} 
                          className="px-3 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg touch-manipulation transition-colors shadow-sm hover:shadow"
                          aria-label="Add tag"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      {/* Show existing tags as quick-add buttons when input is empty */}
                      {!newTag.trim() && allTags.length > 0 && currentTags.length < allTags.length && (
                        <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                          <p className="text-xs font-medium text-gray-700 mb-2 flex items-center gap-1.5">
                            <Tag className="w-3.5 h-3.5" />
                            Quick add existing tags:
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {allTags
                              .filter(tag => !currentTags.includes(tag))
                              .slice(0, 12)
                              .map((tag) => (
                                <button
                                  key={tag}
                                  type="button"
                                  onClick={() => addTag(tag)}
                                  className="px-2.5 py-1 text-xs font-medium text-gray-700 bg-white hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 border border-gray-300 rounded-md transition-all shadow-sm hover:shadow touch-manipulation"
                                >
                                  + {tag}
                                </button>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action buttons - full width on mobile */}
                  <div className="pt-3 border-t border-gray-200">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <button 
                        onClick={saveEdits} 
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-semibold rounded-lg touch-manipulation transition-all shadow-md hover:shadow-lg"
                      >
                        <Save className="w-4 h-4" /> 
                        Save Changes
                      </button>
                      <button 
                        onClick={cancelEditing} 
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 active:bg-gray-100 text-gray-700 border border-gray-300 text-sm font-medium rounded-lg touch-manipulation transition-all"
                      >
                        <X className="w-4 h-4" /> 
                        Cancel
                      </button>
                    </div>
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
                    <div className="text-blue-800 text-base sm:text-sm">{localClickCount}</div>
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

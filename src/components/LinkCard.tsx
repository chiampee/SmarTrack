import React, { useState, memo, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { logger } from '../utils/logger'
import { capitalizeCategoryName, autoCapitalizeCategoryInput } from '../utils/categoryUtils'
import { useMobileOptimizations } from '../hooks/useMobileOptimizations'
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
import { Tooltip } from './Tooltip'

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
  onExpandedChange?: (expanded: boolean) => void
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
  onCardClick,
  onExpandedChange
}) => {
  // #region agent log
  React.useEffect(() => {
    console.log('[ClickTrack] LinkCard rendered:', {linkId:link.id,title:link.title,clickCount:link.clickCount});
  }, [link.id]);
  // #endregion
  const { isMobile } = useMobileOptimizations()
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
  
  // Track favicon load errors for fallback
  const [faviconError, setFaviconError] = useState(false)

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
      const newExpandedState = !isExpanded
      setIsExpanded(newExpandedState)
      if (onExpandedChange) {
        onExpandedChange(newExpandedState)
      }
    }
  }

  // Notify parent when expanded state changes (e.g., when closing)
  React.useEffect(() => {
    if (onExpandedChange) {
      onExpandedChange(isExpanded)
    }
  }, [isExpanded, onExpandedChange])

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

  const formatRelativeTime = (date: Date | string) => {
    const now = new Date()
    const then = new Date(date)
    const diffMs = now.getTime() - then.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)
    
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) !== 1 ? 's' : ''} ago`
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) !== 1 ? 's' : ''} ago`
    return `${Math.floor(diffDays / 365)} year${Math.floor(diffDays / 365) !== 1 ? 's' : ''} ago`
  }

  /**
   * Extract clean domain from URL (handles subdomains correctly)
   * Examples:
   * - https://blog.medium.com/article → medium.com
   * - https://www.github.com/user → github.com
   * - https://subdomain.example.com → example.com
   */
  const getCleanDomain = (url: string): string | null => {
    try {
      const urlObj = new URL(url)
      let hostname = urlObj.hostname
      
      // Remove 'www.' prefix if present
      if (hostname.startsWith('www.')) {
        hostname = hostname.substring(4)
      }
      
      // For subdomains, we keep the full domain (e.g., blog.medium.com)
      // Google's favicon service handles subdomains correctly
      return hostname || null
    } catch {
      // If URL parsing fails, try to extract domain manually
      try {
        const match = url.match(/https?:\/\/(?:www\.)?([^/]+)/)
        return match ? match[1] : null
      } catch {
        return null
      }
    }
  }

  /**
   * 4-Tier Image Fallback System (matching extension behavior):
   * Tier 1: Use link.thumbnail (og:image - higher quality) from database
   * Tier 2: Use link.favicon or link.iconUrl from database
   * Tier 3: Generate favicon URL from domain using Google's service
   * Tier 4: Fallback to Globe icon (handled via faviconError state)
   */
  const getFaviconUrl = (
    url: string, 
    thumbnail?: string | null,
    favicon?: string | null, 
    iconUrl?: string | null
  ): string | null => {
    // Helper to check if a string is a valid HTTP(S) URL
    const isValidUrl = (str: string | null | undefined): boolean => {
      if (!str || typeof str !== 'string') return false
      const trimmed = str.trim()
      return trimmed.length > 0 && (trimmed.startsWith('http://') || trimmed.startsWith('https://'))
    }
    
    // Tier 1: Check database thumbnail (og:image - often better quality)
    if (isValidUrl(thumbnail)) {
      return thumbnail!.trim()
    }
    
    // Tier 2: Check database favicon/iconUrl
    const dbFavicon = favicon || iconUrl
    if (isValidUrl(dbFavicon)) {
      return dbFavicon!.trim()
    }
    
    // Tier 3: Generate from domain using CORS-friendly service
    // Using Icon Horse (CORS-enabled) instead of Google's service which blocks CORS
    const domain = getCleanDomain(url)
    if (domain) {
      return `https://icon.horse/icon/${encodeURIComponent(domain)}`
    }
    
    // No valid URL or domain, return null (Tier 4 fallback will show Globe icon)
    return null
  }

  const faviconUrl = getFaviconUrl(link.url, link.thumbnail, link.favicon, (link as any).iconUrl)
  
  // Debug logging (temporary - only for first few links)
  useEffect(() => {
    // Only log for debugging - check first link
    const isFirstLink = document.querySelector('[data-link-id]')?.getAttribute('data-link-id') === link.id
    if (isFirstLink || !document.querySelector('[data-link-id]')) {
      console.log('[LinkCard Debug]', {
        linkId: link.id,
        title: link.title.substring(0, 30),
        url: link.url,
        hasThumbnail: !!link.thumbnail,
        thumbnail: link.thumbnail,
        hasFavicon: !!link.favicon,
        favicon: link.favicon,
        hasIconUrl: !!(link as any).iconUrl,
        iconUrl: (link as any).iconUrl,
        generatedFaviconUrl: faviconUrl,
        faviconError,
        willShowGlobe: !faviconUrl || faviconError
      })
    }
  }, [link.id, link.url, link.thumbnail, link.favicon, faviconUrl, faviconError])
  
  // Reset error state when favicon URL changes
  useEffect(() => {
    setFaviconError(false)
  }, [faviconUrl])

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
      <motion.div 
        data-link-id={link.id}
        className={`group bg-white rounded-2xl cursor-pointer relative touch-manipulation ${
          isSelected ? 'ring-2 ring-blue-500 bg-blue-50/30 shadow-md' : ''
        }`}
        style={{
          boxShadow: isSelected ? undefined : '0 10px 15px -3px rgba(0, 0, 0, 0.05)'
        }}
        role="article"
        onClick={handleCardClick}
        layout
        whileHover={!isMobile ? {
          y: -2,
          scale: 1.01,
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] }
        } : {}}
        whileTap={{ 
          scale: isMobile ? 0.96 : 0.98,
          transition: { duration: isMobile ? 0.15 : 0.2, ease: [0.4, 0, 0.2, 1] }
        }}
        transition={{
          layout: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
          default: { duration: 0.2 }
        }}
      >
        {/* Main Row - Content First Design for Mobile */}
        <div className="flex items-center gap-4 sm:gap-5 p-3 sm:p-4 relative">
          {/* Checkbox - Hidden on mobile, shown on desktop hover */}
          <div className="hidden sm:flex items-center flex-shrink-0 pt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
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

          {/* Favicon/Thumbnail - Larger size on mobile for content-first design */}
          <div className="flex-shrink-0 relative">
            {faviconUrl && !faviconError ? (
              <img 
                src={faviconUrl} 
                alt="" 
                className={`w-20 h-20 sm:w-14 sm:h-14 rounded-lg bg-slate-50 p-1.5 shadow-sm ${
                  link.thumbnail ? 'object-cover' : 'object-contain'
                }`}
                referrerPolicy="no-referrer-when-downgrade"
                loading="lazy"
                onError={(e) => {
                  // Tier 4: Image failed to load, show Globe icon fallback
                  console.warn('[LinkCard] Image failed to load:', {
                    linkId: link.id,
                    url: link.url,
                    imageUrl: faviconUrl,
                    error: e
                  })
                  setFaviconError(true)
                }}
                onLoad={() => {
                  // Successfully loaded
                  if (link.id === document.querySelector('[data-link-id]')?.getAttribute('data-link-id')) {
                    console.log('[LinkCard] Image loaded successfully:', faviconUrl)
                  }
                }}
              />
            ) : (
              <div className="w-20 h-20 sm:w-14 sm:h-14 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center shadow-sm">
                <Globe className="w-10 h-10 sm:w-7 sm:h-7 text-slate-400" strokeWidth={1.5} />
              </div>
            )}
          </div>

          {/* Title & Domain - Stacked vertically for content-first design */}
          <div className="flex-1 min-w-0">
            {/* Title - Stacked on top, allow up to 2 lines for better readability */}
            <Tooltip content={link.title} disabled={link.title.length < 50}>
              <h3 
                data-link-title
                onClick={(e) => {
                  handleLinkClick(e);
                }}
                className="font-semibold text-gray-900 hover:text-blue-600 active:text-blue-700 text-[15px] sm:text-sm cursor-pointer w-full mb-2 sm:mb-1.5 touch-manipulation line-clamp-2 leading-relaxed"
                title={link.title}
              >
                {link.title}
              </h3>
            </Tooltip>
            {/* Domain only - Category removed from here (shown as badge instead) */}
            <Tooltip content={getCleanDomain(link.url) || link.url} disabled={(getCleanDomain(link.url) || link.url).length < 30}>
              <p className="text-[12px] sm:text-xs text-gray-500 truncate mb-2 sm:mb-1.5" title={getCleanDomain(link.url) || link.url}>
                {getCleanDomain(link.url) || link.url}
              </p>
            </Tooltip>
            
            {/* Icons and metadata row - Hidden on mobile */}
            <div className="hidden sm:flex items-center gap-2 flex-wrap mt-0.5">
              {/* Icons */}
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {link.description && <span title="Has notes"><StickyNote className="w-3.5 h-3.5 text-amber-400" strokeWidth={1.5} /></span>}
                {link.isFavorite && <Star className="w-3.5 h-3.5 text-amber-400 fill-current" strokeWidth={1.5} />}
                {link.isArchived && <Archive className="w-3.5 h-3.5 text-gray-400" strokeWidth={1.5} />}
              </div>
            </div>
          </div>

          {/* Desktop: Badges and Date - Vertically centered */}
          <div className="hidden sm:flex items-center gap-2 flex-shrink-0 self-center">
            <span className={`px-2 py-0.5 text-xs font-medium rounded-full flex items-center gap-1 ${contentTypeInfo.color}`}>
              {contentTypeInfo.label}
            </span>
            {link.category && <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs font-medium rounded-full border border-gray-200">{capitalizeCategoryName(link.category)}</span>}
            {link.collectionId && (
              <span className="px-2 py-0.5 bg-green-50 text-green-700 text-xs font-medium rounded-full flex items-center gap-1">
                <Folder className="w-3 h-3" strokeWidth={1.5} />{getCollectionName(link.collectionId)}
              </span>
            )}
            {/* Single date display - only on large screens */}
            <div className="hidden lg:flex items-center gap-1 text-xs text-gray-400 ml-1">
              <Clock className="w-3 h-3" strokeWidth={1.5} />
              <span>{formatDate(link.createdAt)}</span>
            </div>
          </div>

          {/* Expand/Collapse - Hidden on mobile, shown on desktop */}
          <button 
            className="hidden sm:flex flex-shrink-0 p-2 -m-1 rounded-lg hover:bg-gray-100 active:bg-gray-200 touch-manipulation min-h-[44px] min-w-[44px] items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded) }}
          >
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            >
              <ChevronDown className="w-5 h-5 sm:w-4 sm:h-4 text-gray-500" strokeWidth={1.5} />
            </motion.div>
          </button>
        </div>

        {/* Expanded Content */}
        <AnimatePresence initial={false}>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ 
                duration: 0.3, 
                ease: [0.4, 0, 0.2, 1],
                opacity: { duration: 0.2 }
              }}
              className="overflow-hidden"
            >
              <div className="px-3 sm:px-4 pb-4 pt-0 border-t border-gray-100" onClick={(e) => e.stopPropagation()}>
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
                        Context
                      </label>
                      <textarea 
                        value={editDescription} 
                        onChange={(e) => setEditDescription(e.target.value)} 
                        rows={4} 
                        className="w-full px-4 py-3 text-base border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none transition-all" 
                        placeholder="Add your thoughts, key takeaways, or summary..."
                      />
                      <p className="text-xs text-gray-500 mt-1.5">Optional: Add context to help you remember why you saved this link</p>
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
                            onChange={(e) => {
                              const capitalized = autoCapitalizeCategoryInput(e.target.value)
                              setNewCategoryName(capitalized)
                            }}
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

                  {/* Action buttons - full width on mobile with improved clickability */}
                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
                      <button 
                        onClick={saveEdits} 
                        className="flex items-center justify-center gap-2 px-6 py-3 min-h-[44px] bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-base font-semibold rounded-lg touch-manipulation transition-all shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      >
                        <Save className="w-5 h-5" /> 
                        Save Changes
                      </button>
                      <button 
                        onClick={cancelEditing} 
                        className="flex items-center justify-center gap-2 px-6 py-3 min-h-[44px] bg-white hover:bg-gray-50 active:bg-gray-100 text-gray-700 border-2 border-gray-300 text-base font-medium rounded-lg touch-manipulation transition-all shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
                      >
                        <X className="w-5 h-5" /> 
                        Cancel
                      </button>
                    </div>
                  </div>
                </>
            ) : (
              /* ===== VIEW MODE ===== */
              <>
                {/* Title - Compact header without image (image already shown in collapsed card) */}
                <div className="mb-3">
                  <div className="text-center sm:text-left">
                    <h2 className="text-base font-semibold text-gray-900 leading-tight mb-0.5 break-words">
                      {link.title}
                    </h2>
                  </div>
                </div>

                {/* Instagram-Style Notes - Clean text on white, date inline */}
                {link.description && (
                  <div className="mb-3">
                    <p className="text-sm text-gray-900 leading-relaxed">
                      {link.description}
                      <span className="text-[11px] text-gray-400 ml-2">• {formatDate(link.createdAt)}</span>
                    </p>
                  </div>
                )}

                {/* URL with copy button */}
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg mb-3">
                  <p className="text-sm text-gray-600 truncate flex-1">{link.url}</p>
                  <button 
                    onClick={copyToClipboard} 
                    className={`p-2 rounded-lg transition-colors touch-manipulation ${copied ? 'bg-green-100 text-green-600' : 'bg-white hover:bg-gray-100 active:bg-gray-200 text-gray-500 border border-gray-200'}`}
                  >
                    <Copy className="w-4 h-4" strokeWidth={1.5} />
                  </button>
                  {copied && <span className="text-xs text-green-600 font-medium">Copied!</span>}
                </div>

                {/* Info-Cluster: Horizontal Metadata Row */}
                <div className="flex flex-wrap items-center gap-1.5 text-[12px] text-gray-500 mb-3">
                  <div className="flex items-center gap-1">
                    <span>{contentTypeInfo.label}</span>
                  </div>
                  {link.category && (
                    <>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        <Tag size={14} strokeWidth={1.5} />
                        <span>{capitalizeCategoryName(link.category)}</span>
                      </div>
                    </>
                  )}
                  {link.collectionId && (
                    <>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        <Folder size={14} strokeWidth={1.5} />
                        <span>{getCollectionName(link.collectionId)}</span>
                      </div>
                    </>
                  )}
                </div>

                {/* Date and Clicks - Single horizontal row */}
                <div className="flex flex-wrap items-center gap-1.5 text-[12px] text-gray-500 mb-3">
                  <div className="flex items-center gap-1">
                    <Clock size={14} strokeWidth={1.5} />
                    <span>Captured {formatRelativeTime(link.createdAt)}</span>
                  </div>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <MousePointer size={14} strokeWidth={1.5} />
                    <span>{localClickCount} {localClickCount === 1 ? 'visit' : 'visits'}</span>
                  </div>
                </div>

                  {/* Open Link Button - Primary full-width */}
                  <a 
                    href={link.url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-base font-medium rounded-lg touch-manipulation shadow-sm mb-3"
                  >
                    <ExternalLink className="w-5 h-5" strokeWidth={1.5} /> Visit Site
                  </a>

                  {/* Thumb-Friendly Actions - 4 icons with labels */}
                  <div className="flex flex-row justify-around items-center gap-1 sm:gap-2 pt-2 border-t border-gray-100">
                    <button 
                      onClick={startEditing} 
                      className="flex flex-col items-center justify-center gap-1.5 px-4 py-3 sm:px-5 sm:py-4 min-h-[64px] sm:min-h-[72px] min-w-[64px] sm:min-w-[72px] text-gray-600 hover:text-gray-900 hover:bg-gray-50 active:bg-gray-100 rounded-lg transition-all duration-150 touch-manipulation"
                      aria-label="Edit link"
                    >
                      <Edit className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={1.5} />
                      <span className="text-xs sm:text-sm font-medium">Edit</span>
                    </button>
                    <button 
                      onClick={() => handleAction('toggleFavorite')} 
                      className={`flex flex-col items-center justify-center gap-1.5 px-4 py-3 sm:px-5 sm:py-4 min-h-[64px] sm:min-h-[72px] min-w-[64px] sm:min-w-[72px] rounded-lg transition-all duration-150 touch-manipulation hover:bg-gray-50 active:bg-gray-100 ${link.isFavorite ? 'text-amber-600 hover:text-amber-700' : 'text-gray-600 hover:text-gray-900'}`}
                      aria-label={link.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                    >
                      <Star className={`w-5 h-5 sm:w-6 sm:h-6 ${link.isFavorite ? 'fill-current' : ''}`} strokeWidth={1.5} />
                      <span className="text-xs sm:text-sm font-medium">{link.isFavorite ? 'Favorited' : 'Favorite'}</span>
                    </button>
                    <button 
                      onClick={() => handleAction('toggleArchive')} 
                      className={`flex flex-col items-center justify-center gap-1.5 px-4 py-3 sm:px-5 sm:py-4 min-h-[64px] sm:min-h-[72px] min-w-[64px] sm:min-w-[72px] rounded-lg transition-all duration-150 touch-manipulation hover:bg-gray-50 active:bg-gray-100 ${link.isArchived ? 'text-green-600 hover:text-green-700' : 'text-gray-600 hover:text-gray-900'}`}
                      title={link.isArchived ? 'Unarchive this link' : 'Archive this link'}
                      aria-label={link.isArchived ? 'Unarchive link' : 'Archive link'}
                    >
                      <Archive className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={1.5} />
                      <span className="text-xs sm:text-sm font-medium">{link.isArchived ? 'Unarchive' : 'Archive'}</span>
                    </button>
                    <button 
                      onClick={() => handleAction('delete')} 
                      className="flex flex-col items-center justify-center gap-1.5 px-4 py-3 sm:px-5 sm:py-4 min-h-[64px] sm:min-h-[72px] min-w-[64px] sm:min-w-[72px] text-gray-600 hover:text-red-600 hover:bg-red-50 active:bg-red-100 rounded-lg transition-all duration-150 touch-manipulation"
                      aria-label="Delete link"
                    >
                      <Trash2 className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={1.5} />
                      <span className="text-xs sm:text-sm font-medium">Delete</span>
                    </button>
                  </div>
                </>
              )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    )
  }

  // ============ GRID VIEW - Instagram-inspired Post Style ============
  return (
    <motion.div 
      className={`group bg-white rounded-2xl overflow-hidden cursor-pointer relative touch-manipulation ${
        isSelected ? 'ring-2 ring-blue-500' : ''
      }`}
      style={{
        boxShadow: isSelected ? undefined : '0 10px 15px -3px rgba(0, 0, 0, 0.05)'
      }}
      role="article"
      onClick={handleCardClick}
      layout
      whileHover={!isMobile ? {
        y: -6,
        scale: 1.02,
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] }
      } : {}}
      whileTap={{ 
        scale: 0.96,
        transition: { duration: 0.15, ease: [0.4, 0, 0.2, 1] }
      }}
      transition={{
        layout: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
        default: { duration: 0.2 }
      }}
    >
      {/* Collection tag - Positioned at top-left, inside card (not overlapping) */}
      {link.collectionId && (
        <div className="absolute top-2 left-2 z-10">
          <span className="px-2 py-1 bg-green-600 text-white text-[10px] sm:text-xs font-medium rounded-md shadow-md flex items-center gap-1">
            <Folder className="w-3 h-3" strokeWidth={1.5} />
            {getCollectionName(link.collectionId)}
          </span>
        </div>
      )}
      
      {/* Edge-to-edge image with rounded top corners */}
      {link.thumbnail && link.thumbnail.startsWith('http') ? (
        <div className="aspect-video w-full overflow-hidden bg-gray-100 relative">
          <motion.img 
            src={link.thumbnail} 
            alt="Post thumbnail" 
            className="w-full h-full object-cover rounded-t-2xl"
            style={{ border: '1px solid rgba(0, 0, 0, 0.05)' }}
            referrerPolicy="no-referrer-when-downgrade"
            loading="lazy"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              console.warn('[LinkCard] Failed to load thumbnail:', link.thumbnail);
            }}
            onLoad={() => {
              console.debug('[LinkCard] Thumbnail loaded successfully:', link.thumbnail);
            }}
          />
          {/* Hover Overlay with Quick Actions - Grid view only */}
          {viewMode === 'grid' && (
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-t-2xl flex items-start justify-between p-3">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleLinkClick(e)
                }}
                className="p-2 bg-white/90 hover:bg-white rounded-full shadow-lg transition-all hover:scale-110"
                aria-label="Quick open link"
              >
                <ExternalLink className="w-4 h-4 text-gray-900" strokeWidth={2} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleAction('toggleFavorite')
                }}
                className={`p-2 rounded-full shadow-lg transition-all hover:scale-110 ${
                  link.isFavorite 
                    ? 'bg-amber-500/90 hover:bg-amber-500' 
                    : 'bg-white/90 hover:bg-white'
                }`}
                aria-label={link.isFavorite ? 'Unfavorite' : 'Favorite'}
              >
                <Star className={`w-4 h-4 ${link.isFavorite ? 'fill-white text-white' : 'text-gray-900'}`} strokeWidth={2} />
              </button>
            </div>
          )}
        </div>
      ) : (
        // Fallback: Show aspect-video placeholder if no thumbnail
        <div className="aspect-video w-full bg-gray-100 rounded-t-2xl flex items-center justify-center">
          {faviconUrl && !faviconError ? (
            <img 
              src={faviconUrl} 
              alt="" 
              className="w-16 h-16 rounded-lg object-contain"
              referrerPolicy="no-referrer-when-downgrade"
              loading="lazy"
              onError={() => setFaviconError(true)}
            />
          ) : (
            <Globe className="w-12 h-12 text-gray-300" strokeWidth={1.5} />
          )}
        </div>
      )}

      {/* Content section - no padding on sides, only vertical */}
      <div className="px-3 py-3">
        {/* Favicon & Domain - Above title, tiny light gray */}
        <div className="flex items-center gap-1.5 mb-2">
          {faviconUrl && !faviconError ? (
            <img 
              src={faviconUrl} 
              alt="" 
              className="w-4 h-4 rounded flex-shrink-0"
              referrerPolicy="no-referrer-when-downgrade"
              loading="lazy"
              onError={() => setFaviconError(true)}
            />
          ) : (
            <Globe className="w-4 h-4 text-gray-300 flex-shrink-0" strokeWidth={1.5} />
          )}
          <Tooltip content={getCleanDomain(link.url) || link.url} disabled={(getCleanDomain(link.url) || link.url).length < 25}>
            <span 
              className="text-[10px] text-gray-400 truncate"
              title={getCleanDomain(link.url) || link.url}
            >
              {getCleanDomain(link.url) || link.url}
            </span>
          </Tooltip>
        </div>

        {/* Title - Deep charcoal, exactly 2 lines, allow card height expansion */}
        <Tooltip content={link.title} disabled={link.title.length < 50}>
          <h3 
            data-link-title
            onClick={(e) => {
              handleLinkClick(e);
            }}
            className="font-semibold text-gray-900 text-sm line-clamp-2 mb-3 leading-relaxed cursor-pointer touch-manipulation min-h-[2.5rem]"
            title={link.title}
          >
            {link.title}
          </h3>
        </Tooltip>
        
        {/* Context Preview - Desktop hover only */}
        {link.description && viewMode === 'grid' && (
          <div className="hidden lg:block opacity-0 group-hover:opacity-100 transition-opacity duration-200 mb-3">
            <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
              {link.description}
            </p>
          </div>
        )}
        
        {/* Badges row - Content type and category only (no collection here to avoid overlap) */}
        <div className="flex items-center gap-2 flex-wrap mt-auto pt-2">
          <span className={`px-2 py-1 text-xs font-medium rounded-full flex items-center gap-1 ${contentTypeInfo.color}`}>
            {contentTypeInfo.label}
          </span>
          {link.category && (
            <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full border border-gray-200">
              {capitalizeCategoryName(link.category)}
            </span>
          )}
        </div>
      </div>

      {/* Expanded Content - Minimal for grid view */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ 
              duration: 0.3, 
              ease: [0.4, 0, 0.2, 1],
              opacity: { duration: 0.2 }
            }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-4 border-t border-gray-100" onClick={(e) => e.stopPropagation()}>
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
                        Context
                      </label>
                      <textarea 
                        value={editDescription} 
                        onChange={(e) => setEditDescription(e.target.value)} 
                        rows={3} 
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none transition-all touch-manipulation" 
                        placeholder="Add your thoughts, key takeaways, or summary..."
                      />
                      <p className="text-xs text-gray-500 mt-1.5">Optional: Add context to help you remember why you saved this link</p>
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
                              onChange={(e) => {
                                const capitalized = autoCapitalizeCategoryInput(e.target.value)
                                setNewCategoryName(capitalized)
                              }}
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

                  {/* Action buttons - full width on mobile with improved clickability */}
                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
                      <button 
                        onClick={saveEdits} 
                        className="flex items-center justify-center gap-2 px-6 py-3 min-h-[44px] bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-base font-semibold rounded-lg touch-manipulation transition-all shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      >
                        <Save className="w-5 h-5" /> 
                        Save Changes
                      </button>
                      <button 
                        onClick={cancelEditing} 
                        className="flex items-center justify-center gap-2 px-6 py-3 min-h-[44px] bg-white hover:bg-gray-50 active:bg-gray-100 text-gray-700 border-2 border-gray-300 text-base font-medium rounded-lg touch-manipulation transition-all shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
                      >
                        <X className="w-5 h-5" /> 
                        Cancel
                      </button>
                    </div>
                  </div>
              </>
            ) : (
              /* ===== VIEW MODE ===== */
              <>
                {/* Title - Compact header without image (image already shown in collapsed card) */}
                <div className="mb-3">
                  <div className="text-center sm:text-left">
                    <h2 className="text-base font-semibold text-gray-900 leading-tight mb-0.5 break-words">
                      {link.title}
                    </h2>
                  </div>
                </div>

                {/* Instagram-Style Notes - Clean text on white, date inline */}
                {link.description && (
                  <div className="mb-3">
                    <p className="text-sm text-gray-900 leading-relaxed">
                      {link.description}
                      <span className="text-[11px] text-gray-400 ml-2">• {formatDate(link.createdAt)}</span>
                    </p>
                  </div>
                )}

                {/* URL with copy button */}
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg mb-3">
                  <p className="text-sm text-gray-600 truncate flex-1">{link.url}</p>
                  <button 
                    onClick={copyToClipboard} 
                    className={`p-2 rounded-lg transition-colors touch-manipulation ${copied ? 'bg-green-100 text-green-600' : 'bg-white hover:bg-gray-100 active:bg-gray-200 text-gray-500 border border-gray-200'}`}
                  >
                    <Copy className="w-4 h-4" strokeWidth={1.5} />
                  </button>
                  {copied && <span className="text-xs text-green-600 font-medium">Copied!</span>}
                </div>

                {/* Info-Cluster: Content type and category badges */}
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full flex items-center gap-1 ${contentTypeInfo.color}`}>
                    {contentTypeInfo.label}
                  </span>
                  {link.category && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full border border-gray-200">
                      {capitalizeCategoryName(link.category)}
                    </span>
                  )}
                  {link.collectionId && (
                    <span className="px-2 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-full flex items-center gap-1 border border-green-200">
                      <Folder size={14} strokeWidth={1.5} />
                      {getCollectionName(link.collectionId)}
                    </span>
                  )}
                </div>

                {/* Date and Clicks - Single horizontal row */}
                <div className="flex flex-wrap items-center gap-2 text-[12px] text-gray-500 mb-3">
                  <div className="flex items-center gap-1">
                    <Clock size={14} strokeWidth={1.5} />
                    <span>{formatDate(link.createdAt)}</span>
                  </div>
                  <span className="text-gray-300">•</span>
                  <div className="flex items-center gap-1">
                    <MousePointer size={14} strokeWidth={1.5} />
                    <span>{localClickCount} {localClickCount === 1 ? 'visit' : 'visits'}</span>
                  </div>
                </div>

                {/* Open Link Button - Primary full-width */}
                <a 
                  href={link.url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-base font-medium rounded-lg touch-manipulation shadow-sm mb-3"
                >
                  <ExternalLink className="w-5 h-5" strokeWidth={1.5} /> Open Link
                </a>

                {/* Thumb-Friendly Actions - 4 icons with labels */}
                <div className="flex flex-row justify-around items-center gap-1 sm:gap-2 pt-2 border-t border-gray-100">
                  <button 
                    onClick={startEditing} 
                    className="flex flex-col items-center justify-center gap-1.5 px-4 py-3 sm:px-5 sm:py-4 min-h-[64px] sm:min-h-[72px] min-w-[64px] sm:min-w-[72px] text-gray-600 hover:text-gray-900 hover:bg-gray-50 active:bg-gray-100 rounded-lg transition-all duration-150 touch-manipulation"
                    aria-label="Edit link"
                  >
                    <Edit className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={1.5} />
                    <span className="text-xs sm:text-sm font-medium">Edit</span>
                  </button>
                  <button 
                    onClick={() => handleAction('toggleFavorite')} 
                    className={`flex flex-col items-center justify-center gap-1.5 px-4 py-3 sm:px-5 sm:py-4 min-h-[64px] sm:min-h-[72px] min-w-[64px] sm:min-w-[72px] rounded-lg transition-all duration-150 touch-manipulation hover:bg-gray-50 active:bg-gray-100 ${link.isFavorite ? 'text-amber-600 hover:text-amber-700' : 'text-gray-600 hover:text-gray-900'}`}
                    aria-label={link.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    <Star className={`w-5 h-5 sm:w-6 sm:h-6 ${link.isFavorite ? 'fill-current' : ''}`} strokeWidth={1.5} />
                    <span className="text-xs sm:text-sm font-medium">{link.isFavorite ? 'Favorited' : 'Favorite'}</span>
                  </button>
                  <button 
                    onClick={() => handleAction('toggleArchive')} 
                    className={`flex flex-col items-center justify-center gap-1.5 px-4 py-3 sm:px-5 sm:py-4 min-h-[64px] sm:min-h-[72px] min-w-[64px] sm:min-w-[72px] rounded-lg transition-all duration-150 touch-manipulation hover:bg-gray-50 active:bg-gray-100 ${link.isArchived ? 'text-green-600 hover:text-green-700' : 'text-gray-600 hover:text-gray-900'}`}
                    title={link.isArchived ? 'Unarchive this link' : 'Archive this link'}
                    aria-label={link.isArchived ? 'Unarchive link' : 'Archive link'}
                  >
                    <Archive className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={1.5} />
                    <span className="text-xs sm:text-sm font-medium">{link.isArchived ? 'Unarchive' : 'Archive'}</span>
                  </button>
                  <button 
                    onClick={() => handleAction('delete')} 
                    className="flex flex-col items-center justify-center gap-1.5 px-4 py-3 sm:px-5 sm:py-4 min-h-[64px] sm:min-h-[72px] min-w-[64px] sm:min-w-[72px] text-gray-600 hover:text-red-600 hover:bg-red-50 active:bg-red-100 rounded-lg transition-all duration-150 touch-manipulation"
                    aria-label="Delete link"
                  >
                    <Trash2 className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={1.5} />
                    <span className="text-xs sm:text-sm font-medium">Delete</span>
                  </button>
                </div>
              </>
            )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    )
  }

export const LinkCard = memo(LinkCardComponent)

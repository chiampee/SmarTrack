import React, { useEffect, useState, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { X, BarChart3, Settings, BookOpen, FileText, Wrench, Bookmark, LogOut, Star, Clock, Archive, Library, Edit2, Trash2, Home, ChevronDown, ChevronUp, PlayCircle, PenTool, Mic2, Tag, Image } from 'lucide-react'
import { useAuth0 } from '@auth0/auth0-react'
import { useBackendApi } from '../hooks/useBackendApi'
import { isAppError, getUserFriendlyMessage } from '../utils/errorHandler'
import { capitalizeCategoryName } from '../utils/categoryUtils'
import { Tooltip } from './Tooltip'
import { useIsTruncated } from '../hooks/useIsTruncated'
import type { ResourceTypeCounts } from '../context/ResourceTypeCountsContext'
import { RESOURCE_TYPES, defaultResourceTypeCounts, RESOURCE_TYPE_LABELS, type ResourceType } from '../constants/resourceTypes'
import type { LucideIcon } from 'lucide-react'

const CONTENT_TYPE_ICONS: Record<ResourceType, LucideIcon> = { Video: PlayCircle, Blog: FileText, PDF: PenTool, Images: Image, Audio: Mic2 }

interface Category {
  id: string
  name: string
  linkCount: number
}

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
  categories?: Category[]
  typeCounts?: ResourceTypeCounts
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, categories = [], typeCounts = defaultResourceTypeCounts }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, isAuthenticated, logout } = useAuth0()
  const { makeRequest } = useBackendApi()
  const [collections, setCollections] = useState<Array<{ id: string; name: string; linkCount?: number }>>([])
  const [isProjectsExpanded, setIsProjectsExpanded] = useState(true)
  const [isCategoriesExpanded, setIsCategoriesExpanded] = useState(true)
  const [isLoadingCollections, setIsLoadingCollections] = useState(true)
  // Tablet mode: collapse to icons only between 768px-1024px
  const [isTabletMode, setIsTabletMode] = useState(false)
  const [displayName, setDisplayName] = useState<string | null>(null)

  // Detect active category filter from URL
  const searchParams = new URLSearchParams(location.search)
  const activeCategoryParam = searchParams.get('category')
  const activeCategory = activeCategoryParam 
    ? categories.find(c => c.name === activeCategoryParam || c.name.toLowerCase() === activeCategoryParam.toLowerCase())
    : null


  // Detect tablet mode (768px-1024px)
  useEffect(() => {
    const checkTabletMode = () => {
      setIsTabletMode(window.innerWidth >= 768 && window.innerWidth < 1024)
    }
    checkTabletMode()
    window.addEventListener('resize', checkTabletMode)
    return () => window.removeEventListener('resize', checkTabletMode)
  }, [])

  // Load user profile to get displayName
  useEffect(() => {
    let isMounted = true
    const loadProfile = async () => {
      if (!isAuthenticated || !user) return
      
      try {
        const profile = await makeRequest<{ displayName?: string | null }>('/api/users/profile')
        if (isMounted && profile.displayName) {
          setDisplayName(profile.displayName)
        }
      } catch (e) {
        // Silently ignore errors - will fall back to user.name
        console.debug('Failed to load profile for sidebar:', e)
      }
    }
    loadProfile()
    
    return () => {
      isMounted = false
    }
  }, [isAuthenticated, user, makeRequest])

  // Refresh displayName when sidebar opens (in case it was updated in settings)
  useEffect(() => {
    if (isOpen && isAuthenticated && user) {
      const refreshProfile = async () => {
        try {
          const profile = await makeRequest<{ displayName?: string | null }>('/api/users/profile')
          if (profile.displayName) {
            setDisplayName(profile.displayName)
          }
        } catch (e) {
          // Silently ignore errors
          console.debug('Failed to refresh profile:', e)
        }
      }
      refreshProfile()
    }
  }, [isOpen, isAuthenticated, user, makeRequest])

  // Listen for profile updates from Settings page
  useEffect(() => {
    const handleProfileUpdate = async () => {
      if (isAuthenticated && user) {
        try {
          const profile = await makeRequest<{ displayName?: string | null }>('/api/users/profile')
          if (profile.displayName) {
            setDisplayName(profile.displayName)
          }
        } catch (e) {
          console.debug('Failed to refresh profile on update:', e)
        }
      }
    }

    window.addEventListener('profileUpdated', handleProfileUpdate)
    return () => {
      window.removeEventListener('profileUpdated', handleProfileUpdate)
    }
  }, [isAuthenticated, user, makeRequest])

  useEffect(() => {
    let isMounted = true
    const load = async () => {
      try {
        if (!isAuthenticated) {
          setIsLoadingCollections(false)
          return
        }
        setIsLoadingCollections(true)
        // Wait a bit longer for token to be available and to avoid race conditions with Dashboard
        // This gives Dashboard's initial load priority
        await new Promise(resolve => setTimeout(resolve, 500))
        
        if (!isMounted) return
        
        const cols = await makeRequest<Array<{ id: string; name: string }>>('/api/folders')
        
        if (isMounted) {
          setCollections(cols || [])
          setIsLoadingCollections(false)
        }
      } catch (e) {
        // Silently ignore common errors during initialization
        const error = e instanceof Error ? e : new Error(String(e))
        const errorMsg = error.message.toLowerCase()
        
        // Only log unexpected errors (not auth or timeout issues)
        if (!errorMsg.includes('authentication required') && 
            !errorMsg.includes('timeout') &&
            isMounted) {
          console.error('Failed to load collections:', error.message)
        }
        if (isMounted) {
          setIsLoadingCollections(false)
        }
      }
    }
    load()
    
    return () => {
      isMounted = false
    }
  }, [isAuthenticated, makeRequest])

  const renameCollection = async (id: string, currentName: string) => {
    const newName = prompt('Rename collection', currentName)
    if (!newName || newName.trim() === '' || newName === currentName) return
    try {
      await makeRequest(`/api/folders/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ name: newName.trim() }),
      })
      setCollections(prev => prev.map(c => (c.id === id ? { ...c, name: newName.trim() } : c)))
    } catch (e) {
      alert('Failed to rename collection')
    }
  }

  const deleteCollection = async (id: string, name: string) => {
    if (!confirm(`Delete collection "${name}"? This won't delete the links; they will appear under All Links.`)) return
    try {
      await makeRequest(`/api/folders/${id}`, { method: 'DELETE' })
      setCollections(prev => prev.filter(c => c.id !== id))
      onClose()
    } catch (e) {
      alert('Failed to delete collection')
    }
  }

  const renameCategory = async (currentName: string, linkCount: number) => {
    const newName = prompt(`Rename category "${currentName}" (will update ${linkCount} links)`, currentName)
    if (!newName || newName.trim() === '' || newName === currentName) return
    try {
      await makeRequest(`/api/types/${encodeURIComponent(currentName)}`, {
        method: 'PUT',
        body: JSON.stringify({ newName: newName.trim() }),
      })
      window.location.reload() // Refresh to show updated categories
    } catch (e: any) {
      // Extract error message from various error types
      let errorMessage = 'Unknown error'
      if (isAppError(e)) {
        errorMessage = getUserFriendlyMessage(e)
      } else if (e?.message) {
        errorMessage = e.message
      } else if (typeof e === 'string') {
        errorMessage = e
      } else if (e instanceof Error) {
        errorMessage = e.message
      }
      console.error('Failed to rename category:', e)
      alert(`Failed to rename category: ${errorMessage}`)
    }
  }

  const deleteCategory = async (name: string, linkCount: number) => {
    if (!confirm(`Delete category "${name}"? ${linkCount} links will be moved to "other".`)) return
    try {
      await makeRequest(`/api/types/${encodeURIComponent(name)}`, { method: 'DELETE' })
      window.location.reload() // Refresh to show updated categories
    } catch (e) {
      alert('Failed to delete category')
    }
  }

  const isActivePath = (to: string) => {
    return location.pathname + location.search === to
  }

  const isSettingsActive = location.pathname === '/settings'

  // Component for tooltip that detects truncation
  const TruncatedTooltip: React.FC<{ text: string; isTabletMode: boolean; children: React.ReactElement }> = ({ text, isTabletMode, children }) => {
    const textRef = useRef<HTMLElement | null>(null)
    const isTruncated = useIsTruncated(textRef)
    
    // Clone the child element and add ref callback
    const childWithRef = React.cloneElement(children, {
      ref: (node: HTMLElement | null) => {
        // Use a mutable ref object
        (textRef as React.MutableRefObject<HTMLElement | null>).current = node
        // Preserve existing ref if any
        const originalRef = (children as any).ref
        if (typeof originalRef === 'function') {
          originalRef(node)
        } else if (originalRef && typeof originalRef === 'object' && 'current' in originalRef) {
          (originalRef as React.MutableRefObject<HTMLElement | null>).current = node
        }
      }
    })

    return (
      <Tooltip content={text} disabled={!isTabletMode && !isTruncated}>
        {childWithRef}
      </Tooltip>
    )
  }

  return (
    <>
      {/* Overlay for mobile - with backdrop blur */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[40] bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* ✅ MOBILE RESPONSIVE: Sidebar with better mobile sizing - floating navigation bar on desktop */}
      <aside
        className={`fixed z-[60] transform transition-all duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:!translate-x-0 lg:!block'
        } ${
          // Mobile: full sidebar, Tablet: icons only (w-20), Desktop: permanent fixed width (slightly wider for better text clarity)
          'w-[85vw] max-w-[300px] sm:w-72 md:w-20 lg:!w-72 lg:min-w-[288px] lg:left-0 lg:top-0 lg:h-full'
        } ${
          // Mobile: full height with border, Desktop: permanent sidebar
          'top-0 left-0 h-full border-r border-gray-100 bg-white shadow-xl shadow-gray-900/5 lg:shadow-none lg:!block'
        }`}
        aria-hidden={typeof window !== 'undefined' && window.innerWidth < 1024 ? !isOpen : false}
      >
        <div className="flex flex-col h-full">
          {/* ✅ Premium Mobile: User Profile Section - Minimalist design */}
          {isAuthenticated && user && (
            <div className="p-6 sm:p-5 lg:border-b-0 border-b border-slate-200/80 flex items-center gap-4 flex-shrink-0">
              <div className="relative flex-shrink-0">
                <img
                  src={user.picture}
                  alt={user.name}
                  className="w-14 h-14 sm:w-12 sm:h-12 lg:w-12 lg:h-12 rounded-full border-2 border-gray-200/60 shadow-sm"
                />
              </div>
              <div className="flex-1 min-w-0 md:hidden lg:block">
                <TruncatedTooltip text={displayName || user.name || user.email || ''} isTabletMode={isTabletMode}>
                  <p 
                    className="text-lg sm:text-base lg:text-base font-bold text-gray-900 truncate whitespace-nowrap"
                    title={displayName || user.name || user.email || ''}
                  >
                    {displayName || user.name || user.email}
                  </p>
                </TruncatedTooltip>
                <TruncatedTooltip text={user.email || ''} isTabletMode={isTabletMode}>
                  <p 
                    className="text-xs text-gray-400 truncate whitespace-nowrap mt-0.5"
                    title={user.email || ''}
                  >
                    {user.email}
                  </p>
                </TruncatedTooltip>
              </div>
              <button
                onClick={onClose}
                className="lg:hidden p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-50 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation flex-shrink-0"
                aria-label="Close sidebar"
              >
                <X className="w-5 h-5" strokeWidth={1.5} />
              </button>
            </div>
          )}

          {/* ✅ Premium Mobile: Header - Minimalist design */}
          <div className="mt-2 sm:mt-0 p-4 sm:p-4 lg:border-b-0 border-b border-slate-200/80 flex items-center justify-between">
            <Tooltip content="Navigation" disabled={!isTabletMode}>
              <h1 className="text-base sm:text-lg lg:text-base font-bold text-gray-900 md:hidden lg:inline">Navigation</h1>
            </Tooltip>
          </div>

          {/* Active Filter Badge */}
          {activeCategory && (
            <div className="px-4 pb-3">
              <div className="flex items-center gap-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-3 py-1.5 text-xs font-medium">
                <span className="flex-1 truncate">
                  Filter by {capitalizeCategoryName(activeCategory.name)} ({activeCategory.linkCount} links)
                </span>
                <button
                  onClick={() => {
                    navigate('/main')
                    if (window.innerWidth < 1024) {
                      onClose()
                    }
                  }}
                  className="flex-shrink-0 p-0.5 hover:bg-blue-100 rounded-full transition-colors"
                  aria-label="Clear filter"
                  title="Clear filter"
                >
                  <X className="w-3.5 h-3.5" strokeWidth={2} />
                </button>
              </div>
            </div>
          )}

          {/* ✅ MOBILE RESPONSIVE: Navigation with better touch targets - optimized padding for more space */}
          <nav className="flex-1 p-3 sm:p-4 lg:p-5 space-y-1 overflow-y-auto custom-scrollbar">
            {/* Main */}
            <Link
              to="/main"
              onClick={() => {
                // Close sidebar on mobile when navigating
                if (window.innerWidth < 1024) {
                  onClose()
                  // Scroll to top of page on mobile
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }
              }}
              className={`group flex items-center gap-3 px-4 py-3.5 sm:py-3 rounded-lg transition-all duration-200 ease-in-out min-h-[44px] sm:min-h-0 touch-manipulation relative whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                location.pathname === '/main' || location.pathname === '/'
                  ? 'bg-gray-100 text-gray-900 shadow-md shadow-gray-200/50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              {(location.pathname === '/main' || location.pathname === '/') && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-blue-600 rounded-r sidebar-active-indicator" />
              )}
              <Home className={`w-5 h-5 sm:w-5 sm:h-5 flex-shrink-0 ${location.pathname === '/main' || location.pathname === '/' ? 'text-blue-600' : 'text-gray-500 opacity-50'}`} strokeWidth={1.5} />
              <Tooltip content="Feed" disabled={!isTabletMode}>
                <span 
                  className="font-medium text-[15px] sm:text-sm lg:text-[15px] text-gray-900 flex-shrink-0 truncate md:hidden lg:inline"
                  title="Feed"
                >
                  Feed
                </span>
              </Tooltip>
            </Link>

            {/* Resources – filter links by type (Video, Blog, PDF, Audio) */}
            <div className="mt-6 sm:mt-6 lg:mt-4 pt-2">
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-4 md:hidden lg:inline">Resources</div>
              <div className="space-y-0.5">
                {RESOURCE_TYPES.map((type) => {
                  const Icon = CONTENT_TYPE_ICONS[type]
                  const selectedType = new URLSearchParams(location.search).get('type')
                  const isActive = selectedType === type
                  const count = typeCounts[type] ?? 0
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => {
                        const p = new URLSearchParams(location.search)
                        p.delete('collection')
                        p.delete('filter')
                        p.delete('category')
                        if (isActive) {
                          p.delete('type')
                        } else {
                          p.set('type', type)
                        }
                        const qs = p.toString()
                        navigate(qs ? `/?${qs}` : '/')
                        if (window.innerWidth < 1024) onClose()
                      }}
                      className={`flex items-center w-full px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 md:justify-center lg:justify-start rounded-lg transition-all duration-200 ${
                        isActive ? 'border-l-4 border-blue-600 bg-blue-50/50 text-blue-600' : ''
                      }`}
                    >
                      <Icon className={`w-5 h-5 sm:w-4 sm:h-4 flex-shrink-0 ${isActive ? 'text-blue-600' : 'text-gray-500 opacity-50'}`} strokeWidth={1.5} />
                      <span className="ml-3 md:hidden lg:inline flex-1 text-left">{RESOURCE_TYPE_LABELS[type] ?? type}</span>
                      <span className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded-md ml-auto md:hidden lg:inline">{count}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* ✅ Premium Mobile: Projects Quick Filters - Minimalist design */}
            <div className="mt-6 sm:mt-8 lg:mt-4 pt-4 lg:pt-2">
              <Tooltip content="Projects" disabled={!isTabletMode}>
                <h3 className="text-[10px] font-medium text-gray-400 uppercase tracking-widest mb-3 px-2 whitespace-nowrap md:hidden lg:inline">Projects</h3>
              </Tooltip>
              <div className="space-y-1">
                <Link
                  to="/?filter=favorites"
                  onClick={() => {
                    if (window.innerWidth < 1024) {
                      onClose()
                    }
                  }}
                  className={`group flex items-center gap-3 px-3 py-3.5 sm:py-2.5 rounded-lg text-sm sm:text-sm transition-all duration-200 ease-in-out min-h-[44px] sm:min-h-0 touch-manipulation relative whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    isActivePath('/?filter=favorites')
                      ? 'bg-gray-100 text-gray-900 shadow-md shadow-gray-200/50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  {isActivePath('/?filter=favorites') && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-blue-600 rounded-r sidebar-active-indicator" />
                  )}
                  <Star className={`w-5 h-5 sm:w-4 sm:h-4 flex-shrink-0 ${isActivePath('/?filter=favorites') ? 'text-blue-600' : 'text-gray-500 opacity-50'}`} strokeWidth={1.5} />
                  <Tooltip content="Favorites" disabled={!isTabletMode}>
                    <span 
                      className="font-medium text-[15px] sm:text-sm lg:text-[15px] text-gray-900 flex-shrink-0 truncate md:hidden lg:inline"
                      title="Favorites"
                    >
                      Favorites
                    </span>
                  </Tooltip>
                </Link>
                <Link
                  to="/?filter=recent"
                  onClick={() => {
                    if (window.innerWidth < 1024) {
                      onClose()
                    }
                  }}
                  className={`group flex items-center gap-3 px-3 py-3.5 sm:py-2.5 rounded-lg text-sm sm:text-sm transition-all duration-200 ease-in-out min-h-[44px] sm:min-h-0 touch-manipulation relative whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    isActivePath('/?filter=recent')
                      ? 'bg-gray-100 text-gray-900 shadow-md shadow-gray-200/50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  {isActivePath('/?filter=recent') && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-blue-600 rounded-r sidebar-active-indicator" />
                  )}
                  <Clock className={`w-4 h-4 flex-shrink-0 ${isActivePath('/?filter=recent') ? 'text-blue-600' : 'text-gray-500 opacity-50'}`} strokeWidth={1.5} />
                  <Tooltip content="Recents" disabled={!isTabletMode}>
                    <span 
                      className="font-medium text-[15px] sm:text-sm lg:text-[15px] text-gray-900 flex-shrink-0 truncate md:hidden lg:inline"
                      title="Recents"
                    >
                      Recents
                    </span>
                  </Tooltip>
                </Link>
                <Link
                  to="/?filter=untagged"
                  onClick={() => {
                    if (window.innerWidth < 1024) {
                      onClose()
                    }
                  }}
                  className={`group flex items-center gap-3 px-3 py-3.5 sm:py-2.5 rounded-lg text-sm sm:text-sm transition-all duration-200 ease-in-out min-h-[44px] sm:min-h-0 touch-manipulation relative whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    isActivePath('/?filter=untagged')
                      ? 'bg-gray-100 text-gray-900 shadow-md shadow-gray-200/50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  {isActivePath('/?filter=untagged') && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-blue-600 rounded-r sidebar-active-indicator" />
                  )}
                  <Tag className={`w-5 h-5 sm:w-4 sm:h-4 flex-shrink-0 ${isActivePath('/?filter=untagged') ? 'text-blue-600' : 'text-gray-500 opacity-50'}`} strokeWidth={1.5} />
                  <Tooltip content="Untagged" disabled={!isTabletMode}>
                    <span 
                      className="font-medium text-[15px] sm:text-sm lg:text-[15px] text-gray-900 flex-shrink-0 truncate md:hidden lg:inline"
                      title="Untagged"
                    >
                      Untagged
                    </span>
                  </Tooltip>
                </Link>
                <Link
                  to="/?filter=archived"
                  onClick={() => {
                    if (window.innerWidth < 1024) {
                      onClose()
                    }
                  }}
                  className={`group flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200 ease-in-out min-h-[44px] sm:min-h-0 touch-manipulation relative whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    isActivePath('/?filter=archived')
                      ? 'bg-gray-100 text-gray-900 shadow-md shadow-gray-200/50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  {isActivePath('/?filter=archived') && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-blue-600 rounded-r sidebar-active-indicator" />
                  )}
                  <Archive className={`w-4 h-4 flex-shrink-0 ${isActivePath('/?filter=archived') ? 'text-blue-600' : 'text-gray-500 opacity-50'}`} strokeWidth={1.5} />
                  <Tooltip content="Vault" disabled={!isTabletMode}>
                    <span 
                      className="font-medium text-[15px] sm:text-sm lg:text-[15px] text-gray-900 flex-shrink-0 truncate md:hidden lg:inline"
                      title="Vault"
                    >
                      Vault
                    </span>
                  </Tooltip>
                </Link>
              </div>
              {/* My Projects */}
              {isLoadingCollections ? (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="h-4 w-24 bg-gray-200 rounded animate-pulse md:hidden lg:block" />
                    <div className="h-3 w-12 bg-gray-200 rounded animate-pulse md:hidden lg:block" />
                  </div>
                  <div className="space-y-1">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center gap-2 px-2 py-2.5 rounded-lg">
                        <div className="w-4 h-4 bg-gray-200 rounded animate-pulse flex-shrink-0" />
                        <div className="h-4 flex-1 bg-gray-200 rounded animate-pulse md:hidden lg:block" />
                        <div className="w-6 h-4 bg-gray-200 rounded-full animate-pulse md:hidden lg:block" />
                      </div>
                    ))}
                  </div>
                </div>
              ) : collections.length > 0 ? (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <Tooltip content="Workspaces" disabled={!isTabletMode}>
                      <button
                        onClick={() => setIsProjectsExpanded(!isProjectsExpanded)}
                        className="flex items-center gap-1.5 text-[10px] font-medium text-gray-400 uppercase tracking-widest hover:text-gray-600 transition-colors group whitespace-nowrap md:justify-center"
                      >
                        {isProjectsExpanded ? (
                          <ChevronDown className="w-3 h-3 group-hover:text-gray-600" strokeWidth={1.5} />
                        ) : (
                          <ChevronUp className="w-3 h-3 group-hover:text-gray-600" strokeWidth={1.5} />
                        )}
                        <span className="md:hidden lg:inline">Workspaces</span>
                      </button>
                    </Tooltip>
                    <Tooltip content="Create New Workspace" disabled={!isTabletMode}>
                      <Link 
                        to="/?createCollection=1" 
                        onClick={() => {
                          if (window.innerWidth < 1024) {
                            onClose()
                          }
                        }} 
                        className="text-xs text-blue-600 hover:underline md:hidden lg:inline"
                      >
                        + New
                      </Link>
                    </Tooltip>
                  </div>
                  {isProjectsExpanded && (
                    <div className="space-y-1 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                    {collections.map((c) => {
                      const to = `/?collection=${encodeURIComponent(c.id)}`
                      const active = isActivePath(to)
                      return (
                        <div 
                          key={c.id} 
                          className={`group flex items-center gap-2 px-2.5 sm:px-3 lg:px-3.5 py-3 sm:py-2.5 rounded-lg text-sm min-h-[44px] sm:min-h-0 transition-all duration-200 ease-in-out relative whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                            active 
                              ? 'bg-gray-100 text-gray-900 shadow-md shadow-gray-200/50' 
                              : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                          }`}
                          title={`View collection: ${c.name} (${c.linkCount || 0} links)`}
                        >
                          {active && (
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-blue-600 rounded-r sidebar-active-indicator" />
                          )}
                          <Link 
                            to={to} 
                            onClick={() => {
                              if (window.innerWidth < 1024) {
                                onClose()
                              }
                            }} 
                            className="flex items-center gap-2.5 sm:gap-3 lg:gap-3.5 flex-1 min-w-0 touch-manipulation"
                          >
                            <Library className={`w-5 h-5 sm:w-4 sm:h-4 flex-shrink-0 ${active ? 'text-blue-600' : 'text-gray-500 opacity-50'}`} />
                            <TruncatedTooltip text={c.name} isTabletMode={isTabletMode}>
                              <span 
                                className="flex-1 text-left text-[15px] sm:text-sm lg:text-[15px] font-medium text-gray-900 truncate min-w-[80px] md:hidden lg:inline leading-tight"
                                title={c.name}
                              >
                                {c.name}
                              </span>
                            </TruncatedTooltip>
                            {typeof c.linkCount === 'number' && (
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 md:hidden lg:inline ${
                                active ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-600'
                              }`}>
                                {c.linkCount}
                              </span>
                            )}
                          </Link>
                          <button
                            aria-label="Rename"
                            className="opacity-0 group-hover:opacity-100 sm:opacity-0 p-2 sm:p-1 rounded-lg hover:bg-slate-200 active:bg-slate-300 text-slate-600 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center touch-manipulation flex-shrink-0"
                            onClick={() => renameCollection(c.id, c.name)}
                          >
                            <Edit2 className="w-4 h-4 sm:w-3.5 sm:h-3.5" strokeWidth={1.5} />
                          </button>
                          <button
                            aria-label="Delete"
                            className="opacity-0 group-hover:opacity-100 sm:opacity-0 p-2 sm:p-1 rounded hover:bg-red-100 active:bg-red-200 text-red-600 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center touch-manipulation flex-shrink-0"
                            onClick={() => deleteCollection(c.id, c.name)}
                          >
                            <Trash2 className="w-4 h-4 sm:w-3.5 sm:h-3.5" strokeWidth={1.5} />
                          </button>
                        </div>
                      )
                    })}
                    </div>
                  )}
                </div>
              ) : (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <Tooltip content="Workspaces" disabled={!isTabletMode}>
                      <button
                        onClick={() => setIsProjectsExpanded(!isProjectsExpanded)}
                        className="flex items-center gap-1.5 text-[10px] font-medium text-gray-400 uppercase tracking-widest hover:text-gray-600 transition-colors group whitespace-nowrap md:justify-center"
                      >
                        {isProjectsExpanded ? (
                          <ChevronDown className="w-3 h-3 group-hover:text-gray-600" strokeWidth={1.5} />
                        ) : (
                          <ChevronUp className="w-3 h-3 group-hover:text-gray-600" strokeWidth={1.5} />
                        )}
                        <span className="md:hidden lg:inline">Workspaces</span>
                      </button>
                    </Tooltip>
                  </div>
                  {isProjectsExpanded && (
                    <p className="text-xs italic text-gray-400 px-2 py-2 md:hidden lg:block">Create a project to start</p>
                  )}
                </div>
              )}
            </div>

            {/* ✅ Premium Mobile: Categories Section - Minimalist design */}
            {categories.length > 0 && (
              <div className="mt-4 sm:mt-6 lg:mt-4 pt-4 lg:pt-2">
                <Tooltip content="Categories" disabled={!isTabletMode}>
                  <button
                    onClick={() => setIsCategoriesExpanded(!isCategoriesExpanded)}
                    className="flex items-center gap-1.5 text-[10px] font-medium text-gray-400 uppercase tracking-widest mb-3 px-2 hover:text-gray-600 transition-colors group w-full text-left whitespace-nowrap md:justify-center"
                  >
                    {isCategoriesExpanded ? (
                      <ChevronDown className="w-3 h-3 group-hover:text-gray-600" strokeWidth={1.5} />
                    ) : (
                      <ChevronUp className="w-3 h-3 group-hover:text-gray-600" strokeWidth={1.5} />
                    )}
                    <span className="md:hidden lg:inline">Categories</span>
                  </button>
                </Tooltip>
                {isCategoriesExpanded && (
                  <div className="space-y-1 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                  {categories.map((category, index) => {
                    const getIcon = () => {
                      const name = category.name.toLowerCase()
                      if (name.includes('research')) return <BookOpen className="w-4 h-4" strokeWidth={1.5} />
                      if (name.includes('article')) return <FileText className="w-4 h-4" strokeWidth={1.5} />
                      if (name.includes('tool')) return <Wrench className="w-4 h-4" strokeWidth={1.5} />
                      if (name.includes('reference')) return <Bookmark className="w-4 h-4" strokeWidth={1.5} />
                      return <BookOpen className="w-4 h-4" strokeWidth={1.5} />
                    }

                      const getColor = () => {
                        const name = category.name.toLowerCase()
                        if (name.includes('research')) return 'text-blue-600 bg-blue-100'
                        if (name.includes('article')) return 'text-green-600 bg-green-100'
                        if (name.includes('tool')) return 'text-orange-600 bg-orange-100'
                        if (name.includes('reference')) return 'text-purple-600 bg-purple-100'
                        return 'text-slate-600 bg-slate-100'
                      }

                    const to = `/?category=${encodeURIComponent(category.name)}`
                    const active = isActivePath(to)
                    return (
                        <div 
                        key={`${category.id}-${index}-${category.linkCount}`} 
                        className={`group flex items-center gap-2 px-2.5 sm:px-3 lg:px-3.5 py-3 sm:py-2.5 rounded-lg text-sm min-h-[44px] sm:min-h-0 transition-all duration-200 ease-in-out relative whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                          active ? 'bg-gray-100 text-gray-900 shadow-md shadow-gray-200/50' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                        }`}
                        title={`Filter by ${capitalizeCategoryName(category.name)} (${category.linkCount} links)`}
                      >
                        {active && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-blue-600 rounded-r sidebar-active-indicator" />
                        )}
                        <Link
                          to={to} 
                          onClick={() => {
                            if (window.innerWidth < 1024) {
                              onClose()
                            }
                          }} 
                          className="flex items-center gap-2.5 sm:gap-3 lg:gap-3.5 flex-1 min-w-0 touch-manipulation"
                        >
                          <div className={`p-1.5 sm:p-1 rounded flex-shrink-0 ${getColor()}`}>
                            {getIcon()}
                          </div>
                          <TruncatedTooltip text={capitalizeCategoryName(category.name)} isTabletMode={isTabletMode}>
                            <span 
                              className="flex-1 text-left text-[15px] sm:text-sm lg:text-[15px] font-medium text-gray-900 truncate min-w-[80px] md:hidden lg:inline leading-tight"
                              title={capitalizeCategoryName(category.name)}
                            >
                              {capitalizeCategoryName(category.name)}
                            </span>
                          </TruncatedTooltip>
                          {typeof category.linkCount === 'number' && (
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 md:hidden lg:inline ${
                              active ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-600'
                            }`}>
                              {category.linkCount}
                            </span>
                          )}
                        </Link>
                        <button
                          aria-label="Rename category"
                          className="opacity-0 group-hover:opacity-100 sm:opacity-0 p-2 sm:p-1 rounded hover:bg-gray-200 active:bg-gray-300 text-gray-600 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center touch-manipulation flex-shrink-0"
                          onClick={(e) => {
                            e.preventDefault()
                            renameCategory(category.name, category.linkCount || 0)
                          }}
                        >
                          <Edit2 className="w-4 h-4 sm:w-3.5 sm:h-3.5" strokeWidth={1.5} />
                        </button>
                        <button
                          aria-label="Delete category"
                          className="opacity-0 group-hover:opacity-100 sm:opacity-0 p-2 sm:p-1 rounded hover:bg-red-100 active:bg-red-200 text-red-600 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center touch-manipulation flex-shrink-0"
                          onClick={(e) => {
                            e.preventDefault()
                            deleteCategory(category.name, category.linkCount || 0)
                          }}
                        >
                          <Trash2 className="w-4 h-4 sm:w-3.5 sm:h-3.5" strokeWidth={1.5} />
                        </button>
                      </div>
                    )
                  })}
                  </div>
                )}
              </div>
            )}

            {/* ✅ Premium Mobile: Settings and Admin - Minimalist design */}
            <div className="mt-4 sm:mt-6 lg:mt-4 pt-4 lg:pt-2 space-y-1 sm:space-y-2">
              <Link
                to="/settings"
                onClick={() => {
                  if (window.innerWidth < 1024) {
                    onClose()
                  }
                }}
              className={`group flex items-center gap-3 px-4 py-3.5 sm:py-3 rounded-lg transition-all duration-200 ease-in-out min-h-[44px] sm:min-h-0 touch-manipulation relative whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                isSettingsActive
                  ? 'bg-gray-100 text-gray-900 shadow-md shadow-gray-200/50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              {isSettingsActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-blue-600 rounded-r sidebar-active-indicator" />
              )}
              <Settings className={`w-5 h-5 sm:w-5 sm:h-5 flex-shrink-0 ${isSettingsActive ? 'text-blue-600' : 'text-gray-500'}`} strokeWidth={1.5} />
              <Tooltip content="Settings" disabled={!isTabletMode}>
                <span 
                  className="font-medium text-[15px] sm:text-sm lg:text-[15px] text-gray-900 flex-shrink-0 truncate md:hidden lg:inline"
                  title="Settings"
                >
                  Settings
                </span>
              </Tooltip>
              </Link>
              
              {/* Admin Analytics - only show for admins */}
              {user?.email?.toLowerCase() === 'chaimpeer11@gmail.com' && (
                <Link
                  to="/analytics"
                  onClick={() => {
                    if (window.innerWidth < 1024) {
                      onClose()
                    }
                  }}
                  className={`group flex items-center gap-3 px-4 py-3.5 sm:py-3 rounded-lg transition-all duration-200 ease-in-out min-h-[44px] sm:min-h-0 touch-manipulation relative whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    location.pathname === '/analytics'
                      ? 'bg-gray-100 text-gray-900 shadow-md shadow-gray-200/50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  {location.pathname === '/analytics' && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-blue-600 rounded-r sidebar-active-indicator" />
                  )}
                  <BarChart3 className={`w-5 h-5 sm:w-5 sm:h-5 flex-shrink-0 ${location.pathname === '/analytics' ? 'text-blue-600' : 'text-gray-500'}`} strokeWidth={1.5} />
                  <Tooltip content="Analytics" disabled={!isTabletMode}>
                    <span className="font-medium text-[15px] sm:text-sm lg:text-[15px] text-gray-900 flex-shrink-0 truncate md:hidden lg:inline">Analytics</span>
                  </Tooltip>
                </Link>
              )}
            </div>
          </nav>

          {/* ✅ Premium Mobile: Footer - Minimalist design with whitespace separation - Sticky */}
          <div className="p-4 sm:p-6 lg:p-4 space-y-4 lg:space-y-2 border-t border-gray-100 bg-white mt-auto">
            {isAuthenticated && (
              <button
                onClick={() => {
                  logout({ logoutParams: { returnTo: window.location.origin } })
                  onClose()
                }}
                className="group flex items-center gap-3 px-4 py-3.5 sm:py-3 rounded-lg text-gray-600 hover:text-red-600 hover:bg-red-50 active:bg-red-100 transition-all duration-300 w-full min-h-[44px] sm:min-h-0 touch-manipulation whitespace-nowrap"
                aria-label="Logout"
              >
                <LogOut className="w-5 h-5 sm:w-5 sm:h-5 flex-shrink-0" strokeWidth={1.5} />
                <Tooltip content="Logout" disabled={!isTabletMode}>
                  <span 
                    className="font-medium text-[15px] sm:text-sm lg:text-[15px] text-gray-900 flex-shrink-0 truncate md:hidden lg:inline"
                    title="Logout"
                  >
                    Logout
                  </span>
                </Tooltip>
              </button>
            )}
            <div className="px-4 py-3 lg:py-2">
              <Tooltip content="Version 2.0 • Built for Focus" disabled={!isTabletMode}>
                <div className="text-[10px] lg:text-[9px] text-gray-400 text-center font-medium whitespace-nowrap md:hidden lg:inline">
                  Version 2.0 • Built for Focus
                </div>
              </Tooltip>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}

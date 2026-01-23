import React, { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { X, BarChart3, Settings, BookOpen, FileText, Wrench, Bookmark, LogOut, Star, Clock, Archive, Library, Edit2, Trash2, Home, ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from 'lucide-react'
import { useAuth0 } from '@auth0/auth0-react'
import { useBackendApi } from '../hooks/useBackendApi'
import { isAppError, getUserFriendlyMessage } from '../utils/errorHandler'
import { capitalizeCategoryName } from '../utils/categoryUtils'

interface Category {
  id: string
  name: string
  linkCount: number
}

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
  categories?: Category[]
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, categories = [] }) => {
  const location = useLocation()
  const { user, isAuthenticated, logout } = useAuth0()
  const { makeRequest } = useBackendApi()
  const [collections, setCollections] = useState<Array<{ id: string; name: string; linkCount?: number }>>([])
  const [isProjectsExpanded, setIsProjectsExpanded] = useState(true)
  const [isCategoriesExpanded, setIsCategoriesExpanded] = useState(true)
  // Default to mini mode on desktop for floating navigation bar
  const [isMiniMode, setIsMiniMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1024 // lg breakpoint
    }
    return false
  })
  const [displayName, setDisplayName] = useState<string | null>(null)

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
        if (!isAuthenticated) return
        // Wait a bit longer for token to be available and to avoid race conditions with Dashboard
        // This gives Dashboard's initial load priority
        await new Promise(resolve => setTimeout(resolve, 500))
        
        if (!isMounted) return
        
        const cols = await makeRequest<Array<{ id: string; name: string }>>('/api/folders')
        
        if (isMounted) {
          setCollections(cols || [])
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

  return (
    <>
      {/* Overlay for mobile - with backdrop blur */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* ✅ MOBILE RESPONSIVE: Sidebar with better mobile sizing - floating navigation bar on desktop */}
      <aside
        className={`fixed z-50 transform transition-all duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${
          // Mobile: full sidebar, Desktop: fixed narrow 64px rail
          isMiniMode 
            ? 'w-20 lg:w-16 lg:left-0 lg:top-0 lg:h-full lg:rounded-none lg:border-r lg:border-gray-200/60 lg:shadow-sm lg:bg-white/95 lg:backdrop-blur-md'
            : 'w-[85vw] max-w-[280px] sm:w-64 lg:w-16 lg:left-0 lg:top-0 lg:h-full lg:rounded-none lg:border-r lg:border-gray-200/60 lg:shadow-sm lg:bg-white/95 lg:backdrop-blur-md'
        } ${
          // Mobile: full height with border, Desktop: fixed rail
          'top-0 left-0 h-full border-r border-slate-200/80 shadow-xl shadow-gray-900/5 bg-white lg:shadow-none'
        }`}
        aria-hidden={!isOpen}
      >
        <div className="flex flex-col h-full">
          {/* ✅ Premium Mobile: User Profile Section - Minimalist design */}
          {isAuthenticated && user && (
            <div className={`${isMiniMode ? 'p-4 lg:p-3' : 'p-6 sm:p-5'} lg:border-b-0 border-b border-slate-200/80 flex items-center ${isMiniMode ? 'justify-center flex-col gap-2' : 'gap-4'}`}>
              <div className="relative">
                <img
                  src={user.picture}
                  alt={user.name}
                  className={`${isMiniMode ? 'w-10 h-10 lg:w-9 lg:h-9' : 'w-14 h-14 sm:w-12 sm:h-12'} rounded-full border-2 border-gray-200/60 shadow-sm flex-shrink-0`}
                />
                {isMiniMode && (
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                )}
              </div>
              {!isMiniMode && (
                <>
                  <div className="flex-1 min-w-0">
                    <p className="text-lg sm:text-base font-bold text-gray-900 truncate">
                      {displayName || user.name || user.email}
                    </p>
                    <p className="text-xs text-gray-400 break-words leading-tight mt-0.5" style={{ wordBreak: 'break-word' }}>
                      {user.email}
                    </p>
                  </div>
                  <button
                    onClick={onClose}
                    className="lg:hidden p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-50 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation"
                    aria-label="Close sidebar"
                  >
                    <X className="w-5 h-5" strokeWidth={1.5} />
                  </button>
                </>
              )}
            </div>
          )}

          {/* ✅ Premium Mobile: Header - Minimalist design */}
          <div className="mt-2 sm:mt-0 p-4 sm:p-4 lg:border-b-0 border-b border-slate-200/80 flex items-center justify-between">
            {!isMiniMode && (
              <h1 className="text-base sm:text-lg font-bold text-gray-900">Navigation</h1>
            )}
            {/* Mini mode toggle - desktop only */}
            <button
              onClick={() => setIsMiniMode(!isMiniMode)}
              className="hidden lg:flex items-center justify-center w-8 h-8 rounded-lg hover:bg-gray-100 transition-colors text-gray-600 hover:text-gray-900 ml-auto"
              aria-label={isMiniMode ? 'Expand sidebar' : 'Collapse sidebar'}
              title={isMiniMode ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isMiniMode ? <ChevronRight className="w-5 h-5" strokeWidth={1.5} /> : <ChevronLeft className="w-5 h-5" strokeWidth={1.5} />}
            </button>
          </div>

          {/* ✅ MOBILE RESPONSIVE: Navigation with better touch targets - optimized padding for more space */}
          <nav className={`flex-1 ${isMiniMode ? 'px-2 lg:px-1.5' : 'p-3 sm:p-4 lg:p-5'} space-y-1 lg:space-y-0.5 overflow-y-auto`}>
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
              className={`group flex items-center ${isMiniMode ? 'justify-center lg:px-2 lg:py-2.5' : 'gap-3 px-4 py-3.5 sm:py-3'} rounded-lg transition-all duration-200 ${isMiniMode ? 'lg:rounded-xl' : ''} min-h-[44px] sm:min-h-0 touch-manipulation relative ${
                location.pathname === '/main' || location.pathname === '/'
                  ? `${isMiniMode ? 'lg:bg-blue-50' : 'bg-gray-100'} text-gray-900`
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
              title={isMiniMode ? 'Feed' : undefined}
            >
              {(location.pathname === '/main' || location.pathname === '/') && (
                <div className={`absolute left-0 top-1/2 -translate-y-1/2 ${isMiniMode ? 'lg:w-1 lg:h-8' : 'w-[3px] h-6'} bg-blue-600 rounded-r`} />
              )}
              <Home className={`${isMiniMode ? 'w-5 h-5 lg:w-4.5 lg:h-4.5' : 'w-5 h-5 sm:w-5 sm:h-5'} flex-shrink-0 ${location.pathname === '/main' || location.pathname === '/' ? 'text-blue-600' : 'text-gray-500 opacity-50'}`} strokeWidth={1.5} />
              <span className={`font-medium text-base sm:text-sm lg:opacity-0 lg:group-hover:opacity-100 lg:absolute lg:left-full lg:ml-3 lg:px-2 lg:py-1 lg:bg-gray-900 lg:text-white lg:rounded-lg lg:text-xs lg:whitespace-nowrap lg:pointer-events-none lg:transition-opacity lg:z-50 ${isMiniMode ? 'hidden' : ''}`}>Feed</span>
            </Link>

            {/* ✅ Premium Mobile: Projects Quick Filters - Minimalist design */}
            <div className="mt-6 sm:mt-8 lg:mt-4 pt-4 lg:pt-2">
              {!isMiniMode && <h3 className="text-[10px] font-medium text-gray-400 uppercase tracking-widest mb-3 px-2">Projects</h3>}
              <div className="space-y-1">
                <Link
                  to="/?filter=favorites"
                  onClick={() => {
                    if (window.innerWidth < 1024) {
                      onClose()
                    }
                  }}
                  className={`group flex items-center ${isMiniMode ? 'justify-center lg:px-2 lg:py-2.5' : 'gap-3 px-3 py-3.5 sm:py-2.5'} rounded-lg ${isMiniMode ? 'lg:rounded-xl' : ''} text-sm sm:text-sm transition-all duration-200 min-h-[44px] sm:min-h-0 touch-manipulation relative ${
                    isActivePath('/?filter=favorites')
                      ? `${isMiniMode ? 'lg:bg-blue-50' : 'bg-gray-100'} text-gray-900`
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                  title={isMiniMode ? 'Favorites' : undefined}
                >
                  {isActivePath('/?filter=favorites') && (
                    <div className={`absolute left-0 top-1/2 -translate-y-1/2 ${isMiniMode ? 'lg:w-1 lg:h-8' : 'w-[3px] h-6'} bg-blue-600 rounded-r`} />
                  )}
                  <Star className={`${isMiniMode ? 'w-5 h-5 lg:w-4.5 lg:h-4.5' : 'w-5 h-5 sm:w-4 sm:h-4'} flex-shrink-0 ${isActivePath('/?filter=favorites') ? 'text-blue-600' : 'text-gray-500 opacity-50'}`} strokeWidth={1.5} />
                  <span className={`font-medium text-base sm:text-sm lg:opacity-0 lg:group-hover:opacity-100 lg:absolute lg:left-full lg:ml-3 lg:px-2 lg:py-1 lg:bg-gray-900 lg:text-white lg:rounded-lg lg:text-xs lg:whitespace-nowrap lg:pointer-events-none lg:transition-opacity lg:z-50 ${isMiniMode ? 'hidden' : ''}`}>Favorites</span>
                </Link>
                <Link
                  to="/?filter=recent"
                  onClick={() => {
                    if (window.innerWidth < 1024) {
                      onClose()
                    }
                  }}
                  className={`group flex items-center ${isMiniMode ? 'justify-center lg:px-2 lg:py-2.5' : 'gap-3 px-3 py-3.5 sm:py-2.5'} rounded-lg ${isMiniMode ? 'lg:rounded-xl' : ''} text-sm sm:text-sm transition-all duration-200 min-h-[44px] sm:min-h-0 touch-manipulation relative ${
                    isActivePath('/?filter=recent')
                      ? `${isMiniMode ? 'lg:bg-blue-50' : 'bg-gray-100'} text-gray-900`
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                  title={isMiniMode ? 'Recents' : undefined}
                >
                  {isActivePath('/?filter=recent') && (
                    <div className={`absolute left-0 top-1/2 -translate-y-1/2 ${isMiniMode ? 'lg:w-1 lg:h-8' : 'w-[3px] h-6'} bg-blue-600 rounded-r`} />
                  )}
                  <Clock className={`${isMiniMode ? 'w-5 h-5 lg:w-4.5 lg:h-4.5' : 'w-4 h-4'} flex-shrink-0 ${isActivePath('/?filter=recent') ? 'text-blue-600' : 'text-gray-500 opacity-50'}`} strokeWidth={1.5} />
                  <span className={`font-medium text-base sm:text-sm lg:opacity-0 lg:group-hover:opacity-100 lg:absolute lg:left-full lg:ml-3 lg:px-2 lg:py-1 lg:bg-gray-900 lg:text-white lg:rounded-lg lg:text-xs lg:whitespace-nowrap lg:pointer-events-none lg:transition-opacity lg:z-50 ${isMiniMode ? 'hidden' : ''}`}>Recents</span>
                </Link>
                <Link
                  to="/?filter=archived"
                  onClick={() => {
                    if (window.innerWidth < 1024) {
                      onClose()
                    }
                  }}
                  className={`group flex items-center ${isMiniMode ? 'justify-center lg:px-2 lg:py-2.5' : 'gap-3 px-3 py-2'} rounded-lg ${isMiniMode ? 'lg:rounded-xl' : ''} text-sm transition-all duration-200 min-h-[44px] sm:min-h-0 touch-manipulation relative ${
                    isActivePath('/?filter=archived')
                      ? `${isMiniMode ? 'lg:bg-blue-50' : 'bg-gray-100'} text-gray-900`
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                  title={isMiniMode ? 'Vault' : undefined}
                >
                  {isActivePath('/?filter=archived') && (
                    <div className={`absolute left-0 top-1/2 -translate-y-1/2 ${isMiniMode ? 'lg:w-1 lg:h-8' : 'w-[3px] h-6'} bg-blue-600 rounded-r`} />
                  )}
                  <Archive className={`${isMiniMode ? 'w-5 h-5 lg:w-4.5 lg:h-4.5' : 'w-4 h-4'} flex-shrink-0 ${isActivePath('/?filter=archived') ? 'text-blue-600' : 'text-gray-500 opacity-50'}`} strokeWidth={1.5} />
                  <span className={`font-medium text-base sm:text-sm lg:opacity-0 lg:group-hover:opacity-100 lg:absolute lg:left-full lg:ml-3 lg:px-2 lg:py-1 lg:bg-gray-900 lg:text-white lg:rounded-lg lg:text-xs lg:whitespace-nowrap lg:pointer-events-none lg:transition-opacity lg:z-50 ${isMiniMode ? 'hidden' : ''}`}>Vault</span>
                </Link>
              </div>
              {/* My Projects */}
              {collections.length > 0 && (
                <div className="mt-4">
                  {!isMiniMode && (
                    <div className="flex items-center justify-between mb-2">
                      <button
                        onClick={() => setIsProjectsExpanded(!isProjectsExpanded)}
                        className="flex items-center gap-1.5 text-[10px] font-medium text-gray-400 uppercase tracking-widest hover:text-gray-600 transition-colors group"
                      >
                        {isProjectsExpanded ? (
                          <ChevronDown className="w-3 h-3 group-hover:text-gray-600" strokeWidth={1.5} />
                        ) : (
                          <ChevronUp className="w-3 h-3 group-hover:text-gray-600" strokeWidth={1.5} />
                        )}
                        <span>Workspaces</span>
                      </button>
                      <Link 
                        to="/?createCollection=1" 
                        onClick={() => {
                          if (window.innerWidth < 1024) {
                            onClose()
                          }
                        }} 
                        className="text-xs text-blue-600 hover:underline"
                      >
                        + New
                      </Link>
                    </div>
                  )}
                  {(isProjectsExpanded || isMiniMode) && (
                    <div className="space-y-1 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                    {collections.map((c) => {
                      const to = `/?collection=${encodeURIComponent(c.id)}`
                      const active = isActivePath(to)
                      return (
                        <div 
                          key={c.id} 
                          className={`group flex items-center ${isMiniMode ? 'justify-center lg:px-2 lg:py-2.5' : 'gap-2 px-2 sm:px-2.5 lg:px-3 py-3 sm:py-2'} rounded-lg ${isMiniMode ? 'lg:rounded-xl' : ''} text-sm min-h-[44px] sm:min-h-0 transition-all duration-200 relative ${
                            active 
                              ? `${isMiniMode ? 'lg:bg-blue-50' : 'bg-gray-100'} text-gray-900` 
                              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                          }`}
                          title={isMiniMode ? `${c.name} (${c.linkCount || 0} links)` : `View collection: ${c.name} (${c.linkCount || 0} links)`}
                        >
                          {active && (
                            <div className={`absolute left-0 top-1/2 -translate-y-1/2 ${isMiniMode ? 'lg:w-1 lg:h-8' : 'w-[3px] h-6'} bg-blue-600 rounded-r`} />
                          )}
                          <Link 
                            to={to} 
                            onClick={() => {
                              if (window.innerWidth < 1024) {
                                onClose()
                              }
                            }} 
                            className={`flex items-center ${isMiniMode ? 'justify-center' : 'gap-2 sm:gap-2.5 lg:gap-3'} flex-1 min-w-0 touch-manipulation`}
                          >
                            <Library className={`${isMiniMode ? 'w-5 h-5 lg:w-4.5 lg:h-4.5' : 'w-5 h-5 sm:w-4 sm:h-4'} flex-shrink-0 ${active ? 'text-blue-600' : 'text-gray-500 opacity-50'}`} />
                            {!isMiniMode && (
                              <>
                                <span className="flex-1 text-left text-base sm:text-sm lg:text-base font-medium break-words hyphens-auto min-w-0" style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                                  {c.name}
                                </span>
                                {typeof c.linkCount === 'number' && (
                                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${
                                    active ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-600'
                                  }`}>
                                    {c.linkCount}
                                  </span>
                                )}
                              </>
                            )}
                          </Link>
                          {!isMiniMode && (
                            <>
                              <button
                                aria-label="Rename"
                                className="opacity-0 group-hover:opacity-100 sm:opacity-0 p-2 sm:p-1 rounded-lg hover:bg-slate-200 active:bg-slate-300 text-slate-600 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center touch-manipulation"
                                onClick={() => renameCollection(c.id, c.name)}
                              >
                                <Edit2 className="w-4 h-4 sm:w-3.5 sm:h-3.5" strokeWidth={1.5} />
                              </button>
                              <button
                                aria-label="Delete"
                                className="opacity-0 group-hover:opacity-100 sm:opacity-0 p-2 sm:p-1 rounded hover:bg-red-100 active:bg-red-200 text-red-600 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center touch-manipulation"
                                onClick={() => deleteCollection(c.id, c.name)}
                              >
                                <Trash2 className="w-4 h-4 sm:w-3.5 sm:h-3.5" strokeWidth={1.5} />
                              </button>
                            </>
                          )}
                        </div>
                      )
                    })}
                    </div>
                  )}
                </div>
              )}
              {collections.length === 0 && (
                <Link 
                  to="/?createCollection=1" 
                  onClick={() => {
                    if (window.innerWidth < 1024) {
                      onClose()
                    }
                  }} 
                  className="mt-3 inline-flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-gradient-to-br hover:from-slate-50 hover:via-blue-50/20 hover:to-indigo-50/10 rounded-xl transition-all duration-300"
                >
                  <span>+ Create New Project</span>
                </Link>
              )}
            </div>

            {/* ✅ Premium Mobile: Categories Section - Minimalist design */}
            {categories.length > 0 && (
              <div className="mt-4 sm:mt-6 lg:mt-4 pt-4 lg:pt-2">
                {!isMiniMode && (
                  <button
                    onClick={() => setIsCategoriesExpanded(!isCategoriesExpanded)}
                    className="flex items-center gap-1.5 text-[10px] font-medium text-gray-400 uppercase tracking-widest mb-3 px-2 hover:text-gray-600 transition-colors group w-full text-left"
                  >
                    {isCategoriesExpanded ? (
                      <ChevronDown className="w-3 h-3 group-hover:text-gray-600" strokeWidth={1.5} />
                    ) : (
                      <ChevronUp className="w-3 h-3 group-hover:text-gray-600" strokeWidth={1.5} />
                    )}
                    <span>Categories</span>
                  </button>
                )}
                {(isCategoriesExpanded || isMiniMode) && (
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
                        className={`group flex items-center ${isMiniMode ? 'justify-center' : 'gap-2'} px-2 sm:px-2.5 lg:px-3 py-3 sm:py-2 rounded-lg text-sm min-h-[44px] sm:min-h-0 transition-all duration-200 relative ${
                          active ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                        }`}
                        title={isMiniMode ? `${capitalizeCategoryName(category.name)} (${category.linkCount} links)` : `Filter by ${capitalizeCategoryName(category.name)} (${category.linkCount} links)`}
                        >
                          {active && (
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-blue-600 rounded-r" />
                          )}
                          <Link
                          to={to} 
                          onClick={() => {
                            if (window.innerWidth < 1024) {
                              onClose()
                            }
                          }} 
                          className={`flex items-center ${isMiniMode ? 'justify-center' : 'gap-2 sm:gap-2.5 lg:gap-3'} flex-1 min-w-0 touch-manipulation`}
                        >
                          <div className={`p-1.5 sm:p-1 rounded flex-shrink-0 ${getColor()}`}>
                            {getIcon()}
                          </div>
                          {!isMiniMode && (
                            <>
                              <span className="flex-1 text-left text-base sm:text-sm lg:text-base font-medium break-words hyphens-auto min-w-0" style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                                {capitalizeCategoryName(category.name)}
                              </span>
                              {typeof category.linkCount === 'number' && (
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${
                                  active ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-600'
                                }`}>
                                  {category.linkCount}
                                </span>
                              )}
                            </>
                          )}
                        </Link>
                        {!isMiniMode && (
                          <>
                            <button
                              aria-label="Rename category"
                              className="opacity-0 group-hover:opacity-100 sm:opacity-0 p-2 sm:p-1 rounded hover:bg-gray-200 active:bg-gray-300 text-gray-600 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center touch-manipulation"
                              onClick={(e) => {
                                e.preventDefault()
                                renameCategory(category.name, category.linkCount || 0)
                              }}
                            >
                              <Edit2 className="w-4 h-4 sm:w-3.5 sm:h-3.5" strokeWidth={1.5} />
                            </button>
                            <button
                              aria-label="Delete category"
                              className="opacity-0 group-hover:opacity-100 sm:opacity-0 p-2 sm:p-1 rounded hover:bg-red-100 active:bg-red-200 text-red-600 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center touch-manipulation"
                              onClick={(e) => {
                                e.preventDefault()
                                deleteCategory(category.name, category.linkCount || 0)
                              }}
                            >
                              <Trash2 className="w-4 h-4 sm:w-3.5 sm:h-3.5" strokeWidth={1.5} />
                            </button>
                          </>
                        )}
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
                className={`group flex items-center ${isMiniMode ? 'justify-center' : 'gap-3'} px-4 py-3.5 sm:py-3 rounded-lg transition-all duration-300 min-h-[44px] sm:min-h-0 touch-manipulation relative ${
                  isSettingsActive
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
                title={isMiniMode ? 'Settings' : undefined}
              >
                {isSettingsActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-blue-600 rounded-r" />
                )}
                <Settings className={`w-5 h-5 sm:w-5 sm:h-5 flex-shrink-0 ${isSettingsActive ? 'text-blue-600' : 'text-gray-500'}`} strokeWidth={1.5} />
                <span className={`font-medium text-base sm:text-sm lg:opacity-0 lg:group-hover:opacity-100 lg:absolute lg:left-full lg:ml-3 lg:px-2 lg:py-1 lg:bg-gray-900 lg:text-white lg:rounded-lg lg:text-xs lg:whitespace-nowrap lg:pointer-events-none lg:transition-opacity lg:z-50 ${isMiniMode ? 'hidden' : ''}`}>Settings</span>
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
                  className={`group flex items-center ${isMiniMode ? 'justify-center' : 'gap-3'} px-4 py-3.5 sm:py-3 rounded-lg transition-all duration-300 min-h-[44px] sm:min-h-0 touch-manipulation relative ${
                    location.pathname === '/analytics'
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                  title={isMiniMode ? 'Analytics' : undefined}
                >
                  {location.pathname === '/analytics' && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-blue-600 rounded-r" />
                  )}
                  <BarChart3 className={`w-5 h-5 sm:w-5 sm:h-5 flex-shrink-0 ${location.pathname === '/analytics' ? 'text-blue-600' : 'text-gray-500'}`} strokeWidth={1.5} />
                  <span className={`font-medium text-base sm:text-sm lg:opacity-0 lg:group-hover:opacity-100 lg:absolute lg:left-full lg:ml-3 lg:px-2 lg:py-1 lg:bg-gray-900 lg:text-white lg:rounded-lg lg:text-xs lg:whitespace-nowrap lg:pointer-events-none lg:transition-opacity lg:z-50 ${isMiniMode ? 'hidden' : ''}`}>Analytics</span>
                </Link>
              )}
            </div>
          </nav>

          {/* ✅ Premium Mobile: Footer - Minimalist design with whitespace separation */}
          <div className="p-4 sm:p-6 lg:p-4 space-y-4 lg:space-y-2">
            {isAuthenticated && (
              <button
                onClick={() => {
                  logout({ logoutParams: { returnTo: window.location.origin } })
                  onClose()
                }}
                className={`group flex items-center ${isMiniMode ? 'justify-center' : 'gap-3'} px-4 py-3.5 sm:py-3 rounded-lg text-gray-600 hover:text-red-600 hover:bg-red-50 active:bg-red-100 transition-all duration-300 w-full min-h-[44px] sm:min-h-0 touch-manipulation`}
                aria-label="Logout"
                title={isMiniMode ? 'Logout' : undefined}
              >
                <LogOut className="w-5 h-5 sm:w-5 sm:h-5 flex-shrink-0" strokeWidth={1.5} />
                <span className={`font-medium text-base sm:text-sm lg:opacity-0 lg:group-hover:opacity-100 lg:absolute lg:left-full lg:ml-3 lg:px-2 lg:py-1 lg:bg-gray-900 lg:text-white lg:rounded-lg lg:text-xs lg:whitespace-nowrap lg:pointer-events-none lg:transition-opacity lg:z-50 ${isMiniMode ? 'hidden' : ''}`}>Logout</span>
              </button>
            )}
            <div className={`${isMiniMode ? 'px-2 lg:px-1' : 'px-4'} py-3 lg:py-2`}>
              <div className={`text-[10px] lg:text-[9px] text-gray-400 ${isMiniMode ? 'text-center leading-tight' : 'text-center'} font-medium`}>
                {isMiniMode ? (
                  <>
                    <div className="lg:leading-tight">Version</div>
                    <div className="lg:leading-tight">2.0 •</div>
                    <div className="lg:leading-tight">Built for</div>
                    <div className="lg:leading-tight">Focus</div>
                  </>
                ) : (
                  'Version 2.0 • Built for Focus'
                )}
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}

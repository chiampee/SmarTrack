import React, { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { X, BarChart3, Settings, BookOpen, FileText, Wrench, Bookmark, LogOut, Star, Clock, Archive, Library, Edit2, Trash2, Home } from 'lucide-react'
import { useAuth0 } from '@auth0/auth0-react'
import { useBackendApi } from '../hooks/useBackendApi'
import { isAppError, getUserFriendlyMessage } from '../utils/errorHandler'

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

  useEffect(() => {
    let isMounted = true
    const load = async () => {
      try {
        if (!isAuthenticated) return
        // Wait a bit longer for token to be available and to avoid race conditions with Dashboard
        // This gives Dashboard's initial load priority
        await new Promise(resolve => setTimeout(resolve, 500))
        
        if (!isMounted) return
        
        const cols = await makeRequest<Array<{ id: string; name: string }>>('/api/collections')
        
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
      await makeRequest(`/api/collections/${id}`, {
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
      await makeRequest(`/api/collections/${id}`, { method: 'DELETE' })
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
      await makeRequest(`/api/categories/${encodeURIComponent(currentName)}`, {
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
      await makeRequest(`/api/categories/${encodeURIComponent(name)}`, { method: 'DELETE' })
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
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* ✅ MOBILE RESPONSIVE: Sidebar with better mobile sizing */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-72 sm:w-64 bg-white/95 backdrop-blur-sm border-r border-gray-200/60 shadow-xl transform transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* ✅ MOBILE RESPONSIVE: User Profile Section with better mobile layout */}
          {isAuthenticated && user && (
            <div className="p-4 sm:p-4 border-b border-gray-200/60 bg-gradient-to-r from-blue-50 to-purple-50 flex items-center gap-3">
              <img
                src={user.picture}
                alt={user.name}
                className="w-14 h-14 sm:w-12 sm:h-12 rounded-full border-2 border-blue-200 shadow-sm flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="text-base sm:text-sm font-semibold text-gray-900 truncate">
                  {user.name || user.email}
                </p>
                <p className="text-sm sm:text-xs text-gray-600 truncate">
                  {user.email}
                </p>
              </div>
              <button
                onClick={onClose}
                className="lg:hidden p-2.5 sm:p-2 text-gray-600 hover:text-gray-900 rounded-md hover:bg-gray-100 transition-colors min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center touch-manipulation"
                aria-label="Close sidebar"
              >
                <X className="w-6 h-6 sm:w-5 sm:h-5" />
              </button>
            </div>
          )}

          {/* ✅ MOBILE RESPONSIVE: Header with better mobile sizing */}
          <div className="p-4 sm:p-4 border-b border-gray-200/60 bg-gradient-to-r from-gray-50 to-blue-50/30 flex items-center justify-between">
            <h1 className="text-base sm:text-lg font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">Navigation</h1>
          </div>

          {/* ✅ MOBILE RESPONSIVE: Navigation with better touch targets */}
          <nav className="flex-1 p-4 sm:p-6 space-y-1 sm:space-y-2 overflow-y-auto">
            {/* Main */}
            <Link
              to="/main"
              onClick={onClose}
              className={`flex items-center gap-3 px-4 py-3.5 sm:py-3 rounded-lg transition-all duration-300 min-h-[44px] sm:min-h-0 touch-manipulation ${
                location.pathname === '/main' || location.pathname === '/'
                  ? 'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border border-blue-200 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50'
              }`}
            >
              <Home className={`w-5 h-5 sm:w-5 sm:h-5 flex-shrink-0 ${location.pathname === '/main' || location.pathname === '/' ? 'text-blue-600' : 'text-gray-500'}`} />
              <span className="font-medium text-base sm:text-sm">Main</span>
            </Link>

            {/* ✅ MOBILE RESPONSIVE: Projects Quick Filters with better touch targets */}
            <div className="mt-4 sm:mt-6 pt-4 border-t border-gray-200">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-2">Projects</h3>
              <div className="space-y-1">
                <Link
                  to="/?"
                  onClick={onClose}
                  className={`flex items-center gap-3 px-3 py-3.5 sm:py-2.5 rounded-lg text-sm sm:text-sm transition-all min-h-[44px] sm:min-h-0 touch-manipulation ${
                    isActivePath('/?')
                      ? 'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border border-blue-200 shadow-sm'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Library className="w-5 h-5 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span className="font-medium text-base sm:text-sm">Show All Links</span>
                </Link>
                <Link
                  to="/?filter=favorites"
                  onClick={onClose}
                  className={`flex items-center gap-3 px-3 py-3.5 sm:py-2.5 rounded-lg text-sm sm:text-sm transition-all min-h-[44px] sm:min-h-0 touch-manipulation ${
                    isActivePath('/?filter=favorites')
                      ? 'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border border-blue-200 shadow-sm'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Star className="w-5 h-5 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span className="font-medium text-base sm:text-sm">Favorites</span>
                </Link>
                <Link
                  to="/?filter=recent"
                  onClick={onClose}
                  className={`flex items-center gap-3 px-3 py-3.5 sm:py-2.5 rounded-lg text-sm sm:text-sm transition-all min-h-[44px] sm:min-h-0 touch-manipulation ${
                    isActivePath('/?filter=recent')
                      ? 'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border border-blue-200 shadow-sm'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  <span>Recent (Last 7 days)</span>
                </Link>
                <Link
                  to="/?filter=archived"
                  onClick={onClose}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${
                    isActivePath('/?filter=archived')
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Archive className="w-4 h-4" />
                  <span>Archived</span>
                </Link>
              </div>
              {/* My Projects */}
              {collections.length > 0 && (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">My Projects</h4>
                    <Link to="/?createCollection=1" onClick={onClose} className="text-xs text-blue-600 hover:underline">+ New</Link>
                  </div>
                  <div className="space-y-1">
                    {collections.map((c) => {
                      const to = `/?collection=${encodeURIComponent(c.id)}`
                      const active = isActivePath(to)
                      return (
                        <div 
                          key={c.id} 
                          className={`group flex items-center gap-2 px-3 py-3 sm:py-2 rounded-lg text-sm min-h-[44px] sm:min-h-0 transition-all duration-200 ${
                            active 
                              ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          <Link to={to} onClick={onClose} className="flex items-center gap-3 flex-1 min-w-0 touch-manipulation">
                            <Library className="w-5 h-5 sm:w-4 sm:h-4 flex-shrink-0" />
                            <span className="flex-1 text-left truncate text-base sm:text-sm font-medium">
                              {c.name}
                            </span>
                            {typeof c.linkCount === 'number' && (
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${
                                active ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-600'
                              }`}>
                                {c.linkCount}
                              </span>
                            )}
                          </Link>
                          <button
                            aria-label="Rename"
                            className="opacity-0 group-hover:opacity-100 sm:opacity-0 p-2 sm:p-1 rounded hover:bg-gray-200 active:bg-gray-300 text-gray-600 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center touch-manipulation"
                            onClick={() => renameCollection(c.id, c.name)}
                          >
                            <Edit2 className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                          </button>
                          <button
                            aria-label="Delete"
                            className="opacity-0 group-hover:opacity-100 sm:opacity-0 p-2 sm:p-1 rounded hover:bg-red-100 active:bg-red-200 text-red-600 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center touch-manipulation"
                            onClick={() => deleteCollection(c.id, c.name)}
                          >
                            <Trash2 className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
              {collections.length === 0 && (
                <Link to="/?createCollection=1" onClick={onClose} className="mt-3 inline-flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50 rounded-lg transition-all duration-300">
                  <span>+ Create New Project</span>
                </Link>
              )}
            </div>

            {/* ✅ MOBILE RESPONSIVE: Categories Section with better touch targets */}
            {categories.length > 0 && (
              <div className="mt-4 sm:mt-6 pt-4 border-t border-gray-200">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-2">Categories</h3>
                <div className="space-y-1">
                  {categories.map((category, index) => {
                    const getIcon = () => {
                      const name = category.name.toLowerCase()
                      if (name.includes('research')) return <BookOpen className="w-4 h-4" />
                      if (name.includes('article')) return <FileText className="w-4 h-4" />
                      if (name.includes('tool')) return <Wrench className="w-4 h-4" />
                      if (name.includes('reference')) return <Bookmark className="w-4 h-4" />
                      return <BookOpen className="w-4 h-4" />
                    }

                    const getColor = () => {
                      const name = category.name.toLowerCase()
                      if (name.includes('research')) return 'text-blue-600 bg-blue-100'
                      if (name.includes('article')) return 'text-green-600 bg-green-100'
                      if (name.includes('tool')) return 'text-orange-600 bg-orange-100'
                      if (name.includes('reference')) return 'text-purple-600 bg-purple-100'
                      return 'text-gray-600 bg-gray-100'
                    }

                    const to = `/?category=${encodeURIComponent(category.name)}`
                    const active = isActivePath(to)
                    return (
                      <div key={`${category.id}-${index}-${category.linkCount}`} className={`group flex items-center gap-2 px-3 py-3 sm:py-2 text-sm rounded-lg transition-colors min-h-[44px] sm:min-h-0 ${
                        active ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'text-gray-700 hover:bg-gray-100'
                      }`}>
                        <Link to={to} onClick={onClose} className="flex items-center gap-3 flex-1 min-w-0 touch-manipulation">
                          <div className={`p-1.5 sm:p-1 rounded flex-shrink-0 ${getColor()}`}>
                            {getIcon()}
                          </div>
                          <span className="flex-1 text-left truncate text-base sm:text-sm font-medium">{category.name}</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium transition-colors flex-shrink-0 ${
                            active ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-600 group-hover:bg-blue-100 group-hover:text-blue-700'
                          }`}>
                            {category.linkCount}
                          </span>
                        </Link>
                        <button
                          aria-label="Rename category"
                          className="opacity-0 group-hover:opacity-100 sm:opacity-0 p-2 sm:p-1 rounded hover:bg-gray-200 active:bg-gray-300 text-gray-600 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center touch-manipulation"
                          onClick={(e) => {
                            e.preventDefault()
                            renameCategory(category.name, category.linkCount || 0)
                          }}
                        >
                          <Edit2 className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                        </button>
                        <button
                          aria-label="Delete category"
                          className="opacity-0 group-hover:opacity-100 sm:opacity-0 p-2 sm:p-1 rounded hover:bg-red-100 active:bg-red-200 text-red-600 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center touch-manipulation"
                          onClick={(e) => {
                            e.preventDefault()
                            deleteCategory(category.name, category.linkCount || 0)
                          }}
                        >
                          <Trash2 className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* ✅ MOBILE RESPONSIVE: Settings and Admin with better touch targets */}
            <div className="mt-4 sm:mt-6 pt-4 border-t border-gray-200 space-y-1 sm:space-y-2">
              <Link
                to="/settings"
                onClick={onClose}
                className={`flex items-center gap-3 px-4 py-3.5 sm:py-3 rounded-lg transition-all duration-300 min-h-[44px] sm:min-h-0 touch-manipulation ${
                  isSettingsActive
                    ? 'bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 border border-blue-200 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50'
                }`}
              >
                <Settings className={`w-5 h-5 sm:w-5 sm:h-5 flex-shrink-0 ${isSettingsActive ? 'text-blue-600' : 'text-gray-500'}`} />
                <span className="font-medium text-base sm:text-sm">Settings</span>
              </Link>
              
              {/* Admin Analytics - only show for admins */}
              {user?.email?.toLowerCase() === 'chaimpeer11@gmail.com' && (
                <Link
                  to="/analytics"
                  onClick={onClose}
                  className={`flex items-center gap-3 px-4 py-3.5 sm:py-3 rounded-lg transition-all duration-300 min-h-[44px] sm:min-h-0 touch-manipulation ${
                    location.pathname === '/analytics'
                      ? 'bg-gradient-to-r from-purple-50 to-pink-50 text-purple-700 border border-purple-200 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50'
                  }`}
                >
                  <BarChart3 className={`w-5 h-5 sm:w-5 sm:h-5 flex-shrink-0 ${location.pathname === '/analytics' ? 'text-purple-600' : 'text-gray-500'}`} />
                  <span className="font-medium text-base sm:text-sm">Analytics</span>
                </Link>
              )}
            </div>
          </nav>

          {/* ✅ MOBILE RESPONSIVE: Footer with better touch targets */}
          <div className="p-4 sm:p-6 border-t border-gray-200/60 bg-gradient-to-r from-gray-50 to-blue-50/30 space-y-3">
            {isAuthenticated && (
              <button
                onClick={() => {
                  logout({ logoutParams: { returnTo: window.location.origin } })
                  onClose()
                }}
                className="flex items-center gap-3 px-4 py-3.5 sm:py-3 rounded-lg text-gray-600 hover:text-red-600 hover:bg-red-50 active:bg-red-100 transition-all duration-300 w-full min-h-[44px] sm:min-h-0 touch-manipulation"
                aria-label="Logout"
              >
                <LogOut className="w-5 h-5 sm:w-5 sm:h-5 flex-shrink-0" />
                <span className="font-medium text-base sm:text-sm">Logout</span>
              </button>
            )}
            <div className="text-xs text-gray-600 text-center font-medium">
              SmarTrack v1.0
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}

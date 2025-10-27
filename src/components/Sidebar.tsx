import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { X, BarChart3, Settings, BookOpen, FileText, Wrench, Bookmark, LogOut } from 'lucide-react'
import { useAuth0 } from '@auth0/auth0-react'

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

  const navItems = [
    { path: '/', label: 'Dashboard', icon: BarChart3 },
    { path: '/settings', label: 'Settings', icon: Settings },
  ]

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-white/95 backdrop-blur-sm border-r border-gray-200/60 shadow-xl transform transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* User Profile Section */}
          {isAuthenticated && user && (
            <div className="p-4 border-b border-gray-200/60 bg-gradient-to-r from-blue-50 to-purple-50 flex items-center gap-3">
              <img
                src={user.picture}
                alt={user.name}
                className="w-12 h-12 rounded-full border-2 border-blue-200 shadow-sm"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {user.name || user.email}
                </p>
                <p className="text-xs text-gray-600 truncate">
                  {user.email}
                </p>
              </div>
              <button
                onClick={onClose}
                className="lg:hidden p-2 text-gray-600 hover:text-gray-900 rounded-md hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Header */}
          <div className="p-4 border-b border-gray-200/60 bg-gradient-to-r from-gray-50 to-blue-50/30 flex items-center justify-between">
            <h1 className="text-lg font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">Navigation</h1>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-6 space-y-2 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 border border-blue-200 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50'
                  }`}
                >
                  <item.icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-gray-500'}`} />
                  <span className="font-medium">{item.label}</span>
                </Link>
              )
            })}

            {/* Categories Section */}
            {categories.length > 0 && (
              <div className="mt-6 pt-4 border-t border-gray-200">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Categories</h3>
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

                    return (
                      <button
                        key={`${category.id}-${index}-${category.linkCount}`}
                        onClick={onClose}
                        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors group"
                      >
                        <div className={`p-1 rounded ${getColor()}`}>
                          {getIcon()}
                        </div>
                        <span className="flex-1 text-left">{category.name}</span>
                        <span className="px-2 py-0.5 bg-gray-200 text-gray-600 rounded-full text-xs font-medium group-hover:bg-blue-100 group-hover:text-blue-700 transition-colors">
                          {category.linkCount}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </nav>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200/60 bg-gradient-to-r from-gray-50 to-blue-50/30 space-y-3">
            {isAuthenticated && (
              <button
                onClick={() => {
                  logout({ logoutParams: { returnTo: window.location.origin } })
                  onClose()
                }}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 hover:text-red-600 hover:bg-red-50 transition-all duration-300 w-full"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-medium">Logout</span>
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

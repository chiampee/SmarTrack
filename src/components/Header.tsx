import React from 'react'
import { Menu, Plus } from 'lucide-react'
import { Link } from 'react-router-dom'

interface HeaderProps {
  onMenu: () => void
  onAddLink?: () => void
}

export const Header: React.FC<HeaderProps> = ({ onMenu, onAddLink }) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-30 bg-white/90 backdrop-blur-sm border-b border-gray-200/60 px-4 py-3 lg:pl-4 lg:pr-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-3">
          {/* ✅ MOBILE RESPONSIVE: Hamburger menu with better touch target */}
          <button
            onClick={onMenu}
            className="lg:hidden p-2.5 sm:p-2 text-gray-600 hover:text-gray-900 rounded-md hover:bg-gray-100 active:bg-gray-200 transition-colors min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center touch-manipulation"
            aria-label="Toggle navigation menu"
            aria-expanded="false"
          >
            <Menu className="w-6 h-6 sm:w-6 sm:h-6" />
          </button>
          <Link to="/" className="flex items-center gap-2">
            <img 
              src="/logo.svg" 
              alt="SmarTrack" 
              className="h-8 w-auto"
            />
          </Link>
          {/* ✅ MOBILE/TABLET: Add Link button next to logo */}
          {onAddLink && (
            <button
              onClick={onAddLink}
              className="lg:hidden px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-sm font-bold sm:font-semibold text-white bg-gradient-to-r from-blue-600 via-blue-600 to-indigo-600 rounded-lg hover:from-blue-700 hover:via-blue-700 hover:to-indigo-700 active:from-blue-800 active:via-blue-800 active:to-indigo-800 transition-all duration-200 shadow-md shadow-blue-500/25 hover:shadow-lg hover:shadow-blue-500/30 active:scale-[0.96] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center justify-center gap-1.5 sm:gap-2 min-h-[40px] sm:min-h-[42px] touch-manipulation"
              aria-label="Add new link"
            >
              <Plus className="w-4 h-4 sm:w-4.5 sm:h-4.5 flex-shrink-0" />
              <span className="hidden sm:inline">Add Link</span>
            </button>
          )}
        </div>
      </div>
    </header>
  )
}





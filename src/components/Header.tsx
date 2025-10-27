import React from 'react'
import { Menu } from 'lucide-react'
import { Link } from 'react-router-dom'

interface HeaderProps {
  onMenu: () => void
}

export const Header: React.FC<HeaderProps> = ({ onMenu }) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-30 bg-white/90 backdrop-blur-sm border-b border-gray-200/60 px-4 py-3 lg:pl-4 lg:pr-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <button
            onClick={onMenu}
            className="lg:hidden p-2 mr-2 text-gray-600 hover:text-gray-900 rounded-md hover:bg-gray-100 transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
          <Link to="/" className="flex items-center gap-2">
            <img 
              src="/logo.svg" 
              alt="SmarTrack" 
              className="h-8 w-auto"
            />
          </Link>
        </div>
      </div>
    </header>
  )
}





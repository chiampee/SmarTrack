import React from 'react';
import { Menu, BookOpen, Link as LinkIcon, CheckSquare, MessageSquare, RefreshCw } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { linkStore } from '../../stores/linkStore';

export const Header: React.FC<{ onMenu: () => void }> = ({ onMenu }) => {
  const location = useLocation();
  const fetchLinks = linkStore((state) => state.fetchLinks);

  const navItems = [
    { 
      path: '/', 
      label: 'Links', 
      icon: LinkIcon,
      description: 'Manage and organize saved web pages' 
    },
    { 
      path: '/boards', 
      label: 'Boards', 
      icon: BookOpen,
      description: 'Organize research into projects and collections (Coming Soon)' 
    },
    { 
      path: '/tasks', 
      label: 'Tasks', 
      icon: CheckSquare,
      description: 'Track research goals and action items (Coming Soon)' 
    },
    { 
      path: '/chat-history', 
      label: 'Chat', 
      icon: MessageSquare,
      description: 'AI conversation history and insights' 
    }
  ];



  return (
    <header className="fixed inset-x-0 top-0 z-30 flex h-12 items-center justify-between bg-gradient-to-r from-slate-900 via-gray-900 to-slate-800 px-4 text-white md:pl-64 shadow-xl border-b border-gray-700/50 backdrop-blur-sm">
      {/* Left Section - Logo and Mobile Menu */}
      <div className="flex items-center gap-4">
        <button 
          className="md:hidden p-2 hover:bg-white/10 rounded-lg transition-all duration-300 group" 
          onClick={onMenu}
          aria-label="Toggle menu"
        >
          <Menu size={16} className="group-hover:scale-110 transition-transform duration-300" />
        </button>
        <Link to="/" className="flex items-center gap-2 text-lg font-bold hover:text-gray-200 transition-all duration-300 group">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-md group-hover:shadow-lg group-hover:scale-105 transition-all duration-300">
            <BookOpen size={14} className="text-white" />
          </div>
          <span className="bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent">Smart Research Tracker</span>
        </Link>
      </div>
      
      {/* Center Section - Navigation Tabs */}
      <nav className="hidden md:flex gap-2 text-sm">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`group flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all duration-300 ${
                isActive
                  ? 'bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white shadow-lg'
                  : 'text-gray-300 hover:text-white hover:bg-white/10 hover:shadow-md backdrop-blur-sm'
              }`}
              title={item.description}
            >
              <Icon size={14} className={`${isActive ? 'text-white' : 'text-gray-400'} group-hover:scale-110 transition-transform duration-300`} />
              <span className="font-semibold text-sm">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Right Section - Refresh Button */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => fetchLinks()}
          className="group flex items-center gap-1.5 px-3 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 hover:shadow-md backdrop-blur-sm transition-all duration-300"
          title="Refresh links from extension"
        >
          <RefreshCw size={14} className="text-gray-400 group-hover:scale-110 transition-transform duration-300" />
          <span className="font-semibold text-sm hidden sm:inline">Refresh</span>
        </button>
      </div>


    </header>
  );
};

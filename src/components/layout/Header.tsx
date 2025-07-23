import React from 'react';
import { Menu, HelpCircle, Settings, BookOpen, Link as LinkIcon, CheckSquare, MessageSquare } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useSettingsStore } from '../../stores/settingsStore';
import { HelpTooltip } from '../Tooltip';

export const Header: React.FC<{ onMenu: () => void }> = ({ onMenu }) => {
  const location = useLocation();
  const { setShowOnboarding } = useSettingsStore();

  const navItems = [
    { 
      path: '/', 
      label: 'Boards', 
      icon: BookOpen,
      description: 'Organize research into projects and collections' 
    },
    { 
      path: '/links', 
      label: 'Links', 
      icon: LinkIcon,
      description: 'Manage and organize saved web pages' 
    },
    { 
      path: '/tasks', 
      label: 'Tasks', 
      icon: CheckSquare,
      description: 'Track research goals and action items' 
    },
    { 
      path: '/chat-history', 
      label: 'Chat', 
      icon: MessageSquare,
      description: 'AI conversation history and insights' 
    }
  ];

  const handleShowHelp = () => {
    setShowOnboarding(true);
  };

  return (
    <header className="fixed inset-x-0 top-0 z-30 flex h-14 items-center justify-between bg-gradient-to-r from-gray-800 to-gray-900 px-4 text-white md:pl-64 shadow-lg border-b border-gray-700">
      {/* Left Section - Logo and Mobile Menu */}
      <div className="flex items-center gap-4">
        <button 
          className="md:hidden p-2 hover:bg-gray-700 rounded-lg transition-all duration-200" 
          onClick={onMenu}
          aria-label="Toggle menu"
        >
          <Menu size={20} />
        </button>
        <Link to="/" className="flex items-center gap-2 text-lg font-bold hover:text-gray-200 transition-colors">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <BookOpen size={16} className="text-white" />
          </div>
          <span>Smart Research Tracker</span>
        </Link>
      </div>
      
      {/* Center Section - Navigation Tabs */}
      <nav className="hidden md:flex gap-1 text-sm">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                  : 'text-gray-300 hover:text-white hover:bg-gray-700 hover:shadow-md'
              }`}
              title={item.description}
            >
              <Icon size={16} className={isActive ? 'text-white' : 'text-gray-400'} />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Right Section - Actions */}
      <div className="flex items-center gap-3">
        <HelpTooltip 
          content="Show setup guide and help" 
          className="text-gray-300 hover:text-white transition-colors"
        />
        <button
          onClick={handleShowHelp}
          className="p-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-all duration-200"
          aria-label="Show help"
        >
          <HelpCircle size={18} />
        </button>
        <button
          className="p-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-all duration-200"
          aria-label="Settings"
        >
          <Settings size={18} />
        </button>
      </div>
    </header>
  );
};

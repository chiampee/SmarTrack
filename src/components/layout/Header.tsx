import React from 'react';
import { Menu, HelpCircle, Settings } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useSettingsStore } from '../../stores/settingsStore';
import { HelpTooltip } from '../Tooltip';

export const Header: React.FC<{ onMenu: () => void }> = ({ onMenu }) => {
  const location = useLocation();
  const { setShowOnboarding } = useSettingsStore();

  const navItems = [
    { path: '/', label: 'Boards', description: 'Organize research into projects' },
    { path: '/links', label: 'Links', description: 'Manage saved web pages' },
    { path: '/tasks', label: 'Tasks', description: 'Track research goals' },
    { path: '/chat-history', label: 'Chat', description: 'AI conversation history' }
  ];

  const handleShowHelp = () => {
    setShowOnboarding(true);
  };

  return (
    <header className="fixed inset-x-0 top-0 z-30 flex h-12 items-center justify-between bg-gray-800 px-4 text-white md:pl-64">
      <div className="flex items-center gap-3">
        <button 
          className="md:hidden p-1 hover:bg-gray-700 rounded transition-colors" 
          onClick={onMenu}
          aria-label="Toggle menu"
        >
          <Menu size={20} />
        </button>
        <Link to="/" className="text-lg font-semibold hover:text-gray-200 transition-colors">
          Smart Research Tracker
        </Link>
      </div>
      
      <nav className="hidden md:flex gap-1 text-sm">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              location.pathname === item.path
                ? 'bg-gray-700 text-white'
                : 'text-gray-300 hover:text-white hover:bg-gray-700'
            }`}
            title={item.description}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="flex items-center gap-2">
        <HelpTooltip 
          content="Show setup guide and help" 
          className="text-gray-300 hover:text-white transition-colors"
        />
        <button
          onClick={handleShowHelp}
          className="p-1.5 text-gray-300 hover:text-white hover:bg-gray-700 rounded transition-colors"
          aria-label="Show help"
        >
          <HelpCircle size={16} />
        </button>
      </div>
    </header>
  );
};

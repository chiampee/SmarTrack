import React from 'react';
import { Menu } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Header: React.FC<{ onMenu: () => void }> = ({ onMenu }) => (
  <header className="fixed inset-x-0 top-0 z-30 flex h-12 items-center justify-between bg-gray-800 px-4 text-white md:pl-64">
    <div className="flex items-center gap-3">
      <button className="md:hidden" onClick={onMenu}>
        <Menu size={20} />
      </button>
      <Link to="/" className="text-lg font-semibold">
        Smart Research Tracker
      </Link>
    </div>
    <nav className="hidden md:flex gap-4 text-sm">
      <Link to="/">Boards</Link>
      <Link to="/links">Links</Link>
      <Link to="/tasks">Tasks</Link>
    </nav>
  </header>
);

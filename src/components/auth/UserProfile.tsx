import React, { useState } from 'react';
import { User as UserIcon, ChevronDown } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { LogoutButton } from './LogoutButton';

export const UserProfile: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
      >
        {user.picture ? (
          <img
            src={user.picture}
            alt={user.name || 'User'}
            className="w-8 h-8 rounded-full"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
            <UserIcon className="w-5 h-5 text-white" />
          </div>
        )}
        <div className="hidden md:block text-left">
          <div className="text-sm font-semibold text-gray-900">
            {user.name || user.email}
          </div>
          <div className="text-xs text-gray-500">
            {user.email}
          </div>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
            <div className="px-4 py-3 border-b border-gray-200">
              <div className="text-sm font-semibold text-gray-900">
                {user.name}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {user.email}
              </div>
            </div>
            <div className="py-2">
              <LogoutButton />
            </div>
          </div>
        </>
      )}
    </div>
  );
};


import React from 'react';
import { LogIn } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export const LoginButton: React.FC = () => {
  const { loginWithRedirect } = useAuth();

  return (
    <button
      onClick={() => loginWithRedirect()}
      className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
    >
      <LogIn className="w-5 h-5" />
      <span>Sign In</span>
    </button>
  );
};


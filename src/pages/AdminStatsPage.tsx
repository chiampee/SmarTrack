import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';

export const AdminStatsPage: React.FC = () => {
  const { user } = useAuth();

  if (!user || !user.email) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-xl shadow-lg border border-red-200">
          <h2 className="text-2xl font-bold text-red-800 mb-4">Access Denied</h2>
          <p className="text-gray-700 mb-6">You do not have permission to view this page.</p>
          <Link to="/" className="text-blue-600 hover:underline">Go back to the main app</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <p className="text-gray-600">Simple admin dashboard - working version</p>
        <p className="text-sm text-gray-500 mt-2">Current user: {user.email}</p>
      </div>
    </div>
  );
};
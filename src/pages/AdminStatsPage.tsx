import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';

interface StatItem {
  label: string;
  value: string | number;
}

export const AdminStatsPage: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<StatItem[]>([]);
  const [loading, setLoading] = useState(true);

  const buildStats = async (): Promise<StatItem[]> => {
    return [
      { label: 'Total Users', value: 1 },
      { label: 'Total Links', value: 0 },
      { label: 'Total Chats', value: 0 },
      { label: 'Current User', value: user?.email || '—' },
    ];
  };

  useEffect(() => {
    let mounted = true;
    buildStats().then(async (s) => {
      if (mounted) {
        setStats(s);
        setLoading(false);
      }
    });
    
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mb-4"></div>
          <p className="text-lg text-gray-700 font-medium">Loading Admin Dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user || user.email !== 'chaimpeer11@gmail.com') {
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Simple admin overview - Updated</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
              <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
              <div className="text-sm text-gray-500">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Simple Usage Summary */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Usage Summary</h3>
            <p className="text-sm text-gray-500">Key metrics and activity overview</p>
          </div>
          
          <div className="px-6 py-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">1</div>
                <div className="text-sm text-blue-700 font-medium">Total Logins</div>
                <div className="text-xs text-blue-600 mt-1">Last 30 days</div>
              </div>
              
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">0</div>
                <div className="text-sm text-green-700 font-medium">Total Downloads</div>
                <div className="text-xs text-green-600 mt-1">Extension downloads</div>
              </div>
              
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">0</div>
                <div className="text-sm text-purple-700 font-medium">Total Installations</div>
                <div className="text-xs text-purple-600 mt-1">Extension installations</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
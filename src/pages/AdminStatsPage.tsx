import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../db/smartResearchDB';
import { Link } from 'react-router-dom';

interface StatItem {
  label: string;
  value: string | number;
}

export const AdminStatsPage: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<StatItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [userBreakdown, setUserBreakdown] = useState<Array<{ userId: string; email?: string; name?: string; picture?: string; links: number; chats: number; summaries: number; boards: number; tasks: number; lastActivity: string; sessions?: number; firstSeen?: string }>>([]);
  const [auth0Users, setAuth0Users] = useState<Array<{ user_id: string; name?: string; email?: string; picture?: string; email_verified?: boolean; created_at?: string; last_login?: string; logins_count?: number }>>([]);
  const [recent, setRecent] = useState<{ links7d: number; chats7d: number; users7d: number }>({ links7d: 0, chats7d: 0, users7d: 0 });
  const [traction, setTraction] = useState<{ dau: number; wau: number; mau: number; users: number; activated: number; aiUsers: number } | null>(null);
  const [busy, setBusy] = useState(false);

  const buildStats = async (): Promise<StatItem[]> => {
    const [links, boards, chats, convs, tasks, summaries, settings] = await Promise.all([
      db.links.count(),
      db.boards.count(),
      db.chatMessages.count(),
      db.conversations.count(),
      db.tasks.count(),
      db.summaries.count(),
      db.settings.count(),
    ]);

    const lastLink = await db.links.orderBy('createdAt').last();

    return [
      { label: 'Total Links', value: links },
      { label: 'Boards', value: boards },
      { label: 'Tasks', value: tasks },
      { label: 'AI Summaries', value: summaries },
      { label: 'Chat Messages', value: chats },
      { label: 'Conversations', value: convs },
      { label: 'Settings Rows', value: settings },
      { label: 'Last Link Added', value: lastLink?.createdAt ? new Date(lastLink.createdAt).toLocaleString() : '—' },
      { label: 'Current User', value: user?.email || '—' },
    ];
  };

  const fetchAuth0Users = async () => {
    try {
      const response = await fetch('/api/auth0-users');
      const data = await response.json();
      if (data.users) {
        setAuth0Users(data.users);
      }
    } catch (error) {
      console.error('Failed to fetch Auth0 users:', error);
    }
  };

  const backfillToCurrentUser = async () => {
    if (!user?.sub) return;
    const TARGET = user.sub;
    const LEGACY = 'local-dev-user';
    setBusy(true);
    try {
      const [links, boards, tasks, summaries, chatMessages, conversations, settings, userAudits] = await Promise.all([
        db.links.where({ userId: LEGACY }).toArray(),
        db.boards.where({ userId: LEGACY }).toArray(),
        db.tasks.where({ userId: LEGACY }).toArray(),
        db.summaries.where({ userId: LEGACY }).toArray(),
        db.chatMessages.where({ userId: LEGACY }).toArray(),
        db.conversations.where({ userId: LEGACY }).toArray(),
        db.settings.where({ userId: LEGACY }).toArray(),
        db.userAudits.where({ userId: LEGACY }).toArray(),
      ]);

      const updates = [
        ...links.map(l => ({ ...l, userId: TARGET })),
        ...boards.map(b => ({ ...b, userId: TARGET })),
        ...tasks.map(t => ({ ...t, userId: TARGET })),
        ...summaries.map(s => ({ ...s, userId: TARGET })),
        ...chatMessages.map(c => ({ ...c, userId: TARGET })),
        ...conversations.map(c => ({ ...c, userId: TARGET })),
        ...settings.map(s => ({ ...s, userId: TARGET })),
        ...userAudits.map(u => ({ ...u, userId: TARGET })),
      ];

      await db.transaction('rw', [db.links, db.boards, db.tasks, db.summaries, db.chatMessages, db.conversations, db.settings, db.userAudits], async () => {
        for (const update of updates) {
          if ('url' in update) await db.links.put(update as any);
          else if ('title' in update && 'color' in update) await db.boards.put(update as any);
          else if ('status' in update && 'priority' in update) await db.tasks.put(update as any);
          else if ('linkId' in update && 'kind' in update) await db.summaries.put(update as any);
          else if ('linkId' in update && 'conversationId' in update) await db.chatMessages.put(update as any);
          else if ('linkIdsKey' in update) await db.conversations.put(update as any);
          else if ('id' in update && !('url' in update) && !('title' in update)) await db.settings.put(update as any);
          else await db.userAudits.put(update as any);
        }
      });

      alert(`✅ Moved ${updates.length} records from ${LEGACY} to ${TARGET}`);
    } catch (err) {
      console.error('Backfill failed:', err);
      alert('❌ Backfill failed: ' + (err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    buildStats().then(async (s) => {
      if (mounted) {
        setStats(s);
        setLoading(false);
      }
      
      const users = await db.userAudits.toArray();
      const lastActivityByUser: Record<string, number> = {};
      const usersWithLink = new Set<string>();
      const usersWithAI = new Set<string>();
      
      for (const u of users) {
        lastActivityByUser[u.userId] = Math.max(lastActivityByUser[u.userId] || 0, u.lastSeen);
        const linkCount = await db.links.where({ userId: u.userId }).count();
        if (linkCount > 0) usersWithLink.add(u.userId);
        const aiCount = await db.chatMessages.where({ userId: u.userId }).count() + await db.summaries.where({ userId: u.userId }).count();
        if (aiCount > 0) usersWithAI.add(u.userId);
      }
      
      const userBreakdownData = await Promise.all(users.map(async (u) => {
        const [links, chats, summaries, boards, tasks] = await Promise.all([
          db.links.where({ userId: u.userId }).count(),
          db.chatMessages.where({ userId: u.userId }).count(),
          db.summaries.where({ userId: u.userId }).count(),
          db.boards.where({ userId: u.userId }).count(),
          db.tasks.where({ userId: u.userId }).count(),
        ]);
        return {
          userId: u.userId,
          email: u.email,
          name: u.name,
          picture: u.picture,
          links,
          chats,
          summaries,
          boards,
          tasks,
          lastActivity: new Date(u.lastSeen).toLocaleDateString(),
          sessions: u.sessions,
          firstSeen: u.firstSeen ? new Date(u.firstSeen).toLocaleDateString() : undefined,
        };
      }));
      
      if (mounted) {
        setUserBreakdown(userBreakdownData.sort((a, b) => (b.links + b.chats + b.summaries) - (a.links + a.chats + a.summaries)));
        
        const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
        const dau = users.filter(u => lastActivityByUser[u.userId] >= Date.now() - 24 * 60 * 60 * 1000).length;
        const wau = users.filter(u => lastActivityByUser[u.userId] >= sevenDaysAgo).length;
        const mau = users.filter(u => lastActivityByUser[u.userId] >= thirtyDaysAgo).length;
        setTraction({ dau, wau, mau, users: users.length, activated: usersWithLink.size, aiUsers: usersWithAI.size });
      }
    });
    
    fetchAuth0Users();
    
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Loading Dashboard</h2>
          <p className="text-gray-500">Gathering analytics data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-12">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div className="flex-1">
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
                Admin Dashboard
              </h1>
              <p className="text-base sm:text-lg text-gray-600 max-w-2xl">
                Monitor user activity, track engagement metrics, and analyze product performance
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-white px-4 py-3 rounded-xl shadow-sm border border-gray-200">
                <div className="text-xs text-gray-500 uppercase tracking-wide font-medium">Last Updated</div>
                <div className="text-sm font-semibold text-gray-900 mt-1">
                  {new Date().toLocaleTimeString()}
                </div>
              </div>
              <button
                onClick={() => window.location.reload()}
                className="p-3 text-gray-400 hover:text-gray-600 hover:bg-white rounded-xl transition-all duration-200 hover:shadow-sm border border-gray-200"
                title="Refresh data"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          </div>
          
          {user?.sub && (
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium text-gray-700">Admin Access</span>
                  </div>
                  <div className="text-sm text-gray-500">
                    User ID: <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">{user.sub}</span>
                  </div>
                </div>
                <button
                  onClick={backfillToCurrentUser}
                  disabled={busy}
                  className="px-4 py-2 rounded-lg text-sm bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 disabled:opacity-60 transition-all duration-200 shadow-sm"
                  title="Move legacy records (local-dev-user) to your Auth0 user so they appear under your account"
                >
                  {busy ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Backfilling…</span>
                    </div>
                  ) : (
                    'Backfill Legacy Data'
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((s, index) => {
            const icons = [
              <svg key="links" className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>,
              <svg key="boards" className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h2a2 2 0 002-2z" />
              </svg>,
              <svg key="chats" className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>,
              <svg key="tasks" className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            ];
            
            return (
              <div key={s.label} className="group bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all duration-200 hover:border-gray-300">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="text-sm text-gray-500 font-medium mb-1">{s.label}</div>
                    <div className="text-3xl font-bold text-gray-900">{s.value}</div>
                  </div>
                  <div className="opacity-60 group-hover:opacity-100 transition-opacity duration-200">
                    {icons[index] || icons[0]}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Key Metrics */}
        {traction && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium text-gray-700">Active Users</div>
                <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">{traction.dau} / {traction.wau} / {traction.mau}</div>
              <div className="text-xs text-gray-500">DAU / WAU / MAU</div>
            </div>
            
            <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium text-gray-700">Activated Users</div>
                <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">{traction.activated}</div>
              <div className="text-xs text-gray-500">Users with saved links</div>
            </div>
            
            <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium text-gray-700">AI Users</div>
                <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">{traction.aiUsers}</div>
              <div className="text-xs text-gray-500">Users using AI features</div>
            </div>
          </div>
        )}

        {/* User Analytics */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">User Analytics</h2>
              <p className="text-sm text-gray-500 mt-1">Top users by activity and engagement</p>
            </div>
            <div className="text-sm text-gray-500">
              {userBreakdown.length} users tracked
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Links</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Chats</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Summaries</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Boards</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tasks</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sessions</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">First Seen</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Activity</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {userBreakdown.map((u, index) => (
                  <tr key={u.userId} className={`hover:bg-gray-50 transition-colors duration-150 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                          {u.picture ? (
                            <img src={u.picture} alt="" className="w-8 h-8 object-cover" />
                          ) : (
                            <span className="text-sm font-medium text-gray-600">
                              {(u.name || u.email || 'U').charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900">{u.name || u.email || 'Unknown'}</span>
                          <span className="font-mono text-xs text-gray-500">{u.userId}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {u.links}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {u.chats}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        {u.summaries}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                        {u.boards}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {u.tasks}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500">{u.sessions ?? '—'}</td>
                    <td className="px-4 py-4 text-sm text-gray-500">{u.firstSeen ?? '—'}</td>
                    <td className="px-4 py-4 text-sm text-gray-500">{u.lastActivity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Auth0 Users Table */}
        {auth0Users.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Auth0 Users (Global)</h2>
                <p className="text-sm text-gray-500 mt-1">All authenticated users from Auth0</p>
              </div>
              <div className="text-sm text-gray-500">
                {auth0Users.length} users
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Verified</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Login</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Logins</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {auth0Users.map((u) => (
                    <tr key={u.user_id} className="hover:bg-gray-50 transition-colors duration-150">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                            {u.picture ? (
                              <img src={u.picture} alt="" className="w-8 h-8 object-cover" />
                            ) : (
                              <span className="text-sm font-medium text-gray-600">
                                {(u.name || u.email || 'U').charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-medium text-gray-900">{u.name || 'Unknown'}</span>
                            <span className="font-mono text-xs text-gray-500">{u.user_id}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900">{u.email || '—'}</td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          u.email_verified ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {u.email_verified ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500">
                        {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500">
                        {u.last_login ? new Date(u.last_login).toLocaleString() : '—'}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500">{u.logins_count || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="mt-6 flex items-center gap-3">
          <Link to="/" className="text-sm text-blue-600 hover:text-blue-700">Back to app</Link>
        </div>
      </div>
    </div>
  );
};

export default AdminStatsPage;
import React, { useState, useEffect, useCallback } from 'react'
import { 
  Users, Link as LinkIcon, HardDrive, TrendingUp, 
  RefreshCw, Calendar, BarChart3, FileText, Settings,
  ChevronLeft, ChevronRight, Search, Filter, X, AlertCircle, Tag, LogIn
} from 'lucide-react'
import { useAdminAccess } from '../hooks/useAdminAccess'
import { useAdminApi, AdminAnalytics as AdminAnalyticsType, AdminUser, SystemLog, AdminCategory, UserLimits } from '../services/adminApi'
import { useToast } from '../components/Toast'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { useAuth0 } from '@auth0/auth0-react'

type TabType = 'analytics' | 'users' | 'logs' | 'categories' | 'settings'

export const AdminAnalytics: React.FC = () => {
  const { isAdmin, isChecking } = useAdminAccess()
  const { getAccessTokenSilently, loginWithRedirect } = useAuth0()
  const adminApi = useAdminApi()
  const toast = useToast()
  
  const [activeTab, setActiveTab] = useState<TabType>('analytics')
  const [loading, setLoading] = useState(false)
  const [analytics, setAnalytics] = useState<AdminAnalyticsType | null>(null)
  const [refreshingToken, setRefreshingToken] = useState(false)
  
  // Date range for analytics
  const [startDate, setStartDate] = useState<string>(() => {
    const date = new Date()
    date.setDate(date.getDate() - 7)
    return date.toISOString().split('T')[0]
  })
  const [endDate, setEndDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0]
  })

  // Auto-refresh state
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  // Load analytics data
  const loadAnalytics = useCallback(async () => {
    try {
      setLoading(true)
      // Ensure we have a fresh token with email scope
      try {
        const token = await getAccessTokenSilently({
          cacheMode: 'off',
          authorizationParams: {
            scope: 'openid profile email',
          }
        })
        localStorage.setItem('authToken', token)
      } catch (tokenError) {
        console.error('Failed to get fresh token:', tokenError)
      }
      
      const data = await adminApi.getAnalytics(startDate, endDate)
      setAnalytics(data)
      setLastRefresh(new Date())
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load analytics'
      toast.error(errorMessage)
      console.error('Failed to load analytics:', error)
    } finally {
      setLoading(false)
    }
  }, [adminApi, startDate, endDate, toast, getAccessTokenSilently])

  // Force refresh token to get fresh token with email
  const refreshAuthToken = useCallback(async () => {
    try {
      setRefreshingToken(true)
      // Get a fresh token with cache disabled
      const token = await getAccessTokenSilently({
        cacheMode: 'off',
        authorizationParams: {
          scope: 'openid profile email',
        }
      })
      localStorage.setItem('authToken', token)
      toast.success('Token refreshed successfully')
      // Retry loading analytics after token refresh
      await loadAnalytics()
    } catch (error) {
      console.error('Failed to refresh token:', error)
      toast.error('Failed to refresh token. Please try logging in again.')
    } finally {
      setRefreshingToken(false)
    }
  }, [getAccessTokenSilently, toast, loadAnalytics])

  // Force re-login for admin access
  const handleReLogin = useCallback(async () => {
    try {
      await loginWithRedirect({
        authorizationParams: {
          redirect_uri: window.location.origin + '/analytics',
          audience: import.meta.env.VITE_AUTH0_AUDIENCE,
          scope: 'openid profile email',
          prompt: 'login', // Force login screen
        }
      })
    } catch (error) {
      console.error('Failed to re-login:', error)
      toast.error('Failed to re-authenticate')
    }
  }, [loginWithRedirect, toast])

  // Load analytics data
  const loadAnalytics = useCallback(async () => {
    try {
      setLoading(true)
      // Ensure we have a fresh token with email scope
      try {
        const token = await getAccessTokenSilently({
          cacheMode: 'off',
          authorizationParams: {
            scope: 'openid profile email',
          }
        })
        localStorage.setItem('authToken', token)
      } catch (tokenError) {
        console.error('Failed to get fresh token:', tokenError)
      }
      
      const data = await adminApi.getAnalytics(startDate, endDate)
      setAnalytics(data)
      setLastRefresh(new Date())
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load analytics'
      toast.error(errorMessage)
      console.error('Failed to load analytics:', error)
    } finally {
      setLoading(false)
    }
  }, [adminApi, startDate, endDate, toast, getAccessTokenSilently])

  // Initial load
  useEffect(() => {
    if (isAdmin && !isChecking) {
      loadAnalytics()
    }
  }, [isAdmin, isChecking, loadAnalytics])

  // Auto-refresh every 10 minutes
  useEffect(() => {
    if (!autoRefreshEnabled || !isAdmin || isChecking) return

    const interval = setInterval(() => {
      // Check if tab is visible
      if (!document.hidden) {
        loadAnalytics()
      }
    }, 10 * 60 * 1000) // 10 minutes

    return () => clearInterval(interval)
  }, [autoRefreshEnabled, isAdmin, isChecking, loadAnalytics])

  if (isChecking) {
    return <LoadingSpinner />
  }

  if (!isAdmin) {
    return null // useAdminAccess will redirect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 py-6">
      <div className="max-w-[1600px] mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Analytics</h1>
              <p className="text-gray-600">System-wide analytics and management</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="input-field text-sm"
                />
                <span className="text-gray-500">to</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="input-field text-sm"
                />
              </div>
              <button
                onClick={refreshAuthToken}
                disabled={refreshingToken}
                className="px-3 py-1.5 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors flex items-center gap-2"
                title="Refresh authentication token"
              >
                <RefreshCw className={`w-3 h-3 ${refreshingToken ? 'animate-spin' : ''}`} />
                Refresh Token
              </button>
              <button
                onClick={handleReLogin}
                className="px-3 py-1.5 text-xs bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg transition-colors flex items-center gap-2"
                title="Re-authenticate with Auth0"
              >
                <LogIn className="w-3 h-3" />
                Re-Login
              </button>
              <button
                onClick={loadAnalytics}
                disabled={loading}
                className="btn btn-secondary flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={autoRefreshEnabled}
                  onChange={(e) => setAutoRefreshEnabled(e.target.checked)}
                  className="rounded"
                />
                Auto-refresh (10 min)
              </label>
              <button
                onClick={async () => {
                  try {
                    const debugInfo = await adminApi.debugToken()
                    console.log('Debug Token Info:', debugInfo)
                    alert(`Token Debug Info:\n\n${JSON.stringify(debugInfo, null, 2)}`)
                    toast.success('Token debug info logged to console')
                  } catch (error) {
                    console.error('Debug token error:', error)
                    toast.error('Failed to debug token')
                  }
                }}
                className="px-3 py-1.5 text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors"
                title="Debug token authentication - shows token contents"
              >
                Debug Token
              </button>
            </div>
          </div>
          {lastRefresh && (
            <p className="text-xs text-gray-500 mt-2">
              Last updated: {lastRefresh.toLocaleString()}
            </p>
          )}
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="flex border-b border-gray-200 overflow-x-auto">
            {[
              { id: 'analytics' as TabType, label: 'Analytics', icon: BarChart3 },
              { id: 'users' as TabType, label: 'Users', icon: Users },
              { id: 'logs' as TabType, label: 'System Logs', icon: FileText },
              { id: 'categories' as TabType, label: 'Categories', icon: Tag },
              { id: 'settings' as TabType, label: 'Settings', icon: Settings },
            ].map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-all whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                </button>
              )
            })}
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'analytics' && (
              <AnalyticsTab analytics={analytics} loading={loading} />
            )}
            {activeTab === 'users' && (
              <UsersTab adminApi={adminApi} />
            )}
            {activeTab === 'logs' && (
              <LogsTab adminApi={adminApi} />
            )}
            {activeTab === 'categories' && (
              <CategoriesTab adminApi={adminApi} />
            )}
            {activeTab === 'settings' && (
              <SettingsTab adminApi={adminApi} />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Analytics Tab Component
const AnalyticsTab: React.FC<{ analytics: AdminAnalyticsType | null; loading: boolean }> = ({ analytics, loading }) => {
  if (loading) {
    return <LoadingSpinner />
  }

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No analytics data available</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Users"
          value={analytics.summary.totalUsers}
          subtitle={`${analytics.summary.extensionUsers} via extension`}
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Total Links"
          value={analytics.summary.totalLinks}
          subtitle={`${analytics.summary.extensionLinks} extension, ${analytics.summary.webLinks} web`}
          icon={LinkIcon}
          color="green"
        />
        <StatCard
          title="Storage Used"
          value={`${analytics.summary.totalStorageMB.toFixed(2)} MB`}
          subtitle={`${analytics.summary.totalStorageKB.toFixed(2)} KB`}
          icon={HardDrive}
          color="purple"
        />
        <StatCard
          title="Avg Links/User"
          value={analytics.summary.averageLinksPerUser.toFixed(1)}
          subtitle={`${analytics.summary.activeUsers} active, ${analytics.summary.inactiveUsers} inactive`}
          icon={TrendingUp}
          color="orange"
        />
      </div>

      {/* Growth Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GrowthChart
          title="User Growth"
          data={analytics.growth.userGrowth}
          dataKey="newUsers"
        />
        <GrowthChart
          title="Links Created"
          data={analytics.growth.linksGrowth}
          dataKey="count"
          extensionKey="extensionCount"
          webKey="webCount"
        />
      </div>

      {/* Top Categories */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Categories</h3>
        <div className="space-y-2">
          {analytics.topCategories.slice(0, 10).map((cat, index) => (
            <CategoryBar
              key={cat.category}
              category={cat.category}
              linkCount={cat.linkCount}
              userCount={cat.userCount}
              maxCount={analytics.topCategories[0]?.linkCount || 1}
              rank={index + 1}
            />
          ))}
        </div>
      </div>

      {/* Content Types Distribution */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Content Type Distribution</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {analytics.contentTypes.map((ct) => (
            <div key={ct.contentType} className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">{ct.count}</div>
              <div className="text-sm text-gray-600 mt-1">{ct.contentType}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Stat Card Component
const StatCard: React.FC<{
  title: string
  value: string | number
  subtitle: string
  icon: React.ElementType
  color: 'blue' | 'green' | 'purple' | 'orange'
}> = ({ title, value, subtitle, icon: Icon, color }) => {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-600',
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      <h3 className="text-sm font-medium text-gray-600 mb-1">{title}</h3>
      <div className="text-3xl font-bold text-gray-900 mb-1">{value}</div>
      <p className="text-xs text-gray-500">{subtitle}</p>
    </div>
  )
}

// Growth Chart Component (Simple CSS-based)
const GrowthChart: React.FC<{
  title: string
  data: Array<{ date: string; [key: string]: any }>
  dataKey: string
  extensionKey?: string
  webKey?: string
}> = ({ title, data, dataKey, extensionKey, webKey }) => {
  const maxValue = Math.max(...data.map(d => {
    const total = d[dataKey] || 0
    const ext = extensionKey ? (d[extensionKey] || 0) : 0
    const web = webKey ? (d[webKey] || 0) : 0
    return total || ext || web
  }), 1)

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <div className="space-y-2">
        {data.map((item, index) => {
          const date = new Date(item.date)
          const value = item[dataKey] || 0
          const ext = extensionKey ? (item[extensionKey] || 0) : 0
          const web = webKey ? (item[webKey] || 0) : 0
          
          return (
            <div key={index} className="flex items-center gap-2">
              <div className="text-xs text-gray-600 w-20 flex-shrink-0">
                {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </div>
              <div className="flex-1 flex items-center gap-1">
                {webKey && web > 0 && (
                  <div
                    className="bg-blue-500 h-6 rounded-l"
                    style={{ width: `${(web / maxValue) * 100}%` }}
                    title={`Web: ${web}`}
                  />
                )}
                {extensionKey && ext > 0 && (
                  <div
                    className="bg-green-500 h-6 rounded-r"
                    style={{ width: `${(ext / maxValue) * 100}%` }}
                    title={`Extension: ${ext}`}
                  />
                )}
                {!extensionKey && !webKey && (
                  <div
                    className="bg-blue-500 h-6 rounded"
                    style={{ width: `${(value / maxValue) * 100}%` }}
                    title={value.toString()}
                  />
                )}
              </div>
              <div className="text-xs font-medium text-gray-700 w-12 text-right">
                {value}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Category Bar Component
const CategoryBar: React.FC<{
  category: string
  linkCount: number
  userCount: number
  maxCount: number
  rank: number
}> = ({ category, linkCount, userCount, maxCount, rank }) => {
  const percentage = (linkCount / maxCount) * 100

  return (
    <div className="flex items-center gap-3">
      <div className="text-sm font-medium text-gray-600 w-8">#{rank}</div>
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium text-gray-900 capitalize">{category}</span>
          <span className="text-xs text-gray-600">{linkCount} links, {userCount} users</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </div>
  )
}

// Users Tab Component (placeholder - will implement next)
const UsersTab: React.FC<{ adminApi: ReturnType<typeof useAdminApi> }> = ({ adminApi }) => {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [activeOnly, setActiveOnly] = useState<boolean | undefined>(undefined)
  const toast = useToast()

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true)
      const data = await adminApi.getUsers(page, 25, search || undefined, activeOnly)
      setUsers(data.users)
      setTotal(data.pagination.total)
    } catch (error) {
      toast.error('Failed to load users')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }, [adminApi, page, search, activeOnly, toast])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 mb-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-10 w-full"
          />
        </div>
        <select
          value={activeOnly === undefined ? 'all' : activeOnly ? 'active' : 'inactive'}
          onChange={(e) => setActiveOnly(e.target.value === 'all' ? undefined : e.target.value === 'active')}
          className="input-field"
        >
          <option value="all">All Users</option>
          <option value="active">Active Only</option>
          <option value="inactive">Inactive Only</option>
        </select>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <>
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Links</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Storage</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Extension</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Active</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.userId} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-mono text-gray-900">{user.userId.slice(0, 20)}...</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{user.linkCount}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{user.storageKB.toFixed(2)} KB</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{user.extensionLinks}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        user.isActive 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                      {user.approachingLimit && (
                        <AlertCircle className="w-4 h-4 text-orange-500 inline-block ml-2" />
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {user.lastLinkDate ? new Date(user.lastLinkDate).toLocaleDateString() : 'Never'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing {users.length} of {total} users
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn btn-secondary"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-gray-600">Page {page}</span>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={users.length < 25}
                className="btn btn-secondary"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// Logs Tab Component
const LogsTab: React.FC<{ adminApi: ReturnType<typeof useAdminApi> }> = ({ adminApi }) => {
  const [logs, setLogs] = useState<SystemLog[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [logType, setLogType] = useState<string>('')
  const [severity, setSeverity] = useState<string>('')
  const [logStartDate, setLogStartDate] = useState<string>('')
  const [logEndDate, setLogEndDate] = useState<string>('')
  const toast = useToast()

  const loadLogs = useCallback(async () => {
    try {
      setLoading(true)
      const data = await adminApi.getLogs(
        page,
        50,
        logType || undefined,
        severity || undefined,
        logStartDate || undefined,
        logEndDate || undefined,
        search || undefined
      )
      setLogs(data.logs)
      setTotal(data.pagination.total)
    } catch (error) {
      toast.error('Failed to load logs')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }, [adminApi, page, search, logType, severity, logStartDate, logEndDate, toast])

  useEffect(() => {
    loadLogs()
  }, [loadLogs])

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'error':
      case 'critical':
        return 'bg-red-100 text-red-700'
      case 'warning':
        return 'bg-yellow-100 text-yellow-700'
      case 'info':
      default:
        return 'bg-blue-100 text-blue-700'
    }
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search logs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-10 w-full"
          />
        </div>
        <select
          value={logType}
          onChange={(e) => setLogType(e.target.value)}
          className="input-field"
        >
          <option value="">All Types</option>
          <option value="admin_access">Admin Access</option>
          <option value="api_request">API Request</option>
          <option value="error">Error</option>
          <option value="user_action">User Action</option>
          <option value="rate_limit">Rate Limit</option>
        </select>
        <select
          value={severity}
          onChange={(e) => setSeverity(e.target.value)}
          className="input-field"
        >
          <option value="">All Severities</option>
          <option value="info">Info</option>
          <option value="warning">Warning</option>
          <option value="error">Error</option>
          <option value="critical">Critical</option>
        </select>
        <input
          type="date"
          value={logStartDate}
          onChange={(e) => setLogStartDate(e.target.value)}
          placeholder="Start Date"
          className="input-field"
        />
        <input
          type="date"
          value={logEndDate}
          onChange={(e) => setLogEndDate(e.target.value)}
          placeholder="End Date"
          className="input-field"
        />
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <>
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Timestamp</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Severity</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {log.timestamp ? new Date(log.timestamp).toLocaleString() : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 font-mono text-xs">{log.type || '-'}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs rounded-full ${getSeverityColor(log.severity)}`}>
                          {log.severity || 'info'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {log.email ? (
                          <span className="font-mono text-xs">{log.email}</span>
                        ) : log.userId ? (
                          <span className="font-mono text-xs">{log.userId.slice(0, 20)}...</span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        <details className="cursor-pointer">
                          <summary className="text-blue-600 hover:text-blue-800">View Details</summary>
                          <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        </details>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {logs.length === 0 && !loading && (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <p className="text-gray-500">No logs found</p>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing {logs.length} of {total} logs
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn btn-secondary"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-gray-600">Page {page}</span>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={logs.length < 50}
                className="btn btn-secondary"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// Categories Tab Component
const CategoriesTab: React.FC<{ adminApi: ReturnType<typeof useAdminApi> }> = ({ adminApi }) => {
  const [categories, setCategories] = useState<AdminCategory[]>([])
  const [loading, setLoading] = useState(false)
  const [showMergeModal, setShowMergeModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [mergeSource, setMergeSource] = useState('')
  const [mergeTarget, setMergeTarget] = useState('')
  const [deleteReassign, setDeleteReassign] = useState('other')
  const toast = useToast()

  const loadCategories = useCallback(async () => {
    try {
      setLoading(true)
      const data = await adminApi.getCategories()
      setCategories(data.categories)
    } catch (error) {
      toast.error('Failed to load categories')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }, [adminApi, toast])

  useEffect(() => {
    loadCategories()
  }, [loadCategories])

  const handleMerge = async () => {
    if (!mergeSource || !mergeTarget || mergeSource === mergeTarget) {
      toast.error('Please select different source and target categories')
      return
    }

    try {
      await adminApi.mergeCategories(mergeSource, mergeTarget)
      toast.success('Categories merged successfully')
      setShowMergeModal(false)
      setMergeSource('')
      setMergeTarget('')
      loadCategories()
    } catch (error) {
      toast.error('Failed to merge categories')
      console.error(error)
    }
  }

  const handleDelete = async () => {
    if (!selectedCategory) return

    try {
      await adminApi.deleteCategory(selectedCategory, deleteReassign)
      toast.success('Category deleted successfully')
      setShowDeleteModal(false)
      setSelectedCategory('')
      loadCategories()
    } catch (error) {
      toast.error('Failed to delete category')
      console.error(error)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Category Management</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setShowMergeModal(true)}
            className="btn btn-primary"
          >
            Merge Categories
          </button>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Links</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Users</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {categories.map((cat) => (
                <tr key={cat.name} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 capitalize">{cat.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{cat.linkCount}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{cat.userCount}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => {
                        setSelectedCategory(cat.name)
                        setShowDeleteModal(true)
                      }}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Merge Modal */}
      {showMergeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Merge Categories</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Source Category</label>
                <select
                  value={mergeSource}
                  onChange={(e) => setMergeSource(e.target.value)}
                  className="input-field w-full"
                >
                  <option value="">Select source...</option>
                  {categories.map(cat => (
                    <option key={cat.name} value={cat.name}>{cat.name} ({cat.linkCount} links)</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Target Category</label>
                <select
                  value={mergeTarget}
                  onChange={(e) => setMergeTarget(e.target.value)}
                  className="input-field w-full"
                >
                  <option value="">Select target...</option>
                  {categories.filter(cat => cat.name !== mergeSource).map(cat => (
                    <option key={cat.name} value={cat.name}>{cat.name} ({cat.linkCount} links)</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button
                onClick={() => {
                  setShowMergeModal(false)
                  setMergeSource('')
                  setMergeTarget('')
                }}
                className="btn btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleMerge}
                className="btn btn-primary flex-1"
              >
                Merge
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Delete Category</h3>
            <p className="text-sm text-gray-600 mb-4">
              Deleting <strong>{selectedCategory}</strong> will reassign all links to another category.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Reassign to</label>
              <select
                value={deleteReassign}
                onChange={(e) => setDeleteReassign(e.target.value)}
                className="input-field w-full"
              >
                {categories.filter(cat => cat.name !== selectedCategory).map(cat => (
                  <option key={cat.name} value={cat.name}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowDeleteModal(false)
                  setSelectedCategory('')
                }}
                className="btn btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="btn btn-primary flex-1 bg-red-600 hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Settings Tab Component (User Limits Management)
const SettingsTab: React.FC<{ adminApi: ReturnType<typeof useAdminApi> }> = ({ adminApi }) => {
  const [selectedUserId, setSelectedUserId] = useState<string>('')
  const [userLimits, setUserLimits] = useState<UserLimits | null>(null)
  const [loading, setLoading] = useState(false)
  const [linksLimit, setLinksLimit] = useState<number>(40)
  const [storageLimitKB, setStorageLimitKB] = useState<number>(40)
  const [userSearch, setUserSearch] = useState<string>('')
  const toast = useToast()

  const loadUserLimits = useCallback(async () => {
    if (!selectedUserId) {
      setUserLimits(null)
      return
    }

    try {
      setLoading(true)
      const limits = await adminApi.getUserLimits(selectedUserId)
      setUserLimits(limits)
      setLinksLimit(limits.linksLimit)
      setStorageLimitKB(limits.storageLimitKB)
    } catch (error) {
      toast.error('Failed to load user limits')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }, [adminApi, selectedUserId, toast])

  useEffect(() => {
    loadUserLimits()
  }, [loadUserLimits])

  const handleUpdateLimits = async () => {
    if (!selectedUserId) return

    try {
      setLoading(true)
      await adminApi.updateUserLimits(selectedUserId, linksLimit, storageLimitKB)
      toast.success('User limits updated successfully')
      loadUserLimits()
    } catch (error) {
      toast.error('Failed to update user limits')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleResetLimits = async () => {
    if (!selectedUserId) return

    if (!confirm('Reset user limits to defaults?')) return

    try {
      setLoading(true)
      await adminApi.resetUserLimits(selectedUserId)
      toast.success('User limits reset to defaults')
      loadUserLimits()
    } catch (error) {
      toast.error('Failed to reset user limits')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">User Limits Management</h3>
        <p className="text-sm text-gray-600 mb-4">
          Adjust limits for individual users. Default limits are 40 links and 40 KB storage.
        </p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            User ID
          </label>
          <input
            type="text"
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
            placeholder="Enter user ID..."
            className="input-field w-full font-mono text-sm"
          />
          <button
            onClick={() => {
              if (userSearch.trim()) {
                setSelectedUserId(userSearch.trim())
              }
            }}
            className="btn btn-primary mt-2"
          >
            Load User Limits
          </button>
        </div>

        {selectedUserId && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            {loading && !userLimits ? (
              <LoadingSpinner />
            ) : userLimits ? (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Links Limit
                    </label>
                    {userLimits.isOverridden && (
                      <span className="text-xs text-orange-600 font-medium">
                        Overridden
                      </span>
                    )}
                  </div>
                  <input
                    type="number"
                    value={linksLimit}
                    onChange={(e) => setLinksLimit(parseInt(e.target.value) || 40)}
                    min="1"
                    className="input-field w-full"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Current: {userLimits.linksLimit} links
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Storage Limit (KB)
                    </label>
                    {userLimits.isOverridden && (
                      <span className="text-xs text-orange-600 font-medium">
                        Overridden
                      </span>
                    )}
                  </div>
                  <input
                    type="number"
                    value={storageLimitKB}
                    onChange={(e) => setStorageLimitKB(parseInt(e.target.value) || 40)}
                    min="1"
                    className="input-field w-full"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Current: {userLimits.storageLimitKB} KB ({userLimits.storageLimitBytes} bytes)
                  </p>
                </div>

                {userLimits.isOverridden && userLimits.overriddenAt && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-xs text-yellow-800">
                      Limits were overridden on {new Date(userLimits.overriddenAt).toLocaleString()}
                    </p>
                  </div>
                )}

                <div className="flex gap-2 pt-4">
                  <button
                    onClick={handleUpdateLimits}
                    disabled={loading}
                    className="btn btn-primary flex-1"
                  >
                    {loading ? 'Updating...' : 'Update Limits'}
                  </button>
                  {userLimits.isOverridden && (
                    <button
                      onClick={handleResetLimits}
                      disabled={loading}
                      className="btn btn-secondary"
                    >
                      Reset to Defaults
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">
                User limits not found
              </p>
            )}
          </div>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-blue-900 mb-2">Default Limits</h4>
        <ul className="text-xs text-blue-800 space-y-1">
          <li>• Links: 40 per user</li>
          <li>• Storage: 40 KB per user</li>
          <li>• Overrides are stored in the database and persist until reset</li>
        </ul>
      </div>
    </div>
  )
}


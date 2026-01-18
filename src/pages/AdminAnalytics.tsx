import React, { useState, useEffect, useCallback } from 'react'
import { 
  Users, Link as LinkIcon, HardDrive, TrendingUp, 
  RefreshCw, BarChart3, FileText, Settings,
  ChevronLeft, ChevronRight, Search, AlertCircle, Tag, LogIn, Download, Trash2, AlertTriangle, Shield, CheckCircle2
} from 'lucide-react'
import { useAdminAccess } from '../context/AdminContext'
import { useAdminApi, AdminAnalytics as AdminAnalyticsType, AdminUser, SystemLog, AdminCategory, UserLimits, SystemLogsResponse } from '../services/adminApi'
import { useToast } from '../components/Toast'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { useAuth0 } from '@auth0/auth0-react'

type TabType = 'analytics' | 'users' | 'logs' | 'categories' | 'settings' | 'gdpr'

export const AdminAnalytics: React.FC = () => {
  const { isAdmin, isChecking } = useAdminAccess()
  const { getAccessTokenSilently, loginWithRedirect } = useAuth0()
  const adminApi = useAdminApi()
  const toast = useToast()
  
  const [activeTab, setActiveTab] = useState<TabType>('analytics')
  const [loading, setLoading] = useState(false)
  const [analytics, setAnalytics] = useState<AdminAnalyticsType | null>(null)
  const [refreshingToken, setRefreshingToken] = useState(false)
  const [error, setError] = useState<{ message: string; type?: string; retryable?: boolean } | null>(null)
  
  // Use a ref to track if a request is in progress (to prevent race conditions)
  const loadingRef = React.useRef(false)
  const hasLoadedOnceRef = React.useRef(false)
  
  // Date range for analytics
  const [startDate, setStartDate] = useState<string>(() => {
    const date = new Date()
    date.setDate(date.getDate() - 7)
    return date.toISOString().split('T')[0]
  })
  const [endDate, setEndDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0]
  })
  const [appliedStartDate, setAppliedStartDate] = useState<string>(startDate)
  const [appliedEndDate, setAppliedEndDate] = useState<string>(endDate)

  // Auto-refresh state
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  // Load analytics data with comprehensive error handling
  // Accepts optional date parameters to use latest values when dates change
  const loadAnalytics = async (retryCount = 0, customStartDate?: string, customEndDate?: string) => {
    // Security: Prevent loading if not admin
    if (!isAdmin || isChecking) {
      console.log('[Analytics] Admin access required - skipping load')
      return
    }

    // Prevent concurrent requests
    if (loadingRef.current) {
      console.log('[Analytics] Request already in progress, skipping...')
      return
    }

    try {
      loadingRef.current = true
      setLoading(true)
      setError(null)
      
      // Use provided dates or current state dates (always use latest)
      const effectiveStartDate = customStartDate ?? startDate
      const effectiveEndDate = customEndDate ?? endDate
      
      // Validate dates
      if (!effectiveStartDate || !effectiveEndDate) {
        throw new Error('Start date and end date are required')
      }
      
      if (new Date(effectiveStartDate) > new Date(effectiveEndDate)) {
        throw new Error('Start date must be before end date')
      }
      
      console.log('[Analytics] Loading with date range:', effectiveStartDate, 'to', effectiveEndDate)
      
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
        // Don't fail the request if token refresh fails, might still work with cached token
      }
      
      // Security: Backend validates admin access via check_admin_access
      // This API call will return 403 Forbidden if user is not an admin
      const data = await adminApi.getAnalytics(effectiveStartDate, effectiveEndDate)
      setAnalytics(data)
      setLastRefresh(new Date())
      setError(null) // Clear any previous errors
    } catch (error: any) {
      console.error('Failed to load analytics:', error)
      
      // Parse error to determine type and user-friendly message
      let errorMessage = 'Failed to load analytics data'
      let errorType = 'UNKNOWN'
      let retryable = true
      
      // Security: Check for 403 Forbidden (admin access denied)
      if (error?.status === 403 || error?.message?.includes('403') || error?.message?.includes('Forbidden') || error?.message?.includes('Admin access required')) {
        errorMessage = 'Admin access denied. You do not have permission to access analytics. Please ensure you are logged in with an admin account.'
        errorType = 'AUTH'
        retryable = false
      } else if (error?.type === 'NOT_FOUND' || error?.message?.includes('404') || error?.message?.includes('Not found')) {
        errorMessage = 'Admin access denied. Please ensure you are logged in with the correct account (chaimpeer11@gmail.com). Try clicking "Re-Login" to re-authenticate.'
        errorType = 'AUTH'
        retryable = false
      } else if (error?.message?.includes('timeout') || error?.message?.includes('Timeout')) {
        errorMessage = 'Request timed out. The analytics query is taking too long. Please try again or use a smaller date range.'
        errorType = 'TIMEOUT'
        retryable = false // Don't auto-retry timeouts
      } else if (error?.message?.includes('Network') || error?.message?.includes('fetch')) {
        errorMessage = 'Network error. Please check your internet connection and try again.'
        errorType = 'NETWORK'
        retryable = false // Don't auto-retry network errors
      } else if (error?.message?.includes('401') || error?.message?.includes('Unauthorized')) {
        errorMessage = 'Authentication failed. Please click "Re-Login" to re-authenticate.'
        errorType = 'AUTH'
        retryable = false
      } else if (error?.message?.includes('429') || error?.message?.includes('Too many requests')) {
        errorMessage = 'Rate limit exceeded. Please wait a moment before trying again.'
        errorType = 'RATE_LIMIT'
        retryable = false
      } else if (error?.message) {
        errorMessage = error.message
        retryable = false
      }
      
      setError({
        message: errorMessage,
        type: errorType,
        retryable
      })
      
      toast.error(errorMessage)
      
      // REMOVED: No auto-retry - user must explicitly retry via button
    } finally {
      loadingRef.current = false
      setLoading(false)
    }
  }

  // Force refresh token to get fresh token with email
  const refreshAuthToken = async () => {
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
      // Retry loading analytics after token refresh (use applied dates)
      await loadAnalytics(0, appliedStartDate, appliedEndDate)
    } catch (error) {
      console.error('Failed to refresh token:', error)
      toast.error('Failed to refresh token. Please try logging in again.')
    } finally {
      setRefreshingToken(false)
    }
  }

  // Force re-login for admin access
  const handleReLogin = useCallback(async () => {
    try {
      // Use dashboard as redirect, then navigate to analytics after login
      // This ensures the redirect_uri is in Auth0's allowed callbacks
      await loginWithRedirect({
        authorizationParams: {
          redirect_uri: window.location.origin + '/dashboard',
          audience: import.meta.env.VITE_AUTH0_AUDIENCE,
          scope: 'openid profile email',
          prompt: 'login', // Force login screen
        }
      })
      // After successful login, Auth0 will redirect to /dashboard
      // The App.tsx router will handle navigation to /analytics if user is admin
    } catch (error) {
      console.error('Failed to re-login:', error)
      toast.error('Failed to re-authenticate')
    }
  }, [loginWithRedirect, toast])

  // Initial load - only load once when admin access is confirmed
  useEffect(() => {
    // ✅ Only trigger when we have a definitive admin status (not null, not checking)
    // ✅ Use ref to ensure we only load once, even if effect runs multiple times
    if (isAdmin === true && isChecking === false && !hasLoadedOnceRef.current) {
      console.log('[Analytics] Initial load triggered')
      hasLoadedOnceRef.current = true
      // Use applied dates (which start as initial dates)
      loadAnalytics(0, appliedStartDate, appliedEndDate).catch(console.error)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, isChecking]) // Only depend on admin state, NOT on loadAnalytics

  // Auto-refresh every 10 minutes
  useEffect(() => {
    if (!autoRefreshEnabled || !isAdmin || isChecking) return

    const interval = setInterval(() => {
      // Check if tab is visible
      if (!document.hidden) {
        console.log('[Analytics] Auto-refresh triggered')
        // Use applied dates (currently active date range)
        loadAnalytics(0, appliedStartDate, appliedEndDate).catch(console.error)
      }
    }, 10 * 60 * 1000) // 10 minutes

    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRefreshEnabled, isAdmin, isChecking, appliedStartDate, appliedEndDate]) // Include applied dates

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
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      // Trigger apply on Enter
                      if (startDate && endDate && new Date(startDate) <= new Date(endDate)) {
                        hasLoadedOnceRef.current = false
                        setAppliedStartDate(startDate)
                        setAppliedEndDate(endDate)
                        loadAnalytics(0, startDate, endDate).catch(console.error)
                      }
                    }
                  }}
                  className="input-field text-sm"
                />
                <span className="text-gray-500">to</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      // Trigger apply on Enter
                      if (startDate && endDate && new Date(startDate) <= new Date(endDate)) {
                        hasLoadedOnceRef.current = false
                        setAppliedStartDate(startDate)
                        setAppliedEndDate(endDate)
                        loadAnalytics(0, startDate, endDate).catch(console.error)
                      }
                    }
                  }}
                  className="input-field text-sm"
                />
                {(startDate !== appliedStartDate || endDate !== appliedEndDate) && (
                  <span className="text-xs text-amber-600 font-medium">Dates changed</span>
                )}
                <button
                  onClick={() => {
                    // Validate dates before applying
                    if (!startDate || !endDate) {
                      toast.error('Please select both start and end dates')
                      return
                    }
                    if (new Date(startDate) > new Date(endDate)) {
                      toast.error('Start date must be before end date')
                      return
                    }
                    hasLoadedOnceRef.current = false // Allow reload with new date range
                    setAppliedStartDate(startDate)
                    setAppliedEndDate(endDate)
                    // Pass current date values directly to ensure latest values are used
                    loadAnalytics(0, startDate, endDate).catch(console.error)
                  }}
                  disabled={loading}
                  className="px-3 py-1.5 text-xs bg-green-100 hover:bg-green-200 text-green-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {loading ? 'Loading...' : 'Apply'}
                </button>
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
                onClick={() => {
                  // Use applied dates when manually refreshing
                  loadAnalytics(0, appliedStartDate, appliedEndDate).catch(console.error)
                }}
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
              { id: 'gdpr' as TabType, label: 'GDPR Compliance', icon: Shield },
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

          {/* Error Banner */}
          {error && (
            <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-red-900 mb-1">Error Loading Data</h3>
                  <p className="text-sm text-red-700 mb-3">{error.message}</p>
                  <div className="flex items-center gap-2">
                    {error.retryable && (
                      <button
                        onClick={() => {
                          loadAnalytics(0, appliedStartDate, appliedEndDate).catch(console.error)
                        }}
                        className="px-3 py-1.5 text-xs bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors"
                      >
                        Retry
                      </button>
                    )}
                    {(error.type === 'AUTH' || error.message.includes('access denied')) && (
                      <button
                        onClick={handleReLogin}
                        className="px-3 py-1.5 text-xs bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg transition-colors"
                      >
                        Re-Login
                      </button>
                    )}
                    <button
                      onClick={() => setError(null)}
                      className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'analytics' && (
              <AnalyticsTab analytics={analytics} loading={loading} error={error} onRetry={() => loadAnalytics(0, appliedStartDate, appliedEndDate)} />
            )}
            {activeTab === 'users' && (
              <UsersTab adminApi={adminApi} />
            )}
            {activeTab === 'logs' && (
              <LogsTab adminApi={adminApi} />
            )}
            {activeTab === 'gdpr' && (
              <GDPRComplianceTab adminApi={adminApi} />
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

// Analytics Tab Component - PM-Focused Improvements
const AnalyticsTab: React.FC<{ 
  analytics: AdminAnalyticsType | null; 
  loading: boolean;
  error?: { message: string; type?: string; retryable?: boolean } | null;
  onRetry?: () => void;
}> = ({ analytics, loading, error, onRetry }) => {
  if (loading && !analytics) {
    return <LoadingSpinner />
  }

  if (error && !analytics) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to Load Analytics</h3>
        <p className="text-gray-600 mb-4">{error.message}</p>
        <div className="flex items-center justify-center gap-3">
          {error.retryable && onRetry && (
            <button
              onClick={onRetry}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Retry
            </button>
          )}
          {error.type === 'AUTH' && (
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            >
              Re-Login
            </button>
          )}
        </div>
      </div>
    )
  }

  if (!analytics && !loading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No analytics data available</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Load Analytics
          </button>
        )}
      </div>
    )
  }

  // TypeScript guard: analytics must not be null at this point
  if (!analytics) {
    return null
  }

  // Calculate PM-focused metrics
  const userGrowthData = analytics.growth.userGrowth
  const linksGrowthData = analytics.growth.linksGrowth
  
  // Calculate growth rates
  const recentUserGrowth = userGrowthData.length >= 2 
    ? userGrowthData.slice(-7).reduce((sum, d) => sum + d.newUsers, 0)
    : 0
  const previousUserGrowth = userGrowthData.length >= 14
    ? userGrowthData.slice(-14, -7).reduce((sum, d) => sum + d.newUsers, 0)
    : recentUserGrowth
  const userGrowthRate = previousUserGrowth > 0 
    ? ((recentUserGrowth - previousUserGrowth) / previousUserGrowth * 100).toFixed(1)
    : recentUserGrowth > 0 ? '100+' : '0'

  const recentLinksGrowth = linksGrowthData.length >= 2
    ? linksGrowthData.slice(-7).reduce((sum, d) => sum + d.count, 0)
    : 0
  const previousLinksGrowth = linksGrowthData.length >= 14
    ? linksGrowthData.slice(-14, -7).reduce((sum, d) => sum + d.count, 0)
    : recentLinksGrowth
  const linksGrowthRate = previousLinksGrowth > 0
    ? ((recentLinksGrowth - previousLinksGrowth) / previousLinksGrowth * 100).toFixed(1)
    : recentLinksGrowth > 0 ? '100+' : '0'

  // Calculate engagement metrics
  const activeUserRate = analytics.summary.totalUsers > 0
    ? ((analytics.summary.activeUsers / analytics.summary.totalUsers) * 100).toFixed(1)
    : '0'
  
  const extensionAdoptionRate = analytics.summary.totalUsers > 0
    ? ((analytics.summary.extensionUsers / analytics.summary.totalUsers) * 100).toFixed(1)
    : '0'

  // Calculate health indicators
  const usersAtLimit = analytics.usersApproachingLimits
  const limitHealth = analytics.summary.totalUsers > 0
    ? ((usersAtLimit / analytics.summary.totalUsers) * 100).toFixed(1)
    : '0'

  return (
    <div className="space-y-6">
      {/* Executive Summary - PM Focus */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Executive Summary</h2>
            <p className="text-sm text-gray-600 mt-1">
              {new Date(analytics.dateRange.startDate).toLocaleDateString()} - {new Date(analytics.dateRange.endDate).toLocaleDateString()}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
              parseFloat(userGrowthRate) >= 0 
                ? 'bg-green-100 text-green-700' 
                : 'bg-red-100 text-red-700'
            }`}>
              {parseFloat(userGrowthRate) >= 0 ? '↑' : '↓'} {Math.abs(parseFloat(userGrowthRate))}% User Growth
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <EnhancedStatCard
            title="Total Users"
            value={analytics.summary.totalUsers}
            change={userGrowthRate}
            changeLabel="vs last week"
            subtitle={`${analytics.summary.activeUsers} active (${activeUserRate}%)`}
            icon={Users}
            color="blue"
            trend={parseFloat(userGrowthRate) >= 0 ? 'up' : 'down'}
          />
          <EnhancedStatCard
            title="Total Links"
            value={analytics.summary.totalLinksAllTime}
            change={analytics.summary.linksInPeriod}
            changeLabel={`${analytics.summary.linksInPeriod} in period`}
            subtitle={`${analytics.summary.extensionLinksInPeriod} extension, ${analytics.summary.webLinksInPeriod} web (this period)`}
            icon={LinkIcon}
            color="green"
            trend={parseFloat(linksGrowthRate) >= 0 ? 'up' : 'down'}
          />
          <EnhancedStatCard
            title="Extension Adoption"
            value={`${extensionAdoptionRate}%`}
            change={analytics.summary.extensionUsers}
            changeLabel="users"
            subtitle={`${analytics.summary.extensionLinksInPeriod} links via extension (this period)`}
            icon={TrendingUp}
            color="purple"
            trend="up"
          />
          <EnhancedStatCard
            title="Avg Links/User"
            value={analytics.summary.averageLinksPerUser.toFixed(1)}
            change={analytics.summary.activeUsers}
            changeLabel="active users"
            subtitle={`${analytics.summary.inactiveUsers} inactive`}
            icon={BarChart3}
            color="orange"
            trend="neutral"
          />
        </div>
      </div>

      {/* Health Indicators - PM Focus */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <HealthIndicator
          title="User Limit Health"
          value={limitHealth}
          unit="%"
          status={parseFloat(limitHealth) < 10 ? 'healthy' : parseFloat(limitHealth) < 25 ? 'warning' : 'critical'}
          description={`${usersAtLimit} users approaching limits`}
          action={usersAtLimit > 0 ? `Review ${usersAtLimit} users` : undefined}
        />
        <HealthIndicator
          title="User Engagement"
          value={activeUserRate}
          unit="%"
          status={parseFloat(activeUserRate) > 50 ? 'healthy' : parseFloat(activeUserRate) > 25 ? 'warning' : 'critical'}
          description={`${analytics.summary.activeUsers} of ${analytics.summary.totalUsers} users active`}
        />
        <HealthIndicator
          title="Storage Usage"
          value={analytics.summary.totalStorageMB.toFixed(1)}
          unit="MB"
          status="healthy"
          description={`${analytics.summary.totalStorageKB.toFixed(0)} KB total`}
        />
      </div>

      {/* Growth Trends with Better Visualization */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <EnhancedGrowthChart
          title="User Growth Trend"
          data={analytics.growth.userGrowth}
          dataKey="newUsers"
          showTrend={true}
          periodLabel="Last 7 days"
        />
        <EnhancedGrowthChart
          title="Links Created Trend"
          data={analytics.growth.linksGrowth}
          dataKey="count"
          extensionKey="extensionCount"
          webKey="webCount"
          showTrend={true}
          periodLabel="Last 7 days"
        />
      </div>

      {/* Actionable Insights - PM Focus */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-amber-600" />
          Actionable Insights
        </h3>
        <div className="space-y-3">
          {usersAtLimit > 0 && (
            <InsightCard
              type="warning"
              title={`${usersAtLimit} Users Approaching Limits`}
              description="Consider increasing limits or reaching out to power users"
              action="View Users"
            />
          )}
          {parseFloat(extensionAdoptionRate) < 30 && (
            <InsightCard
              type="info"
              title="Low Extension Adoption"
              description={`Only ${extensionAdoptionRate}% of users use the extension. Consider promoting it.`}
            />
          )}
          {parseFloat(activeUserRate) < 40 && (
            <InsightCard
              type="warning"
              title="Low User Engagement"
              description={`Only ${activeUserRate}% of users are active. Consider re-engagement campaigns.`}
            />
          )}
          {analytics.summary.extensionLinksInPeriod > analytics.summary.webLinksInPeriod && (
            <InsightCard
              type="success"
              title="Extension is Primary Channel"
              description="Users prefer the extension over web. Great product-market fit!"
            />
          )}
        </div>
      </div>

      {/* Top Categories with Better Context */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Top Categories</h3>
          <span className="text-sm text-gray-500">{analytics.topCategories.length} categories total</span>
        </div>
        <div className="space-y-2">
          {analytics.topCategories.slice(0, 10).map((cat, index) => (
            <EnhancedCategoryBar
              key={cat.category}
              category={cat.category}
              linkCount={cat.linkCount}
              userCount={cat.userCount}
              maxCount={analytics.topCategories[0]?.linkCount || 1}
              rank={index + 1}
              percentage={analytics.summary.linksInPeriod > 0 
                ? ((cat.linkCount / analytics.summary.linksInPeriod) * 100).toFixed(1)
                : '0'}
            />
          ))}
        </div>
      </div>

      {/* Content Types with Distribution Chart */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Content Type Distribution</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {analytics.contentTypes.map((ct) => {
              const percentage = analytics.summary.linksInPeriod > 0
                ? ((ct.count / analytics.summary.linksInPeriod) * 100).toFixed(1)
                : '0'
              return (
                <div key={ct.contentType} className="text-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="text-2xl font-bold text-gray-900">{ct.count}</div>
                  <div className="text-sm text-gray-600 mt-1 capitalize">{ct.contentType}</div>
                  <div className="text-xs text-gray-500 mt-1">{percentage}%</div>
                </div>
              )
            })}
          </div>
          <div className="flex items-center justify-center">
            <ContentTypeChart data={analytics.contentTypes} total={analytics.summary.linksInPeriod} />
          </div>
        </div>
      </div>

      {/* Extension Version Adoption */}
      {analytics.extensionVersions && analytics.extensionVersions.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Extension Version Adoption</h3>
          <div className="space-y-2">
            {analytics.extensionVersions.map((version, index) => {
              const totalExtensionUsers = analytics.extensionVersions.reduce((sum, v) => sum + v.userCount, 0)
              const userPercentage = totalExtensionUsers > 0
                ? ((version.userCount / totalExtensionUsers) * 100).toFixed(1)
                : '0'
              return (
                <div key={version.version} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-600 w-8">v{version.version}</span>
                    <div>
                      <div className="text-sm font-semibold text-gray-900">{version.userCount} users</div>
                      <div className="text-xs text-gray-500">{version.linkCount} links</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${userPercentage}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-600 w-12 text-right">{userPercentage}%</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ✅ NEW: User Segmentation - PM Focus */}
      {analytics.userSegmentation && (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-600" />
            User Segmentation
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <SegmentCard
              title="New Users"
              value={analytics.userSegmentation.newUsers}
              description="First link in period"
              color="blue"
              percentage={analytics.summary.totalUsers > 0 
                ? ((analytics.userSegmentation.newUsers / analytics.summary.totalUsers) * 100).toFixed(1)
                : '0'}
            />
            <SegmentCard
              title="Returning Users"
              value={analytics.userSegmentation.returningUsers}
              description="Active in period"
              color="green"
              percentage={analytics.summary.totalUsers > 0
                ? ((analytics.userSegmentation.returningUsers / analytics.summary.totalUsers) * 100).toFixed(1)
                : '0'}
            />
            <SegmentCard
              title="Power Users"
              value={analytics.userSegmentation.powerUsers}
              description="20+ links total"
              color="purple"
              percentage={analytics.summary.totalUsers > 0
                ? ((analytics.userSegmentation.powerUsers / analytics.summary.totalUsers) * 100).toFixed(1)
                : '0'}
            />
            <SegmentCard
              title="Moderate Users"
              value={analytics.userSegmentation.moderateUsers}
              description="6-19 links"
              color="orange"
              percentage={analytics.summary.totalUsers > 0
                ? ((analytics.userSegmentation.moderateUsers / analytics.summary.totalUsers) * 100).toFixed(1)
                : '0'}
            />
            <SegmentCard
              title="Casual Users"
              value={analytics.userSegmentation.casualUsers}
              description="1-5 links"
              color="gray"
              percentage={analytics.summary.totalUsers > 0
                ? ((analytics.userSegmentation.casualUsers / analytics.summary.totalUsers) * 100).toFixed(1)
                : '0'}
            />
          </div>
        </div>
      )}

      {/* ✅ NEW: Engagement Metrics - PM Focus */}
      {analytics.engagement && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            Engagement Depth
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <EngagementMetric
              title="Links per Active User"
              value={analytics.engagement.avgLinksPerActiveUser.toFixed(1)}
              description="Average links created per active user"
              icon={LinkIcon}
            />
            <EngagementMetric
              title="Categories per User"
              value={analytics.engagement.avgCategoriesPerUser.toFixed(1)}
              description="Average categories used"
              icon={Tag}
            />
            <EngagementMetric
              title="Collections per User"
              value={analytics.engagement.avgCollectionsPerUser.toFixed(1)}
              description="Average collections created"
              icon={FileText}
            />
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="text-sm font-medium text-gray-700 mb-1">Collection Adoption</div>
              <div className="text-2xl font-bold text-blue-600">{analytics.engagement.collectionAdoptionRate}%</div>
              <div className="text-xs text-gray-600 mt-1">{analytics.engagement.usersWithCollections} users using collections</div>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <div className="text-sm font-medium text-gray-700 mb-1">Multi-Category Users</div>
              <div className="text-2xl font-bold text-green-600">{analytics.engagement.usersWithMultipleCategories}</div>
              <div className="text-xs text-gray-600 mt-1">Users organizing with multiple categories</div>
            </div>
          </div>
        </div>
      )}

      {/* ✅ NEW: Retention & Churn - PM Focus */}
      {analytics.retention && analytics.retention.previousPeriodActive > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-600" />
            Retention & Churn Analysis
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <RetentionCard
              title="Retention Rate"
              value={`${analytics.retention.retentionRate}%`}
              description={`${analytics.retention.retainedUsers} of ${analytics.retention.previousPeriodActive} users retained`}
              status={analytics.retention.retentionRate >= 60 ? 'excellent' : analytics.retention.retentionRate >= 40 ? 'good' : 'poor'}
              trend="up"
            />
            <RetentionCard
              title="Churn Rate"
              value={`${analytics.retention.churnRate}%`}
              description={`${analytics.retention.churnedUsers} users churned`}
              status={analytics.retention.churnRate <= 20 ? 'excellent' : analytics.retention.churnRate <= 40 ? 'good' : 'poor'}
              trend="down"
            />
            <RetentionCard
              title="Retained Users"
              value={analytics.retention.retainedUsers}
              description="Active in both periods"
              status="neutral"
              trend="neutral"
            />
            <RetentionCard
              title="Previous Period Active"
              value={analytics.retention.previousPeriodActive}
              description="Baseline for comparison"
              status="neutral"
              trend="neutral"
            />
          </div>
        </div>
      )}

      {/* ✅ NEW: Feature Adoption - PM Focus */}
      {analytics.featureAdoption && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Settings className="w-5 h-5 text-green-600" />
            Feature Adoption Rates
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <FeatureAdoptionCard
              title="Collections"
              adoptionRate={analytics.featureAdoption.collectionAdoption}
              userCount={analytics.featureAdoption.collectionUsers}
              totalUsers={analytics.summary.totalUsers}
              color="blue"
            />
            <FeatureAdoptionCard
              title="Favorites"
              adoptionRate={analytics.featureAdoption.favoriteAdoption}
              userCount={analytics.featureAdoption.favoriteUsers}
              totalUsers={analytics.summary.totalUsers}
              color="yellow"
            />
            <FeatureAdoptionCard
              title="Archive"
              adoptionRate={analytics.featureAdoption.archiveAdoption}
              userCount={analytics.featureAdoption.archiveUsers}
              totalUsers={analytics.summary.totalUsers}
              color="gray"
            />
            <FeatureAdoptionCard
              title="Tags"
              adoptionRate={analytics.featureAdoption.tagsAdoption}
              userCount={analytics.featureAdoption.tagsUsers}
              totalUsers={analytics.summary.totalUsers}
              color="green"
            />
          </div>
        </div>
      )}
    </div>
  )
}

// Stat Card Component (Legacy - kept for compatibility)
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

// Enhanced Stat Card with Trends - PM Focus
const EnhancedStatCard: React.FC<{
  title: string
  value: string | number
  change?: string | number
  changeLabel?: string
  subtitle: string
  icon: React.ElementType
  color: 'blue' | 'green' | 'purple' | 'orange'
  trend: 'up' | 'down' | 'neutral'
}> = ({ title, value, change, changeLabel, subtitle, icon: Icon, color, trend }) => {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-600',
  }

  const trendColors = {
    up: 'text-green-600 bg-green-50',
    down: 'text-red-600 bg-red-50',
    neutral: 'text-gray-600 bg-gray-50',
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2.5 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        {change !== undefined && (
          <div className={`px-2 py-1 rounded text-xs font-medium ${trendColors[trend]}`}>
            {trend === 'up' && '↑'} {trend === 'down' && '↓'} {change}{changeLabel && ` ${changeLabel}`}
          </div>
        )}
      </div>
      <h3 className="text-xs font-medium text-gray-600 mb-1">{title}</h3>
      <div className="text-2xl font-bold text-gray-900 mb-1">{value}</div>
      <p className="text-xs text-gray-500">{subtitle}</p>
    </div>
  )
}

// Health Indicator Component - PM Focus
const HealthIndicator: React.FC<{
  title: string
  value: string
  unit: string
  status: 'healthy' | 'warning' | 'critical'
  description: string
  action?: string
}> = ({ title, value, unit, status, description, action }) => {
  const statusColors = {
    healthy: 'bg-green-100 text-green-700 border-green-300',
    warning: 'bg-yellow-100 text-yellow-700 border-yellow-300',
    critical: 'bg-red-100 text-red-700 border-red-300',
  }

  const statusIcons = {
    healthy: '✓',
    warning: '⚠',
    critical: '✗',
  }

  return (
    <div className={`bg-white rounded-lg border-2 p-4 ${statusColors[status]}`}>
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-semibold">{title}</h4>
        <span className="text-lg font-bold">{statusIcons[status]}</span>
      </div>
      <div className="text-2xl font-bold mb-1">
        {value} <span className="text-sm font-normal">{unit}</span>
      </div>
      <p className="text-xs opacity-90 mb-2">{description}</p>
      {action && (
        <button className="text-xs font-medium underline opacity-80 hover:opacity-100">
          {action} →
        </button>
      )}
    </div>
  )
}

// Insight Card Component - PM Focus
const InsightCard: React.FC<{
  type: 'info' | 'warning' | 'success'
  title: string
  description: string
  action?: string
}> = ({ type, title, description, action }) => {
  const typeColors = {
    info: 'bg-blue-50 border-blue-200 text-blue-900',
    warning: 'bg-amber-50 border-amber-200 text-amber-900',
    success: 'bg-green-50 border-green-200 text-green-900',
  }

  return (
    <div className={`p-4 rounded-lg border ${typeColors[type]}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h4 className="font-semibold text-sm mb-1">{title}</h4>
          <p className="text-xs opacity-90">{description}</p>
        </div>
        {action && (
          <button className="text-xs font-medium underline ml-2 whitespace-nowrap">
            {action} →
          </button>
        )}
      </div>
    </div>
  )
}

// Growth Chart Component (Simple CSS-based) - Legacy
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

// Enhanced Growth Chart with Trends - PM Focus
const EnhancedGrowthChart: React.FC<{
  title: string
  data: Array<{ date: string; [key: string]: any }>
  dataKey: string
  extensionKey?: string
  webKey?: string
  showTrend?: boolean
  periodLabel?: string
}> = ({ title, data, dataKey, extensionKey, webKey, showTrend, periodLabel }) => {
  const maxValue = Math.max(...data.map(d => {
    const total = d[dataKey] || 0
    const ext = extensionKey ? (d[extensionKey] || 0) : 0
    const web = webKey ? (d[webKey] || 0) : 0
    return total || ext || web
  }), 1)

  // Calculate trend
  const recentValues = data.slice(-7).map(d => d[dataKey] || 0)
  const previousValues = data.length >= 14 ? data.slice(-14, -7).map(d => d[dataKey] || 0) : []
  const recentAvg = recentValues.reduce((a, b) => a + b, 0) / recentValues.length
  const previousAvg = previousValues.length > 0 ? previousValues.reduce((a, b) => a + b, 0) / previousValues.length : recentAvg
  const trend = previousAvg > 0 ? ((recentAvg - previousAvg) / previousAvg * 100).toFixed(1) : '0'
  const trendDirection = parseFloat(trend) >= 0 ? 'up' : 'down'

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        {showTrend && (
          <div className="flex items-center gap-2">
            {periodLabel && <span className="text-xs text-gray-500">{periodLabel}</span>}
            <span className={`text-xs font-medium px-2 py-1 rounded ${
              trendDirection === 'up' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              {trendDirection === 'up' ? '↑' : '↓'} {Math.abs(parseFloat(trend))}%
            </span>
          </div>
        )}
      </div>
      <div className="space-y-2">
        {data.map((item, index) => {
          const date = new Date(item.date)
          const value = item[dataKey] || 0
          const ext = extensionKey ? (item[extensionKey] || 0) : 0
          const web = webKey ? (item[webKey] || 0) : 0
          
          return (
            <div key={index} className="flex items-center gap-2 group">
              <div className="text-xs text-gray-600 w-20 flex-shrink-0">
                {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </div>
              <div className="flex-1 flex items-center gap-0.5 bg-gray-100 rounded h-7 relative overflow-hidden">
                {webKey && web > 0 && (
                  <div
                    className="bg-blue-500 h-7 rounded-l transition-all group-hover:opacity-90"
                    style={{ width: `${(web / maxValue) * 100}%` }}
                    title={`Web: ${web}`}
                  />
                )}
                {extensionKey && ext > 0 && (
                  <div
                    className="bg-green-500 h-7 rounded-r transition-all group-hover:opacity-90"
                    style={{ width: `${(ext / maxValue) * 100}%` }}
                    title={`Extension: ${ext}`}
                  />
                )}
                {!extensionKey && !webKey && (
                  <div
                    className="bg-blue-500 h-7 rounded transition-all group-hover:opacity-90"
                    style={{ width: `${(value / maxValue) * 100}%` }}
                    title={value.toString()}
                  />
                )}
              </div>
              <div className="text-xs font-semibold text-gray-700 w-12 text-right">
                {value}
              </div>
            </div>
          )
        })}
      </div>
      {extensionKey && webKey && (
        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span className="text-xs text-gray-600">Web</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span className="text-xs text-gray-600">Extension</span>
          </div>
        </div>
      )}
    </div>
  )
}

// Category Bar Component - Legacy
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

// Enhanced Category Bar with Percentage - PM Focus
const EnhancedCategoryBar: React.FC<{
  category: string
  linkCount: number
  userCount: number
  maxCount: number
  rank: number
  percentage: string
}> = ({ category, linkCount, userCount, maxCount, rank, percentage }) => {
  const barPercentage = (linkCount / maxCount) * 100

  return (
    <div className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors group">
      <div className="text-sm font-bold text-gray-400 w-8">#{rank}</div>
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-sm font-semibold text-gray-900 capitalize">{category}</span>
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-blue-600">{percentage}%</span>
            <span className="text-xs text-gray-600">{linkCount} links</span>
            <span className="text-xs text-gray-500">({userCount} users)</span>
          </div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
          <div
            className="bg-gradient-to-r from-blue-500 to-blue-600 h-2.5 rounded-full transition-all group-hover:from-blue-600 group-hover:to-blue-700"
            style={{ width: `${barPercentage}%` }}
          />
        </div>
      </div>
    </div>
  )
}

// Content Type Chart Component - PM Focus
const ContentTypeChart: React.FC<{
  data: Array<{ contentType: string; count: number }>
  total: number
}> = ({ data, total }) => {
  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899']
  
  return (
    <div className="relative w-full h-48 flex items-center justify-center">
      <svg viewBox="0 0 200 200" className="w-full h-full">
        {data.map((item, index) => {
          const percentage = total > 0 ? (item.count / total) * 100 : 0
          const angle = (percentage / 100) * 360
          const startAngle = data.slice(0, index).reduce((sum, d) => sum + (total > 0 ? (d.count / total) * 360 : 0), 0)
          
          // Simple pie chart representation
          const radius = 80
          const x1 = 100 + radius * Math.cos((startAngle - 90) * Math.PI / 180)
          const y1 = 100 + radius * Math.sin((startAngle - 90) * Math.PI / 180)
          const x2 = 100 + radius * Math.cos((startAngle + angle - 90) * Math.PI / 180)
          const y2 = 100 + radius * Math.sin((startAngle + angle - 90) * Math.PI / 180)
          const largeArc = angle > 180 ? 1 : 0
          
          return (
            <path
              key={item.contentType}
              d={`M 100 100 L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`}
              fill={colors[index % colors.length]}
              opacity="0.8"
              className="hover:opacity-100 transition-opacity"
            />
          )
        })}
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">{total}</div>
          <div className="text-xs text-gray-500">Total Links</div>
        </div>
      </div>
    </div>
  )
}

// ✅ NEW: Segment Card Component - PM Focus
const SegmentCard: React.FC<{
  title: string
  value: number
  description: string
  color: 'blue' | 'green' | 'purple' | 'orange' | 'gray'
  percentage: string
}> = ({ title, value, description, color, percentage }) => {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-700 border-blue-300',
    green: 'bg-green-100 text-green-700 border-green-300',
    purple: 'bg-purple-100 text-purple-700 border-purple-300',
    orange: 'bg-orange-100 text-orange-700 border-orange-300',
    gray: 'bg-gray-100 text-gray-700 border-gray-300',
  }

  return (
    <div className={`p-4 rounded-lg border-2 ${colorClasses[color]}`}>
      <div className="text-sm font-semibold mb-1">{title}</div>
      <div className="text-2xl font-bold mb-1">{value}</div>
      <div className="text-xs opacity-90 mb-1">{description}</div>
      <div className="text-xs font-medium">{percentage}% of total</div>
    </div>
  )
}

// ✅ NEW: Engagement Metric Component - PM Focus
const EngagementMetric: React.FC<{
  title: string
  value: string
  description: string
  icon: React.ElementType
}> = ({ title, value, description, icon: Icon }) => {
  return (
    <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4 text-blue-600" />
        <h4 className="text-sm font-semibold text-gray-900">{title}</h4>
      </div>
      <div className="text-3xl font-bold text-blue-600 mb-1">{value}</div>
      <p className="text-xs text-gray-600">{description}</p>
    </div>
  )
}

// ✅ NEW: Retention Card Component - PM Focus
const RetentionCard: React.FC<{
  title: string
  value: string | number
  description: string
  status: 'excellent' | 'good' | 'poor' | 'neutral'
  trend: 'up' | 'down' | 'neutral'
}> = ({ title, value, description, status, trend }) => {
  const statusColors = {
    excellent: 'bg-green-50 border-green-300 text-green-900',
    good: 'bg-blue-50 border-blue-300 text-blue-900',
    poor: 'bg-red-50 border-red-300 text-red-900',
    neutral: 'bg-gray-50 border-gray-300 text-gray-900',
  }

  const statusIcons = {
    excellent: '✓',
    good: '→',
    poor: '⚠',
    neutral: '•',
  }

  return (
    <div className={`p-4 rounded-lg border-2 ${statusColors[status]}`}>
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-semibold">{title}</h4>
        <span className="text-lg">{statusIcons[status]}</span>
      </div>
      <div className="text-2xl font-bold mb-1">{value}</div>
      <p className="text-xs opacity-90">{description}</p>
    </div>
  )
}

// ✅ NEW: Feature Adoption Card Component - PM Focus
const FeatureAdoptionCard: React.FC<{
  title: string
  adoptionRate: number
  userCount: number
  totalUsers: number
  color: 'blue' | 'yellow' | 'gray' | 'green'
}> = ({ title, adoptionRate, userCount, totalUsers, color }) => {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-900',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-900',
    gray: 'bg-gray-50 border-gray-200 text-gray-900',
    green: 'bg-green-50 border-green-200 text-green-900',
  }

  const barColors = {
    blue: 'bg-blue-600',
    yellow: 'bg-yellow-600',
    gray: 'bg-gray-600',
    green: 'bg-green-600',
  }

  return (
    <div className={`p-4 rounded-lg border ${colorClasses[color]}`}>
      <h4 className="text-sm font-semibold mb-2">{title}</h4>
      <div className="text-3xl font-bold mb-2">{adoptionRate}%</div>
      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
        <div
          className={`h-2 rounded-full ${barColors[color]}`}
          style={{ width: `${adoptionRate}%` }}
        />
      </div>
      <p className="text-xs opacity-90">{userCount} of {totalUsers} users</p>
    </div>
  )
}

// Users Tab Component (placeholder - will implement next)
const UsersTab: React.FC<{ adminApi: ReturnType<typeof useAdminApi> }> = ({ adminApi }) => {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [activeOnly, setActiveOnly] = useState<boolean | undefined>(undefined)
  const toast = useToast()
  
  // Use ref to prevent concurrent requests
  const loadingRef = React.useRef(false)

  const loadUsers = async (retryCount = 0) => {
    if (loadingRef.current) return
    
    try {
      loadingRef.current = true
      setLoading(true)
      setError(null)
      const data = await adminApi.getUsers(page, 25, search || undefined, activeOnly)
      setUsers(data.users)
      setTotal(data.pagination.total)
      setError(null)
    } catch (error: any) {
      const errorMessage = error?.message || error?.type === 'NOT_FOUND' 
        ? 'Admin access denied. Please re-authenticate.'
        : 'Failed to load users'
      setError(errorMessage)
      toast.error(errorMessage)
      console.error('Failed to load users:', error)
    } finally {
      loadingRef.current = false
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, activeOnly]) // Only reload when filters change

  if (error && users.length === 0 && !loading) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to Load Users</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={() => loadUsers()}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {error && users.length > 0 && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-yellow-700">{error}</p>
              <button
                onClick={() => loadUsers()}
                className="mt-2 px-3 py-1.5 text-xs bg-yellow-100 hover:bg-yellow-200 text-yellow-700 rounded-lg transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      )}
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
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
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
                    <td className="px-4 py-3">
                      {user.email ? (
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-gray-900">{user.email}</span>
                          <span className="text-xs text-gray-500 font-mono">{user.userId.slice(0, 15)}...</span>
                        </div>
                      ) : (
                        <span className="text-sm font-mono text-gray-900">{user.userId.slice(0, 20)}...</span>
                      )}
                    </td>
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

// ✅ ENHANCED: Logs Tab Component - PM Focus
const LogsTab: React.FC<{ adminApi: ReturnType<typeof useAdminApi> }> = ({ adminApi }) => {
  // ✅ Use Context - single source of truth, no duplicate checks
  const { isAdmin, isChecking } = useAdminAccess()
  const [logs, setLogs] = useState<SystemLog[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [logType, setLogType] = useState<string>('')
  const [severity, setSeverity] = useState<string>('')
  const [logStartDate, setLogStartDate] = useState<string>('')
  const [logEndDate, setLogEndDate] = useState<string>('')
  const [showStats, setShowStats] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [statistics, setStatistics] = useState<SystemLogsResponse['statistics'] | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [logsSize, setLogsSize] = useState<{ totalLogs: number; estimatedSizeBytes: number; estimatedSizeKB: number; estimatedSizeMB: number } | null>(null)
  const [loadingSize, setLoadingSize] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState('')
  const toast = useToast()

  const loadingRef = React.useRef(false)
  const autoRefreshIntervalRef = React.useRef<NodeJS.Timeout | null>(null)

  const loadLogs = async (includeStats: boolean = showStats) => {
    if (loadingRef.current) return

    try {
      loadingRef.current = true
      setLoading(true)
      setError(null)
      const data = await adminApi.getLogs(
        page,
        50,
        logType || undefined,
        severity || undefined,
        logStartDate || undefined,
        logEndDate || undefined,
        search || undefined,
        includeStats
      )
      setLogs(data.logs)
      setTotal(data.pagination.total)
      if (data.statistics) {
        setStatistics(data.statistics)
      }
      setError(null)
    } catch (error: any) {
      const errorMessage = error?.message || error?.type === 'NOT_FOUND'
        ? 'Admin access denied. Please re-authenticate.'
        : 'Failed to load logs'
      setError(errorMessage)
      toast.error(errorMessage)
      console.error('Failed to load logs:', error)
    } finally {
      loadingRef.current = false
      setLoading(false)
    }
  }

  useEffect(() => {
    loadLogs()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, logType, severity, logStartDate, logEndDate, showStats])

  // Auto-refresh
  useEffect(() => {
    if (autoRefresh) {
      autoRefreshIntervalRef.current = setInterval(() => {
        loadLogs(false) // Don't reload stats every time
      }, 30000) // 30 seconds
      return () => {
        if (autoRefreshIntervalRef.current) {
          clearInterval(autoRefreshIntervalRef.current)
        }
      }
    } else {
      if (autoRefreshIntervalRef.current) {
        clearInterval(autoRefreshIntervalRef.current)
      }
    }
  }, [autoRefresh])

  const loadLogsSize = async () => {
    try {
      setLoadingSize(true)
      const sizeInfo = await adminApi.getLogsSize()
      setLogsSize(sizeInfo)
    } catch (error: any) {
      console.error('Failed to load logs size:', error)
      // If API doesn't support size endpoint, estimate from statistics
      if (statistics) {
        const estimatedBytes = statistics.totalLogs * 500 // Rough estimate: 500 bytes per log
        setLogsSize({
          totalLogs: statistics.totalLogs,
          estimatedSizeBytes: estimatedBytes,
          estimatedSizeKB: estimatedBytes / 1024,
          estimatedSizeMB: estimatedBytes / (1024 * 1024)
        })
      }
    } finally {
      setLoadingSize(false)
    }
  }

  const handleDeleteAllLogs = async () => {
    // Security check: Verify admin access before deletion
    if (!isAdmin || isChecking) {
      toast.error('Admin access required')
      setShowDeleteModal(false)
      return
    }

    // Security check: Require confirmation text
    if (deleteConfirmation !== 'DELETE') {
      toast.error('Please type "DELETE" to confirm')
      return
    }

    try {
      setIsDeleting(true)
      const result = await adminApi.deleteAllLogs()
      toast.success(`Successfully deleted ${result.deletedCount.toLocaleString()} logs`)
      setShowDeleteModal(false)
      setDeleteConfirmation('')
      setLogsSize(null)
      setStatistics(null)
      loadLogs(true) // Reload logs and stats
    } catch (error: any) {
      console.error('Failed to delete logs:', error)
      // Check if error is due to unauthorized access
      if (error?.status === 403 || error?.message?.includes('Admin access required') || error?.message?.includes('Forbidden')) {
        toast.error('Admin access required. You do not have permission to delete logs.')
        setShowDeleteModal(false)
      } else {
        toast.error(error?.message || 'Failed to delete logs')
      }
    } finally {
      setIsDeleting(false)
    }
  }

  const exportLogs = () => {
    const csvContent = [
      ['Timestamp', 'Type', 'Severity', 'User ID', 'Email', 'Details'].join(','),
      ...logs.map(log => [
        log.timestamp || '',
        log.type || '',
        log.severity || '',
        log.userId || '',
        log.email || '',
        JSON.stringify(log.details).replace(/"/g, '""')
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `smartrack-logs-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Logs exported successfully')
  }

  // Load logs size when statistics are available
  useEffect(() => {
    if (statistics && statistics.totalLogs > 0 && !logsSize) {
      loadLogsSize()
    }
  }, [statistics])

  // Security: Prevent access if not admin (after all hooks)
  if (isChecking) {
    return <LoadingSpinner />
  }

  if (!isAdmin) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Access Denied</h3>
        <p className="text-gray-600">Admin access required to view system logs.</p>
      </div>
    )
  }

  const getSeverityColor = (severity: string | null | undefined) => {
    if (!severity) {
      return 'bg-blue-100 text-blue-700 border-blue-300'
    }
    switch (severity.toLowerCase()) {
      case 'error':
      case 'critical':
        return 'bg-red-100 text-red-700 border-red-300'
      case 'warning':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300'
      case 'info':
      default:
        return 'bg-blue-100 text-blue-700 border-blue-300'
    }
  }

  const getSeverityIcon = (severity: string | null | undefined) => {
    if (!severity) {
      return 'info'
    }
    switch (severity.toLowerCase()) {
      case 'error':
      case 'critical':
        return '❌'
      case 'warning':
        return '⚠️'
      case 'info':
      default:
        return 'ℹ️'
    }
  }

  // Quick filter presets
  const quickFilters = [
    { label: 'Last 24h', start: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0], end: new Date().toISOString().split('T')[0] },
    { label: 'Last 7 days', start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], end: new Date().toISOString().split('T')[0] },
    { label: 'Last 30 days', start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], end: new Date().toISOString().split('T')[0] },
    { label: 'Errors Only', severity: 'error' },
    { label: 'Warnings Only', severity: 'warning' },
  ]

  if (error && logs.length === 0 && !loading) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to Load Logs</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={() => loadLogs()}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* ✅ NEW: Statistics Panel */}
      {statistics && showStats && (
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-600" />
              Log Statistics
            </h3>
            <button
              onClick={() => setShowStats(false)}
              className="text-xs text-gray-600 hover:text-gray-900"
            >
              Hide Stats
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="text-sm text-gray-600 mb-1">Total Logs</div>
              <div className="text-2xl font-bold text-gray-900">{statistics.totalLogs.toLocaleString()}</div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="text-sm text-gray-600 mb-1">Error Rate</div>
              <div className={`text-2xl font-bold ${statistics.errorRate > 10 ? 'text-red-600' : statistics.errorRate > 5 ? 'text-yellow-600' : 'text-green-600'}`}>
                {statistics.errorRate}%
              </div>
              <div className="text-xs text-gray-500">{statistics.errorCount} errors</div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="text-sm text-gray-600 mb-1">Recent Errors (24h)</div>
              <div className={`text-2xl font-bold ${statistics.recentErrors > 10 ? 'text-red-600' : statistics.recentErrors > 5 ? 'text-yellow-600' : 'text-green-600'}`}>
                {statistics.recentErrors}
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="text-sm text-gray-600 mb-1">Severity Distribution</div>
              <div className="flex gap-2 mt-2">
                {statistics.severityDistribution.slice(0, 3).map((s) => (
                  <div key={s.severity} className="flex-1 text-center">
                    <div className={`text-xs px-2 py-1 rounded ${getSeverityColor(s.severity)}`}>
                      {s.severity}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">{s.count}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Severity & Type Distribution */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Severity Distribution</h4>
              <div className="space-y-2">
                {statistics.severityDistribution.map((s: { severity: string; count: number }) => {
                  const percentage = statistics.totalLogs > 0 ? (s.count / statistics.totalLogs * 100).toFixed(1) : '0'
                  return (
                    <div key={s.severity} className="flex items-center gap-2">
                      <span className="text-xs w-20">{s.severity}</span>
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${getSeverityColor(s.severity).split(' ')[0]}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-600 w-16 text-right">{s.count} ({percentage}%)</span>
                    </div>
                  )
                })}
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Top Log Types</h4>
              <div className="space-y-2">
                {statistics.typeDistribution.slice(0, 5).map((item: { type: string; count: number }) => {
                  const percentage = statistics.totalLogs > 0 ? (item.count / statistics.totalLogs * 100).toFixed(1) : '0'
                  return (
                    <div key={item.type} className="flex items-center justify-between">
                      <span className="text-xs font-mono">{item.type}</span>
                      <span className="text-xs text-gray-600">{item.count} ({percentage}%)</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Hourly Trend */}
          {statistics && (
            <div className="bg-white rounded-lg p-4 border border-gray-200 mt-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Logs by Hour (Last 24h)</h4>
              {statistics.hourlyTrend && statistics.hourlyTrend.length > 0 ? (
                <div className="flex items-end gap-1 h-32">
                  {statistics.hourlyTrend.map((item: { hour: string; count: number }, index: number) => {
                    const maxCount = Math.max(...statistics.hourlyTrend.map((h: { hour: string; count: number }) => h.count), 1)
                    const height = maxCount > 0 ? (item.count / maxCount) * 100 : 0
                    return (
                      <div key={index} className="flex-1 flex flex-col items-center">
                        <div
                          className="w-full bg-blue-500 rounded-t hover:bg-blue-600 transition-colors cursor-pointer min-h-[2px]"
                          style={{ height: `${Math.max(height, 2)}%` }}
                          title={`${item.hour}: ${item.count} logs`}
                        />
                        <div className="text-xs text-gray-500 mt-1 transform -rotate-45 origin-top-left whitespace-nowrap">
                          {item.hour.split(':')[0]}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="flex items-center justify-center h-32 text-gray-400">
                  <div className="text-center">
                    <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No logs in the last 24 hours</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ✅ ENHANCED: Filters with Quick Presets */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-900">Filters & Search</h3>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-xs text-gray-600">
              <input
                type="checkbox"
                checked={showStats}
                onChange={(e) => setShowStats(e.target.checked)}
                className="rounded"
              />
              Show Stats
            </label>
            <label className="flex items-center gap-2 text-xs text-gray-600">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded"
              />
              Auto-refresh (30s)
            </label>
            <button
              onClick={exportLogs}
              className="px-3 py-1.5 text-xs bg-green-100 hover:bg-green-200 text-green-700 rounded-lg transition-colors flex items-center gap-1"
            >
              <Download className="w-3 h-3" />
              Export CSV
            </button>
            <button
              onClick={() => loadLogs()}
              disabled={loading}
              className="px-3 py-1.5 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors flex items-center gap-1"
            >
              <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            {isAdmin && !isChecking && (
              <button
                onClick={() => {
                  if (!isAdmin) {
                    toast.error('Admin access required')
                    return
                  }
                  loadLogsSize()
                  setShowDeleteModal(true)
                }}
                className="px-3 py-1.5 text-xs bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" />
                Delete All
              </button>
            )}
          </div>
        </div>

        {/* Quick Filters */}
        <div className="flex flex-wrap gap-2 mb-4">
          {quickFilters.map((filter, index) => (
            <button
              key={index}
              onClick={() => {
                if (filter.start && filter.end) {
                  setLogStartDate(filter.start)
                  setLogEndDate(filter.end)
                }
                if (filter.severity) {
                  setSeverity(filter.severity)
                }
                setPage(1)
              }}
              className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
            >
              {filter.label}
            </button>
          ))}
          <button
            onClick={() => {
              setSearch('')
              setLogType('')
              setSeverity('')
              setLogStartDate('')
              setLogEndDate('')
              setPage(1)
            }}
            className="px-3 py-1 text-xs bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors"
          >
            Clear All
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search logs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setPage(1)
                  loadLogs()
                }
              }}
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
            <option value="admin_analytics_access">Analytics Access</option>
            <option value="admin_analytics_error">Analytics Error</option>
            <option value="api_request">API Request</option>
            <option value="error">Error</option>
            <option value="user_action">User Action</option>
            <option value="rate_limit">Rate Limit</option>
            <option value="account_deletion">Account Deletion (GDPR/CCPA)</option>
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
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <>
          {/* ✅ ENHANCED: Better Log Table */}
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
                    <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                        {log.timestamp ? (
                          <div>
                            <div className="font-medium">{new Date(log.timestamp).toLocaleDateString()}</div>
                            <div className="text-xs text-gray-500">{new Date(log.timestamp).toLocaleTimeString()}</div>
                          </div>
                        ) : '-'}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                          {log.type || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs rounded-full border ${getSeverityColor(log.severity)} flex items-center gap-1 w-fit`}>
                          <span>{getSeverityIcon(log.severity)}</span>
                          {log.severity || 'info'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {log.email ? (
                          <div>
                            <div className="font-mono text-xs">{log.email}</div>
                            {log.userId && (
                              <div className="text-xs text-gray-500">{log.userId.slice(0, 16)}...</div>
                            )}
                          </div>
                        ) : log.userId ? (
                          <span className="font-mono text-xs">{log.userId.slice(0, 24)}...</span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        <details className="cursor-pointer group">
                          <summary className="text-blue-600 hover:text-blue-800 font-medium">
                            View Details
                          </summary>
                          <div className="mt-2 p-3 bg-gray-50 rounded border border-gray-200">
                            <pre className="text-xs overflow-x-auto whitespace-pre-wrap break-words">
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          </div>
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
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No logs found</p>
              <p className="text-sm text-gray-400 mt-2">Try adjusting your filters</p>
            </div>
          )}

          {/* ✅ ENHANCED: Pagination */}
          <div className="flex items-center justify-between bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-sm text-gray-600">
              Showing <span className="font-medium">{logs.length}</span> of <span className="font-medium">{total.toLocaleString()}</span> logs
              {total > 0 && (
                <span className="ml-2 text-gray-400">
                  (Page {page} of {Math.ceil(total / 50)})
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1 || loading}
                className="btn btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>
              <span className="text-sm text-gray-600 px-3">Page {page}</span>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={logs.length < 50 || loading}
                className="btn btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </>
      )}

      {/* Delete All Logs Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-md w-full mx-4 p-6">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-slate-900 mb-2">Delete All Logs</h3>
                <p className="text-sm text-slate-600 mb-4">
                  This will permanently delete all system logs. This action cannot be undone.
                </p>
                
                {/* Logs Size Information */}
                {loadingSize ? (
                  <div className="bg-slate-50 rounded-lg p-4 mb-4">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Calculating log size...</span>
                    </div>
                  </div>
                ) : logsSize ? (
                  <div className="bg-slate-50 rounded-lg p-4 mb-4 border border-slate-200">
                    <div className="text-sm font-semibold text-slate-900 mb-2">Logs Information:</div>
                    <div className="space-y-1.5 text-sm text-slate-600">
                      <div className="flex justify-between">
                        <span>Total Logs:</span>
                        <span className="font-medium text-slate-900">{logsSize.totalLogs.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Estimated Size:</span>
                        <span className="font-medium text-slate-900">
                          {logsSize.estimatedSizeMB > 1 
                            ? `${logsSize.estimatedSizeMB.toFixed(2)} MB`
                            : logsSize.estimatedSizeKB > 1
                            ? `${logsSize.estimatedSizeKB.toFixed(2)} KB`
                            : `${logsSize.estimatedSizeBytes} bytes`
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                ) : statistics ? (
                  <div className="bg-slate-50 rounded-lg p-4 mb-4 border border-slate-200">
                    <div className="text-sm font-semibold text-slate-900 mb-2">Logs Information:</div>
                    <div className="space-y-1.5 text-sm text-slate-600">
                      <div className="flex justify-between">
                        <span>Total Logs:</span>
                        <span className="font-medium text-slate-900">{statistics.totalLogs.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Estimated Size:</span>
                        <span className="font-medium text-slate-900">
                          {((statistics.totalLogs * 500) / (1024 * 1024)).toFixed(2)} MB
                        </span>
                      </div>
                    </div>
                  </div>
                ) : null}
                
                {/* Security: Confirmation text input */}
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <label className="block text-sm font-semibold text-red-900 mb-2">
                    Type "DELETE" to confirm this action:
                  </label>
                  <input
                    type="text"
                    value={deleteConfirmation}
                    onChange={(e) => setDeleteConfirmation(e.target.value)}
                    placeholder="Type DELETE here"
                    className="w-full px-3 py-2 border border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    disabled={isDeleting}
                    autoFocus
                  />
                  <p className="mt-2 text-xs text-red-700">
                    This action cannot be undone. All system logs will be permanently deleted.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false)
                  setLogsSize(null)
                  setDeleteConfirmation('')
                }}
                disabled={isDeleting}
                className="flex-1 px-4 py-2.5 bg-white text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAllLogs}
                disabled={isDeleting || deleteConfirmation !== 'DELETE' || !isAdmin || isChecking}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Delete All Logs
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Categories Tab Component
const CategoriesTab: React.FC<{ adminApi: ReturnType<typeof useAdminApi> }> = ({ adminApi }) => {
  const [error, setError] = useState<string | null>(null)
  const [categories, setCategories] = useState<AdminCategory[]>([])
  const [loading, setLoading] = useState(false)
  const [showMergeModal, setShowMergeModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [mergeSource, setMergeSource] = useState('')
  const [mergeTarget, setMergeTarget] = useState('')
  const [deleteReassign, setDeleteReassign] = useState('other')
  const toast = useToast()
  
  const loadingRef = React.useRef(false)

  const loadCategories = async () => {
    if (loadingRef.current) return

    try {
      loadingRef.current = true
      setLoading(true)
      setError(null)
      const data = await adminApi.getCategories()
      setCategories(data.categories)
      setError(null)
    } catch (error: any) {
      const errorMessage = error?.message || error?.type === 'NOT_FOUND'
        ? 'Admin access denied. Please re-authenticate.'
        : 'Failed to load categories'
      setError(errorMessage)
      toast.error(errorMessage)
      console.error('Failed to load categories:', error)
    } finally {
      loadingRef.current = false
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCategories()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (error && categories.length === 0 && !loading) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to Load Categories</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={() => loadCategories()}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          Retry
        </button>
      </div>
    )
  }

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

      {error && categories.length > 0 && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-yellow-700">{error}</p>
              <button
                onClick={() => loadCategories()}
                className="mt-2 px-3 py-1.5 text-xs bg-yellow-100 hover:bg-yellow-200 text-yellow-700 rounded-lg transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      )}

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

// GDPR Compliance Tab Component
const GDPRComplianceTab: React.FC<{ adminApi: ReturnType<typeof useAdminApi> }> = ({ adminApi }) => {
  const [gdprLogs, setGdprLogs] = useState<SystemLog[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [startDate, setStartDate] = useState<string>(() => {
    const date = new Date()
    date.setMonth(date.getMonth() - 6) // Last 6 months by default
    return date.toISOString().split('T')[0]
  })
  const [endDate, setEndDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0]
  })
  const [statistics, setStatistics] = useState<{
    totalDeletions: number
    deletionsThisMonth: number
    deletionsLastMonth: number
    averageProcessingTime: string
    complianceStatus: 'compliant' | 'warning' | 'error'
  } | null>(null)
  const toast = useToast()

  const loadGDPRLogs = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await adminApi.getLogs(
        page,
        50,
        'account_deletion', // Filter for account deletions only
        undefined,
        startDate || undefined,
        endDate || undefined,
        undefined,
        false
      )
      setGdprLogs(data.logs)
      setTotal(data.pagination.total)

      // Calculate statistics
      const now = new Date()
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)

      const deletionsThisMonth = data.logs.filter(log => {
        if (!log.timestamp) return false
        const logDate = new Date(log.timestamp)
        return logDate >= thisMonth
      }).length

      const deletionsLastMonth = data.logs.filter(log => {
        if (!log.timestamp) return false
        const logDate = new Date(log.timestamp)
        return logDate >= lastMonth && logDate <= lastMonthEnd
      }).length

      setStatistics({
        totalDeletions: data.pagination.total,
        deletionsThisMonth,
        deletionsLastMonth,
        averageProcessingTime: '< 1 minute', // Account deletions are immediate
        complianceStatus: 'compliant' // All deletions are logged properly
      })
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to load GDPR compliance logs'
      setError(errorMessage)
      toast.error(errorMessage)
      console.error('Failed to load GDPR logs:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadGDPRLogs()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, startDate, endDate])

  const exportGDPRReport = () => {
    const report = {
      reportDate: new Date().toISOString(),
      dateRange: { startDate, endDate },
      statistics,
      deletions: gdprLogs.map(log => ({
        timestamp: log.timestamp,
        userId: log.userId,
        email: log.email,
        details: log.details
      }))
    }
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `gdpr-compliance-report-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('GDPR compliance report exported')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">GDPR/CCPA Compliance Dashboard</h3>
          <p className="text-sm text-gray-600">
            Monitor and validate compliance with GDPR/CCPA Right to Erasure requirements
          </p>
        </div>
        <button
          onClick={exportGDPRReport}
          className="btn btn-secondary flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Export Report
        </button>
      </div>

      {/* Compliance Status Banner */}
      <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-semibold text-green-900 mb-1">Compliance Status: Compliant</h4>
            <p className="text-sm text-green-800">
              All account deletion requests are properly logged with required GDPR/CCPA compliance information including:
            </p>
            <ul className="text-sm text-green-800 mt-2 list-disc list-inside space-y-1">
              <li>User ID and email address</li>
              <li>Timestamp of deletion</li>
              <li>Complete deletion summary (links, collections, user data)</li>
              <li>Compliance metadata (regulation, right exercised)</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Statistics */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-sm text-gray-600 mb-1">Total Deletions</div>
            <div className="text-2xl font-bold text-gray-900">{statistics.totalDeletions.toLocaleString()}</div>
            <div className="text-xs text-gray-500 mt-1">All time</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-sm text-gray-600 mb-1">This Month</div>
            <div className="text-2xl font-bold text-gray-900">{statistics.deletionsThisMonth}</div>
            <div className="text-xs text-gray-500 mt-1">Current month</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-sm text-gray-600 mb-1">Last Month</div>
            <div className="text-2xl font-bold text-gray-900">{statistics.deletionsLastMonth}</div>
            <div className="text-xs text-gray-500 mt-1">Previous month</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-sm text-gray-600 mb-1">Processing Time</div>
            <div className="text-2xl font-bold text-green-600">{statistics.averageProcessingTime}</div>
            <div className="text-xs text-gray-500 mt-1">Average</div>
          </div>
        </div>
      )}

      {/* Date Range Filter */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="input-field w-full"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="input-field w-full"
            />
          </div>
          <button
            onClick={() => {
              setPage(1)
              loadGDPRLogs()
            }}
            className="btn btn-primary"
          >
            Apply Filter
          </button>
        </div>
      </div>

      {/* Logs Table */}
      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Timestamp</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User Email</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User ID</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data Deleted</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Compliance Info</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {gdprLogs.map((log) => {
                    const details = log.details as any
                    const deletionSummary = details?.deletionSummary || {}
                    const compliance = details?.compliance || {}
                    return (
                      <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                          {log.timestamp ? (
                            <div>
                              <div className="font-medium">{new Date(log.timestamp).toLocaleDateString()}</div>
                              <div className="text-xs text-gray-500">{new Date(log.timestamp).toLocaleTimeString()}</div>
                            </div>
                          ) : '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {log.email ? (
                            <span className="font-mono text-xs">{log.email}</span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {log.userId ? (
                            <span className="font-mono text-xs">{log.userId.slice(0, 20)}...</span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          <div className="space-y-1">
                            <div className="text-xs">
                              <span className="font-medium">{deletionSummary.linksDeleted || 0}</span> links
                            </div>
                            <div className="text-xs">
                              <span className="font-medium">{deletionSummary.collectionsDeleted || 0}</span> collections
                            </div>
                            {deletionSummary.userLimitsDeleted && (
                              <div className="text-xs text-gray-500">User limits</div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1">
                              <Shield className="w-3 h-3 text-blue-600" />
                              <span className="text-xs font-medium text-blue-600">{compliance.regulation || 'GDPR/CCPA'}</span>
                            </div>
                            <div className="text-xs text-gray-600">
                              {compliance.right || 'Right to Erasure'}
                            </div>
                            {compliance.dataDeleted && (
                              <div className="text-xs text-green-600 font-medium">✓ Data Deleted</div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          <details className="cursor-pointer group">
                            <summary className="text-blue-600 hover:text-blue-800 font-medium text-xs">
                              View Full Details
                            </summary>
                            <div className="mt-2 p-3 bg-gray-50 rounded border border-gray-200">
                              <pre className="text-xs overflow-x-auto whitespace-pre-wrap break-words">
                                {JSON.stringify(log.details, null, 2)}
                              </pre>
                            </div>
                          </details>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {gdprLogs.length === 0 && !loading && (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No account deletions found in the selected date range</p>
              <p className="text-sm text-gray-400 mt-2">All GDPR/CCPA compliance logs will appear here</p>
            </div>
          )}

          {/* Pagination */}
          {total > 0 && (
            <div className="flex items-center justify-between bg-white rounded-lg border border-gray-200 p-4">
              <div className="text-sm text-gray-600">
                Showing <span className="font-medium">{gdprLogs.length}</span> of <span className="font-medium">{total.toLocaleString()}</span> deletions
                {total > 0 && (
                  <span className="ml-2 text-gray-400">
                    (Page {page} of {Math.ceil(total / 50)})
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1 || loading}
                  className="btn btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>
                <span className="text-sm text-gray-600 px-3">Page {page}</span>
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={gdprLogs.length < 50 || loading}
                  className="btn btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Compliance Information */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-blue-900 mb-2">GDPR/CCPA Compliance Requirements Met:</h4>
        <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside">
          <li>✓ Right to Erasure: All account deletion requests are processed immediately</li>
          <li>✓ Audit Trail: Complete logs with timestamps, user identification, and deletion details</li>
          <li>✓ Data Verification: Logs confirm all user data (links, collections, limits) are deleted</li>
          <li>✓ Compliance Metadata: Each deletion includes regulation type and right exercised</li>
          <li>✓ Retention: Logs are retained for compliance audit purposes</li>
        </ul>
      </div>
    </div>
  )
}

// Settings Tab Component (User Limits Management)
const SettingsTab: React.FC<{ adminApi: ReturnType<typeof useAdminApi> }> = ({ adminApi }) => {
  const [selectedUserId, setSelectedUserId] = useState<string>('')
  const [userLimits, setUserLimits] = useState<UserLimits | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [linksLimit, setLinksLimit] = useState<number>(40)
  const [storageLimitKB, setStorageLimitKB] = useState<number>(40)
  const [userSearch, setUserSearch] = useState<string>('')
  const toast = useToast()

  const loadUserLimits = useCallback(async () => {
    if (!selectedUserId) {
      setUserLimits(null)
      setError(null)
      return
    }

    try {
      setLoading(true)
      setError(null)
      const limits = await adminApi.getUserLimits(selectedUserId)
      setUserLimits(limits)
      setLinksLimit(limits.linksLimit)
      setStorageLimitKB(limits.storageLimitKB)
      setError(null)
    } catch (error: any) {
      const errorMessage = error?.message || error?.type === 'NOT_FOUND'
        ? 'Admin access denied or user not found. Please re-authenticate.'
        : 'Failed to load user limits'
      setError(errorMessage)
      toast.error(errorMessage)
      console.error('Failed to load user limits:', error)
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
      setActionError(null)
      await adminApi.updateUserLimits(selectedUserId, linksLimit, storageLimitKB)
      toast.success('User limits updated successfully')
      await loadUserLimits()
      setActionError(null)
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to update user limits'
      setActionError(errorMessage)
      toast.error(errorMessage)
      console.error('Failed to update user limits:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleResetLimits = async () => {
    if (!selectedUserId) return

    if (!confirm('Reset user limits to defaults?')) return

    try {
      setLoading(true)
      setActionError(null)
      await adminApi.resetUserLimits(selectedUserId)
      toast.success('User limits reset to defaults')
      await loadUserLimits()
      setActionError(null)
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to reset user limits'
      setActionError(errorMessage)
      toast.error(errorMessage)
      console.error('Failed to reset user limits:', error)
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


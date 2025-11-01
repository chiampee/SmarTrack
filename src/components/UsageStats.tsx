import React, { useState, useEffect, useCallback } from 'react'
import { Database, HardDrive, BarChart3, AlertTriangle } from 'lucide-react'
import { useBackendApi, UserStats } from '../hooks/useBackendApi'
import { useToast } from './Toast'
import { getUserFriendlyMessage } from '../utils/errorHandler'
import { isAppError } from '../utils/errorHandler'

export const UsageStats: React.FC = () => {
  const [stats, setStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { getUserStats, isAuthenticated } = useBackendApi()
  const toast = useToast()

  const fetchStats = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false)
      setError('Please log in to view usage statistics')
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      // Set a timeout for the stats API
      const timeoutPromise = new Promise<UserStats>((_, reject) => 
        setTimeout(() => reject(new Error('Stats request timeout after 10 seconds')), 10000)
      )
      
      const userStats = await Promise.race([
        getUserStats(),
        timeoutPromise
      ])
      
      setStats(userStats)
      setError(null)
    } catch (err) {
      // Log detailed error for debugging
      const errorMessage = isAppError(err) ? getUserFriendlyMessage(err) : 'Stats temporarily unavailable'
      const errorDetails = err instanceof Error ? err.message : String(err)
      console.error('Failed to fetch usage stats:', errorDetails, err)
      
      // Show error to user with option to retry
      setError(errorMessage)
      
      // Fallback to zero stats but still show error
      setStats({
        linksUsed: 0,
        linksLimit: 40,
        storageUsed: 0,
        storageLimit: 200 * 1024, // 200 KB
        linksRemaining: 40,
        storageRemaining: 200 * 1024,
        averagePerLink: 0,
      })
    } finally {
      setLoading(false)
    }
  }, [getUserStats, isAuthenticated])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getProgressBarColor = (percentage: number) => {
    if (percentage > 90) return 'bg-red-500'
    if (percentage > 70) return 'bg-orange-500'
    return 'bg-blue-500'
  }

  if (loading) {
    return (
      <div className="card p-6">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="card p-6">
        <div className="flex items-center gap-3 text-red-600 mb-3">
          <AlertTriangle className="w-5 h-5" />
          <span className="font-medium">Failed to load usage stats</span>
        </div>
        <p className="text-red-500 text-sm mb-4">{error}</p>
        <button
          onClick={fetchStats}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
        >
          Retry
        </button>
      </div>
    )
  }

  if (!stats) {
    return null
  }

  const linkUsagePercentage = (stats.linksUsed / stats.linksLimit) * 100
  const storageUsagePercentage = (stats.storageUsed / stats.storageLimit) * 100
  const isApproachingLimits = linkUsagePercentage > 80 || storageUsagePercentage > 80
  const linksRemaining = stats.linksRemaining ?? (stats.linksLimit - stats.linksUsed)
  const storageRemaining = stats.storageRemaining ?? (stats.storageLimit - stats.storageUsed)
  const averagePerLink = stats.averagePerLink ?? (stats.linksUsed > 0 ? Math.floor(stats.storageUsed / stats.linksUsed) : 0)

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-4">Current Usage</h3>
        
        {/* Links Usage */}
        <div className="mb-4">
          <div className="flex justify-between items-center text-sm mb-2">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-blue-600" />
              <span className="font-medium text-gray-900">Links</span>
            </div>
            <div className="text-right">
              <span className="font-bold text-gray-900">{stats.linksUsed}</span>
              <span className="text-gray-500"> / {stats.linksLimit}</span>
              <span className="ml-2 text-sm text-gray-600">({linksRemaining} remaining)</span>
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4 shadow-inner">
            <div
              className={`h-4 rounded-full transition-all duration-700 shadow-md ${getProgressBarColor(linkUsagePercentage)}`}
              style={{ width: `${Math.min(100, linkUsagePercentage)}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>{linkUsagePercentage.toFixed(1)}% used</span>
            <span>{(100 - linkUsagePercentage).toFixed(1)}% available</span>
          </div>
        </div>

        {/* Storage Usage */}
        <div className="mb-4">
          <div className="flex justify-between items-center text-sm mb-2">
            <div className="flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-purple-600" />
              <span className="font-medium text-gray-900">Storage</span>
            </div>
              <div className="text-right">
                <span className="font-bold text-gray-900">{formatBytes(stats.storageUsed)}</span>
                <span className="text-gray-500"> / {formatBytes(stats.storageLimit)}</span>
                <span className="ml-2 text-sm text-gray-600">({formatBytes(Math.max(0, stats.storageLimit - stats.storageUsed))} remaining)</span>
              </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4 shadow-inner">
            <div
              className={`h-4 rounded-full transition-all duration-700 shadow-md ${getProgressBarColor(storageUsagePercentage)}`}
              style={{ width: `${Math.min(100, storageUsagePercentage)}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>{storageUsagePercentage.toFixed(1)}% used</span>
            <span>{(100 - storageUsagePercentage).toFixed(1)}% available</span>
          </div>
        </div>

        {/* Additional Info */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
          <div className="bg-blue-50 rounded-lg p-3">
            <p className="text-xs text-gray-600 mb-1">Average per link</p>
            <p className="text-sm font-semibold text-gray-900">
              {formatBytes(averagePerLink)}
            </p>
          </div>
          <div className="bg-purple-50 rounded-lg p-3">
            <p className="text-xs text-gray-600 mb-1">Est. at current usage</p>
            <p className="text-sm font-semibold text-gray-900">
              {stats.linksUsed > 0 && stats.storageUsed > 0 
                ? `~${Math.round((stats.linksLimit * averagePerLink) / 1024 / 1024)} MB`
                : 'N/A'
              }
            </p>
          </div>
        </div>
      </div>

      {isApproachingLimits && (
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium mb-1">Approaching Usage Limits</p>
              <p className="text-sm">
                You're using {linkUsagePercentage > 80 ? `${linkUsagePercentage.toFixed(0)}% of your links` : ''}
                {linkUsagePercentage > 80 && storageUsagePercentage > 80 ? ' and ' : ''}
                {storageUsagePercentage > 80 ? `${storageUsagePercentage.toFixed(0)}% of your storage` : ''}.
                Consider upgrading your plan for more capacity.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

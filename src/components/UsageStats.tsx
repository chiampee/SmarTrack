import React from 'react'
import { Database, AlertTriangle } from 'lucide-react'
import { useUserStats } from '../hooks/useUserStats'
import { useBackendApi } from '../hooks/useBackendApi'
import { getUserFriendlyMessage } from '../utils/errorHandler'
import { isAppError } from '../utils/errorHandler'

export const UsageStats: React.FC = () => {
  const { stats, loading, isValidating, error, mutate } = useUserStats()
  const { isAuthenticated } = useBackendApi()

  // Handle retry
  const handleRetry = () => {
    mutate()
  }

  // Show error message if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="card p-6">
        <div className="flex items-center gap-3 text-red-600 mb-3">
          <AlertTriangle className="w-5 h-5" />
          <span className="font-medium">Please log in to view usage statistics</span>
        </div>
      </div>
    )
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
    // OPTIMIZATION: Better error message extraction
    const errorMessage = error instanceof Error 
      ? error.message 
      : isAppError(error) 
        ? getUserFriendlyMessage(error) 
        : 'Stats temporarily unavailable'
    
    return (
      <div className="card p-6">
        <div className="flex items-center gap-3 text-red-600 mb-3">
          <AlertTriangle className="w-5 h-5" />
          <span className="font-medium">Failed to load usage stats</span>
        </div>
        <p className="text-red-500 text-sm mb-4">{errorMessage}</p>
        <button
          onClick={handleRetry}
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
  const isApproachingLimits = linkUsagePercentage > 80
  const linksRemaining = stats.linksRemaining ?? (stats.linksLimit - stats.linksUsed)

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

      </div>

      {isApproachingLimits && (
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium mb-1">Approaching Usage Limits</p>
              <p className="text-sm">
                You're using {linkUsagePercentage.toFixed(0)}% of your links.
                Consider upgrading your plan for more capacity.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

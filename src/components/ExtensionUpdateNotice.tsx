import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Download, X, AlertCircle } from 'lucide-react'

interface ExtensionUpdateNoticeProps {
  currentVersion: string
  latestVersion: string
  onDownload: () => void
  isOldExtension?: boolean // If true, don't allow dismissal
}

export const ExtensionUpdateNotice: React.FC<ExtensionUpdateNoticeProps> = ({
  currentVersion,
  latestVersion,
  onDownload,
  isOldExtension = false
}) => {
  // Check if extension is actually up to date (not unknown and matches latest)
  const isUpToDate = currentVersion !== 'unknown' && 
                      !currentVersion.includes('unknown') && 
                      !currentVersion.includes('old extension') &&
                      currentVersion === latestVersion

  const [isDismissed, setIsDismissed] = useState(() => {
    // If extension is up to date, clear any dismissed state and don't show notice
    if (isUpToDate) {
      localStorage.removeItem('smartrack-extension-update-dismissed')
      return true
    }
    
    // Don't allow dismissal for old extensions - they need to update
    if (isOldExtension) {
      return false
    }
    // Check if user has dismissed this specific version notice
    const dismissedVersion = localStorage.getItem('smartrack-extension-update-dismissed')
    return dismissedVersion === latestVersion
  })

  // Clear dismissed state if extension becomes up to date
  React.useEffect(() => {
    if (isUpToDate) {
      // Clear any dismissed state when extension is up to date
      localStorage.removeItem('smartrack-extension-update-dismissed')
      setIsDismissed(true)
    } else if (!isOldExtension) {
      // Re-check dismissed state when version changes (in case extension was updated)
      const dismissedVersion = localStorage.getItem('smartrack-extension-update-dismissed')
      setIsDismissed(dismissedVersion === latestVersion)
    }
  }, [isUpToDate, isOldExtension, currentVersion, latestVersion])

  const handleDismiss = () => {
    setIsDismissed(true)
    // Store dismissed version so notice doesn't reappear until new version
    localStorage.setItem('smartrack-extension-update-dismissed', latestVersion)
  }

  if (isDismissed) {
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`mb-4 p-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg shadow-lg border-2 ${
        isOldExtension ? 'border-red-400 border-dashed' : 'border-amber-400'
      }`}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3 flex-1">
          <AlertCircle className="w-6 h-6 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-lg mb-1">
              {currentVersion === 'unknown' || currentVersion.includes('unknown') || currentVersion.includes('old extension')
                ? 'Extension Update Required' 
                : 'Extension Update Available'}
            </h3>
            <p className="text-sm text-amber-100">
              {currentVersion === 'unknown' || currentVersion.includes('unknown') || currentVersion.includes('old extension') ? (
                <>
                  You're using an older version of the SmarTrack extension. Please update to{' '}
                  <span className="font-semibold">v{latestVersion}</span> to get the latest features, security improvements, and bug fixes.
                </>
              ) : (
                <>
                  A new version of the SmarTrack extension is available. Update from{' '}
                  <span className="font-semibold">v{currentVersion}</span> to{' '}
                  <span className="font-semibold">v{latestVersion}</span> to get the latest features and improvements.
                </>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onDownload}
            className="px-4 py-2 bg-white text-orange-600 rounded-lg hover:bg-amber-50 transition-colors font-semibold text-sm whitespace-nowrap flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Update Now
          </button>
          {!isOldExtension && (
            <button
              onClick={handleDismiss}
              className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
              aria-label="Dismiss update notice"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  )
}

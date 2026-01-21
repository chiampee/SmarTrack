import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Download, X, AlertCircle, RefreshCw } from 'lucide-react'

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
  // Normalize versions for comparison
  const normalizedCurrent = currentVersion ? currentVersion.trim() : currentVersion
  const normalizedLatest = latestVersion ? latestVersion.trim() : latestVersion
  
  // Check if extension is actually up to date (not unknown and matches latest)
  const isUpToDate = normalizedCurrent && 
                      normalizedCurrent !== 'unknown' && 
                      !normalizedCurrent.includes('unknown') && 
                      !normalizedCurrent.includes('old extension') &&
                      normalizedCurrent === normalizedLatest

  // Helper function to compare semantic versions
  // Returns: -1 if v1 < v2, 0 if v1 === v2, 1 if v1 > v2
  const compareVersions = (v1: string, v2: string): number => {
    try {
      const parts1 = v1.split('.').map(part => parseInt(part, 10) || 0)
      const parts2 = v2.split('.').map(part => parseInt(part, 10) || 0)
      
      for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
        const part1 = parts1[i] || 0
        const part2 = parts2[i] || 0
        if (part1 < part2) return -1
        if (part1 > part2) return 1
      }
      return 0
    } catch (error) {
      console.debug('[Extension Update] Version comparison error:', error)
      // On error, treat as different versions (show notice)
      return 1
    }
  }

  const [isDismissed, setIsDismissed] = useState(() => {
    // If extension is up to date, clear any dismissed state and don't show notice
    if (isUpToDate) {
      localStorage.removeItem('smartrack-extension-update-dismissed')
      localStorage.removeItem('smartrack-extension-update-dismissed-time')
      return true
    }
    
    // Don't allow dismissal for truly old extensions without version reporting - they need to update for security
    // But allow dismissal if extension reports a version (even if outdated)
    if (isOldExtension && (normalizedCurrent === 'unknown' || normalizedCurrent?.includes('unknown'))) {
      return false
    }
    
    // Check if user has dismissed this specific version
    const dismissedVersion = localStorage.getItem('smartrack-extension-update-dismissed')
    if (!dismissedVersion) {
      return false // No dismissal recorded, show notice
    }
    
    // Normalize dismissed version
    const normalizedDismissed = dismissedVersion.trim()
    
    // If dismissed version exactly matches latest version, don't show notice
    if (normalizedDismissed === normalizedLatest) {
      return true // User dismissed this exact version
    }
    
    // If a newer version is available than what was dismissed, show notice again
    // Example: User dismissed v1.0.4, but now v1.0.5 is available -> show notice
    try {
      const comparison = compareVersions(normalizedLatest, normalizedDismissed)
      // If latestVersion > dismissedVersion, show notice (comparison > 0)
      // If latestVersion === dismissedVersion, don't show (comparison === 0) - already handled above
      // If latestVersion < dismissedVersion, don't show (shouldn't happen, but handle gracefully)
      return comparison <= 0 // Only dismiss if latest <= dismissed
    } catch (error) {
      // If version comparison fails, default to showing notice (safer)
      console.debug('[Extension Update] Version comparison failed, showing notice:', error)
      return false
    }
  })

  // Clear dismissed state if extension becomes up to date
  // Re-check dismissed state when version changes (in case extension was updated or new version released)
  React.useEffect(() => {
    // If current version matches latest, extension is up to date
    if (normalizedCurrent && normalizedCurrent === normalizedLatest && normalizedCurrent !== 'unknown') {
      // Clear any dismissed state when extension is up to date
      localStorage.removeItem('smartrack-extension-update-dismissed')
      localStorage.removeItem('smartrack-extension-update-dismissed-time')
      setIsDismissed(true)
      console.log(`[Extension Update] Extension is up to date (${normalizedCurrent} === ${normalizedLatest}), hiding notice`)
      return
    }
    
    if (isUpToDate) {
      // Clear any dismissed state when extension is up to date
      localStorage.removeItem('smartrack-extension-update-dismissed')
      localStorage.removeItem('smartrack-extension-update-dismissed-time')
      setIsDismissed(true)
      console.log(`[Extension Update] Extension is up to date, hiding notice`)
      return
    }
    
    if (!isOldExtension) {
      // Re-check dismissed state when version changes
      const dismissedVersion = localStorage.getItem('smartrack-extension-update-dismissed')
      if (!dismissedVersion) {
        setIsDismissed(false)
        return
      }
      
      // Normalize dismissed version
      const normalizedDismissed = dismissedVersion.trim()
      
      // If dismissed version exactly matches latest, don't show
      if (normalizedDismissed === normalizedLatest) {
        setIsDismissed(true)
        console.log(`[Extension Update] Dismissed version ${normalizedDismissed} matches latest ${normalizedLatest}, hiding notice`)
        return
      }
      
      // If a newer version is available than what was dismissed, show notice again
      try {
        const comparison = compareVersions(normalizedLatest, normalizedDismissed)
        // comparison > 0 means latestVersion > dismissedVersion -> show notice
        // comparison <= 0 means latestVersion <= dismissedVersion -> don't show
        const shouldDismiss = comparison <= 0
        setIsDismissed(shouldDismiss)
        if (shouldDismiss) {
          console.log(`[Extension Update] Dismissed version ${normalizedDismissed} >= latest ${normalizedLatest}, hiding notice`)
        } else {
          console.log(`[Extension Update] Dismissed version ${normalizedDismissed} < latest ${normalizedLatest}, showing notice`)
        }
      } catch (error) {
        // On error, show notice to be safe (user should see updates)
        console.debug('[Extension Update] Error checking dismissed state:', error)
        setIsDismissed(false)
      }
    }
  }, [isUpToDate, isOldExtension, normalizedCurrent, normalizedLatest])

  const handleDismiss = () => {
    // Confirm dismissal with user
    const confirmMessage = `Ignore update to v${latestVersion}?\n\nYou'll be notified again when a newer version (after v${latestVersion}) is released.\n\nThe notice will reappear automatically when v1.0.5 or later becomes available.`
    
    if (window.confirm(confirmMessage)) {
      setIsDismissed(true)
      // Store dismissed version so notice doesn't reappear until a newer version is released
      localStorage.setItem('smartrack-extension-update-dismissed', latestVersion)
      // Also store timestamp for reference
      localStorage.setItem('smartrack-extension-update-dismissed-time', Date.now().toString())
      
      // Show feedback via console (non-intrusive)
      console.log(`[Extension Update] Ignored version ${latestVersion}. Notice will reappear when a newer version is released.`)
      
      // Optional: Show a brief toast notification
      // Note: This would require toast context, which might not be available here
    }
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
                  <br />
                  <span className="text-xs text-amber-200 mt-1 block">
                    After updating: 1) Reload the extension in chrome://extensions (click the reload icon), 2) Then click "Refresh" here or reload this page.
                  </span>
                </>
              ) : (
                <>
                  A new version of the SmarTrack extension is available. Update from{' '}
                  <span className="font-semibold">v{currentVersion}</span> to{' '}
                  <span className="font-semibold">v{latestVersion}</span> to get the latest features and improvements.
                  <br />
                  <span className="text-xs text-amber-200 mt-1 block">
                    After updating: 1) Reload the extension in chrome://extensions (click the reload icon), 2) Then click "Refresh" here or reload this page.
                  </span>
                </>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => {
              // Refresh extension detection
              if ((window as any).refreshExtensionDetection) {
                (window as any).refreshExtensionDetection()
              }
              // Also reload the page after a short delay to ensure detection updates
              setTimeout(() => {
                window.location.reload()
              }, 500)
            }}
            className="px-3 py-2 bg-white/90 text-orange-600 rounded-lg hover:bg-white transition-colors font-medium text-sm whitespace-nowrap flex items-center gap-2"
            title="Refresh detection after updating extension"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button
            onClick={onDownload}
            className="px-4 py-2 bg-white text-orange-600 rounded-lg hover:bg-amber-50 transition-colors font-semibold text-sm whitespace-nowrap flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Update Now
          </button>
          {!(isOldExtension && (currentVersion === 'unknown' || currentVersion.includes('unknown'))) && (
            <button
              onClick={handleDismiss}
              className="px-3 py-2 text-white/90 hover:text-white hover:bg-white/20 rounded-lg transition-colors font-medium text-sm whitespace-nowrap flex items-center gap-2 border border-white/30 hover:border-white/50"
              aria-label="Ignore this version"
              title={`Ignore v${latestVersion} update. You'll be notified again when a newer version (after v${latestVersion}) is released.`}
            >
              <X className="w-4 h-4" />
              <span>Ignore This Version</span>
            </button>
          )}
        </div>
      </div>
    </motion.div>
  )
}

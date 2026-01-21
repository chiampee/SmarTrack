import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Download, X, AlertCircle } from 'lucide-react'

interface ExtensionUpdateNoticeProps {
  currentVersion: string
  latestVersion: string
  onDownload: () => void
}

export const ExtensionUpdateNotice: React.FC<ExtensionUpdateNoticeProps> = ({
  currentVersion,
  latestVersion,
  onDownload
}) => {
  const [isDismissed, setIsDismissed] = useState(() => {
    // Check if user has dismissed this specific version notice
    const dismissedVersion = localStorage.getItem('smartrack-extension-update-dismissed')
    return dismissedVersion === latestVersion
  })

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
      className="mb-4 p-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg shadow-lg"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3 flex-1">
          <AlertCircle className="w-6 h-6 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-lg mb-1">Extension Update Available</h3>
            <p className="text-sm text-amber-100">
              A new version of the SmarTrack extension is available.{' '}
              {currentVersion !== 'unknown' && (
                <>Update from <span className="font-semibold">v{currentVersion}</span> to </>
              )}
              {currentVersion === 'unknown' && 'Update to '}
              <span className="font-semibold">v{latestVersion}</span> to get the latest features and improvements.
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
          <button
            onClick={handleDismiss}
            className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
            aria-label="Dismiss update notice"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </motion.div>
  )
}

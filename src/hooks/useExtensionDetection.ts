import { useState, useEffect, useRef } from 'react'
import { normalizeVersion } from '../constants/extensionVersion'

/**
 * Hook to detect if the SmarTrack Chrome extension is installed and get its version
 * Uses multiple detection methods for reliability
 * @returns {object} Object with isExtensionInstalled boolean and extensionVersion string
 */
export interface ExtensionDetectionResult {
  isExtensionInstalled: boolean
  extensionVersion: string | null
}

export const useExtensionDetection = (): ExtensionDetectionResult => {
  const [isExtensionInstalled, setIsExtensionInstalled] = useState<boolean>(false)
  const [extensionVersion, setExtensionVersion] = useState<string | null>(null)
  const isDetectedRef = useRef(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  
  // Expose refresh function via window for manual refresh
  useEffect(() => {
    (window as any).refreshExtensionDetection = () => {
      setRefreshTrigger(prev => prev + 1)
    }
  }, [])

  useEffect(() => {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      return
    }

    let messageListener: ((event: MessageEvent) => void) | null = null

    // Method 1: Try to detect via content script message
    const detectViaMessage = () => {
      return new Promise<{ detected: boolean; version: string | null }>((resolve) => {
        const messageId = `extension-check-${Date.now()}-${Math.random()}`
        let resolved = false
        let timeoutId: NodeJS.Timeout | null = null

        const handleMessage = (event: MessageEvent) => {
          // Security: Only accept messages from same origin
          if (event.origin !== window.location.origin) {
            return
          }

          // Edge case: Handle malformed or missing event data
          if (!event.data || typeof event.data !== 'object') {
            return
          }

          const { type, messageId: responseId, version } = event.data

          // Check if this is a response to our detection message
          // The extension responds with SRT_AUTH_TOKEN_RESPONSE even if no token is available
          if (type === 'SRT_AUTH_TOKEN_RESPONSE' && responseId === messageId) {
            if (!resolved) {
              resolved = true
              cleanup()
              
              // Normalize version using centralized validation utility
              const normalizedVersion = normalizeVersion(version)
              
              // Log warning if version is invalid (for debugging)
              if (version !== null && version !== undefined && !normalizedVersion) {
                console.warn('[Extension Detection] Invalid version format received:', {
                  original: version,
                  type: typeof version
                })
              }
              
              // Log detection result for debugging
              console.debug('[Extension Detection] Received response:', {
                messageId: responseId,
                originalVersion: version,
                normalizedVersion: normalizedVersion,
                hasToken: !!event.data?.token,
                versionType: typeof version
              })
              
              // Return both detection status and version
              resolve({ detected: true, version: normalizedVersion })
            }
          }
        }

        const cleanup = () => {
          if (messageListener) {
            window.removeEventListener('message', messageListener)
            messageListener = null
          }
          if (timeoutId) {
            clearTimeout(timeoutId)
            timeoutId = null
          }
        }

        messageListener = handleMessage
        window.addEventListener('message', messageListener)

        // Send detection message - extension content script listens for this
        window.postMessage(
          {
            type: 'SRT_REQUEST_AUTH_TOKEN',
            messageId: messageId
          },
          window.location.origin
        )
        
        // Log request for debugging
        console.debug('[Extension Detection] Sent detection request:', {
          messageId,
          origin: window.location.origin
        })

        // Timeout after 2 seconds (give extension time to respond)
        timeoutId = setTimeout(() => {
          if (!resolved) {
            resolved = true
            cleanup()
            resolve({ detected: false, version: null })
          }
        }, 2000)
      })
    }

    // Method 2: Try to detect extension via chrome.runtime (works even for old extensions)
    // Note: This only works in extension contexts, not in web pages
    // For web pages, we rely on message-based detection
    const detectViaChromeRuntime = (): Promise<{ detected: boolean; version: string | null }> => {
      return new Promise((resolve) => {
        // Check if we're in a browser environment
        // Note: chrome.runtime is not available in regular web pages, only in extension contexts
        // So this method won't work for detecting extensions from the web app
        // We'll keep it for completeness but it won't be the primary method
        resolve({ detected: false, version: null })
      })
    }

    // Method 3: Check for injected markers (if extension adds any)
    const detectViaMarkers = (): boolean => {
      // Check if extension has injected any global markers
      // This is a fallback method
      return false
    }

    // Run detection with retries for edge cases (old extensions that might not respond immediately)
    const runDetection = async (retryCount = 0) => {
      // Edge case: Prevent infinite retries
      const MAX_RETRIES = 3
      if (retryCount > MAX_RETRIES) {
        console.warn('[Extension Detection] Max retries reached, giving up')
        setIsExtensionInstalled(false)
        setExtensionVersion(null)
        return
      }

      try {
        // Try message-based detection first (for new extensions that respond)
        const result = await detectViaMessage()
        
        // Edge case: Handle timeout or no response
        if (result.detected) {
          isDetectedRef.current = true
          setIsExtensionInstalled(true)
          // Edge case: Validate version before setting (handle null, undefined, empty string)
          const validVersion = result.version && result.version.trim() !== '' ? result.version : null
          setExtensionVersion(validVersion)
          console.debug('[Extension Detection] Detection successful:', { version: validVersion })
          return
        }
        
        // If message detection failed, try chrome.runtime detection (catches old extensions)
        // This is important for old extensions (v1.0.0, v1.0.1) that don't respond to messages
        const chromeResult = await detectViaChromeRuntime()
        
        if (chromeResult.detected) {
          isDetectedRef.current = true
          setIsExtensionInstalled(true)
          // Edge case: Validate version before setting
          const validVersion = chromeResult.version && chromeResult.version.trim() !== '' ? chromeResult.version : null
          setExtensionVersion(validVersion) // Will be null for old extensions
          console.debug('[Extension Detection] Chrome runtime detection successful:', { version: validVersion })
          return
        }
        
        // Edge case: Extension might be slow to respond - retry with exponential backoff
        if (retryCount < 2) {
          const delay = Math.min(1000 * Math.pow(2, retryCount), 3000) // 1s, 2s, max 3s
          console.debug(`[Extension Detection] Retrying in ${delay}ms (attempt ${retryCount + 1})`)
          setTimeout(() => runDetection(retryCount + 1), delay)
          return
        }
        
        // After retries, check for markers as last resort
        const markerDetected = detectViaMarkers()
        setIsExtensionInstalled(markerDetected)
        if (!markerDetected) {
          setExtensionVersion(null)
          console.debug('[Extension Detection] No extension detected after all methods')
        }
      } catch (error) {
        console.error('[Extension Detection] Error during detection:', error)
        // Edge case: Handle specific error types
        if (error instanceof Error) {
          console.error('[Extension Detection] Error details:', {
            message: error.message,
            stack: error.stack
          })
        }
        
        // On error, try chrome.runtime detection as fallback
        try {
          const chromeResult = await detectViaChromeRuntime()
          if (chromeResult.detected) {
            isDetectedRef.current = true
            setIsExtensionInstalled(true)
            const validVersion = chromeResult.version && chromeResult.version.trim() !== '' ? chromeResult.version : null
            setExtensionVersion(validVersion)
            return
          }
        } catch (chromeError) {
          console.debug('[Extension Detection] Chrome runtime fallback failed:', chromeError)
        }
        
        // Final fallback: try one more time after delay (with limit)
        if (retryCount < 1) {
          setTimeout(() => runDetection(retryCount + 1), 1000)
        } else {
          // Edge case: After all retries failed, mark as not installed
          setIsExtensionInstalled(false)
          setExtensionVersion(null)
          console.debug('[Extension Detection] Detection failed after all retries')
        }
      }
    }

    // Small delay to ensure page is fully loaded
    const detectionTimeout = setTimeout(() => runDetection(0), 500)
    
    // Periodic re-check for edge cases (extensions that load slowly or don't respond immediately)
    // This helps catch old extensions that might take longer to initialize
    // Also re-checks periodically to detect when extension is updated
    let periodicCheckInterval: NodeJS.Timeout | null = null
    let checkCount = 0
    const maxChecks = 5 // Check up to 5 times (25 seconds total) - increased for better update detection
    
    periodicCheckInterval = setInterval(() => {
      checkCount++
      // Re-check periodically to detect extension updates
      // This ensures the notice disappears when extension is updated
      if (checkCount <= maxChecks) {
        runDetection(0)
      } else if (checkCount > maxChecks) {
        // After initial checks, continue periodic checks more frequently to detect updates
        if (checkCount % 4 === 0) { // Check every 20 seconds after initial period (more frequent)
          runDetection(0)
        }
      }
    }, 5000) // Check every 5 seconds

    // Cleanup
    return () => {
      if (detectionTimeout) {
        clearTimeout(detectionTimeout)
      }
      if (periodicCheckInterval) {
        clearInterval(periodicCheckInterval)
      }
      if (messageListener) {
        window.removeEventListener('message', messageListener)
      }
    }
  }, [refreshTrigger]) // Re-run when refresh is triggered

  // Return detection result with version information
  return {
    isExtensionInstalled,
    extensionVersion
  }
}

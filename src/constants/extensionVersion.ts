/**
 * Latest extension version constant
 * Update this when a new extension version is released
 */
export const LATEST_EXTENSION_VERSION = '1.0.2'

/**
 * Compares two semantic version strings
 * @param currentVersion - Currently installed version (e.g., "1.0.1")
 * @param latestVersion - Latest available version (e.g., "1.0.2")
 * @returns true if currentVersion is older than latestVersion, false otherwise
 */
export const isVersionOutdated = (
  currentVersion: string | null,
  latestVersion: string
): boolean => {
  if (!currentVersion || typeof currentVersion !== 'string') {
    return false // Can't compare if version is unknown
  }

  if (currentVersion === latestVersion) {
    return false // Same version, not outdated
  }

  try {
    // Parse semantic versions (e.g., "1.0.2" -> [1, 0, 2])
    const parseVersion = (version: string): number[] => {
      return version.split('.').map(part => {
        const num = parseInt(part, 10)
        return isNaN(num) ? 0 : num
      })
    }

    const current = parseVersion(currentVersion)
    const latest = parseVersion(latestVersion)

    // Compare version parts
    for (let i = 0; i < Math.max(current.length, latest.length); i++) {
      const currentPart = current[i] || 0
      const latestPart = latest[i] || 0

      if (currentPart < latestPart) {
        return true // Current version is older
      } else if (currentPart > latestPart) {
        return false // Current version is newer (shouldn't happen, but handle gracefully)
      }
    }

    return false // Versions are equal
  } catch (error) {
    console.debug('[Version Comparison] Error comparing versions:', error)
    return false // On error, assume not outdated
  }
}

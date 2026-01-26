/**
 * Latest extension version constant
 * Update this when a new extension version is released
 * 
 * Validation: Must be semantic version format (e.g., "1.0.5")
 */
export const LATEST_EXTENSION_VERSION = '1.0.6'

/**
 * Validates if a version string is in correct semantic version format
 * @param version - Version string to validate
 * @returns true if valid, false otherwise
 */
export const isValidVersionFormat = (version: string | null | undefined): boolean => {
  if (!version || typeof version !== 'string') {
    return false
  }

  const trimmed = version.trim()
  if (trimmed === '') {
    return false
  }

  // Semantic version format: major.minor.patch (e.g., "1.0.5")
  // Allow optional pre-release/build identifiers (e.g., "1.0.5-beta", "1.0.5+build")
  const semanticVersionRegex = /^\d+\.\d+\.\d+(-[a-zA-Z0-9.-]+)?(\+[a-zA-Z0-9.-]+)?$/
  
  return semanticVersionRegex.test(trimmed)
}

// Validate the constant at module load time (after isValidVersionFormat is defined)
if (typeof window !== 'undefined') {
  if (!isValidVersionFormat(LATEST_EXTENSION_VERSION)) {
    console.error(
      '[Extension Version] CRITICAL: LATEST_EXTENSION_VERSION constant is invalid!',
      LATEST_EXTENSION_VERSION
    )
  } else {
    console.debug('[Extension Version] LATEST_EXTENSION_VERSION validated:', LATEST_EXTENSION_VERSION)
  }
}

/**
 * Normalizes a version string (trim, validate, return null if invalid)
 * @param version - Version string to normalize
 * @returns Normalized version string or null if invalid
 */
export const normalizeVersion = (version: string | null | undefined): string | null => {
  if (!version || typeof version !== 'string') {
    return null
  }

  const trimmed = version.trim()
  if (trimmed === '') {
    return null
  }

  // Basic validation - must start with digits and dots
  if (!/^\d+\.\d+/.test(trimmed)) {
    return null
  }

  return trimmed
}

/**
 * Compares two semantic version strings with edge case validation
 * @param currentVersion - Currently installed version (e.g., "1.0.1")
 * @param latestVersion - Latest available version (e.g., "1.0.2")
 * @returns true if currentVersion is older than latestVersion, false otherwise
 */
export const isVersionOutdated = (
  currentVersion: string | null,
  latestVersion: string
): boolean => {
  // Validate and normalize versions
  const normalizedCurrent = normalizeVersion(currentVersion)
  const normalizedLatest = normalizeVersion(latestVersion)

  // Edge case: Can't compare if either version is invalid
  if (!normalizedCurrent || !normalizedLatest) {
    if (!normalizedCurrent) {
      console.debug('[Version Comparison] Current version is invalid:', currentVersion)
    }
    if (!normalizedLatest) {
      console.warn('[Version Comparison] Latest version is invalid:', latestVersion)
    }
    return false // Can't compare if version is unknown or invalid
  }

  // Edge case: Exact string match (fast path)
  if (normalizedCurrent === normalizedLatest) {
    return false // Same version, not outdated
  }

  try {
    // Parse semantic versions with edge case handling
    const parseVersion = (version: string): number[] => {
      // Edge case: Handle versions with non-numeric parts (e.g., "1.0.4-beta")
      // Extract only numeric parts
      return version
        .split('.')
        .map(part => {
          // Extract numeric part (handle "1", "0", "4-beta" -> 1, 0, 4)
          const numericPart = part.match(/^\d+/)?.[0]
          if (numericPart) {
            const num = parseInt(numericPart, 10)
            // Edge case: Handle NaN
            return isNaN(num) ? 0 : num
          }
          return 0
        })
    }

    const current = parseVersion(normalizedCurrent)
    const latest = parseVersion(normalizedLatest)

    // Edge case: Handle empty arrays (shouldn't happen but be safe)
    if (current.length === 0 || latest.length === 0) {
      console.warn('[Version Comparison] Empty version array after parsing:', { current, latest })
      return false
    }

    // Compare version parts
    const maxLength = Math.max(current.length, latest.length)
    for (let i = 0; i < maxLength; i++) {
      const currentPart = current[i] || 0
      const latestPart = latest[i] || 0

      // Edge case: Handle NaN (shouldn't happen but be safe)
      if (isNaN(currentPart) || isNaN(latestPart)) {
        console.warn('[Version Comparison] NaN in version parts:', { currentPart, latestPart, current, latest })
        return false
      }

      if (currentPart < latestPart) {
        return true // Current version is older
      } else if (currentPart > latestPart) {
        return false // Current version is newer (shouldn't happen, but handle gracefully)
      }
    }

    return false // Versions are equal
  } catch (error) {
    console.error('[Version Comparison] Error comparing versions:', error, {
      currentVersion,
      latestVersion
    })
    return false // On error, assume not outdated (safer default)
  }
}

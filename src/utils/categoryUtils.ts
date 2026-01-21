/**
 * Capitalizes the first letter of a category name for display
 * @param category - Category name (can be lowercase or mixed case)
 * @returns Category name with first letter capitalized
 */
export const capitalizeCategoryName = (category: string): string => {
  if (!category || typeof category !== 'string') return category
  
  const trimmed = category.trim()
  if (trimmed.length === 0) return category
  
  // Capitalize first letter, keep rest as-is (allows user overrides)
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1)
}

/**
 * Auto-capitalizes first letter when user types in category input
 * Only capitalizes if the first character is a letter
 * @param value - Input value
 * @returns Value with first letter capitalized (if applicable)
 */
export const autoCapitalizeCategoryInput = (value: string): string => {
  if (!value || value.length === 0) return value
  
  // If first character is a lowercase letter, capitalize it
  // This allows users to override by typing uppercase manually
  if (value.length > 0 && /^[a-z]/.test(value)) {
    return value.charAt(0).toUpperCase() + value.slice(1)
  }
  
  return value
}

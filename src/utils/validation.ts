/**
 * Data Validation Utilities
 * Provides validation functions for user inputs and API responses
 */

import { ErrorType, createError } from './errorHandler'

export interface ValidationResult {
  isValid: boolean
  errors: string[]
}

/**
 * Validate URL
 */
export function validateUrl(url: string): ValidationResult {
  const errors: string[] = []

  if (!url || url.trim().length === 0) {
    errors.push('URL is required')
  } else {
    try {
      const urlObj = new URL(url)
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        errors.push('URL must use HTTP or HTTPS protocol')
      }
    } catch {
      errors.push('Invalid URL format')
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Validate email
 */
export function validateEmail(email: string): ValidationResult {
  const errors: string[] = []
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  if (!email || email.trim().length === 0) {
    errors.push('Email is required')
  } else if (!emailRegex.test(email)) {
    errors.push('Invalid email format')
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Validate required field
 */
export function validateRequired(value: any, fieldName: string): ValidationResult {
  const errors: string[] = []

  if (value === null || value === undefined || value === '') {
    errors.push(`${fieldName} is required`)
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Validate string length
 */
export function validateLength(
  value: string,
  min: number,
  max: number,
  fieldName: string
): ValidationResult {
  const errors: string[] = []

  if (value.length < min) {
    errors.push(`${fieldName} must be at least ${min} characters`)
  }

  if (value.length > max) {
    errors.push(`${fieldName} must not exceed ${max} characters`)
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Validate array of tags
 */
export function validateTags(tags: string[]): ValidationResult {
  const errors: string[] = []

  if (!Array.isArray(tags)) {
    errors.push('Tags must be an array')
    return { isValid: false, errors }
  }

  if (tags.length > 20) {
    errors.push('Cannot have more than 20 tags')
  }

  tags.forEach((tag, index) => {
    if (typeof tag !== 'string') {
      errors.push(`Tag at index ${index} must be a string`)
    } else if (tag.trim().length === 0) {
      errors.push(`Tag at index ${index} cannot be empty`)
    } else if (tag.length > 50) {
      errors.push(`Tag at index ${index} is too long (max 50 characters)`)
    }
  })

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Validate Link creation data
 */
export function validateLinkData(data: {
  url: string
  title?: string
  description?: string
  tags?: string[]
}): ValidationResult {
  const errors: string[] = []

  // Validate URL
  const urlResult = validateUrl(data.url)
  if (!urlResult.isValid) {
    errors.push(...urlResult.errors)
  }

  // Validate title if provided
  if (data.title !== undefined) {
    const titleResult = validateLength(data.title, 1, 200, 'Title')
    if (!titleResult.isValid) {
      errors.push(...titleResult.errors)
    }
  }

  // Validate description if provided
  if (data.description !== undefined && data.description.length > 1000) {
    errors.push('Description must not exceed 1000 characters')
  }

  // Validate tags if provided
  if (data.tags !== undefined) {
    const tagsResult = validateTags(data.tags)
    if (!tagsResult.isValid) {
      errors.push(...tagsResult.errors)
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Sanitize string input (prevent XSS)
 */
export function sanitizeString(input: string): string {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
}

/**
 * Sanitize URL (ensure it's safe)
 */
export function sanitizeUrl(url: string): string {
  try {
    const urlObj = new URL(url)
    // Only allow http and https
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      throw new Error('Invalid protocol')
    }
    return urlObj.toString()
  } catch {
    throw createError(
      ErrorType.VALIDATION_ERROR,
      'Invalid URL format'
    )
  }
}

/**
 * Validate environment variables
 */
export function validateEnvironment(): { isValid: boolean; missing: string[] } {
  const required = [
    'VITE_AUTH0_DOMAIN',
    'VITE_AUTH0_CLIENT_ID',
    'VITE_AUTH0_AUDIENCE',
  ]

  const missing = required.filter(key => !import.meta.env[key])

  return {
    isValid: missing.length === 0,
    missing,
  }
}

/**
 * Validate API response structure
 */
export function validateApiResponse<T>(
  data: any,
  requiredFields: string[]
): T {
  if (!data || typeof data !== 'object') {
    throw createError(
      ErrorType.API_ERROR,
      'Invalid API response format'
    )
  }

  const missingFields = requiredFields.filter(field => !(field in data))

  if (missingFields.length > 0) {
    throw createError(
      ErrorType.API_ERROR,
      `Missing required fields: ${missingFields.join(', ')}`
    )
  }

  return data as T
}

import type { ContentType } from '../types/Link'

export const RESOURCE_TYPES = ['Video', 'Blog', 'PDF', 'Audio'] as const
export type ResourceType = (typeof RESOURCE_TYPES)[number]

/**
 * Maps sidebar resource types to link contentType.
 * Audio uses 'other' until ContentType has a dedicated 'audio' value.
 */
export const RESOURCE_TYPE_TO_CONTENT: Record<ResourceType, ContentType> = {
  Video: 'video',
  Blog: 'article',
  PDF: 'pdf',
  Audio: 'other',
}

export type ResourceTypeCounts = Record<ResourceType, number>

export const defaultResourceTypeCounts: ResourceTypeCounts = Object.fromEntries(
  RESOURCE_TYPES.map((t) => [t, 0])
) as ResourceTypeCounts

import type { ContentType } from '../types/Link'

export const RESOURCE_TYPES = ['Video', 'Blog', 'PDF', 'Audio'] as const
export type ResourceType = (typeof RESOURCE_TYPES)[number]

/**
 * Maps each sidebar resource type to the link contentTypes that belong to it.
 * A link is counted and shown when filtered if its contentType is in the array.
 * - Blog: article + webpage (blogs and most saved pages)
 * - PDF: pdf + document
 * - Audio: other (until ContentType has 'audio'); 'image' is left uncounted.
 */
export const RESOURCE_TYPE_TO_CONTENT: Record<ResourceType, ContentType[]> = {
  Video: ['video'],
  Blog: ['article', 'webpage'],
  PDF: ['pdf', 'document'],
  Audio: ['other'],
}

export type ResourceTypeCounts = Record<ResourceType, number>

export const defaultResourceTypeCounts: ResourceTypeCounts = Object.fromEntries(
  RESOURCE_TYPES.map((t) => [t, 0])
) as ResourceTypeCounts

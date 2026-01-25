import type { ContentType } from '../types/Link'

export const RESOURCE_TYPES = ['Video', 'Blog', 'PDF', 'Audio'] as const
export type ResourceType = (typeof RESOURCE_TYPES)[number]

/**
 * Maps each sidebar resource type to the link contentTypes that belong to it.
 * A link is counted and shown when filtered if its contentType is in the array.
 * - Blog: article, webpage, document (articles, blogs, and most web pages)
 * - PDF: pdf only
 * - Audio: other (until ContentType has 'audio'); 'image' is left uncounted.
 */
export const RESOURCE_TYPE_TO_CONTENT: Record<ResourceType, ContentType[]> = {
  Video: ['video'],
  Blog: ['article', 'webpage', 'document'],
  PDF: ['pdf'],
  Audio: ['other'],
}

/** Display labels for Resources sidebar (key in URL remains the ResourceType, e.g. type=Blog). */
export const RESOURCE_TYPE_LABELS: Partial<Record<ResourceType, string>> = {
  Blog: 'Articles & pages',
}

export type ResourceTypeCounts = Record<ResourceType, number>

export const defaultResourceTypeCounts: ResourceTypeCounts = Object.fromEntries(
  RESOURCE_TYPES.map((t) => [t, 0])
) as ResourceTypeCounts

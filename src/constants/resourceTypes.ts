import type { ContentType } from '../types/Link'

export const RESOURCE_TYPES = ['Video', 'Blog', 'PDF', 'Audio', 'Images'] as const
export type ResourceType = (typeof RESOURCE_TYPES)[number]

/**
 * Maps each sidebar resource type to the link contentTypes that belong to it.
 * A link is counted and shown when filtered if its contentType is in the array.
 * - Blog: catch-all for article, webpage, document, and any other contentTypes not in Video/PDF/Images/Audio
 * - PDF: pdf only
 * - Images: image
 * - Audio: other (until ContentType has 'audio')
 */
export const RESOURCE_TYPE_TO_CONTENT: Record<ResourceType, ContentType[]> = {
  Video: ['video'],
  Blog: ['article', 'webpage', 'document'], // Explicit list, but counting logic treats Blog as catch-all
  PDF: ['pdf'],
  Images: ['image'],
  Audio: ['other'],
}

/** ContentTypes that are explicitly NOT in Blog (used for catch-all counting). */
export const NON_BLOG_CONTENT_TYPES: ContentType[] = ['video', 'pdf', 'image', 'other']

/** Display labels for Resources sidebar (key in URL remains the ResourceType, e.g. type=Blog). */
export const RESOURCE_TYPE_LABELS: Partial<Record<ResourceType, string>> = {
  Blog: 'Articles & pages',
}

export type ResourceTypeCounts = Record<ResourceType, number>

export const defaultResourceTypeCounts: ResourceTypeCounts = Object.fromEntries(
  RESOURCE_TYPES.map((t) => [t, 0])
) as ResourceTypeCounts

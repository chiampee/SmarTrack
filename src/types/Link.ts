export interface Link {
  id: string;
  userId: string;
  url: string;
  title: string;
  description?: string;
  thumbnail?: string;
  favicon?: string;
  category: string; // Changed from Category to string to match backend
  tags: string[];
  contentType: ContentType;
  isFavorite: boolean;
  isArchived: boolean;
  collectionId?: string | null; // Optional collection this link belongs to (null = removed from collection)
  categoryPosition?: number; // Position within category (0-indexed)
  createdAt: Date;
  updatedAt: Date;
  lastAccessedAt?: Date;
  clickCount: number;
}

export interface Collection {
  id: string;
  userId: string;
  name: string;
  description?: string;
  color: string;
  icon: string;
  isDefault: boolean;
  linkCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
  isDefault: boolean;
}

export type ContentType = 'webpage' | 'pdf' | 'article' | 'video' | 'image' | 'document' | 'other';

export interface SearchFilters {
  query?: string;
  category?: string;
  tags?: string[];
  contentType?: ContentType;
  dateFrom?: Date;
  dateTo?: Date;
  isFavorite?: boolean;
  isArchived?: boolean;
}

export interface LinkStats {
  totalLinks: number;
  linksThisMonth: number;
  favoriteLinks: number;
  archivedLinks: number;
  linksByCategory: Record<string, number>;
  linksByContentType: Record<ContentType, number>;
}
export interface Link {
  _id: string;
  userId: string;
  url: string;
  title: string;
  description?: string;
  content: string; // Full extracted HTML content
  contentSize: number; // Size in bytes
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  metadata: {
    favicon?: string;
    author?: string;
    siteName?: string;
    publishedDate?: string;
  };
}

export interface CreateLinkDto {
  url: string;
  title?: string;
  description?: string;
  tags?: string[];
}

export interface UpdateLinkDto {
  title?: string;
  description?: string;
  tags?: string[];
}

export interface LinkListResponse {
  links: Link[];
  total: number;
  page: number;
  limit: number;
}

export interface LinkFilters {
  tags?: string[];
  search?: string;
  sortBy?: 'createdAt' | 'updatedAt' | 'title';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

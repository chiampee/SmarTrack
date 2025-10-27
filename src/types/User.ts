export interface User {
  id: string;
  email: string;
  name: string;
  picture?: string;
  createdAt: Date;
  lastLoginAt: Date;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  defaultCategory: string;
  itemsPerPage: number;
  showThumbnails: boolean;
  autoArchive: boolean;
  exportFormat: 'csv' | 'json' | 'markdown';
}

export interface UserStats {
  totalLinks: number;
  linksThisMonth: number;
  favoriteLinks: number;
  archivedLinks: number;
  storageUsed: number;
  storageLimit: number;
  linksLimit: number;
}

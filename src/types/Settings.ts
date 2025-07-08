export interface Settings {
  id: string; // always 'user' for singleton settings
  theme: 'light' | 'dark' | 'system';
  sortOrder: 'asc' | 'desc';
  language: string;
  createdAt: Date;
  updatedAt: Date;
} 
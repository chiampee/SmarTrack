export interface Settings {
  id: string; // always 'user' for singleton settings  
  userId: string; // Auth0 user ID
  theme: 'light' | 'dark' | 'system';
  sortOrder: 'asc' | 'desc';
  language: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Link {
  id: string;
  userId: string; // Auth0 user ID
  url: string;
  metadata: {
    title?: string;
    description?: string;
    image?: string;
  };
  /** Optional AI-generated TL;DR for quick previews */
  summary?: string;
  labels: string[];
  priority: 'low' | 'medium' | 'high';
  status: 'active' | 'archived' | 'deleted';
  boardId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

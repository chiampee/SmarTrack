export interface Link {
  id: string;
  url: string;
  metadata: {
    title: string;
    description: string;
    image: string;
  };
  labels: string[];
  priority: 'low' | 'medium' | 'high';
  status: 'active' | 'archived' | 'deleted';
  createdAt: Date;
  updatedAt: Date;
}

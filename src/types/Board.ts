export interface Board {
  id: string;
  userId: string; // Auth0 user ID
  title: string;
  description: string;
  color: string;
  createdAt: Date;
  updatedAt: Date;
}

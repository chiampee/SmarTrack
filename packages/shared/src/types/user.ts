export interface User {
  _id: string;
  auth0Id: string;
  email: string;
  name?: string;
  createdAt: Date;
  updatedAt: Date;
  usageStats: {
    totalLinks: number;
    storageUsed: number; // in bytes
    lastActivity: Date;
  };
}

export interface CreateUserDto {
  auth0Id: string;
  email: string;
  name?: string;
}

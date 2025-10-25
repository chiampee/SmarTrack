export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: any;
  };
}

export interface UsageLimits {
  maxLinks: number;
  maxPageSize: number;
  rateLimitPerMinute: number;
}

export interface UsageStats {
  linksUsed: number;
  linksLimit: number;
  storageUsed: number;
  storageLimit: number;
}

export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  services: {
    database: boolean;
    auth: boolean;
  };
}

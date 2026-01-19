import { Link, Collection, Category, SearchFilters, LinkStats } from '../types/Link';
import { User, UserStats } from '../types/User';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

class DashboardApiService {
  private async getAuthHeaders(): Promise<HeadersInit> {
    const authToken = localStorage.getItem('authToken');
    
    if (!authToken) {
      throw new Error('No authentication token found');
    }
    
    return {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json',
    };
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(url, {
        ...options,
        headers: {
          ...headers,
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.error(`API request failed for ${endpoint}:`, errorMessage, error)
      throw error
    }
  }

  // Health check
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return this.makeRequest('/api/health');
  }

  // User stats
  async getUserStats(): Promise<UserStats> {
    return this.makeRequest('/api/users/stats');
  }

  // Links CRUD operations
  async getLinks(page: number = 1, limit: number = 50, filters?: SearchFilters): Promise<{ links: Link[]; total: number; hasMore: boolean; page: number; limit: number }> {
    // ✅ Backend supports pagination (page, limit parameters)
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (filters) {
      if (filters.query) params.append('q', filters.query);
      if (filters.category) params.append('category', filters.category);
      if (filters.tags?.length) params.append('tags', filters.tags.join(','));
      if (filters.contentType) params.append('contentType', filters.contentType);
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom.toISOString());
      if (filters.dateTo) params.append('dateTo', filters.dateTo.toISOString());
      if (filters.isFavorite !== undefined) params.append('isFavorite', filters.isFavorite.toString());
      if (filters.isArchived !== undefined) params.append('isArchived', filters.isArchived.toString());
    }

    return this.makeRequest(`/api/links?${params.toString()}`);
  }

  async getLink(id: string): Promise<Link> {
    return this.makeRequest<Link>(`/api/links/${id}`);
  }

  async createLink(link: Omit<Link, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'clickCount'>): Promise<Link> {
    return this.makeRequest<Link>('/api/links', {
      method: 'POST',
      body: JSON.stringify(link),
    });
  }

  async updateLink(id: string, updates: Partial<Link>): Promise<Link> {
    return this.makeRequest<Link>(`/api/links/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteLink(id: string): Promise<void> {
    await this.makeRequest(`/api/links/${id}`, {
      method: 'DELETE',
    });
  }

  async bulkUpdateLinks(linkIds: string[], updates: Partial<Link>): Promise<{ message: string; modifiedCount: number }> {
    return this.makeRequest('/api/links/bulk', {
      method: 'PUT',
      body: JSON.stringify({ linkIds, updates }),
    });
  }

  async bulkDeleteLinks(linkIds: string[]): Promise<{ message: string; deletedCount: number }> {
    return this.makeRequest('/api/links/bulk', {
      method: 'DELETE',
      body: JSON.stringify({ linkIds }),
    });
  }
  
  async deleteAllLinks(): Promise<{ message: string; deletedCount: number }> {
    // ✅ Requires confirmation header (Phase 2 safety feature)
    const headers = await this.getAuthHeaders();
    return this.makeRequest('/api/links', {
      method: 'DELETE',
      headers: {
        ...headers,
        'X-Confirm-Delete-All': 'yes'  // Required confirmation
      }
    });
  }

  // Collections CRUD operations
  async getCollections(): Promise<Collection[]> {
    return this.makeRequest<Collection[]>('/api/folders');
  }

  async createCollection(collection: Omit<Collection, 'id' | 'userId' | 'linkCount' | 'createdAt' | 'updatedAt'>): Promise<Collection> {
    return this.makeRequest<Collection>('/api/folders', {
      method: 'POST',
      body: JSON.stringify(collection),
    });
  }

  async updateCollection(id: string, updates: Partial<Collection>): Promise<Collection> {
    return this.makeRequest<Collection>(`/api/folders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteCollection(id: string): Promise<void> {
    await this.makeRequest(`/api/folders/${id}`, {
      method: 'DELETE',
    });
  }

  // Categories
  async getCategories(): Promise<Category[]> {
    return this.makeRequest<Category[]>('/api/types');
  }

  // Search
  async searchLinks(query: string, filters?: Omit<SearchFilters, 'query'>): Promise<Link[]> {
    const params = new URLSearchParams({ q: query });
    
    if (filters) {
      if (filters.category) params.append('category', filters.category);
      if (filters.tags?.length) params.append('tags', filters.tags.join(','));
      if (filters.contentType) params.append('contentType', filters.contentType);
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom.toISOString());
      if (filters.dateTo) params.append('dateTo', filters.dateTo.toISOString());
      if (filters.isFavorite !== undefined) params.append('isFavorite', filters.isFavorite.toString());
      if (filters.isArchived !== undefined) params.append('isArchived', filters.isArchived.toString());
    }

    const response = await this.makeRequest<{ links: Link[] }>(`/api/links/search?${params.toString()}`);
    return response.links;
  }

  // Link stats
  async getLinkStats(): Promise<LinkStats> {
    return this.makeRequest<LinkStats>('/api/links/stats');
  }

  // Export
  async exportLinks(format: 'csv' | 'json' | 'markdown', filters?: SearchFilters): Promise<Blob> {
    const params = new URLSearchParams({ format });
    
    if (filters) {
      if (filters.query) params.append('q', filters.query);
      if (filters.category) params.append('category', filters.category);
      if (filters.tags?.length) params.append('tags', filters.tags.join(','));
      if (filters.contentType) params.append('contentType', filters.contentType);
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom.toISOString());
      if (filters.dateTo) params.append('dateTo', filters.dateTo.toISOString());
      if (filters.isFavorite !== undefined) params.append('isFavorite', filters.isFavorite.toString());
      if (filters.isArchived !== undefined) params.append('isArchived', filters.isArchived.toString());
    }

    const response = await fetch(`${API_BASE_URL}/api/links/export?${params.toString()}`, {
      headers: await this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Export failed: ${response.statusText}`);
    }

    return response.blob();
  }
}

export const dashboardApi = new DashboardApiService();

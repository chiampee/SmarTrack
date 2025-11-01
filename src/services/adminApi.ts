import { useBackendApi } from '../hooks/useBackendApi'

export interface AdminAnalytics {
  summary: {
    totalUsers: number
    extensionUsers: number
    totalLinks: number
    extensionLinks: number
    webLinks: number
    totalStorageBytes: number
    totalStorageKB: number
    totalStorageMB: number
    averageLinksPerUser: number
    activeUsers: number
    inactiveUsers: number
  }
  growth: {
    userGrowth: Array<{
      date: string
      newUsers: number
    }>
    linksGrowth: Array<{
      date: string
      count: number
      extensionCount: number
      webCount: number
    }>
  }
  topCategories: Array<{
    category: string
    linkCount: number
    userCount: number
  }>
  contentTypes: Array<{
    contentType: string
    count: number
  }>
  extensionVersions: Array<{
    version: string
    linkCount: number
    userCount: number
  }>
  usersApproachingLimits: number
  dateRange: {
    startDate: string
    endDate: string
  }
}

export interface AdminUser {
  userId: string
  linkCount: number
  storageBytes: number
  storageKB: number
  extensionLinks: number
  webLinks: number
  favoriteLinks: number
  archivedLinks: number
  firstLinkDate: string | null
  lastLinkDate: string | null
  isActive: boolean
  approachingLimit: boolean
}

export interface AdminUsersResponse {
  users: AdminUser[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface AdminActivity {
  summary: {
    newUsers: number
    linksCreated: number
    extensionLinks: number
    webLinks: number
  }
  dailyActivity: Array<{
    date: string
    linksCreated: number
    extensionLinks: number
    webLinks: number
    newUsers: number
  }>
  dateRange: {
    startDate: string
    endDate: string
  }
}

export interface SystemLog {
  id: string
  type: string
  timestamp: string
  userId: string | null
  email: string | null
  severity: string
  details: Record<string, any>
}

export interface SystemLogsResponse {
  logs: SystemLog[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface AdminCategory {
  name: string
  linkCount: number
  userCount: number
}

export interface UserLimits {
  userId: string
  linksLimit: number
  storageLimitBytes: number
  storageLimitKB: number
  isOverridden: boolean
  overriddenAt?: string
}

export const useAdminApi = () => {
  const { makeRequest } = useBackendApi()

  const getAnalytics = async (
    startDate?: string,
    endDate?: string
  ): Promise<AdminAnalytics> => {
    const params = new URLSearchParams()
    if (startDate) params.append('start_date', startDate)
    if (endDate) params.append('end_date', endDate)
    
    const query = params.toString()
    return makeRequest<AdminAnalytics>(`/api/admin/analytics${query ? `?${query}` : ''}`)
  }

  const getUsers = async (
    page: number = 1,
    limit: number = 25,
    search?: string,
    activeOnly?: boolean
  ): Promise<AdminUsersResponse> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    })
    if (search) params.append('search', search)
    if (activeOnly !== undefined) params.append('active_only', activeOnly.toString())
    
    return makeRequest<AdminUsersResponse>(`/api/admin/users?${params.toString()}`)
  }

  const getActivity = async (
    startDate?: string,
    endDate?: string
  ): Promise<AdminActivity> => {
    const params = new URLSearchParams()
    if (startDate) params.append('start_date', startDate)
    if (endDate) params.append('end_date', endDate)
    
    const query = params.toString()
    return makeRequest<AdminActivity>(`/api/admin/activity${query ? `?${query}` : ''}`)
  }

  const getLogs = async (
    page: number = 1,
    limit: number = 50,
    logType?: string,
    severity?: string,
    startDate?: string,
    endDate?: string,
    search?: string
  ): Promise<SystemLogsResponse> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    })
    if (logType) params.append('log_type', logType)
    if (severity) params.append('severity', severity)
    if (startDate) params.append('start_date', startDate)
    if (endDate) params.append('end_date', endDate)
    if (search) params.append('search', search)
    
    return makeRequest<SystemLogsResponse>(`/api/admin/logs?${params.toString()}`)
  }

  const getCategories = async (): Promise<{ categories: AdminCategory[] }> => {
    return makeRequest<{ categories: AdminCategory[] }>('/api/admin/categories')
  }

  const mergeCategories = async (
    sourceCategory: string,
    targetCategory: string
  ): Promise<{ message: string; linksMoved: number }> => {
    return makeRequest<{ message: string; linksMoved: number }>('/api/admin/categories/merge', {
      method: 'POST',
      body: JSON.stringify({
        source_category: sourceCategory,
        target_category: targetCategory,
      }),
    })
  }

  const deleteCategory = async (
    categoryName: string,
    reassignTo: string = 'other'
  ): Promise<{ message: string; linksReassigned: number; reassignedTo: string }> => {
    return makeRequest<{ message: string; linksReassigned: number; reassignedTo: string }>(
      `/api/admin/categories/${encodeURIComponent(categoryName)}?reassign_to=${encodeURIComponent(reassignTo)}`,
      { method: 'DELETE' }
    )
  }

  const getUserLimits = async (userId: string): Promise<UserLimits> => {
    return makeRequest<UserLimits>(`/api/admin/users/${encodeURIComponent(userId)}/limits`)
  }

  const updateUserLimits = async (
    userId: string,
    linksLimit?: number,
    storageLimitKB?: number
  ): Promise<{ message: string; userId: string; linksLimit?: number; storageLimitKB?: number }> => {
    const params = new URLSearchParams()
    if (linksLimit !== undefined) params.append('links_limit', linksLimit.toString())
    if (storageLimitKB !== undefined) params.append('storage_limit_kb', storageLimitKB.toString())
    
    return makeRequest<{ message: string; userId: string; linksLimit?: number; storageLimitKB?: number }>(
      `/api/admin/users/${encodeURIComponent(userId)}/limits?${params.toString()}`,
      { method: 'PUT' }
    )
  }

  const resetUserLimits = async (userId: string): Promise<{ message: string; userId: string }> => {
    return makeRequest<{ message: string; userId: string }>(
      `/api/admin/users/${encodeURIComponent(userId)}/limits`,
      { method: 'DELETE' }
    )
  }

  return {
    getAnalytics,
    getUsers,
    getActivity,
    getLogs,
    getCategories,
    mergeCategories,
    deleteCategory,
    getUserLimits,
    updateUserLimits,
    resetUserLimits,
  }
}


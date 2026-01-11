/**
 * Cache Manager for SmarTrack
 * Provides IndexedDB caching for offline support and instant load times
 */

const DB_NAME = 'smartrack-cache'
const DB_VERSION = 1
const STORE_NAME = 'links'
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

interface CachedData<T> {
  data: T
  timestamp: number
}

class CacheManager {
  private db: IDBDatabase | null = null

  /**
   * Initialize the IndexedDB database
   */
  private async getDB(): Promise<IDBDatabase> {
    if (this.db) return this.db

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve(this.db)
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME)
        }
      }
    })
  }

  /**
   * Save links to cache
   */
  async saveLinks(userId: string, links: any[]): Promise<void> {
    try {
      const db = await this.getDB()
      const transaction = db.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      
      const cacheData: CachedData<any[]> = {
        data: links,
        timestamp: Date.now()
      }
      
      store.put(cacheData, `links_${userId}`)
      
      return new Promise((resolve, reject) => {
        transaction.oncomplete = () => resolve()
        transaction.onerror = () => reject(transaction.error)
      })
    } catch (error) {
      console.error('[Cache] Failed to save links:', error)
      // Don't throw - caching is optional
    }
  }

  /**
   * Get links from cache
   * Returns null if cache miss, expired, or error
   */
  async getLinks(userId: string): Promise<any[] | null> {
    try {
      const db = await this.getDB()
      const transaction = db.transaction([STORE_NAME], 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.get(`links_${userId}`)
      
      const result = await new Promise<CachedData<any[]> | undefined>((resolve, reject) => {
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
      })
      
      if (!result) {
        console.log('[Cache] Cache miss for links')
        return null
      }
      
      const age = Date.now() - result.timestamp
      if (age > CACHE_DURATION) {
        console.log(`[Cache] Cache expired (age: ${Math.round(age / 1000)}s)`)
        return null
      }
      
      console.log(`[Cache] Cache hit for links (age: ${Math.round(age / 1000)}s)`)
      return result.data
    } catch (error) {
      console.error('[Cache] Failed to get links:', error)
      return null
    }
  }

  /**
   * Save collections to cache
   */
  async saveCollections(userId: string, collections: any[]): Promise<void> {
    try {
      const db = await this.getDB()
      const transaction = db.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      
      const cacheData: CachedData<any[]> = {
        data: collections,
        timestamp: Date.now()
      }
      
      store.put(cacheData, `collections_${userId}`)
      
      return new Promise((resolve, reject) => {
        transaction.oncomplete = () => resolve()
        transaction.onerror = () => reject(transaction.error)
      })
    } catch (error) {
      console.error('[Cache] Failed to save collections:', error)
    }
  }

  /**
   * Get collections from cache
   */
  async getCollections(userId: string): Promise<any[] | null> {
    try {
      const db = await this.getDB()
      const transaction = db.transaction([STORE_NAME], 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.get(`collections_${userId}`)
      
      const result = await new Promise<CachedData<any[]> | undefined>((resolve, reject) => {
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
      })
      
      if (!result) return null
      if (Date.now() - result.timestamp > CACHE_DURATION) return null
      
      return result.data
    } catch (error) {
      console.error('[Cache] Failed to get collections:', error)
      return null
    }
  }

  /**
   * Clear all cached data
   */
  async clearCache(): Promise<void> {
    try {
      const db = await this.getDB()
      const transaction = db.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      store.clear()
      
      return new Promise((resolve, reject) => {
        transaction.oncomplete = () => {
          console.log('[Cache] Cache cleared')
          resolve()
        }
        transaction.onerror = () => reject(transaction.error)
      })
    } catch (error) {
      console.error('[Cache] Failed to clear cache:', error)
    }
  }

  /**
   * Clear cache for a specific user
   */
  async clearUserCache(userId: string): Promise<void> {
    try {
      const db = await this.getDB()
      const transaction = db.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      
      store.delete(`links_${userId}`)
      store.delete(`collections_${userId}`)
      
      return new Promise((resolve, reject) => {
        transaction.oncomplete = () => {
          console.log(`[Cache] User cache cleared for ${userId}`)
          resolve()
        }
        transaction.onerror = () => reject(transaction.error)
      })
    } catch (error) {
      console.error('[Cache] Failed to clear user cache:', error)
    }
  }
}

// Export singleton instance
export const cacheManager = new CacheManager()

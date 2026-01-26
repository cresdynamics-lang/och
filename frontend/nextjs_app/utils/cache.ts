/**
 * Offline caching utility for AI coaching and other features
 * Uses IndexedDB for persistent storage
 */

const CACHE_VERSION = 1
const DB_NAME = 'och_cache'
const STORES = {
  COACHING: 'coaching',
  MENTORSHIP: 'mentorship',
  ANALYTICS: 'analytics',
}

interface CacheEntry<T> {
  key: string
  data: T
  timestamp: number
  expiresAt: number
}

class CacheManager {
  private db: IDBDatabase | null = null
  private initPromise: Promise<void> | null = null

  private async init(): Promise<void> {
    if (this.db) return
    if (this.initPromise) return this.initPromise

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, CACHE_VERSION)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        // Create object stores if they don't exist
        Object.values(STORES).forEach(storeName => {
          if (!db.objectStoreNames.contains(storeName)) {
            db.createObjectStore(storeName, { keyPath: 'key' })
          }
        })
      }
    })

    return this.initPromise
  }

  async set<T>(storeName: string, key: string, data: T, ttlMinutes: number = 60): Promise<void> {
    await this.init()
    if (!this.db) throw new Error('Database not initialized')

    const entry: CacheEntry<T> = {
      key,
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + ttlMinutes * 60 * 1000,
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite')
      const store = transaction.objectStore(storeName)
      const request = store.put(entry)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async get<T>(storeName: string, key: string): Promise<T | null> {
    await this.init()
    if (!this.db) return null

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly')
      const store = transaction.objectStore(storeName)
      const request = store.get(key)

      request.onsuccess = () => {
        const entry = request.result as CacheEntry<T> | undefined
        if (!entry) {
          resolve(null)
          return
        }

        // Check if expired
        if (Date.now() > entry.expiresAt) {
          // Delete expired entry
          this.delete(storeName, key)
          resolve(null)
          return
        }

        resolve(entry.data)
      }

      request.onerror = () => reject(request.error)
    })
  }

  async delete(storeName: string, key: string): Promise<void> {
    await this.init()
    if (!this.db) return

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite')
      const store = transaction.objectStore(storeName)
      const request = store.delete(key)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async clear(storeName: string): Promise<void> {
    await this.init()
    if (!this.db) return

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite')
      const store = transaction.objectStore(storeName)
      const request = store.clear()

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }
}

export const cacheManager = new CacheManager()
export { STORES }


/**
 * IndexedDB Cache for H1B Filter Results
 * Provides fast local caching with automatic expiration and compression
 */

interface CacheEntry<T> {
  key: string;
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
  compressed?: boolean;
  size?: number;
}

interface CacheStats {
  totalEntries: number;
  totalSize: number;
  hitRate: number;
  missRate: number;
  oldestEntry: number;
  newestEntry: number;
}

export class IndexedDBCache {
  private dbName: string;
  private dbVersion: number;
  private storeName: string;
  private db: IDBDatabase | null = null;
  private isInitialized = false;
  private stats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0
  };

  constructor(
    dbName: string = 'H1BFilterCache',
    dbVersion: number = 1,
    storeName: string = 'filterResults'
  ) {
    this.dbName = dbName;
    this.dbVersion = dbVersion;
    this.storeName = storeName;
  }

  /**
   * Initialize the IndexedDB connection
   */
  async init(): Promise<void> {
    if (this.isInitialized && this.db) {
      return;
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        console.error('Failed to open IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        this.isInitialized = true;
        console.log('IndexedDB cache initialized successfully');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create object store if it doesn't exist
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'key' });
          
          // Create indexes for efficient querying
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('ttl', 'ttl', { unique: false });
          
          console.log('Created IndexedDB object store with indexes');
        }
      };
    });
  }

  /**
   * Generate a cache key from filter parameters
   */
  private generateKey(prefix: string, params: any): string {
    const sortedParams = JSON.stringify(params, Object.keys(params).sort());
    return `${prefix}_${btoa(sortedParams).replace(/[+/=]/g, '')}`;
  }

  /**
   * Compress data using simple JSON compression
   */
  private compressData(data: any): { compressed: string; originalSize: number } {
    const jsonString = JSON.stringify(data);
    const originalSize = new Blob([jsonString]).size;
    
    // Simple compression: remove whitespace and use shorter keys
    const compressed = jsonString
      .replace(/\s+/g, '')
      .replace(/"([^"]+)":/g, (match, key) => {
        // Use shorter keys for common properties
        const shortKeys: Record<string, string> = {
          'employer_name': 'e',
          'job_title': 'j',
          'case_status': 's',
          'wage_rate_of_pay_from': 'w1',
          'wage_rate_of_pay_to': 'w2',
          'received_date': 'rd',
          'decision_date': 'dd',
          'case_number': 'cn',
          'totalRecords': 'tr',
          'totalPages': 'tp',
          'currentPage': 'cp',
          'pageSize': 'ps',
          'hasNextPage': 'hnp',
          'hasPreviousPage': 'hpp'
        };
        return `"${shortKeys[key] || key}":`;
      });

    return { compressed, originalSize };
  }

  /**
   * Decompress data
   */
  private decompressData(compressed: string): any {
    // Reverse the compression
    const expanded = compressed.replace(/"([^"]+)":/g, (match, key) => {
      const longKeys: Record<string, string> = {
        'e': 'employer_name',
        'j': 'job_title',
        's': 'case_status',
        'w1': 'wage_rate_of_pay_from',
        'w2': 'wage_rate_of_pay_to',
        'rd': 'received_date',
        'dd': 'decision_date',
        'cn': 'case_number',
        'tr': 'totalRecords',
        'tp': 'totalPages',
        'cp': 'currentPage',
        'ps': 'pageSize',
        'hnp': 'hasNextPage',
        'hpp': 'hasPreviousPage'
      };
      return `"${longKeys[key] || key}":`;
    });

    return JSON.parse(expanded);
  }

  /**
   * Set a cache entry
   */
  async set<T>(prefix: string, params: any, data: T, ttl: number = 5 * 60 * 1000): Promise<void> {
    await this.init();
    if (!this.db) throw new Error('IndexedDB not initialized');

    const key = this.generateKey(prefix, params);
    const { compressed, originalSize } = this.compressData(data);
    
    const entry: CacheEntry<string> = {
      key,
      data: compressed,
      timestamp: Date.now(),
      ttl,
      compressed: true,
      size: originalSize
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.put(entry);

      request.onsuccess = () => {
        this.stats.sets++;
        resolve();
      };

      request.onerror = () => {
        console.error('Failed to set cache entry:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Get a cache entry
   */
  async get<T>(prefix: string, params: any): Promise<T | null> {
    await this.init();
    if (!this.db) return null;

    const key = this.generateKey(prefix, params);

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(key);

      request.onsuccess = () => {
        const entry = request.result as CacheEntry<string> | undefined;
        
        if (!entry) {
          this.stats.misses++;
          resolve(null);
          return;
        }

        // Check if entry has expired
        const now = Date.now();
        if (now - entry.timestamp > entry.ttl) {
          this.stats.misses++;
          // Delete expired entry
          this.delete(prefix, params);
          resolve(null);
          return;
        }

        this.stats.hits++;
        
        try {
          const data = entry.compressed 
            ? this.decompressData(entry.data)
            : entry.data;
          resolve(data as T);
        } catch (error) {
          console.error('Failed to decompress cache entry:', error);
          this.stats.misses++;
          resolve(null);
        }
      };

      request.onerror = () => {
        console.error('Failed to get cache entry:', request.error);
        this.stats.misses++;
        resolve(null);
      };
    });
  }

  /**
   * Delete a cache entry
   */
  async delete(prefix: string, params: any): Promise<void> {
    await this.init();
    if (!this.db) return;

    const key = this.generateKey(prefix, params);

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(key);

      request.onsuccess = () => {
        this.stats.deletes++;
        resolve();
      };

      request.onerror = () => {
        console.error('Failed to delete cache entry:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Clear all cache entries
   */
  async clear(): Promise<void> {
    await this.init();
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.clear();

      request.onsuccess = () => {
        console.log('Cache cleared successfully');
        resolve();
      };

      request.onerror = () => {
        console.error('Failed to clear cache:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Clean up expired entries
   */
  async cleanup(): Promise<number> {
    await this.init();
    if (!this.db) return 0;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const index = store.index('timestamp');
      const request = index.openCursor();
      
      let deletedCount = 0;
      const now = Date.now();

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        
        if (cursor) {
          const entry = cursor.value as CacheEntry<any>;
          
          // Delete if expired
          if (now - entry.timestamp > entry.ttl) {
            cursor.delete();
            deletedCount++;
          }
          
          cursor.continue();
        } else {
          console.log(`Cleaned up ${deletedCount} expired cache entries`);
          resolve(deletedCount);
        }
      };

      request.onerror = () => {
        console.error('Failed to cleanup cache:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<CacheStats> {
    await this.init();
    if (!this.db) {
      return {
        totalEntries: 0,
        totalSize: 0,
        hitRate: 0,
        missRate: 0,
        oldestEntry: 0,
        newestEntry: 0
      };
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.getAll();

      request.onsuccess = () => {
        const entries = request.result as CacheEntry<any>[];
        
        const totalEntries = entries.length;
        const totalSize = entries.reduce((sum, entry) => sum + (entry.size || 0), 0);
        const timestamps = entries.map(entry => entry.timestamp);
        const oldestEntry = timestamps.length > 0 ? Math.min(...timestamps) : 0;
        const newestEntry = timestamps.length > 0 ? Math.max(...timestamps) : 0;
        
        const totalRequests = this.stats.hits + this.stats.misses;
        const hitRate = totalRequests > 0 ? (this.stats.hits / totalRequests) * 100 : 0;
        const missRate = totalRequests > 0 ? (this.stats.misses / totalRequests) * 100 : 0;

        resolve({
          totalEntries,
          totalSize,
          hitRate,
          missRate,
          oldestEntry,
          newestEntry
        });
      };

      request.onerror = () => {
        console.error('Failed to get cache stats:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Get cache hit rate
   */
  getHitRate(): number {
    const total = this.stats.hits + this.stats.misses;
    return total > 0 ? (this.stats.hits / total) * 100 : 0;
  }

  /**
   * Prefetch data for common filter combinations
   */
  async prefetch(commonFilters: Array<{ prefix: string; params: any; fetcher: () => Promise<any> }>): Promise<void> {
    console.log('Starting cache prefetch for common filters...');
    
    const prefetchPromises = commonFilters.map(async ({ prefix, params, fetcher }) => {
      try {
        // Check if already cached
        const cached = await this.get(prefix, params);
        if (cached) {
          return; // Already cached
        }

        // Fetch and cache
        const data = await fetcher();
        await this.set(prefix, params, data, 10 * 60 * 1000); // 10 minute TTL for prefetched data
        
        console.log(`Prefetched: ${prefix}`, params);
      } catch (error) {
        console.warn(`Failed to prefetch ${prefix}:`, error);
      }
    });

    await Promise.allSettled(prefetchPromises);
    console.log('Cache prefetch completed');
  }
}

// Create singleton instance
export const h1bCache = new IndexedDBCache('H1BFilterCache', 1, 'filterResults');

// Auto-cleanup every 30 minutes
setInterval(() => {
  h1bCache.cleanup().catch(console.error);
}, 30 * 60 * 1000);
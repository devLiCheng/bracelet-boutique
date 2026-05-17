// In-memory cache with TTL
const store = new Map<string, { data: any; expiry: number }>();

export const cache = {
  get<T>(key: string): T | null {
    const item = store.get(key);
    if (!item) return null;
    if (Date.now() > item.expiry) {
      store.delete(key);
      return null;
    }
    return item.data as T;
  },

  set(key: string, data: any, ttlMs: number = 30000): void {
    store.set(key, { data, expiry: Date.now() + ttlMs });
  },

  del(key: string): void {
    store.delete(key);
  },

  clear(): void {
    store.clear();
  },

  // Invalidate all keys matching a prefix
  invalidatePrefix(prefix: string): void {
    for (const key of store.keys()) {
      if (key.startsWith(prefix)) store.delete(key);
    }
  },
};

// Generate ETag from string content
export function generateETag(content: string): string {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return '"' + Math.abs(hash).toString(36) + '"';
}

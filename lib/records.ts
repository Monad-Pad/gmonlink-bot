class CacheRecord<T> {
  private cache: Map<number, { value: T; expiry: number }> = new Map();
  private defaultTTL: number;

  constructor(ttlMs: number) {
    this.defaultTTL = ttlMs;
  }

  set(key: number, value: T, ttlMs?: number): void {
    const expiry = Date.now() + (ttlMs ?? this.defaultTTL);
    this.cache.set(key, { value, expiry });
  }

  get(key: number): T | undefined {
    const item = this.cache.get(key);
    if (!item) return undefined;

    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return undefined;
    }

    return item.value;
  }

  has(key: number): boolean {
    return this.get(key) !== undefined;
  }

  delete(key: number): void {
    this.cache.delete(key);
  }
}

// Default TTL values (in milliseconds)
const DEFAULT_TTL = 24 * 60 * 60 * 1000; // 24 hours
const CONVERSATION_TTL = 30 * 60 * 1000;  // 30 minutes
const TRANSFER_TTL = 60 * 60 * 1000;      // 1 hour

export const projectRecord = new CacheRecord<any>(DEFAULT_TTL);
export const activeProjectRecord = new CacheRecord<number>(DEFAULT_TTL);
export const activeLinkRecord = new CacheRecord<number>(DEFAULT_TTL);
export const transferProjectRecord = new CacheRecord<{ projectId: number; fromUserId: number }>(TRANSFER_TTL);
export const lastTransferRequestRecord = new CacheRecord<{ timestamp: number, fromUserId: number }>(TRANSFER_TTL);
export const projectMessageIdRecord = new CacheRecord<number>(DEFAULT_TTL);

export const isInConversationRecord = new CacheRecord<boolean>(CONVERSATION_TTL);
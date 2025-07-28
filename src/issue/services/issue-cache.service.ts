import { Injectable } from '@nestjs/common';
import { Issue, Label } from '@prisma/client';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

interface PaginatedIssueResponse {
  issues: Issue[];
  total: number;
  hasNext: boolean;
}

@Injectable()
export class IssueCacheService {
  private cache = new Map<string, CacheEntry<unknown>>();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

  set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) {
      return null;
    }

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // Specific methods for issue caching
  cacheIssue(issue: Issue & { labels: Label[] }): void {
    this.set(`issue:${issue.id}`, issue);
  }

  getCachedIssue(id: string): (Issue & { labels: Label[] }) | null {
    return this.get(`issue:${id}`);
  }

  invalidateIssue(id: string): void {
    this.delete(`issue:${id}`);
    // Also clear any pagination caches that might contain this issue
    this.clearPaginationCache();
  }

  cachePaginatedIssues(
    page: number,
    limit: number,
    data: PaginatedIssueResponse,
  ): void {
    this.set(`issues:page:${page}:limit:${limit}`, data, 2 * 60 * 1000); // 2 minutes for pagination
  }

  getCachedPaginatedIssues(
    page: number,
    limit: number,
  ): PaginatedIssueResponse | null {
    return this.get(`issues:page:${page}:limit:${limit}`);
  }

  clearPaginationCache(): void {
    const keysToDelete: string[] = [];
    for (const key of this.cache.keys()) {
      if (key.startsWith('issues:page:')) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach((key) => this.cache.delete(key));
  }

  // Cleanup expired entries periodically
  cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach((key) => this.cache.delete(key));
  }
}

import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { PinoLogger } from 'nestjs-pino';
import { performance } from 'perf_hooks';

interface ValidationOptions {
  whitelist?: boolean;
  transform?: boolean;
  enableImplicitConversion?: boolean;
  forbidNonWhitelisted?: boolean;
  enablePerformanceTracking?: boolean;
  maxCacheSize?: number;
}

interface ValidationMetrics {
  totalValidations: number;
  totalTime: number;
  slowValidations: number;
  cacheHits: number;
  cacheMisses: number;
}

interface CacheEntry {
  result: any;
  timestamp: number;
  accessCount: number;
}

@Injectable()
export class EnhancedValidationPipe implements PipeTransform<any> {
  private readonly cache = new Map<string, CacheEntry>();
  private readonly metrics: ValidationMetrics = {
    totalValidations: 0,
    totalTime: 0,
    slowValidations: 0,
    cacheHits: 0,
    cacheMisses: 0,
  };
  private readonly maxCacheSize: number;
  private readonly enablePerformanceTracking: boolean;

  constructor(
    private readonly logger: PinoLogger,
    private readonly options: ValidationOptions = {},
  ) {
    this.maxCacheSize = options.maxCacheSize || 1000;
    this.enablePerformanceTracking = options.enablePerformanceTracking ?? false;
  }

  async transform(value: any, metadata: ArgumentMetadata): Promise<any> {
    const startTime = performance.now();
    this.metrics.totalValidations++;

    try {
      const { metatype } = metadata;

      if (!metatype || !this.toValidate(metatype)) {
        return value;
      }

      // Check cache first
      const cacheKey = this.generateCacheKey(value, metadata);
      const cachedResult = this.getFromCache(cacheKey);

      if (cachedResult !== null) {
        this.metrics.cacheHits++;
        this.logPerformance('cache-hit', startTime);
        return cachedResult;
      }
      this.metrics.cacheMisses++;

      // Skip validation if value is undefined or null
      if (value === undefined || value === null) {
        return value;
      }

      // Transform and validate
      const object = plainToClass(metatype, value, {
        enableImplicitConversion: this.options.enableImplicitConversion,
      });

      const errors = await validate(object, {
        whitelist: this.options.whitelist,
        forbidNonWhitelisted: this.options.forbidNonWhitelisted,
      });

      if (errors.length > 0) {
        const validationError = this.createValidationError(errors);
        this.logger.warn(
          {
            errors,
            input: value,
            metatype: metatype.name,
          },
          'Validation failed',
        );
        throw validationError;
      }

      const result = this.options.transform ? object : value;

      // Cache the result
      this.setCache(cacheKey, result);

      this.logPerformance('validation-success', startTime);
      return result;
    } catch (error) {
      this.logPerformance('validation-error', startTime);
      throw error;
    }
  }
  private toValidate(metatype: any): boolean {
    const types: any[] = [String, Boolean, Number, Array, Object];

    // Skip validation for parameter decorators that return pre-built DTOs
    if (metatype.name === 'UserProfileDto') {
      return false;
    }

    // Skip validation for database entity models (GraphQL ObjectTypes without validation decorators)
    const entityModels = [
      'User',
      'Team',
      'Project',
      'Rate',
      'Time',
      'Issue',
      'Label',
    ];
    if (entityModels.includes(metatype.name)) {
      return false;
    }

    return !types.includes(metatype);
  }

  private generateCacheKey(value: any, metadata: ArgumentMetadata): string {
    const valueHash = this.hashObject(value);
    return `${metadata.metatype?.name || 'unknown'}_${valueHash}`;
  }

  private hashObject(obj: any): string {
    return Buffer.from(JSON.stringify(obj)).toString('base64').substring(0, 16);
  }

  private getFromCache(key: string): any {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check if cache entry is still valid (1 hour TTL)
    const now = Date.now();
    if (now - entry.timestamp > 3600000) {
      this.cache.delete(key);
      return null;
    }

    entry.accessCount++;
    return entry.result;
  }

  private setCache(key: string, result: any): void {
    // Implement LRU eviction if cache is full
    if (this.cache.size >= this.maxCacheSize) {
      this.evictLeastRecentlyUsed();
    }

    this.cache.set(key, {
      result,
      timestamp: Date.now(),
      accessCount: 1,
    });
  }

  private evictLeastRecentlyUsed(): void {
    let oldestKey = '';
    let oldestTime = Date.now();
    let leastUsedKey = '';
    let leastUsedCount = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
      if (entry.accessCount < leastUsedCount) {
        leastUsedCount = entry.accessCount;
        leastUsedKey = key;
      }
    }

    // Prefer evicting least used over oldest
    const keyToEvict = leastUsedCount < 5 ? leastUsedKey : oldestKey;
    this.cache.delete(keyToEvict);
  }

  private createValidationError(errors: any[]): BadRequestException {
    const validationErrors = errors.map((error) => ({
      property: error.property,
      value: error.value,
      constraints: error.constraints,
      children: error.children,
    }));

    return new BadRequestException({
      message: 'Validation failed',
      statusCode: 400,
      validationErrors,
    });
  }

  private logPerformance(operation: string, startTime: number): void {
    if (!this.enablePerformanceTracking) return;

    const duration = performance.now() - startTime;
    this.metrics.totalTime += duration;

    if (duration > 100) {
      // Log slow validations (>100ms)
      this.metrics.slowValidations++;
      this.logger.warn(
        {
          operation,
          duration: Math.round(duration * 100) / 100,
          metrics: this.metrics,
          memoryUsage: process.memoryUsage(),
        },
        'Slow validation detected',
      );
    } else {
      this.logger.debug(
        {
          operation,
          duration: Math.round(duration * 100) / 100,
        },
        'Validation completed',
      );
    }
  }
}

import { Prisma } from '@prisma/client';
import { db } from '../db';
import { equipmentCache, userCache, rentalCache } from '../cache/redis';

type QueryOptions = {
  page?: number;
  limit?: number;
  orderBy?: Record<string, 'asc' | 'desc'>;
  include?: Record<string, boolean | Record<string, boolean>>;
  where?: Record<string, any>;
  select?: Record<string, boolean>;
  cache?: boolean;
  cacheTTL?: number;
};

export class QueryBuilder<T> {
  private model: any;
  private cacheService: typeof equipmentCache | typeof userCache | typeof rentalCache;
  private options: QueryOptions = {};

  constructor(
    model: keyof typeof db,
    cacheService: typeof equipmentCache | typeof userCache | typeof rentalCache
  ) {
    this.model = db[model];
    this.cacheService = cacheService;
  }

  // Pagination
  page(page: number, limit: number = 10) {
    this.options.page = page;
    this.options.limit = limit;
    return this;
  }

  // Ordering
  orderBy(field: string, direction: 'asc' | 'desc' = 'desc') {
    this.options.orderBy = { [field]: direction };
    return this;
  }

  // Relations to include
  include(relations: Record<string, boolean | Record<string, boolean>>) {
    this.options.include = relations;
    return this;
  }

  // Where conditions
  where(conditions: Record<string, any>) {
    this.options.where = conditions;
    return this;
  }

  // Select specific fields
  select(fields: Record<string, boolean>) {
    this.options.select = fields;
    return this;
  }

  // Build the query
  private buildQuery() {
    const query: any = {};

    if (this.options.where) {
      query.where = this.options.where;
    }

    if (this.options.include) {
      query.include = this.options.include;
    }

    if (this.options.select) {
      query.select = this.options.select;
    }

    if (this.options.orderBy) {
      query.orderBy = this.options.orderBy;
    }

    if (this.options.page && this.options.limit) {
      query.skip = (this.options.page - 1) * this.options.limit;
      query.take = this.options.limit;
    }

    return query;
  }

  // Execute the query with caching
  async execute(): Promise<T[]> {
    const cacheKey = JSON.stringify({
      model: this.model,
      options: this.options
    });

    // Try to get from cache first
    const cached = await this.cacheService.get<T[]>(cacheKey);
    if (cached) {
      return cached;
    }

    // Execute the query
    const query = this.buildQuery();
    const results = await this.model.findMany(query);

    // Cache the results
    await this.cacheService.set(cacheKey, results);

    return results;
  }

  // Execute and get total count for pagination
  async executeWithCount(): Promise<{ data: T[]; total: number }> {
    const [data, total] = await Promise.all([
      this.execute(),
      this.model.count({ where: this.options.where })
    ]);

    return { data, total };
  }

  // Get a single record by ID with caching
  async findById(id: string): Promise<T | null> {
    const cached = await this.cacheService.get<T>(id);
    if (cached) {
      return cached;
    }

    const query = this.buildQuery();
    const result = await this.model.findUnique({
      ...query,
      where: { id }
    });

    if (result) {
      await this.cacheService.set(id, result);
    }

    return result;
  }
} 
import { performance } from 'perf_hooks';

interface PerformanceMetrics {
  duration: number;
  memory: {
    heapUsed: number;
    heapTotal: number;
  };
  timestamp: number;
}

class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, PerformanceMetrics[]>;
  private maxMetricsPerKey: number;

  private constructor() {
    this.metrics = new Map();
    this.maxMetricsPerKey = 1000; // Keep last 1000 measurements per key
  }

  public static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  // Measure execution time of async functions
  public async measure<T>(
    key: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const start = performance.now();
    const startMemory = process.memoryUsage();

    try {
      const result = await fn();
      this.recordMetrics(key, start, startMemory);
      return result;
    } catch (error) {
      this.recordMetrics(key, start, startMemory);
      throw error;
    }
  }

  // Measure execution time of sync functions
  public measureSync<T>(
    key: string,
    fn: () => T
  ): T {
    const start = performance.now();
    const startMemory = process.memoryUsage();

    try {
      const result = fn();
      this.recordMetrics(key, start, startMemory);
      return result;
    } catch (error) {
      this.recordMetrics(key, start, startMemory);
      throw error;
    }
  }

  private recordMetrics(
    key: string,
    startTime: number,
    startMemory: NodeJS.MemoryUsage
  ): void {
    const duration = performance.now() - startTime;
    const currentMemory = process.memoryUsage();

    const metrics: PerformanceMetrics = {
      duration,
      memory: {
        heapUsed: currentMemory.heapUsed - startMemory.heapUsed,
        heapTotal: currentMemory.heapTotal,
      },
      timestamp: Date.now(),
    };

    if (!this.metrics.has(key)) {
      this.metrics.set(key, []);
    }

    const keyMetrics = this.metrics.get(key)!;
    keyMetrics.push(metrics);

    // Keep only the last maxMetricsPerKey measurements
    if (keyMetrics.length > this.maxMetricsPerKey) {
      keyMetrics.shift();
    }
  }

  // Get metrics for a specific key
  public getMetrics(key: string): PerformanceMetrics[] {
    return this.metrics.get(key) || [];
  }

  // Get average metrics for a specific key
  public getAverageMetrics(key: string): PerformanceMetrics | null {
    const metrics = this.metrics.get(key);
    if (!metrics || metrics.length === 0) {
      return null;
    }

    const sum = metrics.reduce(
      (acc, curr) => ({
        duration: acc.duration + curr.duration,
        memory: {
          heapUsed: acc.memory.heapUsed + curr.memory.heapUsed,
          heapTotal: acc.memory.heapTotal + curr.memory.heapTotal,
        },
        timestamp: curr.timestamp, // Use the latest timestamp
      }),
      {
        duration: 0,
        memory: { heapUsed: 0, heapTotal: 0 },
        timestamp: 0,
      }
    );

    return {
      duration: sum.duration / metrics.length,
      memory: {
        heapUsed: sum.memory.heapUsed / metrics.length,
        heapTotal: sum.memory.heapTotal / metrics.length,
      },
      timestamp: sum.timestamp,
    };
  }

  // Clear metrics for a specific key
  public clearMetrics(key: string): void {
    this.metrics.delete(key);
  }

  // Clear all metrics
  public clearAllMetrics(): void {
    this.metrics.clear();
  }
}

// Export singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance();

// Example usage:
/*
// For async functions
const result = await performanceMonitor.measure('fetchData', async () => {
  const data = await fetchData();
  return data;
});

// For sync functions
const result = performanceMonitor.measureSync('calculation', () => {
  return heavyCalculation();
});

// Get metrics
const metrics = performanceMonitor.getMetrics('fetchData');
const avgMetrics = performanceMonitor.getAverageMetrics('fetchData');
*/ 
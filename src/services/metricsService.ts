import { MetricsResponse } from '../models/types';

class MetricsService {
  private totalComparisons = 0;
  private matches = 0;
  private mismatches = 0;

  public recordMatch(isMatch: boolean): void {
    this.totalComparisons += 1;
    if (isMatch) {
      this.matches += 1;
    } else {
      this.mismatches += 1;
    }
  }

  public getMetrics(): MetricsResponse {
    return {
      totalComparisons: this.totalComparisons,
      matches: this.matches,
      mismatches: this.mismatches,
      matchRate: this.calculateMatchRate(),
    };
  }

  public reset(): void {
    this.totalComparisons = 0;
    this.matches = 0;
    this.mismatches = 0;
  }

  private calculateMatchRate(): number {
    if (this.totalComparisons === 0) {
      return 100;
    }
    return Number(((this.matches / this.totalComparisons) * 100).toFixed(2));
  }
}

export const metricsService = new MetricsService();

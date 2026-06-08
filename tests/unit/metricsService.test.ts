import { metricsService } from '../../src/services/metricsService';

describe('metricsService', () => {
  beforeEach(() => {
    metricsService.reset();
  });

  it('records matches and mismatches', () => {
    metricsService.recordMatch(true);
    metricsService.recordMatch(false);

    const metrics = metricsService.getMetrics();

    expect(metrics.totalComparisons).toBe(2);
    expect(metrics.matches).toBe(1);
    expect(metrics.mismatches).toBe(1);
    expect(metrics.matchRate).toBe(50);
  });

  it('returns 100% match rate when no comparisons exist', () => {
    const metrics = metricsService.getMetrics();
    expect(metrics.matchRate).toBe(100);
  });
});

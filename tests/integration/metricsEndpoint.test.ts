import Fastify from 'fastify';

describe('Metrics endpoint', () => {
  let server: ReturnType<typeof Fastify>;
  let metricsService: { recordMatch: (match: boolean) => void; reset: () => void };

  beforeEach(async () => {
    jest.resetModules();
    const metricsModule = await import('../../src/services/metricsService');
    metricsService = metricsModule.metricsService;
    metricsService.reset();
    const { buildApp } = await import('../../src/api/app');
    server = buildApp();
    await server.ready();
  });

  afterEach(async () => {
    if (server) {
      await server.close();
    }
  });

  it('returns metrics with total comparisons, matches, mismatches, and match rate', async () => {
    metricsService.recordMatch(true);
    metricsService.recordMatch(false);

    const response = await server.inject({ method: 'GET', url: '/metrics' });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      totalComparisons: 2,
      matches: 1,
      mismatches: 1,
      matchRate: 50,
    });
  });
});

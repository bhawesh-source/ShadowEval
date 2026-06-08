import { FastifyInstance } from 'fastify';
import { metricsService } from '../../services/metricsService';

export async function metricsRoute(fastify: FastifyInstance): Promise<void> {
  fastify.get('/metrics', async () => {
    return metricsService.getMetrics();
  });
}

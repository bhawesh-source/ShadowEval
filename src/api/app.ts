import Fastify from 'fastify';
import { chatRoute } from './routes/chat';
import { metricsRoute } from './routes/metrics';

export function buildApp() {
  const server = Fastify({ logger: false });
  server.register(chatRoute);
  server.register(metricsRoute);
  return server;
}

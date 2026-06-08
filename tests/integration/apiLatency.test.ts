import Fastify from 'fastify';
import { ChatRequest } from '../../src/models/types';

describe('Shadow evaluation API integration', () => {
  let server: ReturnType<typeof Fastify>;

  beforeEach(async () => {
    jest.resetModules();
  });

  afterEach(async () => {
    if (server) {
      await server.close();
    }
  });

  it('returns /chat response immediately even when shadow publish is delayed', async () => {
    const mockPublish = jest.fn(
      () => new Promise((resolve) => setTimeout(resolve, 500)),
    );

    jest.doMock('../../src/services/shadowEvaluationService', () => ({
      publishShadowEvaluationEvent: mockPublish,
    }));
    jest.doMock('../../src/services/evaluationService', () => ({
      evaluatePrimary: jest.fn(async (request: ChatRequest) => ({
        requestId: request.requestId,
        primaryResponse: 'Primary response',
        timestamp: new Date().toISOString(),
      })),
    }));

    const { buildApp } = await import('../../src/api/app');
    server = buildApp();
    await server.ready();

    const start = Date.now();
    const response = await server.inject({
      method: 'POST',
      url: '/chat',
      payload: {
        requestId: 'test-1',
        prompt: 'Hello world',
      },
    });
    const duration = Date.now() - start;

    expect(response.statusCode).toBe(200);
    expect(duration).toBeLessThan(300);
    expect(mockPublish).toHaveBeenCalledTimes(1);
  });

  it('still returns success when the shadow publish fails', async () => {
    const mockPublish = jest.fn(() => Promise.reject(new Error('shadow failure')));

    jest.doMock('../../src/services/shadowEvaluationService', () => ({
      publishShadowEvaluationEvent: mockPublish,
    }));
    jest.doMock('../../src/services/evaluationService', () => ({
      evaluatePrimary: jest.fn(async (request: ChatRequest) => ({
        requestId: request.requestId,
        primaryResponse: 'Primary response',
        timestamp: new Date().toISOString(),
      })),
    }));

    const { buildApp } = await import('../../src/api/app');
    server = buildApp();
    await server.ready();

    const response = await server.inject({
      method: 'POST',
      url: '/chat',
      payload: {
        requestId: 'test-2',
        prompt: 'Hello again',
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toHaveProperty('primaryResponse');
    expect(mockPublish).toHaveBeenCalledTimes(1);
  });
});

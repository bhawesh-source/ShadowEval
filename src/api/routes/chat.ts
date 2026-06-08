import { FastifyInstance } from 'fastify';
import { evaluatePrimary } from '../../services/evaluationService';
import { publishShadowEvaluationEvent } from '../../services/shadowEvaluationService';
import { ChatRequest } from '../../models/types';

export async function chatRoute(fastify: FastifyInstance): Promise<void> {
  fastify.post<{ Body: ChatRequest }>('/chat', async (request, reply) => {
    const chatRequest = request.body;

    const response = await evaluatePrimary(chatRequest);

    void publishShadowEvaluationEvent(chatRequest, response.primaryResponse).catch((error) => {
      fastify.log.error({ err: error, requestId: chatRequest.requestId }, 'Failed to publish shadow event');
    });

    return reply.code(200).send(response);
  });
}

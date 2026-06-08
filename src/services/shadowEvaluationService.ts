import { ChatRequest, EvaluationEvent } from '../models/types';
import { getCandidateResponse } from '../clients/candidateClient';
import { publishEvaluationMessage } from '../clients/kafkaProducer';
import { connectConsumer, runConsumer, subscribeToTopic } from '../clients/kafkaConsumer';
import { metricsService } from './metricsService';
import { compareResponses } from '../utils/responseComparator';
import { EVALUATION_TOPIC } from '../config';

export async function publishShadowEvaluationEvent(request: ChatRequest, primaryResponse: string): Promise<void> {
  const message: EvaluationEvent = {
    requestId: request.requestId,
    timestamp: new Date().toISOString(),
    input: request,
    primaryResponse,
    metadata: request.metadata,
  };

  await publishEvaluationMessage(EVALUATION_TOPIC, JSON.stringify(message));
}

export async function startShadowEvaluationConsumer(): Promise<void> {
  await connectConsumer();
  await subscribeToTopic(EVALUATION_TOPIC);

  await runConsumer(async ({ message }) => {
    if (!message.value) {
      return;
    }

    try {
      const payload = message.value.toString();
      const event: EvaluationEvent = JSON.parse(payload);
      const candidateResponse = await getCandidateResponse(event.input);
      const isMatch = compareResponses(event.primaryResponse, candidateResponse);
      metricsService.recordMatch(isMatch);
    } catch (error) {
      // Candidate failures and consumer errors should not affect the API path.
      // Log here and continue processing subsequent messages.
      console.error('Error processing shadow evaluation message', error);
    }
  });
}

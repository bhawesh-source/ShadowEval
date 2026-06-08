import { EvaluationEvent } from '../models/types';
import { enqueueEvaluationEvent } from '../queue/evaluationQueue';

export async function connectProducer(): Promise<void> {
  return Promise.resolve();
}

export async function publishEvaluationMessage(topic: string, message: string): Promise<void> {
  const event: EvaluationEvent = JSON.parse(message);
  enqueueEvaluationEvent(event);
}

export async function disconnectProducer(): Promise<void> {
  return Promise.resolve();
}

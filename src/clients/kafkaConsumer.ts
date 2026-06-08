import { startEvaluationQueueProcessor, stopEvaluationQueueProcessor } from '../queue/evaluationQueue';
import { EvaluationEvent } from '../models/types';

interface MessagePayload {
  topic: string;
  partition: number;
  message: {
    key: null;
    value: Buffer;
    headers?: Record<string, unknown> | undefined;
    offset: string;
    timestamp: string;
  };
}

export async function connectConsumer(): Promise<void> {
  return Promise.resolve();
}

export async function subscribeToTopic(_topic: string): Promise<void> {
  return Promise.resolve();
}

export async function runConsumer(eachMessage: (payload: MessagePayload) => Promise<void>): Promise<void> {
  startEvaluationQueueProcessor(async (event: EvaluationEvent) => {
    await eachMessage({
      topic: '',
      partition: 0,
      message: {
        key: null,
        value: Buffer.from(JSON.stringify(event)),
        headers: undefined,
        offset: '0',
        timestamp: new Date().toISOString(),
      },
    });
  });
}

export async function disconnectConsumer(): Promise<void> {
  await stopEvaluationQueueProcessor();
}

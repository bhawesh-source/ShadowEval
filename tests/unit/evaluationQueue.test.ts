import { enqueueEvaluationEvent, startEvaluationQueueProcessor, stopEvaluationQueueProcessor } from '../../src/queue/evaluationQueue';
import { EvaluationEvent } from '../../src/models/types';

describe('evaluationQueue', () => {
  afterEach(async () => {
    await stopEvaluationQueueProcessor();
  });

  it('processes queued events in FIFO order', async () => {
    const processed: string[] = [];
    const events: EvaluationEvent[] = [
      { requestId: '1', timestamp: '2026-01-01T00:00:00Z', input: { requestId: '1', prompt: 'first' }, primaryResponse: 'a' },
      { requestId: '2', timestamp: '2026-01-01T00:00:01Z', input: { requestId: '2', prompt: 'second' }, primaryResponse: 'b' },
    ];

    const done = new Promise<void>((resolve) => {
      startEvaluationQueueProcessor(async (event) => {
        processed.push(event.requestId);
        if (processed.length === events.length) {
          resolve();
        }
      });
    });

    events.forEach((event) => enqueueEvaluationEvent(event));
    await done;

    expect(processed).toEqual(['1', '2']);
  });

  it('continues processing after a handler error', async () => {
    const processed: string[] = [];
    const events: EvaluationEvent[] = [
      { requestId: '1', timestamp: '2026-01-01T00:00:00Z', input: { requestId: '1', prompt: 'first' }, primaryResponse: 'a' },
      { requestId: '2', timestamp: '2026-01-01T00:00:01Z', input: { requestId: '2', prompt: 'second' }, primaryResponse: 'b' },
    ];

    const done = new Promise<void>((resolve) => {
      startEvaluationQueueProcessor(async (event) => {
        if (event.requestId === '1') {
          throw new Error('handler failure');
        }

        processed.push(event.requestId);
        if (processed.length === 1) {
          resolve();
        }
      });
    });

    events.forEach((event) => enqueueEvaluationEvent(event));
    await done;

    expect(processed).toEqual(['2']);
  });
});

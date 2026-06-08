import { EvaluationEvent } from '../models/types';

type EventHandler = (event: EvaluationEvent) => Promise<void>;

class EvaluationQueue {
  private queue: EvaluationEvent[] = [];
  private handler: EventHandler | null = null;
  private isRunning = false;
  private isProcessing = false;
  private stopRequested = false;

  public enqueue(event: EvaluationEvent): void {
    this.queue.push(event);
    this.scheduleProcessing();
  }

  public start(handler: EventHandler): void {
    this.handler = handler;
    this.isRunning = true;
    this.stopRequested = false;
    this.scheduleProcessing();
  }

  public async stop(): Promise<void> {
    this.stopRequested = true;
    this.isRunning = false;

    while (this.isProcessing) {
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
  }

  private scheduleProcessing(): void {
    if (!this.isRunning || this.isProcessing || !this.handler) {
      return;
    }

    this.isProcessing = true;
    void this.processQueue();
  }

  private async processQueue(): Promise<void> {
    try {
      while (this.isRunning && !this.stopRequested && this.queue.length > 0) {
        const event = this.queue.shift();
        if (!event || !this.handler) {
          break;
        }

        try {
          await this.handler(event);
        } catch (error) {
          console.error('Error processing evaluation event', error);
        }
      }
    } finally {
      this.isProcessing = false;
      if (this.isRunning && this.queue.length > 0) {
        this.scheduleProcessing();
      }
    }
  }
}

const evaluationQueue = new EvaluationQueue();

export function enqueueEvaluationEvent(event: EvaluationEvent): void {
  evaluationQueue.enqueue(event);
}

export function startEvaluationQueueProcessor(handler: EventHandler): void {
  evaluationQueue.start(handler);
}

export async function stopEvaluationQueueProcessor(): Promise<void> {
  await evaluationQueue.stop();
}

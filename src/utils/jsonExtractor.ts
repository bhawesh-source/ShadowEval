import { ChatRequest } from '../models/types';

export function extractPrompt(request: ChatRequest): string {
  return request.prompt.trim();
}

export function extractMetadata(request: ChatRequest): Record<string, unknown> {
  return request.metadata ?? {};
}

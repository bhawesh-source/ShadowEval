import { ChatRequest } from '../models/types';
import { PRIMARY_MODEL_ENDPOINT } from '../config';

interface LLMApiResponse {
  output?: string;
  response?: string;
}

function normalizeResponseBody(body: LLMApiResponse): string {
  return body.output ?? body.response ?? '';
}

export async function getPrimaryResponse(request: ChatRequest): Promise<string> {
  const response = await fetch(PRIMARY_MODEL_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: request.prompt, requestId: request.requestId, metadata: request.metadata }),
  });

  if (!response.ok) {
    throw new Error(`Primary LLM request failed with status ${response.status}`);
  }

  const body = (await response.json()) as LLMApiResponse;
  return normalizeResponseBody(body);
}

import { ChatRequest, ChatResponse } from '../models/types';
import { getPrimaryResponse } from '../clients/primaryClient';

export async function evaluatePrimary(request: ChatRequest): Promise<ChatResponse> {
  const primaryResponse = await getPrimaryResponse(request);
  return {
    requestId: request.requestId,
    primaryResponse,
    timestamp: new Date().toISOString(),
  };
}

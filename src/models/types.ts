export interface ChatRequest {
  requestId: string;
  prompt: string;
  metadata?: Record<string, unknown>;
}

export interface ChatResponse {
  requestId: string;
  primaryResponse: string;
  timestamp: string;
}

export interface MetricsResponse {
  totalComparisons: number;
  matches: number;
  mismatches: number;
  matchRate: number;
}

export interface EvaluationEvent {
  requestId: string;
  timestamp: string;
  input: ChatRequest;
  primaryResponse: string;
  metadata?: Record<string, unknown>;
}

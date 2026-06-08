## Plan: Shadow-Mode LLM Evaluator API Service

TL;DR
Build a Fastify-based proxy service in `/workspaces/ShadowEval` that synchronously routes customer requests through a Primary LLM endpoint, publishes shadow evaluation messages to Kafka for an asynchronous Candidate evaluation pipeline, and exposes live match metrics via `/metrics`. Keep the customer path isolated from candidate failures and latency.

**Functional requirements**
- Accept customer requests and return Primary LLM responses synchronously.
- Fire an asynchronous shadow request to Candidate LLM for every customer request.
- Candidate response must never affect the customer-facing response.
- Compare Primary and Candidate outputs and record mismatches.
- Expose metrics: total comparisons, matches, mismatches, and match-rate percentage.
- Provide `GET /metrics` endpoint.
- Support unit tests for JSON extraction, response comparison, and match-rate calculation.
- Support integration tests proving candidate latency or failures do not impact API latency.

**Non-functional requirements**
- Use TypeScript, Node.js, Fastify, Kafka, Jest, Docker Compose.
- Use in-memory metrics storage unless persistence becomes necessary.
- Keep design simple, production-oriented, and decoupled.
- Ensure Candidate failures are isolated from customer path.
- GitHub Actions pipeline for install, lint, test, build.

**High-level architecture**
- API Layer: Fastify server exposes `POST /chat` and `GET /metrics`.
- Synchronous path: `POST /chat` forwards request to Primary LLM, returns response quickly.
- Decoupled background path: after Primary response returns, publish an evaluation event to Kafka.
- Kafka consumer: reads shadow events, calls Candidate LLM, compares responses, updates metrics.
- Metrics store: in-memory counter module with total/matches/mismatches and match-rate.
- Health and resilience: Candidate failures caught and logged; no retry from customer path.

**ASCII architecture diagram**

  [Client]
      |
      | POST /chat
      v
  [Fastify API] ---+--> [Primary LLM] --> [Primary response] --> [Client]
                   |
                   +--> [Kafka Producer] --> [Topic: llm-shadow-evaluations]

  [Kafka Consumer] --> [Candidate LLM]
                   |    +--> [Response comparator]
                   |    +--> [Metrics store]
                   v
               [Metrics endpoint /metrics]

**API definitions**
- `POST /chat`
  - Request body: JSON payload containing prompt/inputs and optional metadata.
  - Response: Primary LLM output in a standardized response wrapper.
  - Semantics: synchronous; Candidate path decoupled entirely.
- `GET /metrics`
  - Response JSON:
    - `totalComparisons`
    - `matches`
    - `mismatches`
    - `matchRate`
  - Semantics: read-only metrics exposure.

**Kafka topic design**
- Topic name: `llm-shadow-evaluations`
- Message schema:
  - `requestId`: string
  - `timestamp`: ISO string or epoch ms
  - `input`: original request payload or normalized prompt
  - `primaryResponse`: Primary LLM output
  - `metadata`: optional context for evaluation
- Consumer group: `shadow-evaluator-group`
- Initial topology: single topic with 1 partition for prototype simplicity.

**Folder structure**
- `src/`
  - `api/`
    - `server.ts`
    - `routes/chat.ts`
    - `routes/metrics.ts`
  - `clients/`
    - `primaryClient.ts`
    - `candidateClient.ts`
    - `kafkaProducer.ts`
    - `kafkaConsumer.ts`
  - `services/`
    - `evaluationService.ts`
    - `metricsService.ts`
  - `models/`
    - `types.ts`
    - `kafkaMessage.ts`
  - `utils/`
    - `jsonExtractor.ts`
    - `responseComparator.ts`
    - `logger.ts`
  - `config/`
    - `index.ts`
- `tests/`
  - `unit/`
    - `jsonExtractor.test.ts`
    - `responseComparator.test.ts`
    - `metricsService.test.ts`
  - `integration/`
    - `apiLatency.test.ts`
    - `candidateIsolation.test.ts`
- `docker-compose.yml`
- `Dockerfile`
- `.github/workflows/ci.yml`
- `README.md`

**Failure scenarios and handling**
1. Primary LLM failure
   - API returns a controlled 5xx or 4xx error.
   - Do not publish Kafka event when primary fails to generate a valid response.
2. Kafka producer failure
   - Log error and continue returning Primary response.
   - Do not block customer path.
3. Candidate LLM failure
   - Kafka consumer catches error, logs it, increments a failure metric if desired.
   - Do not propagate errors back to client.
4. Candidate latency
   - Candidate request is executed after API response is returned.
   - The API response is not waiting on Candidate.
5. Kafka consumer processing error
   - Catch and log per-message exceptions.
   - Continue processing next messages.

**How to prove asynchronous decoupling in tests**
- Integration test with mocked Primary and Candidate clients.
- Simulate Candidate client delay (e.g. 500ms or 1s) while Primary returns immediately.
- Assert API `POST /chat` latency is short and not affected by Candidate delay.
- Simulate Candidate error and assert API response still returns successfully with Primary output.
- Use a test Kafka broker via Docker Compose to verify event publication independent of API request.
- Verify `/metrics` updates after consumer processing, not during the request.

**Component-by-component implementation path**
1. Scaffold the project under `/workspaces/ShadowEval`.
2. Define shared types and config.
3. Implement in-memory `metricsService`.
4. Build `jsonExtractor` and `responseComparator` utilities.
5. Build Fastify app with `/chat` and `/metrics` routes.
6. Add Primary LLM client abstraction and synchronous request flow.
7. Add Kafka producer in API path.
8. Add Kafka consumer with Candidate LLM evaluation and comparison.
9. Add error isolation around Kafka publish and Candidate processing.
10. Add unit tests and integration tests.
11. Add Docker Compose and CI pipeline.
12. Write README with architecture, setup, async strategy, and metrics.
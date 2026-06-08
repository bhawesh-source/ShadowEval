# ShadowEval

ShadowEval is a shadow-mode LLM evaluator service built with TypeScript, Fastify, an in-memory queue, and Jest.

## Architecture

- `POST /chat`: customer-facing endpoint.
- Primary request flow:
  - Accept request synchronously.
  - Forward to the Primary LLM client.
  - Return the Primary response to the customer.
- Shadow evaluation flow:
  - Publish an in-memory evaluation event after the Primary response is returned.
  - Background processor calls the Candidate LLM asynchronously.
  - Compare Primary and Candidate outputs.
  - Record metrics in-memory without affecting the customer path.
- `GET /metrics`: exposes total comparisons, matches, mismatches, and match-rate percentage.

## Project structure

- `src/api/` - Fastify server and routes.
- `src/clients/` - Primary/Candidate LLM clients and queue producers/consumers.
- `src/services/` - evaluation and metrics logic.
- `src/models/` - shared request, response, and evaluation event types.
- `src/utils/` - JSON extraction and response comparison utilities.
- `tests/` - unit and integration tests.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables, e.g. in `.env`:
   ```env
   PORT=3000
   PRIMARY_MODEL_ENDPOINT=http://localhost:4000/primary
   CANDIDATE_MODEL_ENDPOINT=http://localhost:4000/candidate
   ```

3. Start the service:
   ```bash
   docker-compose up --build
   ```

4. Send traffic to the API:
   - `POST /chat`
   - `GET /metrics`

## Async decoupling strategy

- The customer path is isolated by returning the Primary response immediately.
- An in-memory queue is used as an asynchronous buffer for shadow events.
- Candidate requests are executed by a separate background processor outside of the synchronous request path.
- Candidate failures or latency only affect background processing and are logged, not returned to the customer.

## Metrics

`GET /metrics` returns:

- `totalComparisons`
- `matches`
- `mismatches`
- `matchRate`

## Tests

- Unit tests cover JSON extraction, response comparison, and match-rate calculation.
- Integration tests cover API latency isolation and metrics endpoint behavior.

Run all tests:
```bash
npm test
```

Build:
```bash
npm run build
```

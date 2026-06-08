const fastify = require('fastify')({ logger: false });
const crypto = require('crypto');

const PORT = 4000;

// Known prompts -> primary responses
const PRIMARY_RESPONSES = {
  'What is Kubernetes?':
    'Kubernetes is a container orchestration platform used to automate deployment, scaling and management of containerized applications.',
  'What is Kafka?':
    'Apache Kafka is a distributed event streaming platform used for building real-time data pipelines and streaming applications.',
  'What is Redis?':
    'Redis is an in-memory key-value data store commonly used for caching, session storage and real-time applications.'
};

// Semantically similar variants for candidate responses
const SIMILAR_RESPONSES = {
  'What is Kubernetes?': 'Kubernetes helps manage and orchestrate containerized workloads.',
  'What is Kafka?': 'Kafka enables reliable real-time event streaming between distributed systems.',
  'What is Redis?': 'Redis is a fast in-memory datastore frequently used as a cache.'
};

// Intentionally incorrect mismatch responses
const MISMATCH_RESPONSES = {
  'What is Kubernetes?': 'Kubernetes is a relational database.',
  'What is Kafka?': 'Kafka is a frontend JavaScript framework.',
  'What is Redis?': 'Redis is a container orchestration platform.'
};

const UNKNOWN_RESPONSE = 'I am a mock LLM and do not have a predefined answer for this prompt.';

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Simple hash helper (returns a non-negative integer)
function hashToInt(str) {
  const h = crypto.createHash('sha256').update(String(str)).digest('hex');
  return parseInt(h.slice(0, 8), 16) >>> 0;
}

function getPrimaryResponse(prompt) {
  if (!prompt || typeof prompt !== 'string') return UNKNOWN_RESPONSE;
  return PRIMARY_RESPONSES[prompt] || UNKNOWN_RESPONSE;
}

async function handlePrimary(req, reply) {
  const prompt = req.body && req.body.prompt;
  const response = getPrimaryResponse(prompt);
  const path = PRIMARY_RESPONSES[prompt] ? 'MATCH' : 'UNKNOWN';
  console.log(`/primary called - ${path}`);
  return reply.send({ response });
}

async function handleCandidate(req, reply) {
  const prompt = req.body && req.body.prompt;
  console.log('/candidate called');

  // Simulate independent failure (5%) and delay (5%)
  const errRoll = Math.random();
  if (errRoll < 0.05) {
    console.log('/candidate - ERROR');
    return reply.status(500).send({ error: 'Simulated server error' });
  }

  const delayRoll = Math.random();
  let didDelay = false;
  if (delayRoll < 0.05) {
    didDelay = true;
    console.log('/candidate - DELAY (10s)');
    await delay(10000);
  }

  const primary = getPrimaryResponse(prompt);

  // Decide MATCH (70%), SIMILAR (20%), MISMATCH (10%)
  const r = Math.random();
  let chosenPath = 'MATCH';
  let responseText = primary;

  if (r < 0.7) {
    chosenPath = 'MATCH';
    responseText = primary;
  } else if (r < 0.9) {
    chosenPath = 'SIMILAR';
    responseText = SIMILAR_RESPONSES[prompt] || primary;
  } else {
    chosenPath = 'MISMATCH';
    responseText = MISMATCH_RESPONSES[prompt] || 'An incorrect answer.';
  }

  console.log(`/candidate - ${chosenPath}${didDelay ? ' (after delay)' : ''}`);
  return reply.send({ response: responseText });
}

fastify.post('/primary', async (req, reply) => handlePrimary(req, reply));
fastify.post('/candidate', async (req, reply) => handleCandidate(req, reply));

fastify.listen({ port: PORT, host: '0.0.0.0' })
  .then(() => console.log(`Mock LLM server listening on http://0.0.0.0:${PORT}`))
  .catch((err) => {
    console.error('Failed to start server', err);
    process.exit(1);
  });

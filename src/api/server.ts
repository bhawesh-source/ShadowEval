import { PORT } from '../config';
import { connectProducer, disconnectProducer } from '../clients/kafkaProducer';
import { disconnectConsumer } from '../clients/kafkaConsumer';
import { startShadowEvaluationConsumer } from '../services/shadowEvaluationService';
import { buildApp } from './app';

const server = buildApp();

server.addHook('onClose', async () => {
  await disconnectProducer();
  await disconnectConsumer();
});

const start = async (): Promise<void> => {
  try {
    await connectProducer().catch((error) => {
      server.log.error({ err: error }, 'Failed to connect shadow event producer');
    });

    await startShadowEvaluationConsumer().catch((error) => {
      server.log.error({ err: error }, 'Failed to start shadow evaluation consumer');
    });

    await server.listen({ port: PORT, host: '0.0.0.0' });
    server.log.info(`Server listening on http://0.0.0.0:${PORT}`);
  } catch (error) {
    server.log.error(error);
    process.exit(1);
  }
};

start();

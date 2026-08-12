// ============================================================================
// WebStackPro BullMQ Queue
// AI processing is queued so webhooks return fast and the dashboard stays snappy.
// Queue name: "webstackpro-inbox"
//
// Redis is OPTIONAL: when REDIS_URL is unset we fall back to inline processing
// (see addInboxJob) so the app still runs for local testing without a server.
// ============================================================================

const { Queue } = require('bullmq');
const Redis = require('ioredis');

const useRedis = !!process.env.REDIS_URL;

const connection = useRedis
  ? new Redis(process.env.REDIS_URL, { maxRetriesPerRequest: null })
  : null;

const inboxQueue = useRedis ? new Queue('webstackpro-inbox', { connection }) : null;

/**
 * Enqueue an inbound message for AI processing.
 * With Redis: pushed to BullMQ. Without Redis: processed inline (fire & forget).
 */
async function addInboxJob(payload) {
  if (useRedis) {
    return inboxQueue.add('process-message', payload, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
      removeOnComplete: true,
    });
  }

  // No Redis available -> run the WebStackPro AI pipeline inline.
  console.log('WebStackPro: processing message inline (no Redis configured)');
  const { processInboundMessage } = require('./processor');
  processInboundMessage(payload).catch((e) =>
    console.error('WebStackPro inline processing failed:', e.message)
  );
  return { id: 'inline', inline: true };
}

module.exports = { inboxQueue, addInboxJob, connection, useRedis };
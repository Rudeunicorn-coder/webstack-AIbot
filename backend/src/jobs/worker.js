// ============================================================================
// WebStackPro BullMQ Worker
// Consumes "webstackpro-inbox" jobs, runs the AI Agent, then delivers the reply
// back over the original channel (WhatsApp / Instagram / Messenger / Web).
// Run separately:  npm run worker
//
// When REDIS_URL is not set the API processes messages inline, so this worker
// is not needed (and will exit with a notice).
// ============================================================================

const { Worker } = require('bullmq');
const { connection, useRedis } = require('./queue');
const { processInboundMessage } = require('./processor');

async function run(job) {
  return processInboundMessage(job.data);
}

if (useRedis) {
  const worker = new Worker('webstackpro-inbox', run, {
    connection,
    concurrency: 5,
  });

  worker.on('completed', (job) => {
    console.log(`WebStackPro job ${job.id} done:`, job.returnvalue?.handledBy || 'handled');
  });

  worker.on('failed', (job, err) => {
    console.error(`WebStackPro job ${job?.id} failed:`, err.message);
  });

  console.log('WebStackPro AI worker started (Redis). Listening for inbox jobs...');
} else {
  console.log(
    'WebStackPro: REDIS_URL not set — AI runs inline in the API process. Worker not needed.'
  );
  process.exit(0);
}
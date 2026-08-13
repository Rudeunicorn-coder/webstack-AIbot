// ============================================================================
// WebStackPro API Server
// Express + Socket.io + BullMQ entrypoint.
// ============================================================================

require('dotenv').config();

const fs = require('fs');
const path = require('path');

// Ensure the knowledge-upload directory exists (Render's FS is ephemeral).
const uploadDir = path.join(__dirname, '..', '..', 'uploads');
fs.mkdirSync(uploadDir, { recursive: true });

const express = require('express');
const cors = require('cors');
const http = require('http');
const prisma = require('./lib/prisma');
const { initSocket } = require('./lib/socket');
const { inboxQueue, useRedis } = require('./jobs/queue');

const queueName = inboxQueue ? inboxQueue.name : 'inline (no Redis)';

// WebStackPro route groups
const webhooksRouter = require('./routes/webhooks');
const inboxRouter = require('./routes/inbox');
const knowledgeRouter = require('./routes/knowledge');
const billingRouter = require('./routes/billing');
const settingsRouter = require('./routes/settings');

const app = express();
const server = http.createServer(app);

// Realtime for the WebStackPro dashboard
initSocket(server, process.env.FRONTEND_URL || 'http://localhost:3000');

// CORS: allow the configured frontend(s). FRONTEND_URL may be a comma-separated list.
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:3000')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      return callback(null, false);
    },
    credentials: true,
  })
);

// The website widget is embeddable on ANY customer site, so its public
// endpoints must reflect whatever origin the page is served from. This
// override runs after the restricted CORS above, so it wins for widget paths.
app.use('/api/webhooks/webwidget', cors({ origin: true }));

// Paystack webhook + Meta webhooks need the raw body for signature verification,
// so parse JSON but store the raw string for HMAC checking.
app.use(express.json({
  verify: (req, _res, buf) => {
    req.rawBody = buf.toString('utf8');
  },
}));

// Simple health check branded for WebStackPro
app.get('/api/health', (_req, res) => {
  res.json({ service: 'WebStackPro API', status: 'online', queue: queueName });
});

// WebStackPro mounts
app.use('/api/webhooks', webhooksRouter);
app.use('/api', settingsRouter); // must precede inboxRouter: /auth/exchange is public
app.use('/api', inboxRouter);
app.use('/api', knowledgeRouter);
app.use('/api', billingRouter);

// WebStackPro error handler
app.use((err, _req, res, _next) => {
  const status = err.status || 500;
  console.error('WebStackPro API error:', err.message);
  if (status >= 500) console.error(err);
  res.status(status).json({
    error: status >= 500 ? 'WebStackPro internal error' : err.message || 'WebStackPro error',
  });
});

const PORT = Number(process.env.PORT || 4000);
server.listen(PORT, () => {
  console.log(`WebStackPro API listening on http://localhost:${PORT}`);
  console.log(`WebStackPro queue: ${queueName}${useRedis ? '' : ' (Redis optional — inline mode)'}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  if (inboxQueue) await inboxQueue.close();
  await prisma.$disconnect();
  server.close(() => process.exit(0));
});

// Keep the API alive on transient failures (e.g. a DB hiccup during a widget
// poll). Without these listeners, Node >=15 crashes the whole process on an
// unhandled rejection or exception.
process.on('unhandledRejection', (reason) => {
  console.error('WebStackPro unhandledRejection:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('WebStackPro uncaughtException:', err.message);
});

module.exports = { app, server, prisma };
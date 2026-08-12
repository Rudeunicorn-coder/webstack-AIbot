// ============================================================================
// WebStackPro Inbox API
// Unified Inbox endpoints for the WebStackPro Dashboard:
//   GET  /conversations                  (with filter: status, channel, unread)
//   GET  /conversations/:id              (messages + contact + notes)
//   POST /conversations/:id/messages     (human agent reply)
//   POST /conversations/:id/takeover     ("Take Over for WebStackPro" button)
//   POST /conversations/:id/assign       (assign a WebStackPro agent)
//   POST /websocket-token                (join realtime room for the business)
// ============================================================================

const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { authRequired, resolveBusiness, signToken } = require('../middleware/auth');
const { dispatchReply } = require('../lib/inbox');
const { emitNewMessage } = require('../lib/socket');

router.use(authRequired);

/** Resolve the WebStackPro business for the logged-in owner + attach user info. */
async function load(req, _res, next) {
  try {
    const business = await resolveBusiness(req.auth.ownerId, { name: req.auth.name });
    req.business = business;
    next();
  } catch (err) {
    next(err);
  }
}
router.use(load);

// ---------------------------------------------------------------------------
// GET /conversations
// ---------------------------------------------------------------------------
router.get('/conversations', async (req, res) => {
  const { status, channel, unread } = req.query;

  const where = { businessId: req.business.id };
  if (status && status !== 'all') where.status = status;
  if (channel && channel !== 'all') where.channel = channel;
  if (unread === 'true') where.unread = true;

  const conversations = await prisma.webStackProConversation.findMany({
    where,
    include: {
      contact: true,
      messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      business: { select: { name: true } },
    },
    orderBy: { lastMessageAt: 'desc' },
  });

  res.json({
    business: { id: req.business.id, name: req.business.name, plan: req.business.plan, planActive: req.business.planActive },
    conversations: conversations.map((c) => ({
      ...c,
      preview: c.messages[0]?.text || '',
    })),
  });
});

// ---------------------------------------------------------------------------
// GET /conversations/:id
// ---------------------------------------------------------------------------
router.get('/conversations/:id', async (req, res) => {
  const conversation = await prisma.webStackProConversation.findFirst({
    where: { id: req.params.id, businessId: req.business.id },
    include: {
      contact: { include: { tags: true } },
      messages: { orderBy: { createdAt: 'asc' } },
      notes: { orderBy: { createdAt: 'desc' } },
    },
  });
  if (!conversation) return res.status(404).json({ error: 'WebStackPro: conversation not found' });

  // Clear unread when opened.
  await prisma.webStackProConversation.update({
    where: { id: conversation.id },
    data: { unread: false },
  });

  const tags = await prisma.webStackProTag.findMany({ where: { businessId: req.business.id } });
  const agents = await prisma.webStackProAgent.findMany({ where: { businessId: req.business.id, active: true } });

  res.json({ conversation, tags, agents });
});

// ---------------------------------------------------------------------------
// POST /conversations/:id/messages   (human reply)
// ---------------------------------------------------------------------------
router.post('/conversations/:id/messages', async (req, res) => {
  const { text } = req.body || {};
  if (!text?.trim()) return res.status(400).json({ error: 'WebStackPro: message is required' });

  const conversation = await prisma.webStackProConversation.findFirst({
    where: { id: req.params.id, businessId: req.business.id },
  });
  if (!conversation) return res.status(404).json({ error: 'WebStackPro: conversation not found' });

  await prisma.webStackProMessage.create({
    data: {
      conversationId: conversation.id,
      role: 'human',
      text,
      channel: conversation.channel,
      meta: { author: req.auth.name || req.auth.ownerId },
    },
  });
  await prisma.webStackProConversation.update({
    where: { id: conversation.id },
    data: { status: 'human', updatedAt: new Date() },
  });

  // Push over the customer's channel if connected.
  const channelRecord = await prisma.webStackProChannel.findUnique({
    where: { businessId_type: { businessId: req.business.id, type: conversation.channel } },
  });
  if (conversation.channel !== 'web' && channelRecord?.connected) {
    await dispatchReply(conversation, text, channelRecord).catch((e) =>
      console.error('WebStackPro outbound failed:', e.message)
    );
  }

  res.json({ ok: true });
});

// ---------------------------------------------------------------------------
// POST /conversations/:id/takeover   ("Take Over for WebStackPro")
// ---------------------------------------------------------------------------
router.post('/conversations/:id/takeover', async (req, res) => {
  const conversation = await prisma.webStackProConversation.findFirst({
    where: { id: req.params.id, businessId: req.business.id },
  });
  if (!conversation) return res.status(404).json({ error: 'WebStackPro: conversation not found' });

  const updated = await prisma.webStackProConversation.update({
    where: { id: conversation.id },
    data: {
      status: 'human',
      assignedTo: req.auth.name || 'Agent',
      updatedAt: new Date(),
    },
  });

  await prisma.webStackProNote.create({
    data: {
      businessId: req.business.id,
      conversationId: conversation.id,
      author: req.auth.name || 'Agent',
      body: `${req.auth.name || 'Agent'} took over from WebStackPro AI`,
    },
  });

  res.json({ ok: true, conversation: updated });
});

// ---------------------------------------------------------------------------
// POST /conversations/:id/assign
// ---------------------------------------------------------------------------
router.post('/conversations/:id/assign', async (req, res) => {
  const { agentId } = req.body || {};
  const agent = await prisma.webStackProAgent.findFirst({
    where: { id: agentId, businessId: req.business.id },
  });
  if (!agent) return res.status(400).json({ error: 'WebStackPro: unknown agent' });

  const updated = await prisma.webStackProConversation.update({
    where: { id: req.params.id },
    data: { assignedTo: agent.name, status: 'human', updatedAt: new Date() },
  });

  res.json({ ok: true, conversation: updated });
});

// ---------------------------------------------------------------------------
// POST /conversations/:id/note
// ---------------------------------------------------------------------------
router.post('/conversations/:id/note', async (req, res) => {
  const { body } = req.body || {};
  if (!body?.trim()) return res.status(400).json({ error: 'WebStackPro: note is required' });

  const note = await prisma.webStackProNote.create({
    data: {
      businessId: req.business.id,
      conversationId: req.params.id,
      author: req.auth.name || 'Agent',
      body,
    },
  });
  res.json({ ok: true, note });
});

// ---------------------------------------------------------------------------
// POST /websocket-token
// ---------------------------------------------------------------------------
router.post('/websocket-token', (req, res) => {
  const token = signToken({ ownerId: req.auth.ownerId, businessId: req.business.id, name: req.auth.name });
  res.json({ token, businessId: req.business.id });
});

module.exports = router;
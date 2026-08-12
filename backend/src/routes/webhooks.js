// ============================================================================
// WebStackPro Webhooks Router
// Endpoints: /api/webhooks/whatsapp, /instagram, /messenger, /webwidget
// Each adapter normalizes the inbound event and pushes it into the unified
// WebStackPro inbox pipeline (saved with business_id).
// ============================================================================

const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { ingestMessage } = require('../lib/inbox');
const whatsapp = require('../adapters/whatsapp');
const instagram = require('../adapters/instagram');
const messenger = require('../adapters/messenger');

// ---------------------------------------------------------------------------
// Meta shared route: WhatsApp | Instagram | Messenger
// GET = subscribe verification.  POST = inbound event.
// ---------------------------------------------------------------------------
router.get(['/whatsapp', '/instagram', '/messenger'], (req, res) => {
  if (whatsapp.verifyWebhook(req.query)) {
    return res.status(200).send(req.query['hub.challenge']);
  }
  return res.status(403).send('WebStackPro: verification failed');
});

router.post('/whatsapp', async (req, res) => {
  try {
    const normalized = whatsapp.parseInbound(req.body);
    if (!normalized) return res.sendStatus(200); // echo/status event, ignore

    const business = await findBusinessByWhatsAppNumber(normalized.platform);
    if (!business) return res.sendStatus(200);

    await ingestMessage({ businessId: business.id, ...normalized });
    res.sendStatus(200);
  } catch (err) {
    console.error('WebStackPro WhatsApp webhook error:', err.message);
    res.sendStatus(200);
  }
});

router.post('/instagram', async (req, res) => {
  try {
    const normalized = instagram.parseInbound(req.body);
    if (!normalized) return res.sendStatus(200);

    // Resolve business by the page/entry id owning this installation.
    const business = await findBusinessByMetaId(normalized.platform || normalized.externalId);
    if (!business) return res.sendStatus(200);

    await ingestMessage({ businessId: business.id, ...normalized });
    res.sendStatus(200);
  } catch (err) {
    console.error('WebStackPro Instagram webhook error:', err.message);
    res.sendStatus(200);
  }
});

router.post('/messenger', async (req, res) => {
  try {
    const normalized = messenger.parseInbound(req.body);
    if (!normalized) return res.sendStatus(200);

    const business = await findBusinessByMetaId(normalized.platform || normalized.externalId);
    if (!business) return res.sendStatus(200);

    await ingestMessage({ businessId: business.id, ...normalized });
    res.sendStatus(200);
  } catch (err) {
    console.error('WebStackPro Messenger webhook error:', err.message);
    res.sendStatus(200);
  }
});

// ---------------------------------------------------------------------------
// WebStackPro Website Widget
// POST /api/webhooks/webwidget  { businessId, externalId, name, text }
// GET  /api/webhooks/webwidget/messages?businessId=&externalId=  (poll replies)
// ---------------------------------------------------------------------------
router.post('/webwidget', async (req, res) => {
  try {
    const { businessId, externalId, name, text } = req.body || {};
    if (!businessId || !text) {
      return res.status(400).json({ error: 'WebStackPro: businessId and text required' });
    }
    await ingestMessage({
      businessId,
      channel: 'web',
      externalId: externalId || `web-${Date.now()}`,
      name: name || 'Website Visitor',
      text,
    });
    res.json({ ok: true });
  } catch (err) {
    console.error('WebStackPro widget webhook error:', err.message);
    res.status(500).json({ error: 'WebStackPro: unable to save message' });
  }
});

// Widget polling: return all messages for a website thread so the widget can render replies.
router.get('/webwidget/messages', async (req, res) => {
  const { businessId, externalId } = req.query;
  if (!businessId || !externalId) {
    return res.status(400).json({ error: 'WebStackPro: businessId and externalId required' });
  }
  const threadKey = `${businessId}-web-${externalId}`;
  const conversation = await prisma.webStackProConversation.findUnique({
    where: { threadKey },
    select: {
      id: true,
      status: true,
      messages: {
        orderBy: { createdAt: 'asc' },
        select: { role: true, text: true, createdAt: true },
      },
    },
  });
  res.json({ conversation });
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
async function findBusinessByWhatsAppNumber(phoneNumberId) {
  if (!phoneNumberId) return null;
  const channels = await prisma.webStackProChannel.findMany({
    where: { type: 'whatsapp', connected: true },
  });
  for (const ch of channels) {
    const config = ch.config || {};
    if (String(config.phoneNumberId) === String(phoneNumberId)) {
      return prisma.webStackProBusiness.findUnique({ where: { id: ch.businessId } });
    }
  }
  return null;
}

async function findBusinessByMetaId(id) {
  if (!id) return null;
  const channels = await prisma.webStackProChannel.findMany({
    where: { type: { in: ['instagram', 'messenger'] }, connected: true },
  });
  for (const ch of channels) {
    const config = ch.config || {};
    if (String(config.pageId || config.igUserId) === String(id)) {
      return prisma.webStackProBusiness.findUnique({ where: { id: ch.businessId } });
    }
  }
  return null;
}

module.exports = router;
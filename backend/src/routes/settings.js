// ============================================================================
// WebStackPro Settings API
// Business info, channel connections, team management, analytics, auth exchange.
// ============================================================================

const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { authRequired, resolveBusiness, signToken } = require('../middleware/auth');
const { searchKnowledge } = require('../lib/pgvector');

// ---------------------------------------------------------------------------
// POST /auth/exchange   Supabase Auth token -> WebStackPro JWT + business
// Registered BEFORE authRequired so a new sign-in can obtain its JWT.
// ---------------------------------------------------------------------------
router.post('/auth/exchange', async (req, res) => {
  const { ownerId, email, name } = req.body || {};
  if (!ownerId) return res.status(400).json({ error: 'WebStackPro: ownerId required' });

  const business = await resolveBusiness(ownerId, { name: name || 'My WebStackPro Business' });

  const token = signToken({ ownerId, businessId: business.id, name: name || 'Agent', email });

  res.json({
    token,
    business: {
      id: business.id,
      name: business.name,
      plan: business.plan,
      planActive: business.planActive,
    },
  });
});

// All other /settings routes require a WebStackPro session.
router.use(authRequired);

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
// PATCH /settings/business
// ---------------------------------------------------------------------------
router.patch('/settings/business', async (req, res) => {
  const { name } = req.body || {};
  const business = await prisma.webStackProBusiness.update({
    where: { id: req.business.id },
    data: { name: name?.trim() || req.business.name },
  });
  res.json({ ok: true, business });
});

// ---------------------------------------------------------------------------
// GET /settings/channels
// Returns a public webhook URL per channel (paste into Meta/IG/Messenger),
// plus masked credential previews so keys never leave the server in full.
// ---------------------------------------------------------------------------
const CHANNEL_CREDENTIAL_FIELDS = {
  whatsapp: ['accessToken', 'phoneNumberId'],
  instagram: ['accessToken', 'igUserId'],
  messenger: ['accessToken', 'pageId'],
  web: [],
};

function maskConfig(type, config = {}) {
  const out = {};
  const src = config || {};
  for (const field of CHANNEL_CREDENTIAL_FIELDS[type] || []) {
    if (!(field in src)) continue;
    const raw = String(src[field]);
    out[field] = raw.length > 8 ? `${raw.slice(0, 4)}…${raw.slice(-4)}` : '••••••';
  }
  return out;
}

router.get('/settings/channels', async (req, res) => {
  const channels = await prisma.webStackProChannel.findMany({
    where: { businessId: req.business.id },
    orderBy: { type: 'asc' },
  });
  const embedScript = `<script src="${process.env.FRONTEND_URL || 'http://localhost:3000'}/webstackpro-widget.js" data-business="${req.business.id}" async></script>`;

  // Public webhook base for pasting into Meta / the widget.
  const base =
    process.env.API_PUBLIC_URL ||
    (process.env.RAILWAY_PUBLIC_DOMAIN ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` : null) ||
    process.env.FRONTEND_URL ||
    `http://localhost:${process.env.PORT || 4000}`;
  const webhookBase = base.replace(/\/+$/, '');

  res.json({
    channels: channels.map((c) => ({
      id: c.id,
      type: c.type,
      label: c.label,
      connected: c.connected,
      configMasked: maskConfig(c.type, c.config || {}),
      webhookUrl: c.type === 'web' ? null : `${webhookBase}/api/webhooks/${c.type}`,
    })),
    embeddingWebhookUrl: `${webhookBase}/api/webhooks/webwidget`,
    embedScript,
  });
});

// ---------------------------------------------------------------------------
// POST /settings/channels/connect  { type, config }
// config holds the real channel credentials:
//   whatsapp   -> { accessToken, phoneNumberId, verifyToken? }
//   instagram  -> { accessToken, igUserId }
//   messenger  -> { accessToken, pageId }
//   web        -> { } (no credentials)
// ---------------------------------------------------------------------------
router.post('/settings/channels/connect', async (req, res) => {
  const { type, config = {} } = req.body || {};
  const valid = ['whatsapp', 'instagram', 'messenger', 'web'];
  if (!valid.includes(type)) return res.status(400).json({ error: 'WebStackPro: invalid channel' });

  // Every channel except "web" needs real credentials to work. The client may
  // leave fields blank to keep stored secrets, so validate against merged config.
  const existing = await prisma.webStackProChannel.findUnique({
    where: { businessId_type: { businessId: req.business.id, type } },
  });
  const merged = { ...(existing?.config || {}) };
  for (const [k, v] of Object.entries(config)) {
    if (String(v || '').trim()) merged[k] = v; // blank keeps the stored secret
  }

  const requiredFields = CHANNEL_CREDENTIAL_FIELDS[type] || [];
  const missing = requiredFields.filter((f) => !String(merged[f] || '').trim());
  if (missing.length) {
    return res.status(400).json({
      error: `WebStackPro: missing ${missing.map((f) => `"${f}"`).join(', ')} for ${type}`,
    });
  }
  if (type === 'whatsapp' && !String(merged.phoneNumberId || '').match(/^\d+$/)) {
    return res.status(400).json({ error: 'WebStackPro: phoneNumberId must be digits only' });
  }

  const labels = {
    whatsapp: 'WhatsApp',
    instagram: 'Instagram',
    messenger: 'Messenger',
    web: 'Website Chat',
  };

  const channel = await prisma.webStackProChannel.upsert({
    where: { businessId_type: { businessId: req.business.id, type } },
    update: { config: merged, connected: true },
    create: {
      businessId: req.business.id,
      type,
      label: labels[type],
      config: merged,
      connected: true,
    },
  });

  res.json({ ok: true, channel });
});

// ---------------------------------------------------------------------------
// POST /settings/channels/disconnect { type }
// ---------------------------------------------------------------------------
router.post('/settings/channels/disconnect', async (req, res) => {
  const { type } = req.body || {};
  const channel = await prisma.webStackProChannel.update({
    where: { businessId_type: { businessId: req.business.id, type } },
    data: { connected: false, config: {} },
  });
  res.json({ ok: true, channel });
});

// ---------------------------------------------------------------------------
// WebStackPro Team Management
// ---------------------------------------------------------------------------
router.get('/settings/team', async (req, res) => {
  const agents = await prisma.webStackProAgent.findMany({
    where: { businessId: req.business.id },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ agents });
});

router.post('/settings/team', async (req, res) => {
  const { name, email, role } = req.body || {};
  if (!name || !email) return res.status(400).json({ error: 'WebStackPro: name and email required' });

  const agent = await prisma.webStackProAgent.upsert({
    where: { businessId_email: { businessId: req.business.id, email } },
    update: { name, role: role || 'agent', active: true },
    create: { businessId: req.business.id, name, email, role: role || 'agent' },
  });
  res.status(201).json({ ok: true, agent });
});

router.delete('/settings/team/:id', async (req, res) => {
  const agent = await prisma.webStackProAgent.findFirst({
    where: { id: req.params.id, businessId: req.business.id },
  });
  if (!agent) return res.status(404).json({ error: 'WebStackPro: agent not found' });
  if (agent.role === 'admin') return res.status(400).json({ error: 'WebStackPro: cannot remove the admin' });

  await prisma.webStackProAgent.delete({ where: { id: agent.id } });
  res.json({ ok: true });
});

// ---------------------------------------------------------------------------
// WebStackPro Analytics
// ---------------------------------------------------------------------------
router.get('/settings/analytics', async (req, res) => {
  const days = Number(req.query.days || 7);
  const since = new Date(Date.now() - days * 86400000);

  const [conversations, messages, aiReplies, humanReplies, channels, avgResponse] = await Promise.all([
    prisma.webStackProConversation.count({ where: { businessId: req.business.id, createdAt: { gte: since } } }),
    prisma.webStackProMessage.count({ where: { conversation: { businessId: req.business.id }, createdAt: { gte: since } } }),
    prisma.webStackProMessage.count({ where: { conversation: { businessId: req.business.id }, role: 'ai', createdAt: { gte: since } } }),
    prisma.webStackProMessage.count({ where: { conversation: { businessId: req.business.id }, role: 'human', createdAt: { gte: since } } }),
    prisma.webStackProChannel.findMany({ where: { businessId: req.business.id, connected: true }, select: { type: true } }),
    rapr(),
  ]);

  async function rapr() {
    const recent = await prisma.webStackProConversation.findMany({
      where: { businessId: req.business.id, lastMessageAt: { gte: since } },
      select: { lastMessageAt: true, createdAt: true },
    });
    const total = recent.reduce((acc, c) => acc + (c.lastMessageAt - c.createdAt), 0);
    return recent.length ? Math.round(total / recent.length / 60000) : 0;
  }

  res.json({
    days,
    conversations,
    messages,
    aiReplies,
    humanReplies,
    aiAutoResolveRate: messages ? Math.round((aiReplies / messages) * 100) : 0,
    connectedChannels: channels.map((c) => c.type),
    avgResponseMinutes: avgResponse,
  });
});

module.exports = router;
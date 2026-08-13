// ============================================================================
// WebStackPro Settings API
// Business info, channel connections, team management, analytics, auth exchange.
// ============================================================================

const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { authRequired, resolveBusiness, signToken } = require('../middleware/auth');
const { searchKnowledge } = require('../lib/pgvector');
const { ingestMessage } = require('../lib/inbox');

// ---------------------------------------------------------------------------
// POST /auth/exchange   Supabase Auth token -> WebStackPro JWT + business
// Registered BEFORE authRequired so a new sign-in can obtain its JWT.
// ---------------------------------------------------------------------------
router.post('/auth/exchange', async (req, res, next) => {
  try {
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
  } catch (err) {
    console.error('WebStackPro /auth/exchange error:', err);
    next(err);
  }
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
  const base =
    process.env.API_PUBLIC_URL ||
    (process.env.RAILWAY_PUBLIC_DOMAIN ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` : null) ||
    process.env.FRONTEND_URL ||
    `http://localhost:${process.env.PORT || 4000}`;
  const webhookBase = base.replace(/\/+$/, '');
  // The widget script lives on the frontend; the widget talks to the backend API.
  const frontendBase = (process.env.FRONTEND_URL || `http://localhost:${process.env.PORT || 3000}`).replace(/\/+$/, '');
  const embedScript = `<script src="${frontendBase}/webstackpro-widget.js" data-api="${webhookBase}" data-business="${req.business.id}" async></script>`;

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

// ---------------------------------------------------------------------------
// WebStackPro Website Widget branding + behaviour
// Stored in the `web` channel's config JSON (no schema change needed).
// GET  /settings/widget   -> current widget config
// PATCH /settings/widget  -> update name, greeting, colors, lead capture, hours
// ---------------------------------------------------------------------------
const DEFAULT_WIDGET_CONFIG = {
  name: 'Chat with us',
  greeting: 'Hi there! 👋 Welcome to our site. How can we help you today?',
  primaryColor: '#0A1F44',
  accentColor: '#00D4FF',
  showPoweredBy: true,
  collectLead: true,
  businessHours: {
    enabled: false,
    days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    open: '09:00',
    close: '17:00',
    timezone: 'Africa/Lagos',
    awayMessage: "Thanks for reaching out! We're currently away, but we'll get back to you as soon as we're back online.",
  },
};

function sanitizeWidgetConfig(input = {}) {
  const base = DEFAULT_WIDGET_CONFIG;
  const out = {
    name: typeof input.name === 'string' && input.name.trim() ? input.name.trim().slice(0, 60) : base.name,
    greeting: typeof input.greeting === 'string' && input.greeting.trim() ? input.greeting.trim().slice(0, 300) : base.greeting,
    primaryColor: /^#[0-9a-fA-F]{3,8}$/.test(input.primaryColor || '') ? input.primaryColor : base.primaryColor,
    accentColor: /^#[0-9a-fA-F]{3,8}$/.test(input.accentColor || '') ? input.accentColor : base.accentColor,
    showPoweredBy: typeof input.showPoweredBy === 'boolean' ? input.showPoweredBy : base.showPoweredBy,
    collectLead: typeof input.collectLead === 'boolean' ? input.collectLead : base.collectLead,
    businessHours: { ...base.businessHours, ...(input.businessHours || {}) },
  };
  if (typeof out.businessHours.enabled !== 'boolean') out.businessHours.enabled = base.businessHours.enabled;
  if (!Array.isArray(out.businessHours.days)) out.businessHours.days = base.businessHours.days;
  out.businessHours.days = out.businessHours.days.slice(0, 7);
  return out;
}

async function loadWebChannel(businessId) {
  return prisma.webStackProChannel.upsert({
    where: { businessId_type: { businessId, type: 'web' } },
    update: {},
    create: { businessId, type: 'web', label: 'Website Chat', config: DEFAULT_WIDGET_CONFIG, connected: true },
  });
}

router.get('/settings/widget', async (req, res) => {
  const channel = await loadWebChannel(req.business.id);
  res.json({ config: sanitizeWidgetConfig(channel.config || {}) });
});

router.patch('/settings/widget', async (req, res) => {
  const merged = sanitizeWidgetConfig({ ...(await loadWebChannel(req.business.id)).config, ...(req.body || {}) });
  const channel = await prisma.webStackProChannel.update({
    where: { businessId_type: { businessId: req.business.id, type: 'web' } },
    data: { config: merged, connected: true },
  });
  res.json({ ok: true, config: sanitizeWidgetConfig(channel.config || {}) });
});

// ---------------------------------------------------------------------------
// WebStackPro Canned Responses (saved quick replies for human agents)
// ---------------------------------------------------------------------------
router.get('/settings/canned', async (req, res) => {
  const canned = await prisma.webStackProCannedReply.findMany({
    where: { businessId: req.business.id },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ canned });
});

router.post('/settings/canned', async (req, res) => {
  const { title, body } = req.body || {};
  if (!title?.trim() || !body?.trim()) {
    return res.status(400).json({ error: 'WebStackPro: title and body required' });
  }
  const reply = await prisma.webStackProCannedReply.create({
    data: { businessId: req.business.id, title: title.trim(), body: body.trim() },
  });
  res.status(201).json({ ok: true, canned: reply });
});

router.delete('/settings/canned/:id', async (req, res) => {
  const reply = await prisma.webStackProCannedReply.findFirst({
    where: { id: req.params.id, businessId: req.business.id },
  });
  if (!reply) return res.status(404).json({ error: 'WebStackPro: canned reply not found' });
  await prisma.webStackProCannedReply.delete({ where: { id: reply.id } });
  res.json({ ok: true });
});

// ---------------------------------------------------------------------------
// WebStackPro Tags (label contacts for filtering + follow-up)
// ---------------------------------------------------------------------------
router.get('/settings/tags', async (req, res) => {
  const tags = await prisma.webStackProTag.findMany({
    where: { businessId: req.business.id },
    orderBy: { createdAt: 'asc' },
  });
  res.json({ tags });
});

router.post('/settings/tags', async (req, res) => {
  const { name, color } = req.body || {};
  if (!name?.trim()) return res.status(400).json({ error: 'WebStackPro: tag name required' });
  const tag = await prisma.webStackProTag.upsert({
    where: { businessId_name: { businessId: req.business.id, name: name.trim() } },
    update: { color: color || '#00D4FF' },
    create: { businessId: req.business.id, name: name.trim(), color: color || '#00D4FF' },
  });
  res.status(201).json({ ok: true, tag });
});

router.delete('/settings/tags/:id', async (req, res) => {
  const tag = await prisma.webStackProTag.findFirst({
    where: { id: req.params.id, businessId: req.business.id },
  });
  if (!tag) return res.status(404).json({ error: 'WebStackPro: tag not found' });
  await prisma.webStackProTag.delete({ where: { id: tag.id } });
  res.json({ ok: true });
});

// ---------------------------------------------------------------------------
// WebStackPro Test Message Simulator
// Sends a message through the full pipeline (inbox -> AI -> reply) so the
// owner can verify the agent works end-to-end without a real customer.
// ---------------------------------------------------------------------------
router.post('/settings/test-message', async (req, res) => {
  const { text, name } = req.body || {};
  if (!text?.trim()) return res.status(400).json({ error: 'WebStackPro: message required' });

  const externalId = `test-${Date.now()}-${Math.floor(Math.random() * 99999)}`;
  const { conversation } = await ingestMessage({
    businessId: req.business.id,
    channel: 'web',
    externalId,
    name: name || 'Test Customer',
    text: text.trim(),
  });

  res.status(201).json({ ok: true, conversationId: conversation.id, externalId });
});

module.exports = router;
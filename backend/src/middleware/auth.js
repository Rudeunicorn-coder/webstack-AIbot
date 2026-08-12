// ============================================================================
// WebStackPro Auth Helpers
// JWT session creation + verification + Express middleware.
// The frontend receives its JWT after Supabase Auth, then calls /api/auth/exchange.
// ============================================================================

const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');

const SECRET = process.env.JWT_SECRET || 'webstackpro-dev-secret';

function signToken(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
}

/**
 * Get or create the WebStackPro Business for a user.
 * Aliased: a "WebStackPro Business" == one customer using the Agent.
 */
async function resolveBusiness(ownerId, defaults = {}) {
  let business = await prisma.webStackProBusiness.findUnique({
    where: { ownerId },
    include: { channels: true },
  });
  if (!business) {
    const trialDecay = Number(process.env.TRIAL_DAYS || 14) * 86400000;
    business = await prisma.webStackProBusiness.create({
      data: {
        ownerId,
        name: defaults.name || 'My WebStackPro Business',
        plan: 'trial',
        planActive: true,
        trialEnds: new Date(Date.now() + trialDecay),
        channels: {
          create: [
            { type: 'whatsapp', label: 'WhatsApp' },
            { type: 'instagram', label: 'Instagram' },
            { type: 'messenger', label: 'Messenger' },
            { type: 'web', label: 'Website Chat' },
          ],
        },
      },
      include: { channels: true },
    });
  }
  return business;
}

function authRequired(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'WebStackPro: sign in first' });
  try {
    req.auth = jwt.verify(token, SECRET);
    next();
  } catch (_) {
    return res.status(401).json({ error: 'WebStackPro: session expired, sign in again' });
  }
}

module.exports = { signToken, resolveBusiness, authRequired };
// ============================================================================
// WebStackPro Billing (Paystack Subscriptions)
//   POST /billing/subscribe  -> create Paystack transaction (pay once /3 months)
//   POST /billing/webhook    -> Paystack verify + activate/deactivate account
//   GET  /billing/status     -> current WebStackPro plan status
// ============================================================================

const express = require('express');
const crypto = require('crypto');
const axios = require('axios');
const router = express.Router();
const prisma = require('../lib/prisma');
const { authRequired, resolveBusiness } = require('../middleware/auth');

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY || '';
const PAYSTACK_PUBLIC = process.env.PAYSTACK_PUBLIC_KEY || '';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || 'webstackpro-webhook-secret-change-me';

const PLANS = {
  starter: { naira: Number(process.env.PLAN_STARTER_PRICE_NAIRA || 50000), label: 'WebStackPro Starter' },
  pro: { naira: Number(process.env.PLAN_PRO_PRICE_NAIRA || 120000), label: 'WebStackPro Pro' },
};

/** Validate signature: x-webstackpro-signature header = HMAC-SHA256(secret, body) */
function validateWebhookSig(req) {
  const signature = req.headers['x-webstackpro-signature'];
  if (!signature) return false;
  // Prefer the exact raw request body for byte-perfect HMAC verification.
  const body = req.rawBody || JSON.stringify(req.body);
  const expected = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(body)
    .digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

// ---------------------------------------------------------------------------
// POST /billing/webhook   (Paystack → WebStackPro)
// Registered BEFORE authRequired so Paystack can reach it without a JWT.
// ---------------------------------------------------------------------------
router.post('/billing/webhook', async (req, res) => {
  if (!validateWebhookSig(req)) {
    return res.status(401).json({ error: 'WebStackPro: invalid webhook signature' });
  }

  const { event, data } = req.body || {};
  const metadata = data?.metadata || {};

  if (event === 'charge.success' || event === 'subscription.create') {
    const business = await prisma.webStackProBusiness.findUnique({
      where: { id: metadata.businessId },
    });
    if (!business) return res.json({ received: true });

    // Activate the WebStackPro account.
    await prisma.webStackProBusiness.update({
      where: { id: business.id },
      data: { plan: metadata.plan || 'starter', planActive: true },
    });
    await prisma.webStackProSubscription.updateMany({
      where: { reference: data.reference || '' },
      data: { status: 'active', paystackSubId: data.subscription_code || data.id || '' },
    });
    console.log(`WebStackPro activated: ${business.id} (${metadata.plan})`);
  }

  if (event === 'charge.dispute.remind' || event === 'subscription.disable' || event === 'invoice.payment_failed') {
    const business = await prisma.webStackProBusiness.findUnique({
      where: { id: metadata.businessId },
    });
    if (business) {
      await prisma.webStackProBusiness.update({
        where: { id: business.id },
        data: { planActive: false },
      });
      console.log(`WebStackPro deactivated: ${business.id}`);
    }
  }

  res.json({ received: true });
});

// All other /billing routes require a WebStackPro session.
router.use(authRequired);

// ---------------------------------------------------------------------------
// GET /billing/status
// ---------------------------------------------------------------------------
router.get('/billing/status', async (req, res) => {
  const business = await resolveBusiness(req.auth.ownerId, { name: req.auth.name });
  const sub = await prisma.webStackProSubscription.findFirst({
    where: { businessId: business.id, status: 'active' },
    orderBy: { createdAt: 'desc' },
  });

  res.json({
    plan: business.plan,
    planActive: business.planActive,
    trialEnds: business.trialEnds,
    subscription: sub,
    paystackPublicKey: PAYSTACK_PUBLIC,
    plans: PLANS,
  });
});

// ---------------------------------------------------------------------------
// POST /billing/subscribe { plan }
// ---------------------------------------------------------------------------
router.post('/billing/subscribe', async (req, res) => {
  const { plan } = req.body || {};
  const selected = PLANS[plan];
  if (!selected) return res.status(400).json({ error: 'WebStackPro: choose starter or pro' });

  const business = await resolveBusiness(req.auth.ownerId, { name: req.auth.name });

  const reference = `webstackpro_${business.id}_${Date.now()}`;

  // Paystack transaction. Amount in kobo (naira * 100).
  const { data } = await axios.post(
    'https://api.paystack.co/transaction/initialize',
    {
      email: req.auth.email || 'customer@webstackpro.demo',
      amount: selected.naira * 100,
      plan: undefined,
      reference,
      metadata: {
        businessId: business.id,
        plan,
        cancel_action: `${FRONTEND_URL}/dashboard/settings`,
      },
      callback_url: `${FRONTEND_URL}/dashboard/settings?paystack=success`,
    },
    { headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` } }
  );

  await prisma.webStackProSubscription.create({
    data: {
      businessId: business.id,
      plan,
      reference,
      email: req.auth.email || 'customer@webstackpro.demo',
      amount: selected.naira * 100,
      status: 'pending',
    },
  });

  res.json({ authorization_url: data.data.authorization_url, reference });
});

module.exports = router;
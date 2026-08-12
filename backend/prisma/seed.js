// ============================================================================
// WebStackPro Seed Script
// Seeds a "Demo WebStackPro Business" with conversations, knowledge base,
// agents, tags and a full sample inbox so the dashboard works immediately.
//
// Run:  npm run seed
// ============================================================================

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function ensureVectorExtension() {
  try {
    await prisma.$executeRawUnsafe('CREATE EXTENSION IF NOT EXISTS vector;');
    console.log('  [pgvector] extension ensured');
  } catch (err) {
    console.log('  [pgvector] skipped (run manually if missing):', err.message);
  }
}

async function main() {
  console.log('==============================');
  console.log('WebStackPro Seeder');
  console.log('==============================');

  await ensureVectorExtension();

  // --- WebStackPro Demo Business -------------------------------------------------
  const demoOwnerId = process.env.DEMO_OWNER_ID || 'demo-owner-webstackpro';

  const business = await prisma.webStackProBusiness.upsert({
    where: { ownerId: demoOwnerId },
    update: { name: 'Demo WebStackPro Business', plan: 'pro', planActive: true },
    create: {
      name: 'Demo WebStackPro Business',
      ownerId: demoOwnerId,
      plan: 'pro',
      planActive: true,
      trialEnds: new Date(Date.now() + 14 * 86400000),
    },
  });
  console.log(`  Business: ${business.name} (${business.id})`);

  // --- WebStackPro Knowledge Base -------------------------------------------------
  const sampleKnowledge = [
    {
      title: 'Delivery in Owerri',
      content:
        'Q: What is WebStackPro delivery time in Owerri?\nA: WebStackPro customers get 24-48 hours delivery within Owerri.',
    },
    {
      title: 'WebStackPro Billing',
      content:
        'Q: How does WebStackPro billing work?\nA: WebStackPro Starter is \u20a650,000/mo. Pro is \u20a6120,000/mo. Billed securely via Paystack.',
    },
    {
      title: 'Store Hours',
      content:
        'Q: What are your hours?\nA: We operate Monday to Saturday, 8am to 8pm. Our WebStackPro AI answers your messages 24/7.',
    },
    {
      title: 'Free Trial',
      content:
        'Q: Do you have a free trial?\nA: Yes! New WebStackPro customers get a free 14-day trial on the Starter plan. No card required.',
    },
    {
      title: 'Payment Methods',
      content:
        'Q: How do I pay?\nA: We accept card payments via Paystack and bank transfer. All major Nigerian banks supported.',
    },
  ];

  for (const item of sampleKnowledge) {
    await prisma.webStackProKnowledge.upsert({
      where: {
        id: `demo-knowledge-${item.title.replace(/\s+/g, '-').toLowerCase()}`,
      },
      update: { content: item.content },
      create: {
        id: `demo-knowledge-${item.title.replace(/\s+/g, '-').toLowerCase()}`,
        businessId: business.id,
        title: item.title,
        content: item.content,
        source: 'manual',
      },
    });
  }
  console.log('  Knowledge base: 5 entries seeded');

  // --- WebStackPro Agent Team ------------------------------------------------------
  const agents = await Promise.all([
    prisma.webStackProAgent.upsert({
      where: { businessId_email: { businessId: business.id, email: 'chioma@webstackpro.demo' } },
      update: {},
      create: {
        businessId: business.id,
        name: 'Chioma Okafor',
        email: 'chioma@webstackpro.demo',
        role: 'admin',
      },
    }),
    prisma.webStackProAgent.upsert({
      where: { businessId_email: { businessId: business.id, email: 'emeka@webstackpro.demo' } },
      update: {},
      create: {
        businessId: business.id,
        name: 'Emeka Nwosu',
        email: 'emeka@webstackpro.demo',
        role: 'agent',
      },
    }),
  ]);
  console.log(`  Agents: ${agents.length} seeded`);

  // --- WebStackPro Channels ----------------------------------------------------------
  const channels = ['whatsapp', 'instagram', 'messenger', 'web'];
  for (const type of channels) {
    await prisma.webStackProChannel.upsert({
      where: { businessId_type: { businessId: business.id, type } },
      update: { connected: true },
      create: {
        businessId: business.id,
        type,
        label: `Demo ${type.charAt(0).toUpperCase() + type.slice(1)}`,
        connected: true,
      },
    });
  }
  console.log('  Channels: whatsapp, instagram, messenger, web connected');

  // --- WebStackPro Contacts & Conversations --------------------------------------------
  const contacts = [
    { name: 'Adaeze Obi', channel: 'whatsapp', externalId: 'wa-1001', phone: '+2348031234567' },
    { name: 'Tunde Bakare', channel: 'instagram', externalId: 'ig-2002', phone: null },
    { name: 'Ngozi Uche', channel: 'messenger', externalId: 'msg-3003', phone: null },
    { name: 'Blessing Eze', channel: 'web', externalId: 'web-4004', phone: null },
    { name: 'Chinedu Onu', channel: 'whatsapp', externalId: 'wa-1005', phone: '+2347069876543' },
  ];

  const messagesByContact = {
    'wa-1001': [
      { role: 'user', text: 'Good morning! Nna, how much for your Samsung phone? I saw it on Instagram.' },
      { role: 'ai', text: 'Good morning Adaeze! The Samsung goes for \u20a6820,000. We deliver anywhere in Owerri within 24-48 hours. Ready to order?' },
      { role: 'user', text: 'Yes o! Do you accept transfer?' },
    ],
    'ig-2002': [
      { role: 'user', text: 'Please do you still have the blue sneakers in size 42?' },
      { role: 'ai', text: 'Yes! Size 42 is available. It\u2019s \u20a642,500. Should I reserve it for you?' },
    ],
    'msg-3003': [
      { role: 'user', text: 'How long does delivery take for items to Aba Road?' },
      { role: 'ai', text: 'No wahala \u2014 deliveries to Aba Road take 24-48 hours via our WebStackPro dispatch. Want me to check stock?' },
      { role: 'user', text: 'Hmm, I actually need it today. Can you help me speak to an agent?' },
      { role: 'human', text: 'Hello Ngozi! This is Chioma from the team. I can arrange express dispatch today for a small fee. Give me a moment please.' },
    ],
    'web-4004': [
      { role: 'user', text: 'Hello, I filled the order form on your website. Any update?' },
      { role: 'ai', text: 'Welcome! Let me check your order status. One moment please.' },
    ],
    'wa-1005': [
      { role: 'user', text: 'What is your return policy?' },
      { role: 'ai', text: 'You can return any item within 7 days in original condition. Which product are you asking about?' },
    ],
  };

  const statusByContact = {
    'wa-1001': 'ai',
    'ig-2002': 'ai',
    'msg-3003': 'human',
    'web-4004': 'ai',
    'wa-1005': 'ai',
  };

  const tags = await Promise.all([
    prisma.webStackProTag.upsert({
      where: { businessId_name: { businessId: business.id, name: 'VIP' } },
      update: {},
      create: { businessId: business.id, name: 'VIP', color: '#F59E0B' },
    }),
    prisma.webStackProTag.upsert({
      where: { businessId_name: { businessId: business.id, name: 'Awaiting Reply' } },
      update: {},
      create: { businessId: business.id, name: 'Awaiting Reply', color: '#00D4FF' },
    }),
  ]);

  for (const c of contacts) {
    const contact = await prisma.webStackProContact.upsert({
      where: { businessId_externalId: { businessId: business.id, externalId: c.externalId } },
      update: { name: c.name },
      create: { ...c, businessId: business.id },
    });

    const conversation = await prisma.webStackProConversation.upsert({
      where: { threadKey: `${business.id}-${c.channel}-${c.externalId}` },
      update: {},
      create: {
        businessId: business.id,
        contactId: contact.id,
        channel: c.channel,
        status: statusByContact[c.externalId],
        assignedTo: statusByContact[c.externalId] === 'human' ? 'Chioma Okafor' : null,
        unread: statusByContact[c.externalId] === 'ai',
        threadKey: `${business.id}-${c.channel}-${c.externalId}`,
      },
    });

    for (let i = 0; i < messagesByContact[c.externalId].length; i++) {
      const m = messagesByContact[c.externalId][i];
      await prisma.webStackProMessage.upsert({
        where: { id: `demo-msg-${c.externalId}-${i}` },
        update: {},
        create: {
          id: `demo-msg-${c.externalId}-${i}`,
          conversationId: conversation.id,
          role: m.role,
          text: m.text,
          channel: c.channel,
        },
      });
    }

    // Attach tags to VIP/Awaiting contacts
    if (c.externalId === 'wa-1001' || c.externalId === 'wa-1005') {
      await prisma.webStackProContact.update({
        where: { id: contact.id },
        data: { tags: { connect: [{ id: tags[0].id }] } },
      });
    }
    if (statusByContact[c.externalId] === 'human') {
      await prisma.webStackProContact.update({
        where: { id: contact.id },
        data: { tags: { connect: [{ id: tags[1].id }] } },
      });
    }
  }
  console.log('  Conversations: 5 seeded with messages');

  console.log('==============================');
  console.log('WebStackPro seed complete.');
  console.log('Login on /dashboard with Supabase Auth to see the demo inbox.');
  console.log('==============================');
}

main()
  .catch((e) => {
    console.error('WebStackPro seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
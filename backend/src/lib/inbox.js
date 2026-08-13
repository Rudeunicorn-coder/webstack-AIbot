// ============================================================================
// WebStackPro Inbox Service
// Shared pipeline for every channel: ingest -> save -> AI -> realtime -> send.
// WhatsApp, Instagram, Messenger webhooks and the Website widget all land here,
// so every customer message shows up in one WebStackPro dashboard.
// ============================================================================

const prisma = require('./prisma');
const { handleIncomingMessage } = require('./ai');
const { emitNewMessage } = require('./socket');
const { addInboxJob } = require('../jobs/queue');

const SENDERS = {
  whatsapp: require('../adapters/whatsapp'),
  instagram: require('../adapters/instagram'),
  messenger: require('../adapters/messenger'),
};

/**
 * Ingest an inbound message from any channel.
 * - resolves the WebStackPro business via the channel type + credentials
 * - finds or creates the contact and conversation
 * - saves the WebStackProMessage row
 * - enqueues the AI/handoff work on BullMQ
 */
async function ingestMessage({ businessId, channel, externalId, name, email, text }) {
  if (!businessId || !text) {
    throw new Error('WebStackPro ingest requires businessId and text');
  }

  // WebStackPro Contact (dedupe by business + external id)
  let contact = await prisma.webStackProContact.findUnique({
    where: { businessId_externalId: { businessId, externalId: String(externalId) } },
  });
  if (!contact) {
    contact = await prisma.webStackProContact.create({
      data: {
        businessId,
        channel,
        externalId: String(externalId),
        name: name || 'Customer',
        email: email || null,
      },
    });
  } else {
    // Lead capture: keep the contact name/email in sync as the visitor provides them.
    const patch = {};
    if (name && name !== 'Website Visitor' && name !== 'Customer' && name !== contact.name) patch.name = name;
    if (email && email !== contact.email) patch.email = email;
    if (Object.keys(patch).length) {
      contact = await prisma.webStackProContact.update({ where: { id: contact.id }, data: patch });
    }
  }

  // WebStackPro Conversation keyed by business+channel+contact
  const threadKey = `${businessId}-${channel}-${externalId}`;
  let conversation = await prisma.webStackProConversation.findUnique({
    where: { threadKey },
  });
  if (!conversation) {
    conversation = await prisma.webStackProConversation.create({
      data: {
        businessId,
        contactId: contact.id,
        channel,
        status: 'ai',
        threadKey,
      },
    });
  }

  // Save the incoming WebStackProMessage
  const message = await prisma.webStackProMessage.create({
    data: {
      conversationId: conversation.id,
      role: 'user',
      text,
      channel,
    },
  });

  // Mark conversation unread + bump lastMessageAt.
  // A customer reply to a resolved chat reopens it for the AI/agents.
  const reopen = conversation.status === 'resolved';
  if (reopen) {
    conversation = await prisma.webStackProConversation.update({
      where: { id: conversation.id },
      data: { status: 'ai', unread: true, lastMessageAt: new Date() },
    });
  } else {
    await prisma.webStackProConversation.update({
      where: { id: conversation.id },
      data: { unread: true, lastMessageAt: new Date() },
    });
  }

  // Real-time toast for dashboard: "New message on WebStackPro"
  emitNewMessage(businessId, {
    conversationId: conversation.id,
    channel,
    text: text.slice(0, 120),
    contactName: contact.name,
  });

  // Queue the WebStackPro AI Agent work.
  await addInboxJob({
    businessId,
    conversationId: conversation.id,
    messageId: message.id,
  });

  return { contact, conversation, message };
}

/**
 * Send an outbound message back over the correct channel.
 * Chose NOT to save here — callers save the WebStackProMessage row first, then
 * use this to push it outward so the customer sees "Powered by WebStackPro AI".
 */
async function dispatchReply(conversation, text, channelRecord) {
  const sender = SENDERS[conversation.channel];
  if (!sender) {
    // Website chat has no outbound push (widget polls the inbox endpoint).
    return { delivered: true, channel: 'web' };
  }

  const recipientExternalId = conversation.threadKey.split('-').pop();
  await sender.sendReply(channelRecord, recipientExternalId, text);
  return { delivered: true, channel: conversation.channel };
}

module.exports = { ingestMessage, dispatchReply };
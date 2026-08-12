// ============================================================================
// WebStackPro Message Processor
// The actual inbound-message pipeline (load -> AI Agent -> deliver reply).
// Shared by the BullMQ worker AND the inline fallback (when Redis is absent),
// so the WebStackPro app works for local testing without a Redis server.
// ============================================================================

const prisma = require('../lib/prisma');
const { handleIncomingMessage } = require('../lib/ai');
const { dispatchReply } = require('../lib/inbox');

async function processInboundMessage({ businessId, conversationId, messageId }) {
  const business = await prisma.webStackProBusiness.findUnique({
    where: { id: businessId },
  });
  if (!business) throw new Error('WebStackPro business not found');

  const conversation = await prisma.webStackProConversation.findUnique({
    where: { id: conversationId },
  });
  if (!conversation) throw new Error('WebStackPro conversation not found');

  const message = await prisma.webStackProMessage.findUnique({
    where: { id: messageId },
  });
  if (!message) throw new Error('WebStackPro message not found');

  // Run the WebStackPro AI Agent core flow.
  const result = await handleIncomingMessage({ conversation, message, business });

  // Confident AI reply -> push back over the customer's channel.
  if (result.handledBy === 'ai' && result.reply) {
    const channelRecord = await prisma.webStackProChannel.findUnique({
      where: { businessId_type: { businessId, type: conversation.channel } },
    });
    if (conversation.channel !== 'web' && channelRecord?.connected) {
      await dispatchReply(conversation, result.reply, channelRecord);
    }
  }

  return result;
}

module.exports = { processInboundMessage };
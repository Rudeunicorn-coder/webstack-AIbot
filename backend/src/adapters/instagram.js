// ============================================================================
// WebStackPro Instagram Direct Adapter (Meta Graph API)
// Instagram DM webhook + send replies via Graph API message routes.
// ============================================================================

const axios = require('axios');

function buildConfigFromChannel(channel) {
  const config = (channel && channel.config) || {};
  return {
    accessToken: config.accessToken || process.env.INSTAGRAM_ACCESS_TOKEN,
    igUserId: config.igUserId || config.pageId || null,
  };
}

/**
 * Normalize an Instagram DM payload (Meta webhook) for the WebStackPro inbox.
 * Events: "messages" nested under messaging events when subscribed via
 * instagram_messaging_account. Config: instagram_messaging_product.
 */
function parseInbound(body) {
  const entry = body?.entry?.[0];
  const event = entry?.messaging?.[0];
  if (!event) return null;

  return {
    channel: 'instagram',
    externalId: String(event.sender?.id),
    name: event.sender?.name || `Instagram User ${String(event.sender?.id || '').slice(-4)}`,
    text: event.message?.text || '[Photo/Reel sent on WebStackPro Instagram]',
    platform: entry?.id,
  };
}

async function sendReply(channelRecord, recipientId, text) {
  const { accessToken, igUserId } = buildConfigFromChannel(channelRecord);
  if (!accessToken || !igUserId) {
    throw new Error('WebStackPro Instagram not connected (missing credentials)');
  }
  const url = `https://graph.facebook.com/v19.0/${igUserId}/messages`;
  await axios.post(
    url,
    {
      recipient: { id: recipientId },
      messaging_type: 'RESPONSE',
      message: { text },
    },
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
}

module.exports = { parseInbound, sendReply };
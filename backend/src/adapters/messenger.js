// ============================================================================
// WebStackPro Messenger Adapter (Meta Graph API)
// Facebook Messenger webhook and reply sender.
// ============================================================================

const axios = require('axios');

function buildConfigFromChannel(channel) {
  const config = (channel && channel.config) || {};
  return {
    accessToken: config.accessToken || process.env.MESSENGER_ACCESS_TOKEN,
    pageId: config.pageId || process.env.MESSENGER_PAGE_ID,
  };
}

function parseInbound(body) {
  const entry = body?.entry?.[0];
  const event = entry?.messaging?.[0];
  if (!event || !event.message) return null;

  return {
    channel: 'messenger',
    externalId: String(event.sender?.id),
    name: `Messenger User ${String(event.sender?.id || '').slice(-4)}`,
    text: event.message.text || '[Media sent on WebStackPro Messenger]',
    platform: entry?.id,
  };
}

async function sendReply(channelRecord, recipientId, text) {
  const { accessToken } = buildConfigFromChannel(channelRecord);
  if (!accessToken) {
    throw new Error('WebStackPro Messenger not connected (missing credentials)');
  }
  const url = `https://graph.facebook.com/v19.0/me/messages`;
  await axios.post(
    url,
    {
      access_token: accessToken,
      recipient: { id: recipientId },
      message: { text },
    }
  );
}

module.exports = { parseInbound, sendReply };
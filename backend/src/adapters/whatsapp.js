// ============================================================================
// WebStackPro WhatsApp Adapter (Meta Cloud API)
// Receives webhook events and sends reply messages.
// ============================================================================

const axios = require('axios');
const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'webstackpro_verify';

function buildConfigFromChannel(channel) {
  const config = (channel && channel.config) || {};
  return {
    accessToken: config.accessToken || process.env.WHATSAPP_ACCESS_TOKEN,
    phoneNumberId: config.phoneNumberId || process.env.WHATSAPP_PHONE_NUMBER_ID,
  };
}

/**
 * Holds verification for Meta: ?hub.mode=subscribe&hub.verify_token=...
 * Returns true if the WebStackPro verify token matches.
 */
function verifyWebhook(query) {
  return (
    query['hub.mode'] === 'subscribe' && query['hub.verify_token'] === VERIFY_TOKEN
  );
}

/**
 * Normalize a WhatsApp inbound payload into { externalId, name, text, channel }.
 */
function parseInbound(body) {
  const entry = body?.entry?.[0];
  const change = entry?.changes?.[0]?.value;
  const contact = change?.contacts?.[0] || {};
  const message = change?.messages?.[0];

  if (!message) return null;

  const text =
    message.type === 'text'
      ? message.text?.body
      : message.type === 'image'
      ? '[📷 Image shared on WebStackPro WhatsApp]'
      : message.type === 'audio'
      ? '[🎙 Voice note on WebStackPro]'
      : '[Media message on WebStackPro]';

  return {
    channel: 'whatsapp',
    externalId: contact.wa_id,
    name: contact.profile?.name || `WhatsApp ${(contact.wa_id || 'customer').slice(-4)}`,
    text,
    platform: change?.metadata?.phone_number_id,
  };
}

async function sendReply(channelRecord, to, text) {
  const { accessToken, phoneNumberId } = buildConfigFromChannel(channelRecord);
  if (!accessToken || !phoneNumberId) {
    throw new Error('WebStackPro WhatsApp not connected (missing credentials)');
  }
  const url = `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`;
  await axios.post(
    url,
    {
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body: text },
    },
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
}

module.exports = { verifyWebhook, parseInbound, sendReply };
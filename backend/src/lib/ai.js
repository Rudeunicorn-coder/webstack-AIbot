// ============================================================================
// WebStackPro AI Agent Engine
//
// Processing flow on a new inbound message:
//   1. If conversation.status === 'human' -> skip AI, notify team.
//   2. Retrieve the business Knowledge Base via WebStackPro pgvector RAG.
//   3. Call GPT-4o-mini with the WebStackPro system prompt.
//   4. If confidence > 0.8 -> broadcast AI reply on the channel.
//   5. If confidence < 0.8 -> set status='human', notify "WebStackPro needs human help".
// ============================================================================

const { llm: openai, CHAT_MODEL } = require('./llm');
const { searchKnowledge } = require('./pgvector');
const prisma = require('./prisma');

const CONFIDENCE_THRESHOLD = Number(process.env.AI_CONFIDENCE_THRESHOLD || 0.8);

function buildSystemPrompt(businessName, knowledge, businessHours) {
  const kb = knowledge
    .map((k, i) => `[Doc ${i + 1}] ${k.content}`)
    .join('\n\n');

  let hoursText = '';
  if (businessHours && businessHours.enabled) {
    const { days, open, close, timezone, awayMessage } = businessHours;
    hoursText = [
      ``,
      `=== WebStackPro Business Hours ===`,
      `Open days: ${(days || []).join(', ')}. Open from ${open} to ${close} (${timezone || 'Africa/Lagos'}).`,
      `If the customer asks whether you are open now, use these hours to decide.`,
      awayMessage ? `When outside business hours, politely mention: "${awayMessage}"` : '',
      ``,
    ].join('\n');
  }

  return [
    `You are WebStackPro AI Assistant for ${businessName}.`,
    `You work for WebStackPro.`,
    `Answer fast, friendly, and in a Nigerian tone. Use only the Knowledge Base below.`,
    `If you are unsure or the answer is not in the Knowledge Base, reply with the exact fallback:`,
    `"No wahala, let me get my WebStackPro manager for you"`,
    ``,
    `=== WebStackPro Knowledge Base ===`,
    kb || "(No knowledge base entries yet. Reply with the WebStackPro fallback line.)",
    hoursText,
    `RULES:`,
    `- Never invent prices, policies or details not present in the Knowledge Base.`,
    `- Keep answers under 40 words.`,
    `- End each reply without a trailing signature; the client stamps the brand.`,
  ].join('\n');
}

/**
 * Decide if GPT is confident. We ask the model for a 0-1 score alongside its
 * answer, so the WebStackPro hand-off logic ("human in the loop") can act on it.
 */
async function callWebStackProAI({ businessName, message, history, knowledge, businessHours }) {
  const systemPrompt = buildSystemPrompt(businessName, knowledge, businessHours);

  const messages = [
    { role: 'system', content: systemPrompt },
    ...history.slice(-8).map((m) => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: m.text,
    })),
    { role: 'user', content: message.text },
  ];

  messages.push({
    role: 'user',
    content:
      '\n\nOnly reply in JSON:\n{"reply": "<your answer>", "confidence": <number 0..1>}',
  });

  const completion = await openai.chat.completions.create({
    model: CHAT_MODEL,
    messages,
    temperature: 0.6,
    max_tokens: 220,
    response_format: { type: 'json_object' },
  });

  const raw = completion.choices[0].message.content || '{"reply":"No wahala","confidence":0.5}';
  const parsed = JSON.parse(raw);

  return {
    reply: String(parsed.reply || 'No wahala, let me get my WebStackPro manager for you'),
    confidence: Math.max(0, Math.min(1, Number(parsed.confidence ?? 0.5))),
  };
}

/**
 * The main WebStackPro Agent entrypoint. Called by the inbox service whenever a
 * new customer message arrives on any connected channel.
 */
async function handleIncomingMessage({ conversation, message, business }) {
  // 1) If a WebStackPro human agent has taken over, do not interrupt them.
  if (conversation.status === 'human') {
    return { handledBy: 'human', reply: null };
  }

  // 2) Pull the business Knowledge Base.
  const knowledge = await searchKnowledge(business.id, message.text);

  // 3) Load recent history for context.
  const history = await prisma.webStackProMessage.findMany({
    where: { conversationId: conversation.id },
    orderBy: { createdAt: 'asc' },
    take: 10,
  });

  // 4) Pull the business' widget config for business-hours awareness.
  let businessHours = null;
  try {
    const webChannel = await prisma.webStackProChannel.findUnique({
      where: { businessId_type: { businessId: business.id, type: 'web' } },
      select: { config: true },
    });
    const cfg = webChannel?.config || {};
    if (cfg.businessHours?.enabled) businessHours = cfg.businessHours;
  } catch (_) {
    /* best-effort */
  }

  let result;
  try {
    result = await callWebStackProAI({
      businessName: business.name,
      message,
      history,
      knowledge,
      businessHours,
    });
  } catch (err) {
    console.error('WebStackPro AI error:', err.message);
    // 4b) On AI failure we hand off to a human — safest default.
    await handoffToHuman(conversation, business, message);
    return { handledBy: 'human', reply: null, error: err.message };
  }

  // 4) Confident answer -> send it back.
  if (result.confidence >= CONFIDENCE_THRESHOLD) {
    await prisma.webStackProMessage.create({
      data: {
        conversationId: conversation.id,
        role: 'ai',
        text: result.reply,
        channel: conversation.channel,
      },
    });
    await prisma.webStackProConversation.update({
      where: { id: conversation.id },
      data: { unread: false, lastMessageAt: new Date() },
    });
    return { handledBy: 'ai', reply: result.reply, confidence: result.confidence };
  }

  // 5) Low confidence -> WebStackPro hands off to a human agent.
  await handoffToHuman(conversation, business, message);
  return { handledBy: 'human', reply: null, confidence: result.confidence };
}

/**
 * Flip a conversation to human mode and emit a realtime "WebStackPro needs
 * human help" notification to the dashboard.
 */
async function handoffToHuman(conversation, business, message) {
  await prisma.webStackProConversation.update({
    where: { id: conversation.id },
    data: { status: 'human', unread: true, updatedAt: new Date() },
  });

  await prisma.webStackProNote.create({
    data: {
      businessId: business.id,
      conversationId: conversation.id,
      author: 'WebStackPro AI',
      body: 'WebStackPro AI confidence too low. Needs human help: "' + (message.text || '').slice(0, 120) + '"',
    },
  });

  // Realtime event to the WebStackPro dashboard (socket.io).
  const { io } = require('./socket');
  if (io) {
    io.to(`biz:${business.id}`).emit('webstackpro:handoff', {
      conversationId: conversation.id,
      businessId: business.id,
      message: 'WebStackPro needs human help',
    });
  }
}

module.exports = { handleIncomingMessage, callWebStackProAI, CONFIDENCE_THRESHOLD };
// ============================================================================
// WebStackPro LLM Client
// Single OpenAI-compatible client for the whole backend. Reads the provider
// from env so you can swap between OpenAI (default) and Groq (free) without
// touching route/service code.
//
//   AI_PROVIDER="groq"  GROQ_API_KEY="gsk_..."  -> Llama via Groq
//   AI_PROVIDER="openai" OPENAI_API_KEY="sk-..." -> GPT-4o-mini (default)
// ============================================================================

const OpenAI = require('openai');

const provider = (process.env.AI_PROVIDER || 'openai').toLowerCase();

const GROQ_BASE_URL = 'https://api.groq.com/openai/v1';
const OPENAI_BASE_URL = process.env.OPENAI_API_BASE || undefined;

const apiKey =
  provider === 'groq'
    ? process.env.GROQ_API_KEY || ''
    : process.env.OPENAI_API_KEY || '';

const baseURL = provider === 'groq' ? GROQ_BASE_URL : OPENAI_BASE_URL;

const llm = apiKey
  ? new OpenAI({ apiKey, baseURL })
  : null;

const CHAT_MODEL =
  process.env.AI_MODEL ||
  (provider === 'groq' ? 'llama-3.3-70b-versatile' : process.env.OPENAI_MODEL || 'gpt-4o-mini');

const EMBED_MODEL = process.env.EMBED_MODEL || 'text-embedding-3-small';

// Groq has chat/LLM endpoints but no embeddings endpoint, so RAG falls back
// to the keyword search path when the provider does not support embeddings.
const SUPPORTS_EMBEDDINGS = provider !== 'groq';

module.exports = { llm, CHAT_MODEL, EMBED_MODEL, SUPPORTS_EMBEDDINGS, provider };
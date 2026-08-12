// ============================================================================
// WebStackPro Knowledge Base API
// "/dashboard/webstackpro-knowledge" -> "Train Your WebStackPro AI"
// Supports: list, create (title/content), upload .txt/.pdf, test chat, delete.
// Uploads embed into pgvector so the WebStackPro AI RAG can retrieve them.
// ============================================================================

const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const prisma = require('../lib/prisma');
const { searchKnowledge, embedKnowledge } = require('../lib/pgvector');
const { authRequired, resolveBusiness } = require('../middleware/auth');
const { callWebStackProAI } = require('../lib/ai');
const { SUPPORTS_EMBEDDINGS, llm } = require('../lib/llm');

const upload = multer({ dest: 'uploads/', limits: { fileSize: 5 * 1024 * 1024 } });
router.use(authRequired);

async function load(req, _res, next) {
  try {
    const business = await resolveBusiness(req.auth.ownerId, { name: req.auth.name });
    req.business = business;
    next();
  } catch (err) {
    next(err);
  }
}
router.use(load);

// OpenAI-compatible client via llm.js; embedding calls are gated on the
// provider supporting embeddings (Groq does not, and falls back to keywords).
function canEmbed() {
  return SUPPORTS_EMBEDDINGS && llm;
}

function readTextFile(file) {
  const isPdf = file.mimetype === 'application/pdf' || file.originalname.endsWith('.pdf');
  if (isPdf) {
    const pdfParse = require('pdf-parse');
    const buffer = fs.readFileSync(file.path);
    return pdfParse(buffer).then((data) => data.text);
  }
  return fs.promises.readFile(file.path, 'utf8');
}

// ---------------------------------------------------------------------------
// GET /knowledge
// ---------------------------------------------------------------------------
router.get('/knowledge', async (req, res) => {
  const items = await prisma.webStackProKnowledge.findMany({
    where: { businessId: req.business.id },
    orderBy: { createdAt: 'desc' },
    select: { id: true, title: true, content: true, source: true, createdAt: true },
  });
  res.json({ items });
});

// ---------------------------------------------------------------------------
// POST /knowledge   (manual entry)
// ---------------------------------------------------------------------------
router.post('/knowledge', async (req, res) => {
  const { title, content } = req.body || {};
  if (!title || !content) return res.status(400).json({ error: 'WebStackPro: title and content required' });

  const item = await prisma.webStackProKnowledge.create({
    data: { businessId: req.business.id, title, content, source: 'manual' },
  });

  if (canEmbed()) await embedKnowledge(llm, item.id, `${title}\n${content}`);
  res.status(201).json({ ok: true, item });
});

// ---------------------------------------------------------------------------
// POST /knowledge/upload   (.txt / .pdf)
// ---------------------------------------------------------------------------
router.post('/knowledge/upload', upload.single('file'), async (req, res) => {
  const file = req.file;
  if (!file) return res.status(400).json({ error: 'WebStackPro: no file uploaded' });

  try {
    const text = await readTextFile(file);
    const title = file.originalname.replace(/\.[^.]+$/, '');
    const chunks = splitChunks(text, 1500);

    const items = [];
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const item = await prisma.webStackProKnowledge.create({
        data: {
          businessId: req.business.id,
          title: i === 0 ? title : `${title} (part ${i + 1})`,
          content: chunk,
          source: 'upload',
        },
      });
      if (canEmbed()) await embedKnowledge(llm, item.id, chunk);
      items.push(item.id);
    }

    res.status(201).json({ ok: true, chunks: items.length });
  } finally {
    fs.unlink(file.path, () => {});
  }
});

// ---------------------------------------------------------------------------
// POST /knowledge/test   "Chat with your WebStackPro AI"
// ---------------------------------------------------------------------------
router.post('/knowledge/test', async (req, res) => {
  const { question } = req.body || {};
  if (!question?.trim()) return res.status(400).json({ error: 'WebStackPro: ask a question first' });

  const knowledge = await searchKnowledge(req.business.id, question, 4);

  const result = await callWebStackProAI({
    businessName: req.business.name,
    message: { role: 'user', text: question },
    history: [],
    knowledge,
  });

  res.json({ answer: result.reply, confidence: result.confidence, sources: knowledge.length });
});

// ---------------------------------------------------------------------------
// DELETE /knowledge/:id
// ---------------------------------------------------------------------------
router.delete('/knowledge/:id', async (req, res) => {
  await prisma.webStackProKnowledge.deleteMany({
    where: { id: req.params.id, businessId: req.business.id },
  });
  res.json({ ok: true });
});

function splitChunks(text, size) {
  const clean = text.replace(/\s+/g, ' ').trim();
  const parts = [];
  for (let i = 0; i < clean.length; i += size) {
    parts.push(clean.slice(i, i + size));
  }
  return parts.length ? parts : [''];
}

module.exports = router;
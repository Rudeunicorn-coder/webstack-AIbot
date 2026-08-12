// ============================================================================
// WebStackPro pgvector RAG helper
// Semantic search over a business Knowledge Base using Supabase pgvector.
//
// Prereq on Supabase:  CREATE EXTENSION IF NOT EXISTS vector;
// The WebStackPro KnowledgeBase.embedding column is vector(1536).
// ============================================================================

const { llm: openai, EMBED_MODEL, SUPPORTS_EMBEDDINGS } = require('./llm');
const prisma = require('./prisma');

function toVectorLiteral(vector) {
  return `[${vector.map((n) => Number(n.toFixed(6))).join(',')}]`;
}

/**
 * Find the most relevant knowledge chunks for a WebStackPro business.
 * 1) Embeds the query and runs a pgvector similarity search (cosine distance).
 * 2) Falls back to keyword matching when embed/pgvector is not available so the
 *    WebStackPro inbox always works.
 */
async function searchKnowledge(businessId, query, limit = 4) {
  // 1) Vector similarity search.
  if (openai && SUPPORTS_EMBEDDINGS) {
    try {
      const emb = await openai.embeddings.create({
        model: EMBED_MODEL,
        input: query.slice(0, 8000),
      });
      const vector = emb.data[0].embedding;

      const rows = await prisma.$queryRawUnsafe(
        `SELECT id, title, content
           FROM "WebStackProKnowledge"
          WHERE "businessId" = $1::text
            AND embedding IS NOT NULL
          ORDER BY embedding <=> $2::vector
          LIMIT $3`,
        businessId,
        toVectorLiteral(vector),
        limit
      );
      if (Array.isArray(rows) && rows.length > 0) return rows;
    } catch (err) {
      console.error('WebStackPro pgvector search failed, using keywords:', err.message);
    }
  }

  // 2) Keyword fallback so the WebStackPro AI still answers from seeded content.
  const terms = query
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length > 2)
    .slice(0, 6);

  const all = await prisma.webStackProKnowledge.findMany({ where: { businessId } });

  const scored = all
    .map((k) => {
      const blob = `${k.title} ${k.content}`.toLowerCase();
      const score = terms.reduce((acc, t) => acc + (blob.includes(t) ? 1 : 0), 0);
      return { ...k, score };
    })
    .filter((k) => k.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.length ? scored.slice(0, limit) : all.slice(0, limit);
}

/**
 * Pre-compute and store an embedding for a knowledge entry so RAG works end-to-end.
 */
async function embedKnowledge(openai, knowledgeId, text) {
  try {
    const res = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text.slice(0, 8000),
    });
    const vector = res.data[0].embedding;
    await prisma.$executeRawUnsafe(
      `UPDATE "WebStackProKnowledge" SET embedding = $1::vector WHERE id = $2`,
      toVectorLiteral(vector),
      knowledgeId
    );
    return true;
  } catch (err) {
    console.error('WebStackPro embed error:', err.message);
    return false;
  }
}

module.exports = { searchKnowledge, embedKnowledge };
// ============================================================================
// WebStackPro Prisma Singleton
// A single shared PrismaClient across the WebStackPro backend.
// ============================================================================

const { PrismaClient } = require('@prisma/client');

const prisma = global.__webstackproPrisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  global.__webstackproPrisma = prisma;
}

module.exports = prisma;
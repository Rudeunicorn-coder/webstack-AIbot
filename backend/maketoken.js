require('dotenv').config();
const jwt = require('jsonwebtoken');
const prisma = require('./src/lib/prisma');
(async () => {
  const biz = await prisma.webStackProBusiness.findUnique({ where: { ownerId: 'demo-owner-webstackpro' } });
  const token = jwt.sign(
    { ownerId: 'demo-owner-webstackpro', businessId: biz.id, name: 'Demo Agent' },
    process.env.JWT_SECRET || 'webstackpro-dev-secret',
    { expiresIn: '7d' }
  );
  console.log('COPY THIS TOKEN (include the dot characters, no quotes):');
  console.log('');
  console.log(token);
  await prisma.$disconnect();
})();
require('dotenv').config();
const prisma = require('./src/lib/prisma');
(async () => {
  try {
    const bizs = await prisma.webStackProBusiness.findMany({ select: { id: true, name: true, ownerId: true } });
    console.log(JSON.stringify(bizs, null, 2));
    await prisma.$disconnect();
  } catch (e) {
    console.log('FAILED:', e.message);
    process.exit(1);
  }
})();

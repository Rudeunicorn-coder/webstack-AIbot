require('dotenv').config();
const prisma = require('./src/lib/prisma');
(async () => {
  try {
    const items = await prisma.webStackProKnowledge.findMany({ where: { businessId: 'cmsqgpews000013u9e0dr852s' }, select: { title: true, content: true } });
    console.log('COUNT:', items.length);
    items.forEach((i) => console.log(' - ' + i.title));
    await prisma.$disconnect();
  } catch (e) {
    console.log('FAILED:', e.message);
    process.exit(1);
  }
})();

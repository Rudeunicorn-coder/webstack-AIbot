require('dotenv').config();
const prisma = require('./src/lib/prisma');

const entries = [
  {
    title: 'Contact Information',
    content:
      'WebStackPro contact details: Address is No 4 Tetlow Road, Owerri, Imo State, Nigeria. Phone: +234 803 342 3861. Email: info@webstackpro.com. Website: www.webstackpro.pro.',
    source: 'manual',
  },
  {
    title: 'Business Hours',
    content:
      'WebStackPro business hours: Monday to Friday 8:00 AM to 6:00 PM. Saturday 9:00 AM to 4:00 PM. Closed on Sundays.',
    source: 'manual',
  },
  {
    title: 'Services',
    content:
      'WebStackPro provides IT services and equipment sales. We help businesses automate customer service with AI agents, unified inbox, and business tools.',
    source: 'manual',
  },
];

(async () => {
  try {
    for (const e of entries) {
      const existing = await prisma.webStackProKnowledge.findFirst({
        where: { businessId: 'cmsqgpews000013u9e0dr852s', title: e.title },
      });
      if (existing) {
        console.log('SKIP (exists): ' + e.title);
      } else {
        await prisma.webStackProKnowledge.create({
          data: { businessId: 'cmsqgpews000013u9e0dr852s', title: e.title, content: e.content, source: e.source },
        });
        console.log('ADDED: ' + e.title);
      }
    }
    await prisma.$disconnect();
  } catch (e) {
    console.log('FAILED:', e.message);
    process.exit(1);
  }
})();

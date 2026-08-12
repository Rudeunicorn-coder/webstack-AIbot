const axios = require('axios');
(async () => {
  const base = 'http://localhost:4000/api';
  try {
    const ex = await axios.post(base + '/auth/exchange', { ownerId: 'demo-owner-webstackpro' });
    const biz = ex.data.business;

    const externalId = 'web-demo-' + Date.now();
    const q = "Hello! What are your store hours and do you deliver in Owerri?";
    console.log('>>> SENDING customer message: "' + q + '"');
    await axios.post(base + '/webhooks/webwidget', {
      businessId: biz.id,
      externalId,
      name: 'Ngozi Demo',
      text: q,
    });
    console.log('>>> Message accepted. Waiting for WebStackPro AI...');
    await new Promise((r) => setTimeout(r, 9000));

    const poll = await axios.get(base + '/webhooks/webwidget/messages', { params: { businessId: biz.id, externalId } });
    const c = poll.data.conversation;
    console.log('----------------------------------------');
    console.log('CONVERSATION STATUS:', c?.status);
    (c?.messages || []).forEach((m) => console.log('  [' + m.role + '] ' + m.text));
    console.log('----------------------------------------');
    console.log('Check the dashboard inbox: it now shows Ngozi Demo with this thread.');
  } catch (e) {
    console.error('FAIL:', e.response ? e.response.status + ' ' + JSON.stringify(e.response.data) : e.message);
  }
})();
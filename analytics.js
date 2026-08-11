(function () {
  const config = window.SJ_ANALYTICS || {};
  const endpoint = config.endpoint || '';
  const queue = [];
  function clean(properties) {
    const safe = {};
    Object.entries(properties || {}).forEach(([key, value]) => {
      if (/pin|video|password|token/i.test(key)) return;
      safe[key] = String(value ?? '').slice(0, 160);
    });
    return safe;
  }
  function track(name, properties) {
    const event = { name, properties: clean(properties), path: location.pathname, at: new Date().toISOString() };
    queue.push(event);
    if (!endpoint) return;
    fetch(`${endpoint.replace(/\/$/, '')}/api/events`, {
      method: 'POST', headers: { 'content-type': 'application/json' }, keepalive: true,
      body: JSON.stringify(event)
    }).catch(() => {});
  }
  window.SJAnalytics = { track, queue };
  track('page_view', { title: document.title });
  document.addEventListener('click', (event) => {
    const card = event.target.closest('[data-title], .card');
    const link = event.target.closest('a,button');
    if (card) track('content_click', { title: card.dataset.title || card.querySelector('h3')?.textContent || '', label: link?.textContent || '' });
  });
})();

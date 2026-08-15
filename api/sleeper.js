module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let path = req.query.path;

  if (Array.isArray(path)) path = path[0];

  if (!path || typeof path !== 'string') {
    return res.status(400).json({ error: 'Missing path' });
  }

  path = path.replace(/^\/+/, '');

  const allowed = [
    /^draft\/\d+$/,
    /^draft\/\d+\/picks$/,
    /^draft\/\d+\/traded_picks$/,
    /^league\/\d+\/users$/,
    /^league\/\d+\/rosters$/
  ];

  if (!allowed.some(rx => rx.test(path))) {
    return res.status(400).json({ error: 'Unsupported endpoint' });
  }

  try {
    const upstream = await fetch(
      `https://api.sleeper.app/v1/${path}`,
      {
        headers: {
          accept: 'application/json'
        }
      }
    );

    const text = await upstream.text();

    res.setHeader('Cache-Control', 'no-store, max-age=0');
    res.setHeader(
      'Content-Type',
      upstream.headers.get('content-type') || 'application/json'
    );

    return res.status(upstream.status).send(text);

  } catch (e) {
    return res.status(502).json({
      error: 'Sleeper upstream failed',
      detail: e?.message || String(e)
    });
  }
};

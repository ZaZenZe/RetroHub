/*
  scripts/check-profile-links.js
  - Logs in as a seeded user (default: oak)
  - GET /users/:id/last-posts and verifies each post has a game slug/_id
  - Verifies GET /games/:param returns 200 for each referenced game
  - Verifies favoriteGames entries resolve via GET /games/:id

  Usage:
    node scripts/check-profile-links.js            # uses oak/Admin@123
    USERNAME=SpeedRunner PASSWORD=SpeedRun@2024 node scripts/check-profile-links.js
*/

const http = require('http');
const https = require('https');
const { URL } = require('url');

const BASE = process.env.BASE || 'http://localhost:3000';
const USERNAME = process.env.USERNAME || 'oak';
const PASSWORD = process.env.PASSWORD || 'Admin@123';

function fetchJson(path, opts = {}) {
  const url = new URL(path, BASE);
  const lib = url.protocol === 'https:' ? https : http;
  const headers = Object.assign({ 'Content-Type': 'application/json' }, opts.headers || {});
  return new Promise((resolve, reject) => {
    const req = lib.request(url, { method: opts.method || 'GET', headers }, (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (c) => (body += c));
      res.on('end', () => {
        try {
          const parsed = body ? JSON.parse(body) : null;
          resolve({ status: res.statusCode, body: parsed });
        } catch (err) {
          reject(new Error(`Invalid JSON (${res.statusCode}): ${body.slice(0, 200)}`));
        }
      });
    });
    req.on('error', reject);
    if (opts.body) req.write(JSON.stringify(opts.body));
    req.end();
  });
}

(async () => {
  console.log('Signing in as', USERNAME);
  const login = await fetchJson('/auth/login', { method: 'POST', body: { username: USERNAME, password: PASSWORD } });
  if (login.status !== 200 || !login.body || !login.body.token) {
    console.error('Login failed:', login.status, login.body);
    process.exit(2);
  }
  const token = login.body.token;
  const user = login.body.user;
  console.log('User id:', user && (user._id || user.id));

  const headers = { Authorization: `Bearer ${token}` };

  console.log('\nChecking /users/:id/last-posts');
  const lp = await fetchJson(`/users/${user._id || user.id}/last-posts`, { headers });
  if (lp.status !== 200) {
    console.error('GET last-posts failed', lp.status, lp.body);
    process.exit(3);
  }
  const posts = lp.body.posts || [];
  console.log(`Returned ${posts.length} posts`);

  let failed = false;
  for (const p of posts) {
    const gid = (p.gameId && (p.gameId.slug || p.gameId._id)) || p.gameId || null;
    if (!gid) {
      console.error('Post missing game reference:', p._id || p.id);
      failed = true;
      continue;
    }
    const gres = await fetchJson(`/games/${encodeURIComponent(gid)}`);
    if (gres.status !== 200) {
      console.error(`Referenced game not resolvable for post ${p._id}: /games/${gid} -> ${gres.status}`);
      failed = true;
    } else {
      console.log(`OK post ${p._id} -> game ${gres.body.game.title} (${gid})`);
    }
  }

  console.log('\nChecking favoriteGames');
  const me = await fetchJson(`/users/${user._id || user.id}`, { headers });
  if (me.status !== 200) {
    console.error('GET /users/:id failed', me.status, me.body);
    process.exit(4);
  }
  const favs = (me.body.user && me.body.user.favoriteGames) || [];
  console.log('favoriteGames:', favs);
  for (const f of favs) {
    const gres = await fetchJson(`/games/${encodeURIComponent(f)}`);
    if (gres.status !== 200) {
      console.error(`Favorite game ${f} not resolvable (/games/${f} -> ${gres.status})`);
      failed = true;
    } else {
      console.log(`OK favourite ${f} -> ${gres.body.game.title}`);
    }
  }

  console.log('\nHeartbeat test: POST /users/:id/session {seconds:5}');
  const hb = await fetchJson(`/users/${user._id || user.id}/session`, { method: 'POST', headers, body: { seconds: 5 } });
  if (hb.status !== 200) {
    console.error('Heartbeat POST failed', hb.status, hb.body);
    failed = true;
  } else {
    console.log('Heartbeat accepted; totalPlaySeconds:', hb.body && hb.body.stats && hb.body.stats.totalPlaySeconds);
  }

  if (failed) process.exit(5);
  console.log('\nAll checks passed (profile links + heartbeat).');
  process.exit(0);
})();

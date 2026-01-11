'use strict';

const SERVICES = [
  { name: 'auth', port: 3001 },
  { name: 'user', port: 3002 },
  { name: 'game', port: 3003 },
  { name: 'community', port: 3004 },
  { name: 'ai', port: 3005 },
];

const TIMEOUT_MS = 4000;

function timeoutFetch(url, options = {}, timeoutMs = TIMEOUT_MS) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  const opts = { ...options, signal: controller.signal };
  return fetch(url, opts).finally(() => clearTimeout(id));
}

async function checkService(service) {
  const url = `http://localhost:${service.port}/health`;
  try {
    const res = await timeoutFetch(url, { method: 'GET' });
    if (!res.ok) {
      return { ok: false, status: res.status, message: res.statusText, url };
    }
    const data = await res.json().catch(() => ({}));
    return { ok: true, status: res.status, message: data.status || 'ok', url };
  } catch (err) {
    return { ok: false, status: 0, message: err.message || 'request failed', url };
  }
}

async function main() {
  console.log('Running health checks...');
  const results = await Promise.all(SERVICES.map(checkService));
  let allOk = true;

  results.forEach((result, idx) => {
    const prefix = result.ok ? '[OK ]' : '[FAIL]';
    const name = SERVICES[idx].name;
    console.log(`${prefix} ${name} -> ${result.url} (${result.status || 'n/a'}) ${result.message}`);
    if (!result.ok) allOk = false;
  });

  process.exit(allOk ? 0 : 1);
}

main().catch(err => {
  console.error('Health check failed:', err);
  process.exit(1);
});

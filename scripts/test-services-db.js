'use strict';

const path = require('path');
const { spawn } = require('child_process');

const SERVICES = [
  {
    name: 'auth',
    cwd: path.join(__dirname, '..', 'backend', 'auth-service'),
    port: 3001,
    hasDb: true,
  },
  {
    name: 'user',
    cwd: path.join(__dirname, '..', 'backend', 'user-service'),
    port: 3002,
    hasDb: true,
  },
  {
    name: 'game',
    cwd: path.join(__dirname, '..', 'backend', 'game-service'),
    port: 3003,
    hasDb: true,
  },
  {
    name: 'community',
    cwd: path.join(__dirname, '..', 'backend', 'community-service'),
    port: 3004,
    hasDb: true,
  },
  {
    name: 'ai',
    cwd: path.join(__dirname, '..', 'backend', 'ai-service'),
    port: 3005,
    hasDb: false,
  },
];

const WAIT_AFTER_START_MS = 5000;
const HEALTH_TIMEOUT_MS = 5000;
const SYMBOLS = { ok: '[OK]', fail: '[FAIL]' };

function logStep(ok, message) {
  const prefix = ok ? SYMBOLS.ok : SYMBOLS.fail;
  console.log(`${prefix} ${message}`);
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function checkHealth(service) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), HEALTH_TIMEOUT_MS);
  const url = `http://localhost:${service.port}/health`;
  try {
    const res = await fetch(url, { signal: controller.signal });
    const data = await res.json().catch(() => ({}));
    const dbStatus = data.database || {};
    const dbConnected = service.hasDb ? Boolean(dbStatus.connected) : true;
    const ok = res.ok && dbConnected;
    logStep(ok, `${service.name} health ${ok ? 'ok' : 'failed'} (${dbStatus.state || 'no state'})`);
    return { ok, res };
  } catch (err) {
    logStep(false, `${service.name} health check failed: ${err.message}`);
    return { ok: false, error: err };
  } finally {
    clearTimeout(timeoutId);
  }
}

function startService(service) {
  return new Promise((resolve, reject) => {
    const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    const child = spawn(npmCmd, ['start'], {
      cwd: service.cwd,
      env: { ...process.env, PORT: service.port },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    child.stdout.on('data', data => {
      process.stdout.write(`[${service.name}] ${data}`);
    });
    child.stderr.on('data', data => {
      process.stderr.write(`[${service.name}][err] ${data}`);
    });

    child.once('error', err => reject(err));

    resolve(child);
  });
}

async function stopService(child, service) {
  if (!child || child.exitCode !== null) return;
  child.kill('SIGINT');
  const exited = await Promise.race([
    new Promise(resolve => child.once('exit', () => resolve(true))),
    wait(4000).then(() => false),
  ]);
  if (!exited) {
    child.kill('SIGTERM');
  }
  logStep(true, `${service.name} stopped`);
}

async function testService(service) {
  logStep(true, `Starting ${service.name} service...`);
  let child;
  try {
    child = await startService(service);
  } catch (err) {
    logStep(false, `Failed to start ${service.name}: ${err.message}`);
    return { ok: false };
  }

  await wait(WAIT_AFTER_START_MS);

  if (child.exitCode !== null) {
    logStep(false, `${service.name} exited before health check (code ${child.exitCode})`);
    return { ok: false };
  }

  const health = await checkHealth(service);
  await stopService(child, service);
  return { ok: health.ok };
}

async function main() {
  console.log('Testing service connectivity (one at a time)...');
  const summary = [];

  for (const service of SERVICES) {
    const result = await testService(service);
    summary.push({ name: service.name, ok: result.ok });
    if (!result.ok) {
      logStep(false, `${service.name} failed checks`);
    }
    await wait(500);
  }

  console.log('\nSummary:');
  let allOk = true;
  summary.forEach(item => {
    allOk = allOk && item.ok;
    logStep(item.ok, `${item.name}`);
  });

  process.exit(allOk ? 0 : 1);
}

main().catch(err => {
  logStep(false, `Unexpected error: ${err.message}`);
  process.exit(1);
});

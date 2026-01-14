'use strict';

const fs = require('fs');
const path = require('path');
const net = require('net');
const { execFile } = require('child_process');
const { promisify } = require('util');

const execFileAsync = promisify(execFile);

const SYMBOLS = {
  ok: '[OK]',
  fail: '[FAIL]',
};

const DOCKER_COMPOSE_PATH = path.join(__dirname, '..', 'docker-compose.yml');
const MONGO_CONTAINER = 'retrohub-mongodb';
const MONGO_EXPRESS_CONTAINER = 'retrohub-mongo-express';
const PORTS = [27017, 8081];

function logCheck(ok, message) {
  const prefix = ok ? SYMBOLS.ok : SYMBOLS.fail;
  console.log(`${prefix} ${message}`);
}

async function checkDockerRunning() {
  try {
    await execFileAsync('docker', ['info']);
    logCheck(true, 'Docker is running');
    return true;
  } catch (err) {
    logCheck(false, 'Docker is not running. Please start Docker Desktop or the Docker daemon.');
    return false;
  }
}

async function checkComposeFile() {
  const exists = fs.existsSync(DOCKER_COMPOSE_PATH);
  logCheck(exists, `docker-compose.yml ${exists ? 'found' : 'missing'} at ${DOCKER_COMPOSE_PATH}`);
  return exists;
}

async function checkContainerRunning(name) {
  try {
    const { stdout } = await execFileAsync('docker', [
      'ps',
      '--filter',
      `name=${name}`,
      '--filter',
      'status=running',
      '--format',
      '{{.Names}}',
    ]);
    const running = stdout.trim().length > 0;
    logCheck(running, `${name} container ${running ? 'running' : 'not running'}`);
    return running;
  } catch (err) {
    logCheck(false, `Failed to inspect container ${name}: ${err.message}`);
    return false;
  }
}

function checkPort(port) {
  return new Promise(resolve => {
    const socket = net.createConnection({ port, host: '127.0.0.1', timeout: 2000 }, () => {
      logCheck(true, `Port ${port} reachable`);
      socket.destroy();
      resolve(true);
    });
    socket.on('error', () => {
      logCheck(false, `Port ${port} not reachable`);
      resolve(false);
    });
    socket.on('timeout', () => {
      logCheck(false, `Port ${port} timed out`);
      socket.destroy();
      resolve(false);
    });
  });
}

async function checkMongoExpressHttp() {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3000);
  try {
    const res = await fetch('http://localhost:8081', { signal: controller.signal });
    const ok = res.ok;
    logCheck(ok, `mongo-express HTTP ${ok ? 'reachable' : 'returned error ' + res.status}`);
    return ok;
  } catch (err) {
    logCheck(false, `mongo-express HTTP check failed: ${err.message}`);
    return false;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function main() {
  console.log('Running Docker health checks...');
  let allOk = true;

  const dockerRunning = await checkDockerRunning();
  allOk = allOk && dockerRunning;
  const composeExists = await checkComposeFile();
  allOk = allOk && composeExists;

  const mongoRunning = dockerRunning && (await checkContainerRunning(MONGO_CONTAINER));
  allOk = allOk && mongoRunning;
  const expressRunning = dockerRunning && (await checkContainerRunning(MONGO_EXPRESS_CONTAINER));
  allOk = allOk && expressRunning;

  for (const port of PORTS) {
    const ok = await checkPort(port);
    allOk = allOk && ok;
  }

  if (expressRunning) {
    const ok = await checkMongoExpressHttp();
    allOk = allOk && ok;
  }

  if (!dockerRunning) {
    console.log(
      '\nHint: Start Docker Desktop (Windows/macOS) or run `sudo systemctl start docker` (Linux).'
    );
  }

  process.exit(allOk ? 0 : 1);
}

main().catch(err => {
  logCheck(false, `Unexpected error: ${err.message}`);
  process.exit(1);
});

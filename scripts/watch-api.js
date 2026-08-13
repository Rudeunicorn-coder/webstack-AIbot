/**
 * WebStackPro API supervisor.
 * Runs the backend with Node and restarts it whenever it exits for any reason
 * (crash, DB pooler timeout, port conflict, manual stop). This guarantees the
 * API is always up during development so the frontend never sees
 * ERR_CONNECTION_REFUSED.
 *
 * Usage: node scripts/watch-api.js
 */

const { spawn } = require('child_process');
const path = require('path');

const BACKEND_DIR = path.join(__dirname, '..', 'backend');
const ENTRY = path.join(BACKEND_DIR, 'src', 'index.js');
const RESTART_DELAY_MS = 1500;
const MAX_BACKOFF_MS = 10000;

let child = null;
let stopping = false;
let restartDelay = RESTART_DELAY_MS;

function start() {
  if (stopping) return;

  console.log(`[watch-api] starting backend: node ${ENTRY}`);
  child = spawn(process.execPath, [ENTRY], {
    cwd: BACKEND_DIR,
    env: { ...process.env, NODE_ENV: process.env.NODE_ENV || 'development' },
    stdio: ['inherit', 'inherit', 'inherit'],
  });

  child.on('exit', (code, signal) => {
    child = null;
    if (stopping) {
      console.log('[watch-api] stopped.');
      return;
    }
    console.log(
      `[watch-api] backend exited (code=${code}, signal=${signal}). Restarting in ${restartDelay}ms...`
    );
    // Back off if it is crash-looping so we do not spin the CPU.
    setTimeout(start, restartDelay);
    restartDelay = Math.min(restartDelay * 2, MAX_BACKOFF_MS);
  });

  child.on('error', (err) => {
    console.error('[watch-api] failed to spawn backend:', err.message);
  });
}

// A successful startup that stays alive for a while resets the backoff.
const resetTimer = setInterval(() => {
  if (child && !child.killed) {
    restartDelay = RESTART_DELAY_MS;
  }
}, 60000);
resetTimer.unref();

process.on('SIGINT', () => {
  stopping = true;
  if (child) child.kill('SIGTERM');
  else process.exit(0);
});

process.on('SIGTERM', () => {
  stopping = true;
  if (child) child.kill('SIGTERM');
  else process.exit(0);
});

start();

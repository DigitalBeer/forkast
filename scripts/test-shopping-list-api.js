/*
 Internal, framework-free tests for GET /api/shopping-list
 Requires a running server. Start Next.js locally first:
   npm run dev
 Then run:
   npm run test:shopping-list:api
 You can override BASE_URL with env var.
*/

const http = require('http');
const https = require('https');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TEST_TIMEOUT = 5000;

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
};

let total = 0;
let passed = 0;
let failed = 0;

function log(msg, color = colors.reset) {
  console.log(`${color}${msg}${colors.reset}`);
}

function logTest(name, ok, extra = '') {
  total++;
  if (ok) {
    passed++;
    log(`✓ ${name}` + (extra ? ` — ${extra}` : ''), colors.green);
  } else {
    failed++;
    log(`✗ ${name}` + (extra ? ` — ${extra}` : ''), colors.red);
  }
}

function request(url, options = {}) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const req = protocol.request(url, { timeout: TEST_TIMEOUT, ...options }, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        let body = null;
        try { body = data ? JSON.parse(data) : null; } catch { body = data; }
        resolve({ statusCode: res.statusCode, headers: res.headers, body, raw: data });
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(new Error('timeout')); });
    if (options.body) req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    req.end();
  });
}

async function testMissingMealPlanId() {
  try {
    const res = await request(`${BASE_URL}/api/shopping-list`);
    logTest('GET /api/shopping-list without mealPlanId returns 400', res.statusCode === 400, `status=${res.statusCode}`);
  } catch (e) {
    logTest('GET /api/shopping-list without mealPlanId returns 400', false, e.message);
  }
}

async function testInvalidMealPlanId() {
  try {
    const res = await request(`${BASE_URL}/api/shopping-list?mealPlanId=abc`);
    logTest('GET /api/shopping-list with invalid mealPlanId returns 400', res.statusCode === 400, `status=${res.statusCode}`);
  } catch (e) {
    logTest('GET /api/shopping-list with invalid mealPlanId returns 400', false, e.message);
  }
}

async function testZeroMealPlanId() {
  try {
    const res = await request(`${BASE_URL}/api/shopping-list?mealPlanId=0`);
    logTest('GET /api/shopping-list with mealPlanId=0 returns 400', res.statusCode === 400, `status=${res.statusCode}`);
  } catch (e) {
    logTest('GET /api/shopping-list with mealPlanId=0 returns 400', false, e.message);
  }
}

async function testNegativeMealPlanId() {
  try {
    const res = await request(`${BASE_URL}/api/shopping-list?mealPlanId=-5`);
    logTest('GET /api/shopping-list with negative mealPlanId returns 400', res.statusCode === 400, `status=${res.statusCode}`);
  } catch (e) {
    logTest('GET /api/shopping-list with negative mealPlanId returns 400', false, e.message);
  }
}

async function testUnauthenticated() {
  try {
    const res = await request(`${BASE_URL}/api/shopping-list?mealPlanId=1`);
    // Auth should fail before plan lookup
    logTest('GET /api/shopping-list unauthenticated returns 401', res.statusCode === 401, `status=${res.statusCode}`);
  } catch (e) {
    logTest('GET /api/shopping-list unauthenticated returns 401', false, e.message);
  }
}

async function waitForServer(url, tries = 20, delayMs = 500) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await request(url);
      if (res.statusCode) return true;
    } catch (_) {
      // ignore
    }
    await new Promise((r) => setTimeout(r, delayMs));
  }
  return false;
}

async function run() {
  log(`${colors.bold}${colors.blue}Shopping List API Internal Tests${colors.reset}`);
  log(`Target: ${BASE_URL}`);

  const ready = await waitForServer(`${BASE_URL}/`);
  if (!ready) {
    log('Server did not become ready in time', colors.red);
    process.exit(1);
  }

  await testMissingMealPlanId();
  await testInvalidMealPlanId();
  await testZeroMealPlanId();
  await testNegativeMealPlanId();
  await testUnauthenticated();

  log('');
  log(`${colors.bold}Summary:${colors.reset}`);
  log(`  Total: ${total}`);
  log(`${colors.green}  Passed: ${passed}${colors.reset}`);
  log(`${colors.red}  Failed: ${failed}${colors.reset}`);

  process.exit(failed > 0 ? 1 : 0);
}

run().catch((e) => {
  log(`Fatal error: ${e.message}`, colors.red);
  process.exit(1);
});

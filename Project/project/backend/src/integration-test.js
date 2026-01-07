#!/usr/bin/env node

/**
 * FitLife Planner - Integration Test Suite
 * ✅ Tests frontend-backend-database connectivity
 */

const http = require('http');

const API_URL = 'http://localhost:3002';
const tests = [];
let passed = 0;
let failed = 0;

function log(message, type = 'info') {
  const colors = {
    info: '\x1b[36m',
    success: '\x1b[32m',
    error: '\x1b[31m',
    warning: '\x1b[33m',
    reset: '\x1b[0m',
  };
  console.log(`${colors[type] || colors.info}[${type.toUpperCase()}]${colors.reset} ${message}`);
}

async function test(name, fn) {
  try {
    console.log(`\n🧪 Testing: ${name}`);
    await fn();
    log(`✅ PASS: ${name}`, 'success');
    passed++;
  } catch (e) {
    log(`❌ FAIL: ${name}`, 'error');
    log(`   Error: ${e.message}`, 'error');
    failed++;
  }
}

function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(API_URL + path);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 5000,
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(json);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${json.error || data}`));
          }
        } catch (e) {
          reject(new Error(`Invalid JSON response: ${data}`));
        }
      });
    });

    req.on('error', (e) => reject(new Error(`Request failed: ${e.message}`)));
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runTests() {
  console.log('\n🔬 FitLife Planner - Integration Tests\n');
  console.log('='.repeat(60));

  // Test 1: Health Check
  await test('Backend Health Check', async () => {
    const res = await request('GET', '/health');
    if (!res.ok || res.service !== 'FitLife Planner API') {
      throw new Error('Invalid health response');
    }
  });

  // Test 2: Database Connection
  await test('Database Health Check', async () => {
    const res = await request('GET', '/db/health');
    if (res.db !== 'ok') {
      throw new Error('Database is not responding');
    }
  });

  // Test 3: Auth Signup
  let email = `test_${Date.now()}@example.com`;
  let password = 'TestPassword123!';
  await test('User Signup', async () => {
    const res = await request('POST', '/auth/signup', {
      email,
      password,
      name: 'Test User',
    });
    if (!res.id || !res.accessToken) {
      throw new Error('Invalid signup response');
    }
  });

  // Test 4: Auth Login
  let accessToken = null;
  await test('User Login', async () => {
    const res = await request('POST', '/auth/login', {
      email,
      password,
    });
    if (!res.accessToken) {
      throw new Error('No access token returned');
    }
    accessToken = res.accessToken;
  });

  // Test 5: Get Dashboard
  await test('Get Dashboard', async () => {
    const url = new URL(API_URL + '/api/dashboard');
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
      timeout: 5000,
    };

    await new Promise((resolve, reject) => {
      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            JSON.parse(data);
            resolve();
          } catch (e) {
            reject(e);
          }
        });
      });
      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Timeout'));
      });
      req.end();
    });
  });

  // Test 6: Save Body Measurements
  await test('Save Body Measurements', async () => {
    const res = await request('POST', '/api/dashboard/body-measurements', {
      height: 180,
      weight: 75,
      chest: 100,
      waist: 85,
      hips: 95,
      ai_analysis: 'Test analysis',
    });
    if (!res.ok && !res.id) {
      throw new Error('Invalid body measurements response');
    }
  });

  // Test 7: Get Activities
  await test('Get Activities', async () => {
    const res = await request('GET', '/api/triggers/activities?user_id=1');
    if (!res.ok && !Array.isArray(res.activities)) {
      throw new Error('Invalid activities response');
    }
  });

  // Test 8: Log Activity
  await test('Log Activity', async () => {
    const res = await request('POST', '/api/triggers/activities', {
      activity_type: 'workout_completed',
      description: 'Test workout',
      points: 10,
    });
    if (!res.ok && !res.id) {
      throw new Error('Invalid activity log response');
    }
  });

  // Test 9: Get Notifications
  await test('Get Notifications', async () => {
    const res = await request('GET', '/api/triggers/notifications?user_id=1');
    if (!res.ok && !Array.isArray(res.notifications)) {
      throw new Error('Invalid notifications response');
    }
  });

  // Test 10: Get Achievements
  await test('Get Achievements', async () => {
    const res = await request('GET', '/api/triggers/achievements?user_id=1');
    if (!res.ok && !Array.isArray(res.achievements)) {
      throw new Error('Invalid achievements response');
    }
  });

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log(`\n📊 Test Results:\n`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Total: ${passed + failed}\n`);

  if (failed === 0) {
    log('✨ All integration tests passed!', 'success');
    process.exit(0);
  } else {
    log(`⚠️  ${failed} test(s) failed. Check errors above.`, 'warning');
    process.exit(1);
  }
}

runTests().catch((e) => {
  log(`Fatal error: ${e.message}`, 'error');
  process.exit(1);
});

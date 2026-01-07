#!/usr/bin/env node

/**
 * FitLife Planner - System Health Check
 * ✅ Verifies all services are properly configured and running
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const checks = {
  passed: 0,
  failed: 0,
  results: [],
};

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

function success(message) {
  checks.passed++;
  checks.results.push({ message, type: 'success' });
  log(message, 'success');
}

function error(message) {
  checks.failed++;
  checks.results.push({ message, type: 'error' });
  log(message, 'error');
}

function warning(message) {
  checks.results.push({ message, type: 'warning' });
  log(message, 'warning');
}

// 📝 Check Files
function checkFile(filePath, description) {
  if (fs.existsSync(filePath)) {
    success(`${description} exists at ${filePath}`);
    return true;
  } else {
    error(`${description} NOT found at ${filePath}`);
    return false;
  }
}

// 🔗 Check HTTP endpoint
async function checkEndpoint(url, description) {
  return new Promise((resolve) => {
    const request = http.get(url, { timeout: 3000 }, (res) => {
      if (res.statusCode === 200 || res.statusCode === 401) {
        success(`${description} is running (${url})`);
        resolve(true);
      } else {
        error(`${description} returned ${res.statusCode} (${url})`);
        resolve(false);
      }
    });

    request.on('error', () => {
      error(`${description} is NOT running (${url})`);
      resolve(false);
    });

    request.on('timeout', () => {
      error(`${description} timed out (${url})`);
      resolve(false);
    });
  });
}

// 📋 Check environment variables
function checkEnvVar(filePath, varName) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    if (content.includes(`${varName}=`)) {
      success(`${varName} is set in ${path.basename(filePath)}`);
      return true;
    } else {
      error(`${varName} is NOT set in ${path.basename(filePath)}`);
      return false;
    }
  } catch (e) {
    error(`Could not read ${path.basename(filePath)}: ${e.message}`);
    return false;
  }
}

// Main checks
async function runChecks() {
  console.log('\n🔍 FitLife Planner - System Health Check\n');
  console.log('='.repeat(60));

  // ✅ Backend Files
  console.log('\n📦 Backend Files:');
  checkFile(
    path.join(__dirname, 'server.js'),
    'Backend server'
  );
  checkFile(
    path.join(__dirname, 'mysql.env'),
    'Backend env config'
  );
  checkFile(
    path.join(__dirname, 'routes/auth.js'),
    'Auth routes'
  );
  checkFile(
    path.join(__dirname, 'routes/triggers.js'),
    'Triggers routes'
  );
  checkFile(
    path.join(__dirname, 'sechmer.sql'),
    'SQL schema'
  );

  // ✅ Environment Configuration
  console.log('\n⚙️ Environment Configuration:');
  checkEnvVar(path.join(__dirname, 'mysql.env'), 'DB_HOST');
  checkEnvVar(path.join(__dirname, 'mysql.env'), 'DB_USER');
  checkEnvVar(path.join(__dirname, 'mysql.env'), 'DB_NAME');
  checkEnvVar(path.join(__dirname, 'mysql.env'), 'JWT_ACCESS_SECRET');
  checkEnvVar(path.join(__dirname, 'mysql.env'), 'CORS_ORIGIN');

  // ✅ Service Health (only if services are running)
  console.log('\n🚀 Service Status:');
  console.log('(These checks require services to be running)');

  await checkEndpoint('http://localhost:3002/health', 'Backend API');
  await checkEndpoint('http://localhost:3002/db/health', 'Database Connection');
  await checkEndpoint('http://localhost:3000/', 'Frontend');
  await checkEndpoint('http://localhost:8000/docs', 'AI Service');

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 Summary:\n');
  console.log(`✅ Passed: ${checks.passed}`);
  console.log(`❌ Failed: ${checks.failed}`);

  if (checks.failed === 0) {
    log('\n✨ All checks passed! System is ready.', 'success');
    process.exit(0);
  } else {
    log('\n⚠️  Some checks failed. Please review the errors above.', 'warning');
    process.exit(1);
  }
}

runChecks().catch(console.error);

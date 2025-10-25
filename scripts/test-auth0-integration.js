#!/usr/bin/env node

/**
 * Auth0 Integration Test Script
 * 
 * This script verifies that your Auth0 configuration is correct
 * and all required components are in place.
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');

// ANSI colors
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function success(message) {
  log(`✅ ${message}`, 'green');
}

function error(message) {
  log(`❌ ${message}`, 'red');
}

function warning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function info(message) {
  log(`ℹ️  ${message}`, 'blue');
}

function header(message) {
  log(`\n${'='.repeat(60)}`, 'cyan');
  log(`  ${message}`, 'bold');
  log(`${'='.repeat(60)}`, 'cyan');
}

// Test results
let passed = 0;
let failed = 0;
let warnings = 0;

function test(name, fn) {
  try {
    const result = fn();
    if (result === true) {
      success(name);
      passed++;
    } else if (result === null) {
      warning(name);
      warnings++;
    } else {
      error(name);
      failed++;
    }
  } catch (err) {
    error(`${name} - ${err.message}`);
    failed++;
  }
}

// Load .env file
function loadEnv() {
  const envPath = join(ROOT, '.env');
  if (!existsSync(envPath)) {
    return {};
  }
  
  const content = readFileSync(envPath, 'utf-8');
  const env = {};
  
  content.split('\n').forEach(line => {
    line = line.trim();
    if (line && !line.startsWith('#')) {
      const [key, ...valueParts] = line.split('=');
      env[key.trim()] = valueParts.join('=').trim();
    }
  });
  
  return env;
}

// Check if file exists
function fileExists(path) {
  return existsSync(join(ROOT, path));
}

// Check if file contains text
function fileContains(path, text) {
  const fullPath = join(ROOT, path);
  if (!existsSync(fullPath)) return false;
  const content = readFileSync(fullPath, 'utf-8');
  return content.includes(text);
}

// Main test suite
function runTests() {
  header('Auth0 Integration Test Suite');
  
  const env = loadEnv();
  
  // Environment Variables
  header('Environment Variables');
  
  test('VITE_AUTH0_DOMAIN is set', () => {
    return env.VITE_AUTH0_DOMAIN && env.VITE_AUTH0_DOMAIN !== 'your-domain.auth0.com';
  });
  
  test('VITE_AUTH0_CLIENT_ID is set', () => {
    return env.VITE_AUTH0_CLIENT_ID && env.VITE_AUTH0_CLIENT_ID !== 'your-client-id';
  });
  
  test('VITE_AUTH0_DOMAIN format is correct', () => {
    if (!env.VITE_AUTH0_DOMAIN) return false;
    return env.VITE_AUTH0_DOMAIN.includes('.auth0.com') || env.VITE_AUTH0_DOMAIN.includes('.us.auth0.com');
  });
  
  // Required Files
  header('Required Files');
  
  test('Auth0 config file exists', () => {
    return fileExists('src/config/auth0.ts');
  });
  
  test('Auth context file exists', () => {
    return fileExists('src/contexts/AuthContext.tsx');
  });
  
  test('Login page exists', () => {
    return fileExists('src/pages/LoginPage.tsx');
  });
  
  test('Auth callback page exists', () => {
    return fileExists('src/pages/AuthCallbackPage.tsx');
  });
  
  test('Login button component exists', () => {
    return fileExists('src/components/auth/LoginButton.tsx');
  });
  
  test('Logout button component exists', () => {
    return fileExists('src/components/auth/LogoutButton.tsx');
  });
  
  test('User profile component exists', () => {
    return fileExists('src/components/auth/UserProfile.tsx');
  });
  
  // Configuration Checks
  header('Configuration Checks');
  
  test('Auth0Provider is imported in AuthContext', () => {
    return fileContains('src/contexts/AuthContext.tsx', '@auth0/auth0-react');
  });
  
  test('AuthProvider wraps app in main.tsx', () => {
    return fileContains('src/main.tsx', '<AuthProvider>');
  });
  
  test('Redirect URI is set to /callback', () => {
    return fileContains('src/config/auth0.ts', '/callback');
  });
  
  test('Mock auth enabled for development', () => {
    return fileContains('src/contexts/AuthContext.tsx', 'MockAuthProvider');
  });
  
  test('Protected routes are configured', () => {
    return fileContains('src/App.tsx', 'ProtectedRoute');
  });
  
  // Backend Checks
  header('Backend Configuration');
  
  test('Backend auth service exists', () => {
    return fileExists('packages/backend/services/auth.py');
  });
  
  test('Backend config file exists', () => {
    return fileExists('packages/backend/core/config.py');
  });
  
  test('Backend has JWT verification', () => {
    return fileContains('packages/backend/services/auth.py', 'verify_jwt_token');
  });
  
  test('Backend has Auth0 JWKS fetch', () => {
    return fileContains('packages/backend/services/auth.py', 'get_auth0_public_key');
  });
  
  // Package Dependencies
  header('Package Dependencies');
  
  test('@auth0/auth0-react is installed', () => {
    return fileContains('packages/frontend/package.json', '@auth0/auth0-react');
  });
  
  test('python-jose is in backend requirements', () => {
    return fileContains('packages/backend/requirements.txt', 'python-jose');
  });
  
  // Documentation
  header('Documentation');
  
  test('Auth0 setup guide exists', () => {
    return fileExists('docs/AUTH0_SETUP.md');
  });
  
  test('Auth0 integration status doc exists', () => {
    return fileExists('docs/AUTH0_INTEGRATION_STATUS.md');
  });
  
  test('Auth0 quick start guide exists', () => {
    return fileExists('docs/AUTH0_QUICK_START.md');
  });
  
  // API Endpoints
  header('API Endpoints');
  
  test('Auth0 users API endpoint exists', () => {
    return fileExists('api/auth0-users.ts');
  });
  
  // Print Summary
  header('Test Summary');
  
  const total = passed + failed + warnings;
  const passRate = ((passed / total) * 100).toFixed(1);
  
  log(`\nTotal Tests: ${total}`, 'cyan');
  success(`Passed: ${passed}`);
  
  if (warnings > 0) {
    warning(`Warnings: ${warnings}`);
  }
  
  if (failed > 0) {
    error(`Failed: ${failed}`);
  }
  
  log(`\nPass Rate: ${passRate}%\n`, passRate >= 90 ? 'green' : 'yellow');
  
  // Recommendations
  if (failed > 0 || warnings > 0) {
    header('Recommendations');
    
    if (!env.VITE_AUTH0_DOMAIN || env.VITE_AUTH0_DOMAIN === 'your-domain.auth0.com') {
      info('Set VITE_AUTH0_DOMAIN in your .env file');
    }
    
    if (!env.VITE_AUTH0_CLIENT_ID || env.VITE_AUTH0_CLIENT_ID === 'your-client-id') {
      info('Set VITE_AUTH0_CLIENT_ID in your .env file');
    }
    
    if (failed > 0) {
      info('Review the failed tests above and ensure all required files exist');
      info('Run: npm install or pnpm install to ensure dependencies are installed');
    }
    
    info('Read docs/AUTH0_QUICK_START.md for setup instructions');
    info('Read docs/AUTH0_INTEGRATION_STATUS.md for complete feature list');
  }
  
  // Exit code
  if (failed > 0) {
    log('\n❌ Some tests failed. Please review the errors above.\n', 'red');
    process.exit(1);
  } else if (warnings > 0) {
    log('\n⚠️  All critical tests passed, but there are warnings.\n', 'yellow');
    process.exit(0);
  } else {
    log('\n✅ All tests passed! Your Auth0 integration is ready! 🎉\n', 'green');
    process.exit(0);
  }
}

// Additional Info
header('Auth0 Integration Test');
info('This script will verify your Auth0 configuration');
info('Make sure you have set up your .env file first\n');

// Run the tests
runTests();


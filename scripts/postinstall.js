#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🎉 Smart Research Tracker installed successfully!');
console.log('================================================\n');

// Check if .env.local exists
const envPath = path.join(__dirname, '..', '.env.local');
if (!fs.existsSync(envPath)) {
  console.log('📝 No environment configuration found.');
  console.log('   Run "pnpm setup" to configure your API keys and settings.\n');
} else {
  console.log('✅ Environment configuration found (.env.local)');
}

console.log('🚀 To get started:');
console.log('   1. Run: pnpm dev');
console.log('   2. Open: http://localhost:5173');
console.log('\n🔧 Optional: Build the browser extension');
console.log('   Run: pnpm build:extension');
console.log('\n📖 For help:');
console.log('   - Check the README.md file');
console.log('   - Run "pnpm setup" for guided configuration');
console.log('   - Visit the project repository for documentation\n'); 
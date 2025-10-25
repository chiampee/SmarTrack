#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

console.log('🚀 Smart Research Tracker Setup');
console.log('===============================\n');

async function setup() {
  try {
    // Check if .env.local already exists
    const envPath = path.join(__dirname, '..', '.env.local');
    if (fs.existsSync(envPath)) {
      console.log('✅ Environment file already exists (.env.local)');
      console.log('   If you want to reconfigure, delete .env.local and run setup again.\n');
    } else {
      console.log('📝 Setting up your environment configuration...\n');
      
      // Copy .env.example to .env.local
      const examplePath = path.join(__dirname, '..', '.env.example');
      if (fs.existsSync(examplePath)) {
        fs.copyFileSync(examplePath, envPath);
        console.log('✅ Created .env.local from template');
      } else {
        // Create basic .env.local if no example exists
        const basicEnv = `# Smart Research Tracker Configuration
VITE_OPENAI_API_KEY=sk-your-openai-api-key-here
VITE_OPENAI_MODEL=gpt-4.5-preview
VITE_OPENAI_EMBED_MODEL=text-embedding-3-small
`;
        fs.writeFileSync(envPath, basicEnv);
        console.log('✅ Created basic .env.local file');
      }

      // Ask user if they want to configure API keys
      const configureNow = await question('🤖 Do you want to configure your OpenAI API key now? (y/n): ');
      
      if (configureNow.toLowerCase() === 'y' || configureNow.toLowerCase() === 'yes') {
        console.log('\n📋 To get your OpenAI API key:');
        console.log('   1. Go to https://platform.openai.com/api-keys');
        console.log('   2. Sign in or create an account');
        console.log('   3. Click "Create new secret key"');
        console.log('   4. Copy the key (it starts with "sk-")');
        console.log('   5. Paste it below\n');
        
        const apiKey = await question('🔑 Enter your OpenAI API key (or press Enter to skip): ');
        
        if (apiKey && apiKey.trim() !== '') {
          // Update .env.local with the API key
          let envContent = fs.readFileSync(envPath, 'utf8');
          envContent = envContent.replace(
            /VITE_OPENAI_API_KEY=.*/,
            `VITE_OPENAI_API_KEY=${apiKey.trim()}`
          );
          fs.writeFileSync(envPath, envContent);
          console.log('✅ API key saved to .env.local');
        } else {
          console.log('ℹ️  No API key provided. You can add it later by editing .env.local');
        }
      }
    }

    // Check Node.js version
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
    
    if (majorVersion < 18) {
      console.log('\n⚠️  Warning: You\'re using Node.js version', nodeVersion);
      console.log('   Smart Research Tracker works best with Node.js 18 or higher');
      console.log('   Consider updating: https://nodejs.org/\n');
    } else {
      console.log('✅ Node.js version check passed:', nodeVersion);
    }

    // Check if pnpm is available
    try {
      const { execSync } = await import('child_process');
      execSync('pnpm --version', { stdio: 'ignore' });
      console.log('✅ pnpm is available');
    } catch (error) {
      console.log('\n⚠️  pnpm not found. Installing pnpm...');
      try {
        const { execSync } = await import('child_process');
        execSync('npm install -g pnpm', { stdio: 'inherit' });
        console.log('✅ pnpm installed successfully');
      } catch (installError) {
        console.log('❌ Failed to install pnpm. You can install it manually:');
        console.log('   npm install -g pnpm');
        console.log('   or visit: https://pnpm.io/installation');
      }
    }

    console.log('\n🎉 Setup complete!');
    console.log('\n📋 Next steps:');
    console.log('   1. Run: pnpm install');
    console.log('   2. Run: pnpm dev');
    console.log('   3. Open: http://localhost:5173');
    console.log('\n🔧 Optional: Build the browser extension');
    console.log('   Run: pnpm build:extension');
    console.log('   Then load the dist-extension/ folder in Chrome\n');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

setup(); 
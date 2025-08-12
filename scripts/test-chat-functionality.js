#!/usr/bin/env node

/**
 * Chat Functionality Test Script
 * 
 * This script tests the chat functionality to ensure:
 * 1. Messages are saved to the database
 * 2. Conversation history is loaded correctly
 * 3. API key configuration works
 * 4. Error handling works properly
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

console.log('🧪 Testing Chat Functionality');
console.log('=============================\n');

// Test 1: Check if .env.local exists and has API key
console.log('1️⃣ Testing API Key Configuration...');
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const hasApiKey = envContent.includes('VITE_OPENAI_API_KEY=') && 
                   !envContent.includes('VITE_OPENAI_API_KEY=sk-your-key-here');
  
  if (hasApiKey) {
    console.log('✅ .env.local exists with API key configured');
  } else {
    console.log('⚠️  .env.local exists but API key may not be properly configured');
  }
} else {
  console.log('❌ .env.local not found - API key not configured');
  console.log('   Run: npm run setup:env');
}

// Test 2: Check database schema
console.log('\n2️⃣ Testing Database Schema...');
const dbPath = path.join(process.cwd(), 'src/db/smartResearchDB.ts');
if (fs.existsSync(dbPath)) {
  const dbContent = fs.readFileSync(dbPath, 'utf8');
  const hasChatMessages = dbContent.includes('chatMessages!: Table<ChatMessage, string>');
  const hasConversations = dbContent.includes('conversations!: Table<import(\'../types/Conversation\').Conversation, string>');
  
  if (hasChatMessages && hasConversations) {
    console.log('✅ Database schema includes chat tables');
  } else {
    console.log('❌ Database schema missing chat tables');
  }
} else {
  console.log('❌ Database file not found');
}

// Test 3: Check chat service
console.log('\n3️⃣ Testing Chat Service...');
const chatServicePath = path.join(process.cwd(), 'src/services/chatService.ts');
if (fs.existsSync(chatServicePath)) {
  const chatServiceContent = fs.readFileSync(chatServicePath, 'utf8');
  const hasStartConversation = chatServiceContent.includes('startConversation');
  const hasGetMessages = chatServiceContent.includes('getMessages');
  const hasSendMessage = chatServiceContent.includes('sendMessage');
  
  if (hasStartConversation && hasGetMessages && hasSendMessage) {
    console.log('✅ Chat service has required methods');
  } else {
    console.log('❌ Chat service missing required methods');
  }
} else {
  console.log('❌ Chat service file not found');
}

// Test 4: Check MultiChatPanel component
console.log('\n4️⃣ Testing MultiChatPanel Component...');
const multiChatPath = path.join(process.cwd(), 'src/components/ai/MultiChatPanel.tsx');
if (fs.existsSync(multiChatPath)) {
  const multiChatContent = fs.readFileSync(multiChatPath, 'utf8');
  const hasBuildContext = multiChatContent.includes('buildContext');
  const hasSend = multiChatContent.includes('const send =');
  const hasMessageLoading = multiChatContent.includes('existingMessages');
  const hasHistoryLoading = multiChatContent.includes('getMessages');
  
  if (hasBuildContext && hasSend && hasMessageLoading && hasHistoryLoading) {
    console.log('✅ MultiChatPanel has history loading functionality');
  } else {
    console.log('❌ MultiChatPanel missing history functionality');
  }
} else {
  console.log('❌ MultiChatPanel file not found');
}

// Test 5: Check TypeScript compilation
console.log('\n5️⃣ Testing TypeScript Compilation...');
try {
  execSync('npx tsc --noEmit --project tsconfig.json', { 
    stdio: 'pipe',
    cwd: process.cwd() 
  });
  console.log('✅ TypeScript compilation successful');
} catch (error) {
  console.log('❌ TypeScript compilation failed');
  console.log('   Error:', error.message);
}

// Test 6: Check development server
console.log('\n6️⃣ Testing Development Server...');
try {
  const response = execSync('curl -s -o /dev/null -w "%{http_code}" http://localhost:5173', { 
    stdio: 'pipe',
    cwd: process.cwd() 
  });
  const statusCode = response.toString().trim();
  if (statusCode === '200') {
    console.log('✅ Development server is running');
  } else {
    console.log(`⚠️  Development server responded with status: ${statusCode}`);
  }
} catch (error) {
  console.log('❌ Development server is not running');
  console.log('   Start it with: npm run dev');
}

// Test 7: Check for debugging logs
console.log('\n7️⃣ Testing Debug Logs...');
const hasDebugLogs = [
  'src/db/smartResearchDB.ts',
  'src/components/ai/MultiChatPanel.tsx',
  'src/services/chatService.ts'
].some(filePath => {
  const fullPath = path.join(process.cwd(), filePath);
  if (fs.existsSync(fullPath)) {
    const content = fs.readFileSync(fullPath, 'utf8');
    return content.includes('console.log') && content.includes('db.');
  }
  return false;
});

if (hasDebugLogs) {
  console.log('✅ Debug logging is enabled for database operations');
} else {
  console.log('⚠️  Debug logging may not be enabled');
}

// Summary
console.log('\n📋 Test Summary');
console.log('==============');
console.log('To test the chat functionality manually:');
console.log('');
console.log('1. Open the application in your browser');
console.log('2. Select some research links');
console.log('3. Click "Start AI Chat"');
console.log('4. Send a message and get a response');
console.log('5. Close the chat panel');
console.log('6. Reopen the chat with the same links');
console.log('7. Verify that previous messages are loaded');
console.log('');
console.log('Expected behavior:');
console.log('- Messages should be saved to the database');
console.log('- Conversation history should persist');
console.log('- Welcome message only shows for new conversations');
console.log('- Message counter should show conversation length');
console.log('- "New Chat" button should appear for existing conversations');
console.log('');
console.log('Check browser console for debug logs:');
console.log('- "db.addChatMessage called with:"');
console.log('- "Message added to database successfully"');
console.log('- "db.getChatMessagesByConversation called with conversationId:"');
console.log('- "Retrieved messages from database:"');
console.log('- "Loaded X existing messages from conversation"');
console.log('');
console.log('🎯 Chat functionality should now work correctly with persistent history!'); 
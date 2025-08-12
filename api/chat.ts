// Free AI Chat API endpoint
// Uses free-tier models from Together AI, Groq, or similar providers

import type { NextRequest } from 'next/server';

// Configuration for different free AI providers
const AI_PROVIDERS = {
  together: {
    name: 'Together AI',
    baseUrl: 'https://api.together.xyz/v1',
    model: 'mistralai/Mixtral-8x7B-Instruct-v0.1',
    apiKey: process.env.TOGETHER_API_KEY,
    free: true
  },
  groq: {
    name: 'Groq',
    baseUrl: 'https://api.groq.com/openai/v1',
    model: 'llama3-8b-8192',
    apiKey: process.env.GROQ_API_KEY,
    free: true
  },
  fireworks: {
    name: 'Fireworks AI',
    baseUrl: 'https://api.fireworks.ai/inference/v1',
    model: 'accounts/fireworks/models/llama-v2-7b-chat',
    apiKey: process.env.FIREWORKS_API_KEY,
    free: true
  }
};

// Select the best available provider
function getBestProvider() {
  for (const [key, provider] of Object.entries(AI_PROVIDERS)) {
    if (provider.apiKey && provider.free) {
      return { key, ...provider };
    }
  }
  return null;
}

// Format messages for different providers
function formatMessages(messages: any[], provider: string) {
  if (provider === 'together' || provider === 'groq') {
    return messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));
  }
  
  if (provider === 'fireworks') {
    // Fireworks uses a different format
    return messages.map(msg => ({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: msg.content
    }));
  }
  
  return messages;
}

// Make request to AI provider
async function makeAIRequest(provider: any, messages: any[]) {
  const formattedMessages = formatMessages(messages, provider.key);
  
  const requestBody = {
    model: provider.model,
    messages: formattedMessages,
    max_tokens: 1000,
    temperature: 0.7,
    stream: false
  };

  const response = await fetch(`${provider.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${provider.apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    throw new Error(`AI provider error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || 'No response from AI';
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, model } = body;

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ 
        error: 'Invalid messages format' 
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get the best available provider
    const provider = getBestProvider();
    
    if (!provider) {
      return new Response(JSON.stringify({ 
        error: 'No AI provider available. Please configure API keys.' 
      }), { 
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log(`[AI Chat] Using provider: ${provider.name}`);

    // Make the AI request
    const response = await makeAIRequest(provider, messages);

    return new Response(JSON.stringify({
      response,
      provider: provider.name,
      model: provider.model
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[AI Chat] Error:', error);
    
    return new Response(JSON.stringify({ 
      error: 'Failed to process chat request',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Health check endpoint
export async function GET() {
  const provider = getBestProvider();
  
  return new Response(JSON.stringify({
    status: 'ok',
    provider: provider ? provider.name : 'none',
    available: !!provider
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
} 
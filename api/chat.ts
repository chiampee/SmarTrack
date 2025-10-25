// Free AI Chat API endpoint
// Uses free-tier models from Together AI, Groq, or similar providers

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

// Vercel Node serverless function handler
export default async function handler(
  req: import('@vercel/node').VercelRequest,
  res: import('@vercel/node').VercelResponse
) {
  try {
    if (req.method === 'GET' || req.method === 'HEAD') {
      const provider = getBestProvider();
      if (req.method === 'HEAD') {
        return res.status(200).end();
      }
      return res.status(200).json({
        status: 'ok',
        provider: provider ? provider.name : 'none',
        available: !!provider
      });
    }

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { messages } = (req.body || {}) as { messages?: any[] };

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Invalid messages format' });
    }

    const provider = getBestProvider();
    if (!provider) {
      return res.status(503).json({ error: 'No AI provider available. Please configure API keys.' });
    }

    console.log(`[AI Chat] Using provider: ${provider.name}`);
    const responseText = await makeAIRequest(provider, messages);

    return res.status(200).json({
      response: responseText,
      provider: provider.name,
      model: provider.model
    });
  } catch (error: any) {
    console.error('[AI Chat] Error:', error);
    return res.status(500).json({
      error: 'Failed to process chat request',
      details: error?.message || 'Unknown error'
    });
  }
}
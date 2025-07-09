// Basic AI service that talks to OpenAI (and optionally Mistral) chat completion endpoints.
// API keys are expected in Vite env variables (see README):
//   VITE_OPENAI_API_KEY
//   VITE_MISTRAL_API_KEY
// The caller should supply the model name; defaults to gpt-3.5-turbo.
//
// This file purposefully avoids importing the heavy `openai` npm package and instead
// uses the Fetch API available in the browser/runtime. It implements:
// 1. Exponential-backoff retries for transient errors / 429 / 5xx.
// 2. Simple in-memory rate-limiting (max N concurrent, delay queue).
// 3. Fallback to the Mistral endpoint if OpenAI fails (optional key required).
// 4. 30-second request timeout.

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatOptions {
  model?: string; // e.g. "gpt-3.5-turbo" or "mistral-small"
  maxTokens?: number;
  temperature?: number;
}

const OPENAI_ENDPOINT = 'https://api.openai.com/v1/chat/completions';
const MISTRAL_ENDPOINT = 'https://api.mistral.ai/v1/chat/completions';

// ----- Rate limiting -----
const MAX_CONCURRENT = 2;
const queue: (() => Promise<void>)[] = [];
let activeCount = 0;

async function withRateLimit<T>(fn: () => Promise<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const run = async () => {
      activeCount++;
      try {
        const result = await fn();
        resolve(result);
      } catch (err) {
        reject(err);
      } finally {
        activeCount--;
        if (queue.length) {
          const next = queue.shift();
          if (next) void next();
        }
      }
    };

    if (activeCount < MAX_CONCURRENT) {
      void run();
    } else {
      queue.push(run);
    }
  });
}

// ----- Fetch with timeout -----
async function fetchWithTimeout(input: RequestInfo | URL, init: RequestInit & { timeout?: number }) {
  const { timeout = 30000, ...rest } = init;
  const ctrl = new AbortController();
  const to = setTimeout(() => ctrl.abort(), timeout);
  try {
    const res = await fetch(input, { ...rest, signal: ctrl.signal });
    return res;
  } finally {
    clearTimeout(to);
  }
}

// ----- Retry wrapper -----
async function retry<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (err: any) {
      attempt++;
      if (attempt > retries) throw err;
      const delay = Math.pow(2, attempt) * 500 + Math.random() * 100;
      await new Promise((r) => setTimeout(r, delay));
    }
  }
}

export const aiService = {
  async chat(messages: ChatMessage[], opts: ChatOptions = {}): Promise<string> {
    const model = opts.model || 'gpt-3.5-turbo';
    const openaiKey = import.meta.env.VITE_OPENAI_API_KEY as string | undefined;
    const mistralKey = import.meta.env.VITE_MISTRAL_API_KEY as string | undefined;

    if (!openaiKey && !mistralKey) {
      throw new Error('No AI provider API key configured');
    }

    const callProvider = async (provider: 'openai' | 'mistral'): Promise<string> => {
      const endpoint = provider === 'openai' ? OPENAI_ENDPOINT : MISTRAL_ENDPOINT;
      const key = provider === 'openai' ? openaiKey : mistralKey;
      if (!key) throw new Error(`${provider} key missing`);

      const body = {
        model,
        messages,
        max_tokens: opts.maxTokens ?? 512,
        temperature: opts.temperature ?? 0.7,
      } as Record<string, unknown>;

      const res = await fetchWithTimeout(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify(body),
        timeout: 30000,
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`${provider} ${res.status}: ${errText}`);
      }

      const data = await res.json();
      const content = data.choices?.[0]?.message?.content;
      if (!content) throw new Error(`${provider} empty response`);
      return content.trim();
    };

    // Wrapper with retry and rate-limit
    const safeCall = (prov: 'openai' | 'mistral') =>
      withRateLimit(() => retry(() => callProvider(prov), 2));

    // Prefer OpenAI, fallback to Mistral
    if (openaiKey) {
      try {
        return await safeCall('openai');
      } catch (err) {
        console.warn('OpenAI failed, attempting fallback', err);
        if (mistralKey) {
          return await safeCall('mistral');
        }
        throw err;
      }
    }
    // Otherwise directly call Mistral
    return safeCall('mistral');
  },
}; 
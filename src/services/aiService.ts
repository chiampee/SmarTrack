/**
 * aiService.ts
 * -------------
 * Universal client-side wrapper around AI providers with free tier support.
 * Supports both free API endpoint and user-provided API keys with automatic fallback.
 *
 * Environment variables required (see README):
 *   VITE_OPENAI_API_KEY       – optional for OpenAI chat & embeddings
 *   VITE_MISTRAL_API_KEY      – optional fallback provider for chat
 *   VITE_OPENAI_MODEL         – defaults to gpt-4o if absent
 *   VITE_OPENAI_EMBED_MODEL   – defaults to text-embedding-3-small if absent
 *
 * Public API:
 *   • chat(messages, opts?)         → Promise<string>
 *   • chatStream(messages, cb, opts?) → Promise<string> (delta callback)
 *   • embed(text, model?)           → Promise<number[]>
 *
 * All functions throw rich Error objects – callers are expected to handle/display.
 */

import { logError } from '../utils/logger';
import { useSettingsStore } from '../stores/settingsStore';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatOptions {
  model?: string; // e.g. "gpt-3.5-turbo" or "mistral-small"
  maxTokens?: number;
  temperature?: number;
  useUserKey?: boolean; // Force use of user's API key
}

const OPENAI_ENDPOINT = 'https://api.openai.com/v1/chat/completions';
const MISTRAL_ENDPOINT = 'https://api.mistral.ai/v1/chat/completions';
const FREE_API_ENDPOINT = '/api/chat'; // Our free API endpoint

// Default chat model – can be overridden via env
const DEFAULT_CHAT_MODEL = import.meta.env.VITE_OPENAI_MODEL || 'gpt-4o';

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

// ----- Get user settings -----
function getUserSettings() {
  try {
    // Try to get settings from store (if in React context)
    const store = useSettingsStore?.getState();
    if (store) {
      return {
        userApiKey: store.userApiKey,
        useUserKey: store.useUserKey
      };
    }
  } catch (error) {
    // Not in React context, fallback to localStorage
  }
  
  // Fallback to localStorage
  return {
    userApiKey: localStorage.getItem('userApiKey'),
    useUserKey: localStorage.getItem('useUserKey') === 'true'
  };
}

// ----- Check free API availability -----
async function checkFreeAPI(): Promise<boolean> {
  try {
    const response = await fetch(FREE_API_ENDPOINT, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    return false;
  }
}

const cryptoSubtle = typeof crypto !== 'undefined' && crypto.subtle;
const embedCache = new Map<string, number[]>();

async function hashText(text: string): Promise<string> {
  if (!cryptoSubtle) return text; // fallback
  const enc = new TextEncoder().encode(text);
  const buf = await cryptoSubtle.digest('SHA-256', enc);
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export const aiService = {
  async chat(messages: ChatMessage[], opts: ChatOptions = {}): Promise<string> {
    const model = opts.model || DEFAULT_CHAT_MODEL;
    const settings = getUserSettings();
    const openaiKey = import.meta.env.VITE_OPENAI_API_KEY as string | undefined;
    const mistralKey = import.meta.env.VITE_MISTRAL_API_KEY as string | undefined;

    // Determine which provider to use
    const useUserKey = opts.useUserKey ?? settings.useUserKey;
    const userApiKey = settings.userApiKey;

    // Priority order:
    // 1. User's API key (if enabled and provided)
    // 2. Free API endpoint (if available)
    // 3. Environment API keys (OpenAI, then Mistral)
    // 4. Fallback to free API with error handling

    // Try user's API key first
    if (useUserKey && userApiKey) {
      try {
        return await this.callOpenAI(messages, opts, userApiKey);
      } catch (error) {
        console.warn('User API key failed, trying fallback:', error);
      }
    }

    // Try free API endpoint
    const freeAPIAvailable = await checkFreeAPI();
    if (freeAPIAvailable) {
      try {
        return await this.callFreeAPI(messages, opts);
      } catch (error) {
        console.warn('Free API failed, trying environment keys:', error);
      }
    }

    // Try environment API keys
    if (openaiKey || mistralKey) {
      try {
        return await this.callEnvironmentAPI(messages, opts, openaiKey, mistralKey);
      } catch (error) {
        console.warn('Environment API keys failed:', error);
      }
    }

    // Final fallback to free API (even if we think it's not available)
    try {
      return await this.callFreeAPI(messages, opts);
    } catch (error) {
      // Provide a helpful fallback response when no AI provider is available
      const lastUserMessage = messages.filter(m => m.role === 'user').pop();
      if (lastUserMessage) {
        return `I apologize, but I'm currently unable to process your request because no AI provider is configured. 

**To fix this issue:**

1. **Configure an OpenAI API Key:**
   - Visit [OpenAI Platform](https://platform.openai.com/api-keys)
   - Create a new API key
   - Add it to your environment variables or use the app's setup wizard

2. **Quick Setup:**
   - Open the diagnostic modal in the app
   - Click "Configure API Key"
   - Follow the setup instructions

3. **Alternative:**
   - Check your internet connection
   - Ensure the API key has sufficient credits
   - Try again in a few minutes

**Your question was:** "${lastUserMessage.content}"

Once you configure an API key, I'll be able to provide detailed, contextual responses based on your research materials.`;
      }
      
      throw new Error('No AI provider available. Please configure an API key or check your connection.');
    }
  },

  // Call user's OpenAI API key
  async callOpenAI(messages: ChatMessage[], opts: ChatOptions, apiKey: string): Promise<string> {
    const model = opts.model || DEFAULT_CHAT_MODEL;
    
    const body = {
      model,
      messages,
      max_tokens: opts.maxTokens ?? 2048,
      temperature: opts.temperature ?? 0.3,
      top_p: 0.9,
      frequency_penalty: 0.1,
      presence_penalty: 0.1,
    };

    const res = await fetchWithTimeout(OPENAI_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
      timeout: 30000,
    });

    if (!res.ok) {
      const errText = await res.text();
      let errorMessage = `OpenAI ${res.status}: ${errText}`;
      
      switch (res.status) {
        case 401:
          errorMessage = 'Invalid API Key: Please check your OpenAI API key.';
          break;
        case 402:
          errorMessage = 'Insufficient Credits: Your OpenAI account doesn\'t have enough credits.';
          break;
        case 429:
          errorMessage = 'Rate Limit Exceeded: Too many requests. Please try again later.';
          break;
        case 403:
          errorMessage = 'Access Denied: Your API key doesn\'t have the required permissions.';
          break;
        case 500:
          errorMessage = 'OpenAI Server Error: Service temporarily unavailable.';
          break;
        case 502:
        case 503:
        case 504:
          errorMessage = 'OpenAI Service Unavailable: Service experiencing issues.';
          break;
      }
      
      throw new Error(errorMessage);
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error('OpenAI empty response');
    return content.trim();
  },

  // Call our free API endpoint
  async callFreeAPI(messages: ChatMessage[], opts: ChatOptions): Promise<string> {
    const body = {
      messages,
      model: opts.model || 'free-tier',
      maxTokens: opts.maxTokens ?? 1000,
      temperature: opts.temperature ?? 0.7,
    };

    const res = await fetchWithTimeout(FREE_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      timeout: 30000,
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || `Free API error: ${res.status}`);
    }

    const data = await res.json();
    return data.response || 'No response from free API';
  },

  // Call environment API keys (OpenAI or Mistral)
  async callEnvironmentAPI(messages: ChatMessage[], opts: ChatOptions, openaiKey?: string, mistralKey?: string): Promise<string> {
    const model = opts.model || DEFAULT_CHAT_MODEL;

    const callProvider = async (provider: 'openai' | 'mistral'): Promise<string> => {
      const endpoint = provider === 'openai' ? OPENAI_ENDPOINT : MISTRAL_ENDPOINT;
      const key = provider === 'openai' ? openaiKey : mistralKey;
      if (!key) throw new Error(`${provider} key missing`);

      const body = {
        model,
        messages,
        max_tokens: opts.maxTokens ?? 2048,
        temperature: opts.temperature ?? 0.3,
        top_p: 0.9,
        frequency_penalty: 0.1,
        presence_penalty: 0.1,
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
        let errorMessage = `${provider} ${res.status}: ${errText}`;
        
        switch (res.status) {
          case 401:
            errorMessage = 'API Key Not Found: The API key you provided doesn\'t exist in our system.';
            break;
          case 402:
            errorMessage = 'Insufficient Credits: Your account doesn\'t have enough credits for API calls.';
            break;
          case 429:
            errorMessage = 'Rate Limit Exceeded: You\'ve made too many API requests in a short time period.';
            break;
          case 403:
            errorMessage = 'Access Denied: Your API key doesn\'t have the required permissions.';
            break;
          case 500:
            errorMessage = 'Server Error: The service is temporarily unavailable. Please try again later.';
            break;
          case 502:
          case 503:
          case 504:
            errorMessage = 'Service Unavailable: The service is experiencing issues. Please try again later.';
            break;
        }
        
        throw new Error(errorMessage);
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

  /**
   * Streamed chat – calls onDelta each time new text chunk arrives.
   * Returns full accumulated assistant message when stream completes.
   */
  async chatStream(
    messages: ChatMessage[],
    onDelta: (partial: string) => void,
    opts: ChatOptions = {},
  ): Promise<string> {
    const settings = getUserSettings();
    const useUserKey = opts.useUserKey ?? settings.useUserKey;
    const userApiKey = settings.userApiKey;

    // For streaming, prefer user's API key or environment OpenAI key
    if ((useUserKey && userApiKey) || import.meta.env.VITE_OPENAI_API_KEY) {
      const apiKey = useUserKey && userApiKey ? userApiKey : import.meta.env.VITE_OPENAI_API_KEY;
      return this.streamOpenAI(messages, onDelta, opts, apiKey);
    }

    // Fallback to non-streaming for free API
    const full = await this.chat(messages, opts);
    onDelta(full);
    return full;
  },

  // Stream with OpenAI
  async streamOpenAI(
    messages: ChatMessage[],
    onDelta: (partial: string) => void,
    opts: ChatOptions = {},
    apiKey: string,
  ): Promise<string> {
    const model = opts.model || DEFAULT_CHAT_MODEL;

    const body = {
      model,
      messages,
      stream: true,
      max_tokens: opts.maxTokens ?? 2048,
      temperature: opts.temperature ?? 0.3,
      top_p: 0.9,
      frequency_penalty: 0.1,
      presence_penalty: 0.1,
    } as Record<string, unknown>;

    const res = await fetchWithTimeout(OPENAI_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
      timeout: 60000,
    });

    if (!res.ok || !res.body) {
      throw new Error(`OpenAI stream error ${res.status}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let done = false;
    let acc = '';
    while (!done) {
      const { value, done: d } = await reader.read();
      done = d;
      if (value) {
        const txt = decoder.decode(value, { stream: true });
        const lines = txt.split('\n');
        for (const l of lines) {
          const m = l.trim();
          if (m.startsWith('data: ')) {
            const json = m.replace('data: ', '').trim();
            if (json === '[DONE]') continue;
            try {
              const chunk = JSON.parse(json);
              const delta = chunk.choices?.[0]?.delta?.content;
              if (delta) {
                acc += delta;
                onDelta(acc);
              }
            } catch {}
          }
        }
      }
    }
    return acc.trim();
  },

  async embed(text: string, model = import.meta.env.VITE_OPENAI_EMBED_MODEL || "text-embedding-3-large"): Promise<number[]> {
     const key = await hashText(text + "|" + model);
     if (embedCache.has(key)) return embedCache.get(key)!;

     // localStorage persistent cache
     try {
       const cachedRaw = localStorage.getItem("emb_" + key);
       if (cachedRaw) {
         const arr = JSON.parse(cachedRaw) as number[];
         embedCache.set(key, arr);
         return arr;
       }
     } catch (err) {
       logError('aiService.embed.readCache', err);
     }

     const settings = getUserSettings();
     const useUserKey = settings.useUserKey;
     const userApiKey = settings.userApiKey;
     const openaiKey = import.meta.env.VITE_OPENAI_API_KEY as string | undefined;

     // Use user's API key if available, otherwise fall back to environment key
     const apiKey = (useUserKey && userApiKey) ? userApiKey : openaiKey;
     
     if (!apiKey) {
       throw new Error("No OpenAI API key available for embeddings");
     }

     const fetchEmbedding = async () => {
      const attempt = async (mdl: string) => {
        const res = await fetchWithTimeout("https://api.openai.com/v1/embeddings", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({ model: mdl, input: text }),
          timeout: 30000,
        });

        if (!res.ok) {
          const errText = await res.text();
          let errorMessage = `OpenAI embeddings error ${res.status}: ${errText}`;
          
          switch (res.status) {
            case 401:
              errorMessage = 'API Key Not Found: The API key you provided doesn\'t exist in our system.';
              break;
            case 402:
              errorMessage = 'Insufficient Credits: Your OpenAI account doesn\'t have enough credits for embeddings.';
              break;
            case 429:
              errorMessage = 'Rate Limit Exceeded: You\'ve made too many embedding requests.';
              break;
            case 403:
              errorMessage = 'Access Denied: Your API key doesn\'t have embedding permissions.';
              break;
            case 404:
              errorMessage = 'Model Not Found: The embedding model is not available.';
              break;
          }
          
          const isModelErr = res.status === 404 || errText.includes("model");
          if (isModelErr && mdl !== "text-embedding-ada-002") {
            console.warn(`Embedding model ${mdl} not available, falling back to ada-002`);
            return attempt("text-embedding-ada-002");
          }
          throw new Error(errorMessage);
        }

        const data = await res.json();
        const vector = data.data?.[0]?.embedding as number[];
        if (!vector) throw new Error("No embedding returned");
        return vector;
      };

      return attempt(model);
    };

     // Enforce concurrency limit of 3
     const embedding = await withRateLimit(() => fetchEmbedding());

     embedCache.set(key, embedding);
     try {
       localStorage.setItem("emb_" + key, JSON.stringify(embedding));
     } catch (err) {
       logError('aiService.embed.writeCache', err);
     }

     return embedding;
   },

   // Check if free API is available
   async checkFreeAPIAvailability(): Promise<boolean> {
     return checkFreeAPI();
   },

   // Get current provider info
   async getProviderInfo(): Promise<{ type: string; available: boolean; model?: string }> {
     const settings = getUserSettings();
     const useUserKey = settings.useUserKey;
     const userApiKey = settings.userApiKey;
     const openaiKey = import.meta.env.VITE_OPENAI_API_KEY;
     const mistralKey = import.meta.env.VITE_MISTRAL_API_KEY;

     if (useUserKey && userApiKey) {
       return { type: 'user-openai', available: true, model: DEFAULT_CHAT_MODEL };
     }

     if (openaiKey) {
       return { type: 'environment-openai', available: true, model: DEFAULT_CHAT_MODEL };
     }

     if (mistralKey) {
       return { type: 'environment-mistral', available: true, model: DEFAULT_CHAT_MODEL };
     }

     const freeAPIAvailable = await checkFreeAPI();
     if (freeAPIAvailable) {
       return { type: 'free-api', available: true, model: 'free-tier' };
     }

     return { type: 'none', available: false };
   }
}; 
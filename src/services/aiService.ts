/**
 * aiService.ts
 * -------------
 * Universal client-side wrapper around OpenAI (and optionally Mistral) HTTP endpoints.
 * The goals of this layer:
 *   1. Hide vendor differences behind a single chat() / chatStream() / embed() API.
 *   2. Provide sensible production-ready features (retries, timeouts, rate-limit, caching).
 *   3. Remain lightweight – no large official SDKs, only fetch() is used so it runs
 *      in browsers, service-workers and Node test runners alike.
 *
 * Environment variables required (see README):
 *   VITE_OPENAI_API_KEY       – mandatory for OpenAI chat & embeddings
 *   VITE_MISTRAL_API_KEY      – optional fallback provider for chat
 *   VITE_OPENAI_MODEL         – defaults to gpt-4.5-preview if absent
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

// Default chat model – can be overridden via env
const DEFAULT_CHAT_MODEL = import.meta.env.VITE_OPENAI_MODEL || 'gpt-4.5-preview';

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
        let errorMessage = `${provider} ${res.status}: ${errText}`;
        
        // Provide more specific error messages based on status codes
        switch (res.status) {
          case 401:
            errorMessage = 'API Key Not Found: The API key you provided doesn\'t exist in our system.';
            break;
          case 402:
            errorMessage = 'Insufficient Credits: Your OpenAI account doesn\'t have enough credits for API calls.';
            break;
          case 429:
            errorMessage = 'Rate Limit Exceeded: You\'ve made too many API requests in a short time period.';
            break;
          case 403:
            errorMessage = 'Access Denied: Your API key doesn\'t have the required permissions.';
            break;
          case 500:
            errorMessage = 'OpenAI Server Error: The service is temporarily unavailable. Please try again later.';
            break;
          case 502:
          case 503:
          case 504:
            errorMessage = 'OpenAI Service Unavailable: The service is experiencing issues. Please try again later.';
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
    const model = opts.model || DEFAULT_CHAT_MODEL;
    const openaiKey = import.meta.env.VITE_OPENAI_API_KEY as string | undefined;
    if (!openaiKey) {
      // fallback to non-stream
      const full = await this.chat(messages, opts);
      onDelta(full);
      return full;
    }

    const body = {
      model,
      messages,
      stream: true,
      max_tokens: opts.maxTokens ?? 512,
      temperature: opts.temperature ?? 0.7,
    } as Record<string, unknown>;

    const res = await fetchWithTimeout(OPENAI_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${openaiKey}`,
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

  async embed(text: string, model = import.meta.env.VITE_OPENAI_EMBED_MODEL || "text-embedding-3-small"): Promise<number[]> {
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

     const openaiKey = import.meta.env.VITE_OPENAI_API_KEY as string | undefined;
     if (!openaiKey) {
       throw new Error("OpenAI key missing for embeddings");
     }

     const fetchEmbedding = async () => {
      const attempt = async (mdl: string) => {
        const res = await fetchWithTimeout("https://api.openai.com/v1/embeddings", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${openaiKey}`,
          },
          body: JSON.stringify({ model: mdl, input: text }),
          timeout: 30000,
        });

        if (!res.ok) {
          const errText = await res.text();
          let errorMessage = `OpenAI embeddings error ${res.status}: ${errText}`;
          
          // Provide more specific error messages for embeddings
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
            // retry with universally available Ada model
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
}; 
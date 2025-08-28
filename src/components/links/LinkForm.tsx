import React, { useState, useEffect } from 'react';
import { Input, Button, LoadingSpinner, Select } from '..';
import { Link } from '../../types/Link';
import { useLinkStore } from '../../stores/linkStore';
import { linkStore } from '../../stores/linkStore';
import { fetchMetadata } from '../../utils/metadata';
import { aiService } from '../../services/aiService';
import { suggestLabelsForDraft, suggestPriorityForDraft, suggestBoardForDraft } from '../../services';
import { useBoardStore } from '../../stores/boardStore';

interface Props {
  onSuccess: () => void;
  existing?: Link;
}

export const LinkForm: React.FC<Props> = ({ onSuccess, existing }) => {
  const [name, setName] = useState(existing?.metadata.title || '');
  const [url, setUrl] = useState(existing?.url || '');
  const [description, setDescription] = useState(
    existing?.metadata.description || ''
  );
  const [labels, setLabels] = useState<string>(existing?.labels.join(', ') || '');
  const [priority, setPriority] = useState<Link['priority']>(
    existing?.priority || 'medium'
  );
  const [status, setStatus] = useState<Link['status']>(
    existing?.status || 'active'
  );
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string>('');
  const [labelSuggestions, setLabelSuggestions] = useState<string[]>([]);
  const [prioritySuggestion, setPrioritySuggestion] = useState<Link['priority'] | null>(null);
  const [autoAppliedLabels, setAutoAppliedLabels] = useState<boolean>(false);
  const [autoAppliedPriority, setAutoAppliedPriority] = useState<boolean>(false);
  const [boardId, setBoardId] = useState<string>(existing?.boardId || '');
  const [autoAppliedBoard, setAutoAppliedBoard] = useState<boolean>(false);
  const { boards, loadBoards } = useBoardStore();
  const { addLink } = useLinkStore();
  const { updateLink } = useLinkStore();

  const normalizeUrl = (u: string) => u.replace(/\/+$/, '').toLowerCase();
  const descLimit = 500;
  const descCount = description.length;
  const descNearLimit = descCount > descLimit - 50;

  // Load boards on mount for the selector
  useEffect(() => {
    void loadBoards();
  }, [loadBoards]);

  // Auto-suggest labels and priority as the user types (debounced)
  useEffect(() => {
    if (existing) return; // only auto-suggest for new links
    const handle = setTimeout(async () => {
      try {
        console.log('[Suggest] Effect triggered with:', { url, name, description });
        const state = linkStore.getState();
        let existingLinks = state.rawLinks || [];
        if (!existingLinks.length) {
          try {
            await state.fetchLinks();
            existingLinks = linkStore.getState().rawLinks || [];
          } catch {}
        }
        if (!existingLinks.length) {
          // Use filtered list as a fallback for suggestions to avoid empty state
          const filtered = linkStore.getState().links || [];
          if (filtered.length) {
            console.log('[Suggest] Falling back to filtered links for suggestions:', filtered.length);
            existingLinks = filtered;
          }
        }
        console.log('[Suggest] Existing links available:', existingLinks.length);
        try { await loadBoards(); } catch {}

        const suggestions = suggestLabelsForDraft({ url, title: name, description }, existingLinks);
        setLabelSuggestions(suggestions);
        console.log('[Suggest] Label suggestions:', suggestions);

        if (!autoAppliedLabels && (!labels || labels.trim().length === 0) && suggestions.length) {
          const prefill = suggestions.slice(0, 3).join(', ');
          if (prefill) {
            console.log('[Suggest] Auto-prefilling labels with:', prefill);
            setLabels(prefill);
            setAutoAppliedLabels(true);
          }
        }

        const p = suggestPriorityForDraft({ url, title: name, description }, existingLinks);
        setPrioritySuggestion(p);
        if (!autoAppliedPriority && p) {
          console.log('[Suggest] Auto-setting priority:', p);
          setPriority(p);
          setAutoAppliedPriority(true);
        }

        if (!autoAppliedBoard) {
          const bid = suggestBoardForDraft({ url, title: name, description }, existingLinks);
          if (bid) {
            console.log('[Suggest] Auto-selecting boardId:', bid);
            setBoardId(bid);
            setAutoAppliedBoard(true);
          }
        }
      } catch {}
    }, 500);
    return () => clearTimeout(handle);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, name, description]);

  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setLoading(true);
        setFormError('');

        // 1. Editing existing link – update inline and finish.
        if (existing) {
          await updateLink(existing.id, {
            url,
            metadata: {
              ...existing.metadata,
              description,
              title: name || existing.metadata.title || url,
            },
            labels: labels
              .split(',')
              .map((l) => l.trim())
              .filter(Boolean),
            priority,
            status,
            boardId: boardId || undefined,
          });
          console.log('[Suggest] Updated existing link with boardId:', boardId || undefined);
          setLoading(false);
          onSuccess();
          return;
        }

        // Validate and normalize URL
        let finalUrl = url.trim();
        if (!/^https?:\/\//i.test(finalUrl)) {
          finalUrl = `https://${finalUrl}`;
        }
        try {
          // Throws if invalid
          // eslint-disable-next-line no-new
          new URL(finalUrl);
        } catch {
          setFormError('Please enter a valid URL.');
          setLoading(false);
          return;
        }

        // Duplicate check against current source (extension or local DB)
        try {
          await linkStore.getState().fetchLinks();
          const existingLinks = linkStore.getState().rawLinks || [];
          const exists = existingLinks.some((l) => normalizeUrl(l.url) === normalizeUrl(finalUrl));
          if (exists) {
            setFormError('This link is already saved.');
            setLoading(false);
            return;
          }
        } catch {}

        // 2. Optimistic creation – immediately insert a placeholder link so UI updates instantly.
        const id = crypto.randomUUID();

        const placeholderMeta = {
          title:
            name || (() => {
              try {
                const u = new URL(finalUrl);
                let host = u.hostname;
                if (host.startsWith('www.')) host = host.slice(4);
                return host;
              } catch {
                return finalUrl;
              }
            })(),
          description: description || '',
          image: '',
        };

        const link: Link = {
          id,
          url: finalUrl,
          metadata: placeholderMeta,
          labels: labels
            .split(',')
            .map((l) => l.trim())
            .filter(Boolean),
          priority,
          status,
          boardId: boardId || undefined,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        // Add the placeholder link immediately.
        await addLink(link);
        console.log('[Suggest] Created new link with boardId:', boardId || undefined);
        setLoading(false);
        onSuccess();

        // 3. Fetch metadata in the background and patch the link once retrieved.
        try {
          const meta = await fetchMetadata(finalUrl);
          if (name) meta.title = name; // user-supplied name takes precedence
          if (description) meta.description = description; // keep manual description

          await updateLink(id, {
            metadata: {
              title: meta.title,
              description: meta.description,
              image: meta.image,
            },
          });
        } catch (err) {
          // Metadata fetch failure should not break UX – silently ignore.
          console.error('Metadata fetch failed', err);
        }
        }}
    >
      {formError && (
        <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-md p-2">
          {formError}
        </div>
      )}
      {/* Basic Information Section */}
      <div className="space-y-3">
        <h3 className="text-base font-semibold text-gray-900 flex items-center justify-between">
          <span>Basic Information</span>
          <span className="text-[11px] text-gray-500">Press Enter to save</span>
        </h3>
        
        <Input
          label="Name (optional)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter a descriptive name for this link..."
          className="py-2 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
        />
        
        <div className="space-y-1.5">
          <Input
            label="URL"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            required
            className="py-2 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
          <p className="text-[11px] text-gray-500">We’ll auto-add https:// if missing.</p>
        </div>
      </div>

      {/* Enhanced Description Section */}
      <div className="space-y-3">
        <h3 className="text-base font-semibold text-gray-900">Description</h3>
        
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value.slice(0, descLimit))}
            placeholder="Add a brief description of this link, what it's about, or why you're saving it..."
            rows={3}
            className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-none placeholder-gray-400 ${descNearLimit ? 'ring-amber-300' : ''}`}
          />
          <div className="flex items-center justify-between">
            <p className={`text-[11px] ${descNearLimit ? 'text-amber-600' : 'text-gray-500'}`}>
              {descCount}/{descLimit} characters
            </p>
            <button
              type="button"
              className="text-[11px] text-blue-600 hover:text-blue-700 font-medium"
              onClick={async () => {
                try {
                  setLoading(true);
                  // Normalize URL for fetches
                  const u = url.trim();
                  const finalUrl = /^https?:\/\//i.test(u) ? u : `https://${u}`;
                  // Fetch page text and create a >10 word AI-style summary (no title usage)
                  let summary = '';
                  // Helpers to clean noisy scraper text
                  const stripMeta = (txt: string) => {
                    // Remove markdown images, links, and HTML
                    let cleaned = txt
                      .replace(/!\[.*?\]\(.*?\)/g, '') // Remove markdown images
                      .replace(/\[.*?\]\(.*?\)/g, '') // Remove markdown links
                      .replace(/<[^>]*>/g, '') // Remove HTML tags
                      .replace(/&[a-zA-Z]+;/g, ' ') // Remove HTML entities
                      .replace(/https?:\/\/[^\s]+/g, '') // Remove URLs
                      .replace(/[^\w\s.,!?-]/g, ' ') // Remove special characters except basic punctuation
                      .replace(/\s+/g, ' ') // Normalize whitespace
                      .trim();
                    
                    const metaRe = /^(url|url source|published time|markdown content|site name|author|title|source|by):/i;
                    const lines = cleaned.split('\n')
                      .map((l) => l.trim())
                      .filter((l) => l.length > 0)
                      .filter((l) => !metaRe.test(l))
                      .filter((l) => !/^https?:\/\//i.test(l))
                      .filter((l) => !/^#/.test(l))
                      .filter((l) => !/^!\[.*?\]/i.test(l)) // Extra filter for markdown images
                      .filter((l) => !/^\[.*?\]/i.test(l)); // Extra filter for markdown links
                    return lines.join(' ');
                  };
                  const candidateFromText = (raw: string) => {
                    const cleaned = stripMeta(raw);
                    const paras = cleaned
                      .split(/\n{1,}/)
                      .map((p) => p.replace(/\s+/g, ' ').trim())
                      .filter((p) => /[a-zA-Z]/.test(p) && p.split(' ').length >= 12);
                    const cand = paras.find((p) => /[.!?]/.test(p)) || paras[0] || cleaned;
                    const sentences = cand.split(/(?<=[.!?])\s+/);
                    const joined = sentences.slice(0, 2).join(' ');
                    return joined;
                  };
                  // Try AI first if available
                  try {
                    const info = await aiService.getProviderInfo();
                    const hasRealAI = info.type === 'user-openai' || info.type === 'environment-openai' || info.type === 'environment-mistral';
                    if (hasRealAI) {
                      console.log('[AutoFill] Using AI service:', info.type);
                      const messages = [
                        { role: 'system', content: 'You are a concise research assistant.' },
                        { role: 'user', content: `Visit this URL and write exactly 10 informative words summarizing the page content (no title, no quotes, no punctuation beyond spaces): ${finalUrl}` }
                      ];
                      const resp = await aiService.chat(messages as any, { maxTokens: 40, useUserKey: info.type === 'user-openai' });
                      if (resp) {
                        summary = resp.replace(/[^\w\s-]/g, ' ').replace(/\s{2,}/g, ' ').trim();
                        console.log('[AutoFill] AI response:', summary);
                      }
                    }
                  } catch (err) {
                    console.log('[AutoFill] AI failed, falling back to page text:', err);
                  }

                  // Fallback 1: Get page text and extract summary
                  if (!summary || summary.split(/\s+/).filter(Boolean).length < 5) {
                    try {
                      console.log('[AutoFill] Trying page text extraction...');
                      const { getPageText } = await import('../../utils/pageCache');
                      const text = await getPageText(finalUrl);
                      if (text) {
                        const joined = candidateFromText(text);
                        const words = joined.split(' ').filter(Boolean);
                        const slice = words.slice(0, Math.min(80, Math.max(20, words.length)));
                        summary = slice.join(' ').trim();
                        console.log('[AutoFill] Page text summary:', summary);
                      }
                    } catch (err) {
                      console.log('[AutoFill] Page text failed:', err);
                    }
                  }

                  // Fallback 2: Use jina.ai if available
                  if (!summary || summary.split(/\s+/).filter(Boolean).length < 5) {
                    try {
                      console.log('[AutoFill] Trying jina.ai...');
                      const clean = finalUrl.replace(/^https?:\/\//, '');
                      const res = await fetch(`https://r.jina.ai/http://${clean}`);
                      if (res.ok) {
                        let txt = await res.text();
                        const [, ...rest] = txt.split('\n');
                        txt = stripMeta(rest.join('\n'));
                        const joined = candidateFromText(txt);
                        const words = joined.replace(/\s+/g, ' ').trim().split(' ').filter(Boolean);
                        const slice = words.slice(0, 80);
                        if (slice.length >= 5) {
                          summary = slice.join(' ');
                          console.log('[AutoFill] Jina.ai summary:', summary);
                        }
                      }
                    } catch (err) {
                      console.log('[AutoFill] Jina.ai failed:', err);
                    }
                  }

                  // Fallback 3: Generate from URL slug
                  if (!summary || summary.split(/\s+/).filter(Boolean).length < 5) {
                    try {
                      console.log('[AutoFill] Generating from URL slug...');
                      const uo = new URL(finalUrl);
                      const slug = (uo.pathname + ' ' + (uo.search || ''))
                        .replace(/[\/_?&=]+/g, ' ')
                        .replace(/[^a-zA-Z0-9\s-]/g, ' ')
                        .replace(/\s{2,}/g, ' ')
                        .trim();
                      const words = slug.split(' ').filter(Boolean);
                      if (words.length) {
                        summary = words.slice(0, 20).join(' ');
                        console.log('[AutoFill] URL slug summary:', summary);
                      }
                    } catch (err) {
                      console.log('[AutoFill] URL slug failed:', err);
                    }
                  }

                  // Final guard: generic summary
                  if (!summary || summary.split(/\s+/).filter(Boolean).length < 5) {
                    try {
                      const host = new URL(finalUrl).hostname.replace(/^www\./, '');
                      summary = `Overview from ${host}: key highlights, essential context, and notable takeaways summarized for quick review.`;
                      console.log('[AutoFill] Generic summary:', summary);
                    } catch {
                      summary = 'Overview: key highlights, essential context, and notable takeaways summarized for quick review.';
                      console.log('[AutoFill] Fallback generic summary:', summary);
                    }
                  }

                  // Ensure exactly 10 words
                  const words = summary.split(/\s+/).filter(Boolean);
                  if (words.length > 10) {
                    summary = words.slice(0, 10).join(' ');
                  } else if (words.length < 10) {
                    const fillers = ['key', 'insights', 'and', 'context', 'overview', 'highlights'];
                    while (words.length < 10) {
                      words.push(fillers[(words.length) % fillers.length]);
                    }
                    summary = words.join(' ');
                  }
                  const wordCount = summary.split(/\s+/).filter(Boolean).length;
                  console.log(`[AutoFill] Final summary (${wordCount} words):`, summary);
                  console.log('[AutoFill] Setting description field to:', summary);
                  setDescription(summary);
                  console.log('[AutoFill] Description state updated');
                  setLoading(false);
                } catch {
                  setLoading(false);
                }
              }}
            >
              Auto-fill from page
            </button>
          </div>
        </div>
      </div>

      {/* Organization Section */}
      <div className="space-y-3">
        <h3 className="text-base font-semibold text-gray-900">Organization</h3>
        
        <Input
          label="Labels (comma separated)"
          value={labels}
          onChange={(e) => setLabels(e.target.value)}
          placeholder="research, ai, cybersecurity, tag1, tag2"
          className="py-2 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
        />

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="text-[12px] px-2 py-1 rounded-md bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100"
            onClick={async () => {
              try {
                // Ensure we use the latest in-memory links from the dashboard
                await linkStore.getState().fetchLinks();
                const existingLinks = linkStore.getState().rawLinks || [];
                const suggestions = suggestLabelsForDraft(
                  { url, title: name, description },
                  existingLinks,
                );
                setLabelSuggestions(suggestions);
                const p = suggestPriorityForDraft({ url, title: name, description }, existingLinks);
                setPrioritySuggestion(p);
              } catch {}
            }}
          >
            Suggest from dashboard
          </button>

          {labelSuggestions.map((s) => (
            <button
              key={s}
              type="button"
              className="text-[12px] px-2 py-1 rounded-full border border-gray-300 hover:border-gray-400 text-gray-700"
              onClick={() => {
                const current = labels.split(',').map((l) => l.trim()).filter(Boolean);
                if (!current.includes(s)) {
                  const next = [...current, s].join(', ');
                  setLabels(next);
                }
              }}
              title="Click to add label"
            >
              + {s}
            </button>
          ))}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Board (optional)
            </label>
            <select
              value={boardId}
              onChange={(e) => setBoardId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white"
            >
              <option value="">No board</option>
              {boards.map((b) => (
                <option key={b.id} value={b.id}>{b.title}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Priority
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as Link['priority'])}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white"
            >
              <option value="low" className="py-2">Low Priority</option>
              <option value="medium" className="py-2">Medium Priority</option>
              <option value="high" className="py-2">High Priority</option>
            </select>
            {prioritySuggestion && (
              <button
                type="button"
                className="text-[12px] mt-1 text-blue-700 hover:text-blue-900 underline"
                onClick={() => setPriority(prioritySuggestion)}
              >
                Apply suggested: {prioritySuggestion}
              </button>
            )}
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as Link['status'])}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white"
            >
              <option value="active" className="py-2">Active</option>
              <option value="archived" className="py-2">Archived (Done)</option>
              <option value="deleted" className="py-2">Deleted</option>
            </select>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="pt-3">
        <Button 
          type="submit" 
          disabled={loading}
          className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <LoadingSpinner />
              <span>Saving...</span>
            </div>
          ) : (
            <span>Save Link</span>
          )}
        </Button>
      </div>
    </form>
  );
};


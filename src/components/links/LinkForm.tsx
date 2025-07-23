import React, { useState } from 'react';
import { Input, Button, LoadingSpinner, Select } from '..';
import { Link } from '../../types/Link';
import { useLinkStore } from '../../stores/linkStore';
import { fetchMetadata } from '../../utils/metadata';

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
  const { addLink } = useLinkStore();
  const { updateLink } = useLinkStore();

  return (
    <form
      className="space-y-6"
      onSubmit={async (e) => {
        e.preventDefault();
        setLoading(true);

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
          });
          setLoading(false);
          onSuccess();
          return;
        }

        // 2. Optimistic creation – immediately insert a placeholder link so UI updates instantly.
        const id = crypto.randomUUID();

        const placeholderMeta = {
          title:
            name || (() => {
              try {
                const u = new URL(url.startsWith('http') ? url : `https://${url}`);
                let host = u.hostname;
                if (host.startsWith('www.')) host = host.slice(4);
                return host;
              } catch {
                return url;
              }
            })(),
          description: description || '',
          image: '',
        };

        const link: Link = {
          id,
          url,
          metadata: placeholderMeta,
          labels: labels
            .split(',')
            .map((l) => l.trim())
            .filter(Boolean),
          priority,
          status,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        // Add the placeholder link immediately.
        await addLink(link);
        setLoading(false);
        onSuccess();

        // 3. Fetch metadata in the background and patch the link once retrieved.
        try {
          const meta = await fetchMetadata(url);
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
      {/* Basic Information Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
          Basic Information
        </h3>
        
        <Input
          label="Name (optional)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter a descriptive name for this link..."
          className="focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        
        <Input
          label="URL"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com"
          required
          className="focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Enhanced Description Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
          Description
        </h3>
        
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add a brief description of this link, what it's about, or why you're saving it..."
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-none placeholder-gray-400"
          />
          <p className="text-xs text-gray-500">
            {description.length}/500 characters
          </p>
        </div>
      </div>

      {/* Organization Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
          Organization
        </h3>
        
        <Input
          label="Labels (comma separated)"
          value={labels}
          onChange={(e) => setLabels(e.target.value)}
          placeholder="research, ai, cybersecurity, tag1, tag2"
          className="focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Priority
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as Link['priority'])}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white"
            >
              <option value="low" className="py-2">Low Priority</option>
              <option value="medium" className="py-2">Medium Priority</option>
              <option value="high" className="py-2">High Priority</option>
            </select>
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as Link['status'])}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white"
            >
              <option value="active" className="py-2">Active</option>
              <option value="archived" className="py-2">Archived (Done)</option>
              <option value="deleted" className="py-2">Deleted</option>
            </select>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="pt-4 border-t border-gray-200">
        <Button 
          type="submit" 
          disabled={loading}
          className="w-full py-3 px-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
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

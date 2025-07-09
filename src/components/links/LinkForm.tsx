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
      className="flex flex-col gap-4"
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
      <Input
        label="Name (optional)"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <Input
        label="URL"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        required
      />
      <Input
        label="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <Input
        label="Labels (comma separated)"
        value={labels}
        onChange={(e) => setLabels(e.target.value)}
      />
      <Select label="Priority" value={priority} onChange={(e) => setPriority(e.target.value as Link['priority'])}>
        <option value="low">Low</option>
        <option value="medium">Medium</option>
        <option value="high">High</option>
      </Select>
      <Select label="Status" value={status} onChange={(e) => setStatus(e.target.value as Link['status'])}>
        <option value="active">Active</option>
        <option value="archived">Archived (Done)</option>
        <option value="deleted">Deleted</option>
      </Select>
      <Button type="submit" disabled={loading}>
        {loading ? <LoadingSpinner /> : 'Save'}
      </Button>
    </form>
  );
};

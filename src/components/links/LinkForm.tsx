import React, { useState } from 'react';
import { Input, Button, LoadingSpinner } from '..';
import { Link } from '../../types/Link';
import { linkService } from '../../services/linkService';
import { fetchMetadata } from '../../utils/metadata';

interface Props {
  onSuccess: () => void;
}

export const LinkForm: React.FC<Props> = ({ onSuccess }) => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setLoading(true);
        const meta = await fetchMetadata(url);
        const link: Link = {
          id: crypto.randomUUID(),
          url,
          metadata: meta,
          labels: [],
          priority: 'medium',
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        await linkService.create(link);
        setLoading(false);
        onSuccess();
      }}
    >
      <Input label="URL" value={url} onChange={(e) => setUrl(e.target.value)} required />
      <Button type="submit" disabled={loading}>
        {loading ? <LoadingSpinner /> : 'Save'}
      </Button>
    </form>
  );
}; 
import React from 'react';
import { Button } from '.';

interface Props {
  message: string;
  onRetry: () => void;
}

export const ErrorBanner: React.FC<Props> = ({ message, onRetry }) => (
  <div className="my-4 rounded border border-red-300 bg-red-50 p-4 text-sm text-red-700">
    <div className="mb-2">{message}</div>
    <Button variant="danger" size="sm" onClick={onRetry}>
      Retry
    </Button>
  </div>
);

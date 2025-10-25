import React from 'react';

export const Skeleton: React.FC<{ className?: string }> = ({
  className = '',
}) => <div className={`animate-pulse rounded bg-gray-200 ${className}`} />;

import React from 'react';

export type BadgeVariant = 'default' | 'success' | 'warning' | 'danger';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const badgeClasses: Record<BadgeVariant, string> = {
  default: 'bg-gray-200 text-gray-800',
  success: 'bg-amber-300 text-amber-900',
  warning: 'bg-rose-400 text-white',
  danger: 'bg-red-500 text-white',
};

export const Badge: React.FC<BadgeProps> = ({
  variant = 'default',
  children,
  className = '',
}) => (
  <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${badgeClasses[variant]} ${className}`}>{children}</span>
);

export default Badge;

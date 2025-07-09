import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  className = '',
  ...props
}) => (
  <div className="flex flex-col gap-1">
    {label && (
      <label className="text-sm font-medium text-gray-700">{label}</label>
    )}
    <input
      className={`rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 ${className}`}
      {...props}
    />
  </div>
);

export default Input;

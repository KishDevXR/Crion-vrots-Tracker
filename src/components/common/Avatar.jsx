import React from 'react';

const COLORS = [
  'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200',
  'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200',
  'bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-200',
  'bg-orange-100 text-orange-800 dark:bg-orange-900/60 dark:text-orange-200',
  'bg-pink-100 text-pink-800 dark:bg-pink-900/60 dark:text-pink-200',
  'bg-teal-100 text-teal-800 dark:bg-teal-900/60 dark:text-teal-200',
  'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-200',
];

export default function Avatar({ name, size = 'md', className = '' }) {
  if (!name) return null;

  const initials = name
    .split(' ')
    .map(part => part[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  // Simple string hashing to get a stable color index
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colorIndex = Math.abs(hash) % COLORS.length;
  const colorClass = COLORS[colorIndex];

  let sizeClass = 'w-8 h-8 text-xs';
  if (size === 'sm') sizeClass = 'w-6 h-6 text-[10px]';
  if (size === 'lg') sizeClass = 'w-12 h-12 text-base';
  if (size === 'xl') sizeClass = 'w-16 h-16 text-xl';

  return (
    <div 
      className={`inline-flex items-center justify-center rounded-full font-bold uppercase tracking-wider select-none shadow-sm ${sizeClass} ${colorClass} ${className}`}
      title={name}
    >
      {initials}
    </div>
  );
}

import React from 'react';
import { getStatusColors, getPriorityColors } from '../../utils/statusUtils';

export default function Badge({ type = 'status', value, className = '' }) {
  if (!value) return null;

  if (type === 'priority') {
    const colors = getPriorityColors(value);
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${colors.bg} ${colors.text} ${className}`}>
        <span className={`w-1 h-1 rounded-full mr-1.5 ${value.toLowerCase() === 'critical' ? 'bg-red-500 animate-pulse' : value.toLowerCase() === 'high' ? 'bg-orange-500' : value.toLowerCase() === 'medium' ? 'bg-blue-500' : 'bg-slate-400'}`} />
        {value}
      </span>
    );
  }

  // Otherwise status
  const colors = getStatusColors(value);
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colors.bg} ${colors.text} ${colors.border} ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${colors.dot}`} />
      {value}
    </span>
  );
}

import React from 'react';
import { RiderStatusType } from '../types';

interface RiderBadgeProps {
  status: RiderStatusType;
  size?: 'sm' | 'md';
}

export const RiderBadge: React.FC<RiderBadgeProps> = ({ status, size = 'md' }) => {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1.5',
    md: 'text-xs font-medium px-2.5 py-1 gap-2',
  }[size];

  switch (status) {
    case 'Available':
      return (
        <span
          id={`rider-status-available`}
          className={`inline-flex items-center rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60 ${sizeClasses}`}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Available</span>
        </span>
      );
    case 'On Delivery':
      return (
        <span
          id={`rider-status-on-delivery`}
          className={`inline-flex items-center rounded-full bg-blue-50 text-blue-800 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/60 ${sizeClasses}`}
        >
          <span className="w-2 h-2 rounded-full bg-blue-500" />
          <span>On Delivery</span>
        </span>
      );
    case 'Offline':
      return (
        <span
          id={`rider-status-offline`}
          className={`inline-flex items-center rounded-full bg-zinc-100 text-zinc-600 border border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700 ${sizeClasses}`}
        >
          <span className="w-2 h-2 rounded-full bg-zinc-400" />
          <span>Offline</span>
        </span>
      );
    default:
      return null;
  }
};

import React from 'react';
import { DeliveryStatus } from '../types';
import { Clock, UserCheck, Package, CheckCircle2, Truck } from 'lucide-react';

interface StatusBadgeProps {
  status: DeliveryStatus;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
  showIcon = true,
}) => {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs font-semibold px-2.5 py-1 gap-1.5',
    lg: 'text-sm font-semibold px-3.5 py-1.5 gap-2',
  }[size];

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  }[size];

  switch (status) {
    case 'OPEN':
      return (
        <span
          id={`status-badge-${status.toLowerCase()}`}
          className={`inline-flex items-center rounded-md border font-medium bg-zinc-100 text-zinc-700 border-zinc-300 dark:bg-zinc-800/80 dark:text-zinc-300 dark:border-zinc-700 tracking-wide ${sizeClasses}`}
        >
          {showIcon && <Clock className={`${iconSizes} text-zinc-500`} />}
          <span>OPEN</span>
        </span>
      );
    case 'ASSIGNED':
      return (
        <span
          id={`status-badge-${status.toLowerCase()}`}
          className={`inline-flex items-center rounded-md border font-medium bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-700/60 tracking-wide ${sizeClasses}`}
        >
          {showIcon && <UserCheck className={`${iconSizes} text-amber-600 dark:text-amber-400`} />}
          <span>ASSIGNED</span>
        </span>
      );
    case 'PICKED_UP':
      return (
        <span
          id={`status-badge-${status.toLowerCase()}`}
          className={`inline-flex items-center rounded-md border font-medium bg-sky-50 text-sky-800 border-sky-300 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-700/60 tracking-wide ${sizeClasses}`}
        >
          {showIcon && <Package className={`${iconSizes} text-sky-600 dark:text-sky-400`} />}
          <span>PICKED UP</span>
        </span>
      );
    case 'IN_TRANSIT':
      return (
        <span
          id={`status-badge-${status.toLowerCase()}`}
          className={`inline-flex items-center rounded-md border font-medium bg-blue-50 text-blue-800 border-blue-300 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-700/60 tracking-wide ${sizeClasses}`}
        >
          {showIcon && <Truck className={`${iconSizes} text-blue-600 dark:text-blue-400`} />}
          <span>IN TRANSIT</span>
        </span>
      );
    case 'DELIVERED':
      return (
        <span
          id={`status-badge-${status.toLowerCase()}`}
          className={`inline-flex items-center rounded-md border font-medium bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-700/60 tracking-wide ${sizeClasses}`}
        >
          {showIcon && <CheckCircle2 className={`${iconSizes} text-emerald-600 dark:text-emerald-400`} />}
          <span>DELIVERED</span>
        </span>
      );
    default:
      return null;
  }
};

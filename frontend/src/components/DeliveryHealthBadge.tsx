import React from 'react';
import { Delivery, DeliveryHealth } from '../types';
import { getDeliveryHealth } from '../utils/deliveryHealth';
import { CheckCircle2, AlertTriangle, AlertOctagon, CheckCheck, Clock } from 'lucide-react';

interface DeliveryHealthBadgeProps {
  delivery?: Delivery;
  health?: DeliveryHealth;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  showPulse?: boolean;
  showElapsed?: boolean;
  showExpectedTime?: boolean;
  compact?: boolean;
}

export const DeliveryHealthBadge: React.FC<DeliveryHealthBadgeProps> = ({
  delivery,
  health: explicitHealth,
  size = 'md',
  showIcon = true,
  showPulse = true,
  showElapsed = false,
  showExpectedTime = false,
  compact = false,
}) => {
  if (!delivery && !explicitHealth) return null;

  // Use helper if delivery is provided
  const computed = delivery ? getDeliveryHealth(delivery) : null;
  const currentHealth: DeliveryHealth = (explicitHealth || computed?.health || 'ON_TIME') as DeliveryHealth;

  const sizeClasses = {
    xs: 'text-[10px] px-1.5 py-0.5 gap-1',
    sm: 'text-xs px-2 py-0.5 gap-1.5',
    md: 'text-xs font-semibold px-2.5 py-1 gap-1.5',
    lg: 'text-sm font-semibold px-3 py-1.5 gap-2',
  }[size];

  const iconSizes = {
    xs: 'w-2.5 h-2.5',
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  }[size];

  const dotSizes = {
    xs: 'w-1.5 h-1.5',
    sm: 'w-2 h-2',
    md: 'w-2 h-2',
    lg: 'w-2.5 h-2.5',
  }[size];

  // Visual styles for all 5 frozen health states
  const stylesMap: Record<
    DeliveryHealth,
    {
      bg: string;
      dot: string;
      icon: React.ComponentType<{ className?: string }>;
      label: string;
      isPulseEligible: boolean;
    }
  > = {
    ON_TIME: {
      bg: 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-700/60',
      dot: 'bg-emerald-500',
      icon: CheckCircle2,
      label: compact ? 'On Time' : computed?.label || 'On Time',
      isPulseEligible: true,
    },
    AT_RISK: {
      bg: 'bg-amber-50 text-amber-900 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-700/60',
      dot: 'bg-amber-500',
      icon: AlertTriangle,
      label: compact ? 'At Risk' : computed?.label || 'At Risk',
      isPulseEligible: true,
    },
    DELAYED: {
      bg: 'bg-rose-50 text-rose-800 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-700/60',
      dot: 'bg-rose-500',
      icon: AlertOctagon,
      label: compact ? 'Delayed' : computed?.label || 'Delayed',
      isPulseEligible: true,
    },
    DELIVERED_ON_TIME: {
      bg: 'bg-emerald-50 text-emerald-900 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-700/60',
      dot: 'bg-emerald-600',
      icon: CheckCheck,
      label: compact ? 'Delivered (On Time)' : computed?.label || 'Delivered On Time',
      isPulseEligible: false,
    },
    DELIVERED_LATE: {
      bg: 'bg-orange-50 text-orange-900 border-orange-300 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-700/60',
      dot: 'bg-orange-500',
      icon: Clock,
      label: compact ? 'Delivered (Late)' : computed?.label || 'Delivered Late',
      isPulseEligible: false,
    },
  };

  const style = stylesMap[currentHealth] || stylesMap.ON_TIME;
  const IconComponent = style.icon;
  const isInTransit = computed?.isInTransit ?? false;

  return (
    <span
      id={delivery ? `health-badge-${delivery.delivery_id}` : `health-badge-${currentHealth.toLowerCase()}`}
      className={`inline-flex items-center rounded-md border font-medium tracking-wide transition-all ${style.bg} ${sizeClasses}`}
      title={computed?.description || style.label}
    >
      {/* Pulse indicator for active states */}
      {showPulse && style.isPulseEligible && (
        <span className="relative flex items-center justify-center">
          {isInTransit && (
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${style.dot}`}
            />
          )}
          <span className={`relative inline-flex rounded-full ${dotSizes} ${style.dot}`} />
        </span>
      )}

      {/* Completed or non-pulsing icon */}
      {(showIcon || !style.isPulseEligible) && <IconComponent className={`${iconSizes} shrink-0`} />}

      {/* Label */}
      <span className="font-semibold uppercase tracking-wider text-[10px] sm:text-xs">
        {style.label}
      </span>

      {/* Optional Expected Delivery display */}
      {showExpectedTime && computed && (
        <span className="opacity-80 font-mono text-[10px] pl-1 border-l border-current/30">
          Due: {computed.expectedTimeFormatted}
        </span>
      )}

      {/* Optional Elapsed Transit Indicator */}
      {showElapsed && computed?.isInTransit && !showExpectedTime && (
        <span className="opacity-80 font-mono text-[10px] pl-1 border-l border-current/30">
          {computed.elapsedMinutes}m
        </span>
      )}
    </span>
  );
};

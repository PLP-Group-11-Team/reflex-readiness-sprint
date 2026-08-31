import {
  Delivery,
  DeliveryHealth,
  DeliveryHealthType,
  DeliveryStatus,
  TrafficCondition,
} from '../types';

export const AT_RISK_WINDOW_MINUTES = 30;

export interface ComputedDeliveryHealth {
  health: DeliveryHealth;
  label: string;
  shortLabel: string;
  tag: DeliveryHealth;
  isCompleted: boolean;
  isInTransit: boolean;
  expectedDeliveryAt: string;
  expectedTimeFormatted: string;
  atRiskWindowStartFormatted: string;
  atRiskWindowStartMins: number;
  expectedMins: number;
  currentMins: number;
  minutesDiff: number; // Positive = minutes remaining until deadline, Negative = minutes past deadline
  elapsedMinutes: number;
  slaMinutes: number;
  remainingMinutes: number;
  progressPercent: number;
  trafficCondition: TrafficCondition;
  trafficLabel: string;
  description: string;
  recommendation: string;
  combinedStateText: string;
  badgeStyle: {
    bg: string;
    text: string;
    border: string;
    dotBg: string;
    progressBg: string;
    ringColor: string;
  };
}

/**
 * Parses time string (e.g. "14:00:00", "2:00 PM", "1:30 PM", "10:15", ISO) to minutes from midnight (0..1439).
 */
export function parseTimeToMinutes(timeStr?: string | null): number | null {
  if (!timeStr) return null;
  const trimmed = timeStr.trim();

  // 12-hour format with AM/PM (e.g. "2:00 PM", "1:30 PM", "02:00 pm")
  const ampmMatch = trimmed.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)$/i);
  if (ampmMatch) {
    let hours = parseInt(ampmMatch[1], 10);
    const mins = parseInt(ampmMatch[2], 10);
    const meridian = ampmMatch[4].toUpperCase();
    if (meridian === 'PM' && hours < 12) hours += 12;
    if (meridian === 'AM' && hours === 12) hours = 0;
    return hours * 60 + mins;
  }

  // 24-hour HH:MM or HH:MM:SS format (e.g. "14:00:00", "14:00", "09:30:00")
  const h24Match = trimmed.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (h24Match) {
    const hours = parseInt(h24Match[1], 10);
    const mins = parseInt(h24Match[2], 10);
    return hours * 60 + mins;
  }

  // Fallback: Date parse
  const parsed = Date.parse(trimmed);
  if (!isNaN(parsed)) {
    const d = new Date(parsed);
    return d.getHours() * 60 + d.getMinutes();
  }

  return null;
}

/**
 * Formats minutes from midnight to clean 12-hour AM/PM format (e.g. 840 -> "2:00 PM").
 */
export function minutesToDisplayTime(totalMinutes: number): string {
  // Normalize within 0..1439
  const normalized = ((totalMinutes % 1440) + 1440) % 1440;
  const h = Math.floor(normalized / 60);
  const m = normalized % 60;
  const period = h >= 12 ? 'PM' : 'AM';
  const displayH = h % 12 === 0 ? 12 : h % 12;
  const displayM = m < 10 ? `0${m}` : m;
  return `${displayH}:${displayM} ${period}`;
}

/**
 * Formats any time string to "h:mm A" display format (e.g. "14:00:00" -> "2:00 PM").
 */
export function formatDisplayTime(timeStr?: string | null): string {
  if (!timeStr) return '—';
  const mins = parseTimeToMinutes(timeStr);
  if (mins === null) return timeStr;
  return minutesToDisplayTime(mins);
}

/**
 * Formats a Date object to "HH:MM:SS" (24-hour).
 */
export function formatTime24(date: Date = new Date()): string {
  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

/**
 * Formats a Date object to "h:mm A" (12-hour).
 */
export function formatTime12(date: Date = new Date()): string {
  return date.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Adds minutes to a Date or time string, returning "HH:MM:SS" (24h).
 */
export function addMinutesToTime(timeStrOrDate: string | Date, minutesToAdd: number): string {
  if (timeStrOrDate instanceof Date) {
    const nextDate = new Date(timeStrOrDate.getTime() + minutesToAdd * 60000);
    return formatTime24(nextDate);
  }

  const mins = parseTimeToMinutes(timeStrOrDate);
  if (mins !== null) {
    const nextMins = (mins + minutesToAdd) % 1440;
    const h = Math.floor(nextMins / 60);
    const m = nextMins % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:00`;
  }

  const now = new Date();
  now.setMinutes(now.getMinutes() + minutesToAdd);
  return formatTime24(now);
}

/**
 * Derives Delivery Health strictly per the frozen specification:
 * 
 * Active-delivery health values:
 * • ON_TIME: Before expected_delivery_at - 30 min and not delivered
 * • AT_RISK: expected_delivery_at - 30 min through expected_delivery_at and not delivered
 * • DELAYED: After expected_delivery_at and not delivered
 * 
 * Completed-delivery health values:
 * • DELIVERED_ON_TIME: Delivered at or before expected_delivery_at
 * • DELIVERED_LATE: Delivered after expected_delivery_at
 * 
 * Health is derived by the backend from timestamps and is NOT manually edited by a user.
 */
export function deriveDeliveryHealth(
  status: DeliveryStatus,
  expectedDeliveryAt: string,
  actualDeliveredAt?: string | null,
  currentReference?: string | Date
): {
  health: DeliveryHealth;
  isCompleted: boolean;
  minutesDiff: number;
  expectedMins: number;
  currentOrDeliveredMins: number;
  atRiskWindowStartMins: number;
  atRiskWindowStartFormatted: string;
  expectedTimeFormatted: string;
} {
  const expectedMins = parseTimeToMinutes(expectedDeliveryAt) ?? 14 * 60; // default 2:00 PM
  const atRiskWindowStartMins = expectedMins - AT_RISK_WINDOW_MINUTES;
  const atRiskWindowStartFormatted = minutesToDisplayTime(atRiskWindowStartMins);
  const expectedTimeFormatted = minutesToDisplayTime(expectedMins);

  if (status === 'DELIVERED') {
    const deliveredMins = parseTimeToMinutes(actualDeliveredAt) ?? expectedMins;
    const minutesDiff = expectedMins - deliveredMins;

    // Delivered at or before expected_delivery_at -> DELIVERED_ON_TIME
    // Delivered after expected_delivery_at -> DELIVERED_LATE
    const health: DeliveryHealth = deliveredMins <= expectedMins ? 'DELIVERED_ON_TIME' : 'DELIVERED_LATE';

    return {
      health,
      isCompleted: true,
      minutesDiff,
      expectedMins,
      currentOrDeliveredMins: deliveredMins,
      atRiskWindowStartMins,
      atRiskWindowStartFormatted,
      expectedTimeFormatted,
    };
  }

  // Active delivery
  let currentMins: number;
  if (currentReference instanceof Date) {
    currentMins = currentReference.getHours() * 60 + currentReference.getMinutes();
  } else if (typeof currentReference === 'string') {
    currentMins = parseTimeToMinutes(currentReference) ?? new Date().getHours() * 60 + new Date().getMinutes();
  } else {
    currentMins = new Date().getHours() * 60 + new Date().getMinutes();
  }

  const minutesDiff = expectedMins - currentMins;

  let health: DeliveryHealth = 'ON_TIME';

  if (currentMins < atRiskWindowStartMins) {
    // Before 1:30 PM and not delivered -> ON_TIME
    health = 'ON_TIME';
  } else if (currentMins >= atRiskWindowStartMins && currentMins <= expectedMins) {
    // 1:30 PM through 2:00 PM and not delivered -> AT_RISK
    health = 'AT_RISK';
  } else {
    // After 2:00 PM and not delivered -> DELAYED
    health = 'DELAYED';
  }

  return {
    health,
    isCompleted: false,
    minutesDiff,
    expectedMins,
    currentOrDeliveredMins: currentMins,
    atRiskWindowStartMins,
    atRiskWindowStartFormatted,
    expectedTimeFormatted,
  };
}

/**
 * Returns full computed health metrics for UI components.
 */
export function getDeliveryHealth(
  delivery: Delivery,
  currentTime?: string | Date
): ComputedDeliveryHealth {
  const isCompleted = delivery.status === 'DELIVERED';
  const isInTransit = delivery.status === 'PICKED_UP';

  // Resolve expected delivery time
  const expectedDeliveryAt = delivery.expected_delivery_at || '14:00:00';
  const actualDeliveredAt = delivery.confirmation_time || delivery.updated_at;

  const derived = deriveDeliveryHealth(
    delivery.status,
    expectedDeliveryAt,
    actualDeliveredAt,
    currentTime
  );

  const health = derived.health;

  // Derive status name for combined state text (e.g. "status = IN_TRANSIT health = AT_RISK")
  const statusDisplayName =
    delivery.status === 'PICKED_UP'
      ? 'IN_TRANSIT'
      : delivery.status;

  const combinedStateText = `status = ${statusDisplayName}  health = ${health}`;

  // Time calculations for SLA visual metrics
  const createMins = parseTimeToMinutes(delivery.created_at) ?? derived.expectedMins - 45;
  const currentOrDeliveredMins = derived.currentOrDeliveredMins;
  const elapsedMinutes = Math.max(0, currentOrDeliveredMins - createMins);
  const slaMinutes = Math.max(15, derived.expectedMins - createMins);
  const remainingMinutes = Math.max(0, derived.minutesDiff);
  const progressPercent = Math.min(100, Math.max(0, Math.round((elapsedMinutes / slaMinutes) * 100)));

  // Determine traffic label
  const traffic: TrafficCondition =
    health === 'DELAYED'
      ? 'heavy'
      : health === 'AT_RISK'
      ? 'moderate'
      : 'smooth';

  const trafficLabels: Record<TrafficCondition, string> = {
    smooth: 'Corridor Flow Normal',
    moderate: 'Approaching Delivery Deadline',
    heavy: 'Delivery Deadline Exceeded',
  };

  // Label, description, recommendation mapping
  let label = 'On Time';
  let shortLabel = 'On Time';
  let description = '';
  let recommendation = '';

  switch (health) {
    case 'ON_TIME':
      label = 'On Time';
      shortLabel = 'On Time';
      description = `Expected delivery at ${derived.expectedTimeFormatted}. More than ${AT_RISK_WINDOW_MINUTES} minutes until deadline.`;
      recommendation = 'Order is progressing on schedule. No urgent intervention required.';
      break;

    case 'AT_RISK':
      label = 'At Risk';
      shortLabel = 'At Risk';
      description = `Expected delivery at ${derived.expectedTimeFormatted}. Inside the ${AT_RISK_WINDOW_MINUTES}-minute deadline window (${derived.minutesDiff}m remaining).`;
      recommendation = isInTransit
        ? 'Priority transit monitoring: verify courier progress and coordinate swift handover.'
        : 'Priority dispatch: assign and pick up immediately to avoid SLA delay.';
      break;

    case 'DELAYED':
      label = 'Delayed';
      shortLabel = 'Delayed';
      description = `Expected delivery at ${derived.expectedTimeFormatted} has passed by ${Math.abs(derived.minutesDiff)} minutes without confirmation.`;
      recommendation = 'Escalate with courier and update customer on expected arrival time.';
      break;

    case 'DELIVERED_ON_TIME':
      label = 'Delivered On Time';
      shortLabel = 'On Time';
      description = `Delivered at or before the scheduled deadline (${derived.expectedTimeFormatted}).`;
      recommendation = 'SLA achieved. Closed with proof of delivery.';
      break;

    case 'DELIVERED_LATE':
      label = 'Delivered Late';
      shortLabel = 'Delivered Late';
      description = `Delivered after the scheduled deadline (${derived.expectedTimeFormatted}).`;
      recommendation = 'Post-delivery review logged for fleet turnaround performance.';
      break;
  }

  // Styling
  const badgeStyles: Record<
    DeliveryHealth,
    { bg: string; text: string; border: string; dotBg: string; progressBg: string; ringColor: string }
  > = {
    ON_TIME: {
      bg: 'bg-emerald-50 dark:bg-emerald-950/50',
      text: 'text-emerald-700 dark:text-emerald-300',
      border: 'border-emerald-300 dark:border-emerald-700/60',
      dotBg: 'bg-emerald-500',
      progressBg: 'bg-emerald-500',
      ringColor: 'ring-emerald-400',
    },
    AT_RISK: {
      bg: 'bg-amber-50 dark:bg-amber-950/50',
      text: 'text-amber-800 dark:text-amber-300',
      border: 'border-amber-300 dark:border-amber-700/60',
      dotBg: 'bg-amber-500',
      progressBg: 'bg-amber-500',
      ringColor: 'ring-amber-400',
    },
    DELAYED: {
      bg: 'bg-rose-50 dark:bg-rose-950/50',
      text: 'text-rose-700 dark:text-rose-300',
      border: 'border-rose-300 dark:border-rose-700/60',
      dotBg: 'bg-rose-500',
      progressBg: 'bg-rose-500',
      ringColor: 'ring-rose-400',
    },
    DELIVERED_ON_TIME: {
      bg: 'bg-emerald-50 dark:bg-emerald-950/50',
      text: 'text-emerald-800 dark:text-emerald-300',
      border: 'border-emerald-300 dark:border-emerald-700/60',
      dotBg: 'bg-emerald-600',
      progressBg: 'bg-emerald-600',
      ringColor: 'ring-emerald-400',
    },
    DELIVERED_LATE: {
      bg: 'bg-orange-50 dark:bg-orange-950/50',
      text: 'text-orange-800 dark:text-orange-300',
      border: 'border-orange-300 dark:border-orange-700/60',
      dotBg: 'bg-orange-500',
      progressBg: 'bg-orange-500',
      ringColor: 'ring-orange-400',
    },
  };

  return {
    health,
    label,
    shortLabel,
    tag: health,
    isCompleted,
    isInTransit,
    expectedDeliveryAt,
    expectedTimeFormatted: derived.expectedTimeFormatted,
    atRiskWindowStartFormatted: derived.atRiskWindowStartFormatted,
    atRiskWindowStartMins: derived.atRiskWindowStartMins,
    expectedMins: derived.expectedMins,
    currentMins: derived.currentOrDeliveredMins,
    minutesDiff: derived.minutesDiff,
    elapsedMinutes,
    slaMinutes,
    remainingMinutes,
    progressPercent,
    trafficCondition: traffic,
    trafficLabel: trafficLabels[traffic],
    description,
    recommendation,
    combinedStateText,
    badgeStyle: badgeStyles[health],
  };
}

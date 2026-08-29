import { Delivery, DeliveryStatus, StatusHistoryEntry } from '../types';

export interface TimelineActionItem {
  id: string;
  time: string; // e.g. "10:00"
  actor: string;
  action: string;
  rawText: string; // e.g. "10:00 Retailer created DEL-001"
  status: DeliveryStatus;
  isCompleted: boolean;
  isCurrent: boolean;
  isUpcoming: boolean;
  note?: string;
}

/**
 * Truncates / formats a timestamp to "HH:mm" (e.g. "10:00:00" -> "10:00")
 */
export function formatTimeShort(timestamp?: string | null): string {
  if (!timestamp) return '--:--';
  const parts = timestamp.trim().split(':');
  if (parts.length >= 2) {
    const hours = parts[0].padStart(2, '0');
    const minutes = parts[1].padStart(2, '0');
    return `${hours}:${minutes}`;
  }
  return timestamp;
}

/**
 * Derives the canonical action string for a delivery status milestone.
 * Matches the user's explicit format:
 * 10:00 Retailer created DEL-001
 * 10:05 Dispatcher assigned Brian
 * 10:30 Brian changed ASSIGNED -> PICKED_UP
 * 10:35 Brian changed PICKED_UP -> IN_TRANSIT
 * 12:04 Brian confirmed delivery by QR
 */
export function formatActionText(
  status: DeliveryStatus,
  delivery: Delivery,
  actor?: string,
  customNote?: string
): string {
  const ref = delivery.reference || `DEL-${delivery.delivery_id}`;
  const riderFirstName = delivery.rider ? delivery.rider.trim().split(' ')[0] : 'Rider';
  const actorFirstName =
    actor && actor !== 'Retailer' && actor !== 'Dispatcher' && !actor.includes('&')
      ? actor.trim().split(' ')[0]
      : riderFirstName;

  switch (status) {
    case 'OPEN':
      return `Retailer created ${ref}`;
    case 'ASSIGNED':
      return `Dispatcher assigned ${riderFirstName}`;
    case 'PICKED_UP':
      return `${actorFirstName} changed ASSIGNED -> PICKED_UP`;
    case 'IN_TRANSIT':
      return `${actorFirstName} changed PICKED_UP -> IN_TRANSIT`;
    case 'DELIVERED':
      return `${actorFirstName} confirmed delivery by QR`;
    default:
      return customNote || `${actor || 'Dispatcher'} updated status to ${status}`;
  }
}

/**
 * Builds the complete list of logged and upcoming timeline actions for a delivery.
 * Updates dynamically after every action.
 */
export function generateActionTimeline(delivery: Delivery): TimelineActionItem[] {
  const items: TimelineActionItem[] = [];
  const ref = delivery.reference || `DEL-${delivery.delivery_id}`;
  const riderFirstName = delivery.rider ? delivery.rider.trim().split(' ')[0] : 'Rider';

  const statusOrder: DeliveryStatus[] = ['OPEN', 'ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED'];
  const currentIndex = statusOrder.indexOf(delivery.status);

  // 1. Map logged history entries
  delivery.history.forEach((entry: StatusHistoryEntry, index: number) => {
    const time = formatTimeShort(entry.timestamp);
    const action = formatActionText(entry.status, delivery, entry.actor, entry.note);
    const isCurrent = entry.status === delivery.status && index === delivery.history.length - 1;

    items.push({
      id: `history-${index}-${entry.status}`,
      time,
      actor: entry.actor || 'System',
      action,
      rawText: `${time} ${action}`,
      status: entry.status,
      isCompleted: !isCurrent,
      isCurrent,
      isUpcoming: false,
      note: entry.note,
    });
  });

  // 2. Derive upcoming pending actions if not yet delivered
  if (delivery.status !== 'DELIVERED') {
    const remainingStatuses = statusOrder.slice(currentIndex + 1);

    remainingStatuses.forEach((upcomingStatus) => {
      let upcomingAction = '';
      switch (upcomingStatus) {
        case 'ASSIGNED':
          upcomingAction = 'Dispatcher assigns rider';
          break;
        case 'PICKED_UP':
          upcomingAction = `${riderFirstName} changes ASSIGNED -> PICKED_UP`;
          break;
        case 'IN_TRANSIT':
          upcomingAction = `${riderFirstName} changes PICKED_UP -> IN_TRANSIT`;
          break;
        case 'DELIVERED':
          upcomingAction = `${riderFirstName} confirms delivery by QR`;
          break;
        default:
          upcomingAction = `Transition to ${upcomingStatus}`;
      }

      items.push({
        id: `upcoming-${upcomingStatus}`,
        time: 'Pending',
        actor: upcomingStatus === 'ASSIGNED' ? 'Dispatcher' : riderFirstName,
        action: upcomingAction,
        rawText: `Pending: ${upcomingAction}`,
        status: upcomingStatus,
        isCompleted: false,
        isCurrent: false,
        isUpcoming: true,
      });
    });
  }

  return items;
}

/**
 * Returns clean multiline text matching the exact requested format:
 * 10:00 Retailer created DEL-001
 * 10:05 Dispatcher assigned Brian
 * 10:30 Brian changed ASSIGNED -> PICKED_UP
 * 10:35 Brian changed PICKED_UP -> IN_TRANSIT
 * 12:04 Brian confirmed delivery by QR
 */
export function getTimelinePlainText(delivery: Delivery): string {
  const items = generateActionTimeline(delivery).filter((item) => !item.isUpcoming);
  return items.map((item) => item.rawText).join('\n');
}

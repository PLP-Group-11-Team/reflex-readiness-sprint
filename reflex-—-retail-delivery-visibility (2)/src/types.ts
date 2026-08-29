export type DeliveryStatus = 'OPEN' | 'ASSIGNED' | 'PICKED_UP' | 'IN_TRANSIT' | 'DELIVERED';

export type RiderStatusType = 'Available' | 'On Delivery' | 'Offline';

/**
 * Frozen Delivery Health Specification:
 * Separate from delivery status.
 * Active-delivery health values: ON_TIME, AT_RISK, DELAYED
 * Completed-delivery health values: DELIVERED_ON_TIME, DELIVERED_LATE
 */
export type ActiveDeliveryHealth = 'ON_TIME' | 'AT_RISK' | 'DELAYED';
export type CompletedDeliveryHealth = 'DELIVERED_ON_TIME' | 'DELIVERED_LATE';
export type DeliveryHealth = ActiveDeliveryHealth | CompletedDeliveryHealth;
export type DeliveryHealthType = DeliveryHealth;

export type TrafficCondition = 'smooth' | 'moderate' | 'heavy';

export interface TransitHealthData {
  health: DeliveryHealth;
  trafficCondition?: TrafficCondition;
  customNote?: string;
  delayReason?: string;
  targetSlaMinutes?: number;
  elapsedMinutes?: number;
  reportedBy?: string;
  reportedAt?: string;
}

export interface Rider {
  id: string;
  name: string;
  phone: string;
  vehicle?: string;
  isFixedOffline?: boolean;
}

export interface StatusHistoryEntry {
  status: DeliveryStatus;
  timestamp: string;
  note: string;
  actor?: string;
}

export interface Delivery {
  delivery_id: string;
  reference: string;
  retailer: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  delivery_address: string;
  item_description: string;
  rider: string | null;
  status: DeliveryStatus;
  created_at: string;
  updated_at: string;
  expected_delivery_at: string;
  confirmation_time: string | null;
  history: StatusHistoryEntry[];
  transitHealth?: TransitHealthData;
}

export type UserRole = 'retailer' | 'dispatcher' | 'rider';

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  riderId?: string;
}

export interface NotificationToast {
  id: string;
  message: string;
  type: 'success' | 'info' | 'warning';
  timestamp: number;
}

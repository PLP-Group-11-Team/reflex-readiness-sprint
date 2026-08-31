import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';
import {
  Delivery,
  DeliveryStatus,
  StatusHistoryEntry,
  DeliveryHealthType,
  TrafficCondition,
  TransitHealthData,
  Rider,
  RiderStatusType,
  UserRole,
  UserAccount,
  NotificationToast,
} from '../types';
import { addMinutesToTime } from '../utils/deliveryHealth';

interface ReflexContextType {
  currentUser: UserAccount | null;
  users: UserAccount[];
  login: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  signup: (name: string, email: string, password: string, role: UserRole) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  role: UserRole;
  setRole: (role: UserRole) => void;
  activeRiderId: string;
  setActiveRiderId: (id: string) => void;
  retailerTab: 'dashboard' | 'deliveries' | 'new_delivery';
  setRetailerTab: (tab: 'dashboard' | 'deliveries' | 'new_delivery') => void;
  dispatcherTab: 'dashboard' | 'monitoring';
  setDispatcherTab: (tab: 'dashboard' | 'monitoring') => void;
  deliveries: Delivery[];
  riders: Rider[];
  getRiderStatus: (riderName: string) => RiderStatusType;
  selectedDeliveryId: string | null;
  setSelectedDeliveryId: (id: string | null) => void;
  createDelivery: (data: {
    customer_name: string;
    customer_phone: string;
    customer_email?: string;
    delivery_address: string;
    item_description: string;
    expected_delivery_at?: string;
    reference?: string;
  }) => Delivery;
  assignRider: (deliveryId: string, riderName: string) => boolean;
  confirmPickup: (deliveryId: string) => boolean;
  startTransit: (deliveryId: string) => boolean;
  confirmDeliveryQR: (deliveryId: string) => boolean;
  updateTransitHealth: (
    deliveryId: string,
    health?: DeliveryHealthType,
    trafficCondition?: TrafficCondition,
    note?: string
  ) => boolean;
  resetDemoData: () => void;
  toasts: NotificationToast[];
  addToast: (message: string, type?: 'success' | 'info' | 'warning') => void;
  removeToast: (id: string) => void;
}

const INITIAL_RIDERS: Rider[] = [
  { id: 'brian', name: 'Brian Kamau', phone: '0733 112 233', vehicle: 'Box Bike (KMD 204C)' },
  { id: 'james', name: 'James Otieno', phone: '0734 223 344', vehicle: 'Motorcycle (KME 882A)' },
  { id: 'daniel', name: 'Daniel Mwangi', phone: '0735 334 455', vehicle: 'Motorcycle (KMH 509D)' },
  { id: 'samuel', name: 'Samuel Mutua', phone: '0736 445 566', vehicle: 'Off Shift', isFixedOffline: true },
];

const INITIAL_USERS: UserAccount[] = [
  {
    id: 'user-retailer-1',
    name: 'Mwangaza Electronics',
    email: 'retailer@mwangaza.ke',
    password: 'password123',
    role: 'retailer',
  },
  {
    id: 'user-dispatcher-1',
    name: 'Chief Dispatcher',
    email: 'dispatch@reflex.ke',
    password: 'password123',
    role: 'dispatcher',
  },
  {
    id: 'user-rider-1',
    name: 'Brian Kamau',
    email: 'brian@reflex.ke',
    password: 'password123',
    role: 'rider',
    riderId: 'brian',
  },
  {
    id: 'user-rider-2',
    name: 'James Otieno',
    email: 'james@reflex.ke',
    password: 'password123',
    role: 'rider',
    riderId: 'james',
  },
];

const formatTimestamp = (date: Date = new Date()): string => {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
};

const getSeedDeliveries = (): Delivery[] => {
  const now = new Date();
  const relTime = (diffMinutes: number): string => {
    const d = new Date(now.getTime() + diffMinutes * 60000);
    return formatTimestamp(d);
  };

  return [
    {
      delivery_id: '104',
      reference: 'DEL-001',
      retailer: 'Mwangaza Electronics',
      customer_name: 'Jane Wanjiku',
      customer_phone: '0712 345 678',
      customer_email: 'jane.wanjiku@gmail.com',
      delivery_address: 'Westlands, Nairobi',
      item_description: 'Samsung 55" TV',
      rider: null,
      status: 'OPEN',
      created_at: relTime(-10),
      updated_at: relTime(-10),
      expected_delivery_at: relTime(50),
      confirmation_time: null,
      history: [
        {
          status: 'OPEN',
          timestamp: relTime(-10),
          note: 'Order created by Mwangaza Electronics',
          actor: 'Retailer',
        },
      ],
    },
    {
      delivery_id: '103',
      reference: 'DEL-002',
      retailer: 'Mwangaza Electronics',
      customer_name: 'Amina Hassan',
      customer_phone: '0723 554 433',
      customer_email: 'amina.hassan@gmail.com',
      delivery_address: 'Kilimani, Nairobi (Argwings Kodhek Rd)',
      item_description: 'Dell 27" 4K Monitor',
      rider: 'Brian Kamau',
      status: 'IN_TRANSIT',
      created_at: relTime(-30),
      updated_at: relTime(-10),
      expected_delivery_at: relTime(15),
      confirmation_time: null,
      history: [
        {
          status: 'OPEN',
          timestamp: relTime(-30),
          note: 'Order created by Mwangaza Electronics',
          actor: 'Retailer',
        },
        {
          status: 'ASSIGNED',
          timestamp: relTime(-22),
          note: 'Assigned to rider Brian Kamau',
          actor: 'Dispatcher',
        },
        {
          status: 'PICKED_UP',
          timestamp: relTime(-15),
          note: 'Package picked up by Brian Kamau from retailer store',
          actor: 'Brian Kamau',
        },
        {
          status: 'IN_TRANSIT',
          timestamp: relTime(-10),
          note: 'Brian Kamau is in transit to Kilimani (Argwings Kodhek Rd)',
          actor: 'Brian Kamau',
        },
      ],
    },
    {
      delivery_id: '105',
      reference: 'DEL-003',
      retailer: 'Mwangaza Electronics',
      customer_name: 'Peter Mwangi',
      customer_phone: '0722 456 789',
      customer_email: 'peter.mwangi@outlook.com',
      delivery_address: 'Kilimani, Nairobi',
      item_description: 'HP Envy Laptop',
      rider: null,
      status: 'OPEN',
      created_at: relTime(-50),
      updated_at: relTime(-50),
      expected_delivery_at: relTime(-10),
      confirmation_time: null,
      history: [
        {
          status: 'OPEN',
          timestamp: relTime(-50),
          note: 'Order created by Mwangaza Electronics',
          actor: 'Retailer',
        },
      ],
    },
    {
      delivery_id: '102',
      reference: 'DEL-004',
      retailer: 'Mwangaza Electronics',
      customer_name: 'Samuel Kiprono',
      customer_phone: '0711 998 877',
      customer_email: 'samuel.kip@yahoo.com',
      delivery_address: 'Riverside Drive, Nairobi',
      item_description: 'Apple Watch Series 9',
      rider: 'James Otieno',
      status: 'DELIVERED',
      created_at: relTime(-75),
      updated_at: relTime(-35),
      expected_delivery_at: relTime(-20),
      confirmation_time: relTime(-35),
      history: [
        {
          status: 'OPEN',
          timestamp: relTime(-75),
          note: 'Order created by Mwangaza Electronics',
          actor: 'Retailer',
        },
        {
          status: 'ASSIGNED',
          timestamp: relTime(-65),
          note: 'Assigned to rider James Otieno',
          actor: 'Dispatcher',
        },
        {
          status: 'PICKED_UP',
          timestamp: relTime(-55),
          note: 'Package picked up by James Otieno from retailer',
          actor: 'James Otieno',
        },
        {
          status: 'IN_TRANSIT',
          timestamp: relTime(-45),
          note: 'James Otieno in transit towards Riverside Drive',
          actor: 'James Otieno',
        },
        {
          status: 'DELIVERED',
          timestamp: relTime(-35),
          note: 'QR code scanned & delivery confirmed at customer destination on schedule',
          actor: 'James Otieno & Customer',
        },
      ],
    },
    {
      delivery_id: '101',
      reference: 'DEL-005',
      retailer: 'Mwangaza Electronics',
      customer_name: 'Grace Muthoni',
      customer_phone: '0700 123 456',
      customer_email: 'grace.m@gmail.com',
      delivery_address: 'Parklands, Nairobi',
      item_description: 'Sony WH-1000XM5 Headphones',
      rider: 'Daniel Mwangi',
      status: 'DELIVERED',
      created_at: relTime(-90),
      updated_at: relTime(-15),
      expected_delivery_at: relTime(-45),
      confirmation_time: relTime(-15),
      history: [
        {
          status: 'OPEN',
          timestamp: relTime(-90),
          note: 'Order created by Mwangaza Electronics',
          actor: 'Retailer',
        },
        {
          status: 'ASSIGNED',
          timestamp: relTime(-75),
          note: 'Assigned to rider Daniel Mwangi',
          actor: 'Dispatcher',
        },
        {
          status: 'PICKED_UP',
          timestamp: relTime(-60),
          note: 'Package picked up by Daniel Mwangi',
          actor: 'Daniel Mwangi',
        },
        {
          status: 'DELIVERED',
          timestamp: relTime(-15),
          note: 'Delivered past target deadline due to heavy transit delays',
          actor: 'Daniel Mwangi & Customer',
        },
      ],
    },
  ];
};

const ReflexContext = createContext<ReflexContextType | undefined>(undefined);

export const ReflexProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [users, setUsers] = useState<UserAccount[]>(INITIAL_USERS);
  const [role, setRole] = useState<UserRole>('retailer');
  const [activeRiderId, setActiveRiderId] = useState<string>('brian');
  const [retailerTab, setRetailerTab] = useState<'dashboard' | 'deliveries' | 'new_delivery'>('dashboard');
  const [dispatcherTab, setDispatcherTab] = useState<'dashboard' | 'monitoring'>('dashboard');
  const [deliveries, setDeliveries] = useState<Delivery[]>(getSeedDeliveries());
  const [riders, setRiders] = useState<Rider[]>(INITIAL_RIDERS);
  const [selectedDeliveryId, setSelectedDeliveryId] = useState<string | null>('104');
  const [toasts, setToasts] = useState<NotificationToast[]>([]);

  const addToast = useCallback((message: string, type: 'success' | 'info' | 'warning' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type, timestamp: Date.now() }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Login handler using Django backend
  const login = useCallback(
async (email: string, password?: string): Promise<{ success: boolean; error?: string }> => {
try {
const response = await fetch('http://127.0.0.1:8000/api/auth/login/', {
method: 'POST',
headers: {
'Content-Type': 'application/json',
},
body: JSON.stringify({
email: email.trim().toLowerCase(),
password: password?.trim() || '',
}),
});


  const data = await response.json();

  if (!response.ok) {
    return {
      success: false,
      error: data.message || 'Invalid email or password.',
    };
  }

  const backendUser: UserAccount = {
    id: String(data.user.id),
    name: data.user.name,
    email: email.trim().toLowerCase(),
    role: data.user.role.toLowerCase() as UserRole,
  };

  setCurrentUser(backendUser);
  setRole(backendUser.role);

  setRetailerTab('dashboard');
  setDispatcherTab('dashboard');

  addToast(
    `Welcome back, ${backendUser.name}! (${backendUser.role.toUpperCase()})`,
    'success'
  );

  return { success: true };
} catch (error) {
  return {
    success: false,
    error: 'Unable to connect to the Reflex server.',
  };
}


},
[addToast]
);

  // Signup handler
  const signup = useCallback(
    async (name: string, email: string, password: string, newRole: UserRole): Promise<{ success: boolean; error?: string }> => {
      await new Promise((resolve) => setTimeout(resolve, 350));

      const cleanName = name.trim();
      const cleanEmail = email.trim().toLowerCase();
      const cleanPassword = password.trim();

      if (!cleanName || !cleanEmail || !cleanPassword) {
        return { success: false, error: 'All fields are required.' };
      }

      if (!cleanEmail.includes('@') || cleanEmail.indexOf('@') === 0 || cleanEmail.lastIndexOf('.') < cleanEmail.indexOf('@')) {
        return { success: false, error: 'Please enter a valid email address.' };
      }

      if (cleanPassword.length < 4) {
        return { success: false, error: 'Password must be at least 4 characters long.' };
      }

      const emailExists = users.some((u) => u.email.toLowerCase() === cleanEmail);
      if (emailExists) {
        return { success: false, error: 'An account with this email address already exists.' };
      }

      let riderId: string | undefined = undefined;

      // If signing up as rider, ensure rider profile exists in fleet
      if (newRole === 'rider') {
        const idSlug = cleanName.toLowerCase().replace(/[^a-z0-9]/g, '') || `rider${Date.now()}`;
        riderId = idSlug;
        
        const existingRider = riders.find((r) => r.id === idSlug || r.name.toLowerCase() === cleanName.toLowerCase());
        if (!existingRider) {
          const newRiderProfile: Rider = {
            id: idSlug,
            name: cleanName,
            phone: '0700 000 000',
            vehicle: 'Motorcycle (Field Courier)',
          };
          setRiders((prev) => [...prev, newRiderProfile]);
        }
      }

      const newUser: UserAccount = {
        id: `user-${Date.now()}`,
        name: cleanName,
        email: cleanEmail,
        password: cleanPassword,
        role: newRole,
        riderId,
      };

      setUsers((prev) => [...prev, newUser]);
      setCurrentUser(newUser);
      setRole(newRole);

      if (riderId) {
        setActiveRiderId(riderId);
      }

      setRetailerTab('dashboard');
      setDispatcherTab('dashboard');

      addToast(`Account created! Logged in as ${cleanName} (${newRole.toUpperCase()})`, 'success');
      return { success: true };
    },
    [users, riders, addToast]
  );

  // Logout handler
  const logout = useCallback(() => {
    setCurrentUser(null);
    addToast('You have been logged out.', 'info');
  }, [addToast]);

  // Derived rider status
  const getRiderStatus = useCallback(
    (riderName: string): RiderStatusType => {
      const riderObj = riders.find((r) => r.name.toLowerCase() === riderName.toLowerCase());
      if (riderObj?.isFixedOffline) {
        return 'Offline';
      }
      const hasActiveJob = deliveries.some(
        (d) =>
          d.rider?.toLowerCase() === riderName.toLowerCase() &&
          (d.status === 'ASSIGNED' || d.status === 'PICKED_UP' || d.status === 'IN_TRANSIT')
      );
      return hasActiveJob ? 'On Delivery' : 'Available';
    },
    [deliveries, riders]
  );

  const createDelivery = useCallback(
    (data: {
      customer_name: string;
      customer_phone: string;
      customer_email?: string;
      delivery_address: string;
      item_description: string;
      expected_delivery_at?: string;
      reference?: string;
    }) => {
      const time = formatTimestamp();
      const expectedTime = data.expected_delivery_at?.trim() || addMinutesToTime(new Date(), 45);
      const existingIds = deliveries
        .map((d) => parseInt(d.delivery_id, 10))
        .filter((n) => !isNaN(n));
      const nextNum = existingIds.length > 0 ? Math.max(...existingIds) + 1 : 106;
      const nextId = nextNum.toString();
      const autoRef = `DEL-${String(nextNum).padStart(3, '0')}`;
      const reference = data.reference?.trim() || autoRef;

      const retailerName = currentUser?.role === 'retailer' ? currentUser.name : 'Mwangaza Electronics';

      const newDelivery: Delivery = {
        delivery_id: nextId,
        reference,
        retailer: retailerName,
        customer_name: data.customer_name.trim(),
        customer_phone: data.customer_phone.trim(),
        customer_email: data.customer_email?.trim() || undefined,
        delivery_address: data.delivery_address.trim(),
        item_description: data.item_description.trim(),
        rider: null,
        status: 'OPEN',
        created_at: time,
        updated_at: time,
        expected_delivery_at: expectedTime,
        confirmation_time: null,
        history: [
          {
            status: 'OPEN',
            timestamp: time,
            note: `Order created by ${retailerName} (Ref: ${reference}). Expected delivery at ${expectedTime}`,
            actor: retailerName,
          },
        ],
      };

      setDeliveries((prev) => [newDelivery, ...prev]);
      setSelectedDeliveryId(nextId);
      addToast(`Delivery #${nextId} (${reference}) created successfully`, 'success');
      return newDelivery;
    },
    [deliveries, currentUser, addToast]
  );

  const assignRider = useCallback(
    (deliveryId: string, riderName: string): boolean => {
      const time = formatTimestamp();
      let updated = false;

      setDeliveries((prev) =>
        prev.map((d) => {
          if ((d.delivery_id === deliveryId || d.reference === deliveryId) && d.status === 'OPEN') {
            updated = true;
            return {
              ...d,
              rider: riderName,
              status: 'ASSIGNED' as DeliveryStatus,
              updated_at: time,
              history: [
                ...d.history,
                {
                  status: 'ASSIGNED',
                  timestamp: time,
                  note: `Assigned to rider ${riderName}`,
                  actor: 'Dispatcher',
                },
              ],
            };
          }
          return d;
        })
      );

      if (updated) {
        addToast('Rider assigned successfully', 'success');
      }
      return updated;
    },
    [addToast]
  );

  const confirmPickup = useCallback(
    (deliveryId: string): boolean => {
      const time = formatTimestamp();
      let updated = false;

      setDeliveries((prev) =>
        prev.map((d) => {
          if ((d.delivery_id === deliveryId || d.reference === deliveryId) && d.status === 'ASSIGNED') {
            updated = true;
            return {
              ...d,
              status: 'PICKED_UP' as DeliveryStatus,
              updated_at: time,
              transitHealth: {
                health: 'ON_TRACK',
                trafficCondition: 'smooth',
                targetSlaMinutes: 35,
                elapsedMinutes: 1,
                reportedBy: d.rider || 'Rider',
                reportedAt: time,
                customNote: `Package picked up by ${d.rider || 'Rider'} from retailer shop.`,
              },
              history: [
                ...d.history,
                {
                  status: 'PICKED_UP',
                  timestamp: time,
                  note: `Package picked up from ${d.retailer} by ${d.rider || 'Rider'}`,
                  actor: d.rider || 'Rider',
                },
              ],
            };
          }
          return d;
        })
      );

      if (updated) {
        addToast('Pickup confirmed - Package ready for transit', 'success');
      }
      return updated;
    },
    [addToast]
  );

  const startTransit = useCallback(
    (deliveryId: string): boolean => {
      const time = formatTimestamp();
      let updated = false;

      setDeliveries((prev) =>
        prev.map((d) => {
          if ((d.delivery_id === deliveryId || d.reference === deliveryId) && d.status === 'PICKED_UP') {
            updated = true;
            return {
              ...d,
              status: 'IN_TRANSIT' as DeliveryStatus,
              updated_at: time,
              transitHealth: {
                ...d.transitHealth,
                health: d.transitHealth?.health || 'ON_TRACK',
                trafficCondition: d.transitHealth?.trafficCondition || 'smooth',
                reportedBy: d.rider || 'Rider',
                reportedAt: time,
                customNote: `${d.rider || 'Rider'} is in transit towards ${d.delivery_address}.`,
              },
              history: [
                ...d.history,
                {
                  status: 'IN_TRANSIT',
                  timestamp: time,
                  note: `${d.rider || 'Rider'} is now in transit towards destination`,
                  actor: d.rider || 'Rider',
                },
              ],
            };
          }
          return d;
        })
      );

      if (updated) {
        addToast('Status updated: Delivery is now IN TRANSIT', 'info');
      }
      return updated;
    },
    [addToast]
  );

  const confirmDeliveryQR = useCallback(
    (deliveryId: string): boolean => {
      const time = formatTimestamp();
      let updated = false;

      setDeliveries((prev) =>
        prev.map((d) => {
          if (
            (d.delivery_id === deliveryId || d.reference === deliveryId) &&
            (d.status === 'PICKED_UP' || d.status === 'IN_TRANSIT')
          ) {
            updated = true;
            const historyToAdd: StatusHistoryEntry[] = [];
            if (d.status === 'PICKED_UP' && !d.history.some((h) => h.status === 'IN_TRANSIT')) {
              historyToAdd.push({
                status: 'IN_TRANSIT',
                timestamp: time,
                note: `Package transit completed by ${d.rider || 'Rider'}`,
                actor: d.rider || 'Rider',
              });
            }
            historyToAdd.push({
              status: 'DELIVERED',
              timestamp: time,
              note: 'QR code scanned & delivery confirmed at customer destination',
              actor: `${d.rider || 'Rider'} & Customer`,
            });

            return {
              ...d,
              status: 'DELIVERED' as DeliveryStatus,
              updated_at: time,
              confirmation_time: time,
              transitHealth: {
                health: 'ON_TRACK',
                trafficCondition: 'smooth',
                targetSlaMinutes: 35,
                elapsedMinutes: d.transitHealth?.elapsedMinutes || 24,
                customNote: 'Delivered successfully at customer destination via QR scan.',
              },
              history: [...d.history, ...historyToAdd],
            };
          }
          return d;
        })
      );

      if (updated) {
        addToast('Delivery confirmed successfully', 'success');
      }
      return updated;
    },
    [addToast]
  );

  const updateTransitHealth = useCallback(
    (
      deliveryId: string,
      health: DeliveryHealthType,
      trafficCondition: TrafficCondition = 'smooth',
      note?: string
    ): boolean => {
      const time = formatTimestamp();
      let updated = false;

      setDeliveries((prev) =>
        prev.map((d) => {
          if (d.delivery_id === deliveryId || d.reference === deliveryId) {
            updated = true;
            const currentElapsed = d.transitHealth?.elapsedMinutes ?? (d.status === 'PICKED_UP' ? 14 : 5);
            return {
              ...d,
              updated_at: time,
              transitHealth: {
                ...d.transitHealth,
                health,
                trafficCondition,
                targetSlaMinutes: d.transitHealth?.targetSlaMinutes || 35,
                elapsedMinutes: currentElapsed,
                reportedBy: currentUser?.name || 'Dispatcher',
                reportedAt: time,
                customNote:
                  note ||
                  (trafficCondition === 'heavy'
                    ? 'Heavy traffic gridlock reported (+15m delay)'
                    : trafficCondition === 'moderate'
                    ? 'Moderate traffic congestion en route'
                    : 'Transit flowing smoothly on schedule'),
              },
              history: [
                ...d.history,
                {
                  status: d.status,
                  timestamp: time,
                  note: `Transit Health updated: ${health.replace('_', ' ')} (${trafficCondition} traffic)${note ? ` - ${note}` : ''}`,
                  actor: currentUser?.name || 'Dispatcher',
                },
              ],
            };
          }
          return d;
        })
      );

      if (updated) {
        addToast(`Transit health for #${deliveryId} updated: ${health.replace('_', ' ')}`, 'info');
      }
      return updated;
    },
    [currentUser, addToast]
  );

  const resetDemoData = useCallback(() => {
    setDeliveries(getSeedDeliveries());
    setSelectedDeliveryId('103');
    setRole('retailer');
    setRetailerTab('dashboard');
    setDispatcherTab('dashboard');
    setActiveRiderId('brian');
    addToast('Demo state reset to initial seed data (#103 In Transit)', 'info');
  }, [addToast]);

  const value = useMemo(
    () => ({
      currentUser,
      users,
      login,
      signup,
      logout,
      role,
      setRole,
      activeRiderId,
      setActiveRiderId,
      retailerTab,
      setRetailerTab,
      dispatcherTab,
      setDispatcherTab,
      deliveries,
      riders,
      getRiderStatus,
      selectedDeliveryId,
      setSelectedDeliveryId,
      createDelivery,
      assignRider,
      confirmPickup,
      startTransit,
      confirmDeliveryQR,
      updateTransitHealth,
      resetDemoData,
      toasts,
      addToast,
      removeToast,
    }),
    [
      currentUser,
      users,
      login,
      signup,
      logout,
      role,
      activeRiderId,
      retailerTab,
      dispatcherTab,
      deliveries,
      riders,
      getRiderStatus,
      selectedDeliveryId,
      createDelivery,
      assignRider,
      confirmPickup,
      startTransit,
      confirmDeliveryQR,
      updateTransitHealth,
      resetDemoData,
      toasts,
      addToast,
      removeToast,
    ]
  );

  return <ReflexContext.Provider value={value}>{children}</ReflexContext.Provider>;
};

export const useReflex = () => {
  const context = useContext(ReflexContext);
  if (!context) {
    throw new Error('useReflex must be used within a ReflexProvider');
  }
  return context;
};


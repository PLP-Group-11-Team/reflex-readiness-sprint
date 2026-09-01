import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  apiFetch,
  saveTokens,
  clearTokens,
  getAccessToken,
} from '../utils/api';

import {
  Delivery,
  DeliveryHealthType,
  DeliveryStatus,
  NotificationToast,
  Rider,
  RiderStatusType,
  StatusHistoryEntry,
  TrafficCondition,
  UserAccount,
  UserRole,
} from '../types';

interface ReflexContextType {
  currentUser: UserAccount | null;
  users: UserAccount[];

  login: (
    email: string,
    password?: string
  ) => Promise<{ success: boolean; error?: string }>;

  signup: (
    name: string,
    email: string,
    password: string,
    role: UserRole
  ) => Promise<{ success: boolean; error?: string }>;

  logout: () => void;

  role: UserRole;
  setRole: (role: UserRole) => void;

  activeRiderId: string;
  setActiveRiderId: (id: string) => void;

  retailerTab:
    | 'dashboard'
    | 'deliveries'
    | 'new_delivery';

  setRetailerTab: (
    tab:
      | 'dashboard'
      | 'deliveries'
      | 'new_delivery'
  ) => void;

  dispatcherTab:
    | 'dashboard'
    | 'monitoring';

  setDispatcherTab: (
    tab: 'dashboard' | 'monitoring'
  ) => void;

  deliveries: Delivery[];
  riders: Rider[];

  getRiderStatus: (
    riderName: string
  ) => RiderStatusType;

  selectedDeliveryId: string | null;

  setSelectedDeliveryId: (
    id: string | null
  ) => void;

  createDelivery: (data: {
    customer_name: string;
    customer_phone: string;
    customer_email?: string;
    delivery_address: string;
    item_description: string;
    expected_delivery_at?: string;
    reference?: string;
  }) => Promise<Delivery | null>;

  assignRider: (
    deliveryId: string,
    riderName: string
  ) => Promise<boolean>;

  confirmPickup: (
    deliveryId: string
  ) => Promise<boolean>;

  startTransit: (
    deliveryId: string
  ) => Promise<boolean>;

  confirmDeliveryQR: (
    deliveryId: string,
    scannedToken?: string
  ) => Promise<boolean>;

  updateTransitHealth: (
    deliveryId: string,
    health?: DeliveryHealthType,
    trafficCondition?: TrafficCondition,
    note?: string
  ) => boolean;

  resetDemoData: () => void;

  toasts: NotificationToast[];

  addToast: (
    message: string,
    type?: 'success' | 'info' | 'warning'
  ) => void;

  removeToast: (id: string) => void;
}

/* =========================
   BACKEND TYPES
========================= */

type BackendRider = {
  id: number;
  name: string;
  role: string;
};

type BackendEvent = {
  id: number;
  event_type: string;
  from_status: DeliveryStatus | null;
  to_status: DeliveryStatus | null;

  actor: {
    id: number;
    name: string;
    role: string;
  } | null;

  created_at: string;
};

type BackendConfirmation = {
  id: number;

  confirmed_by: BackendRider;

  confirmation_method: string;

  confirmed_at: string;
};

type BackendDelivery = {
  id: number;

  reference: string;

  customer_name: string;

  customer_phone?: string;

  delivery_address: string;

  item_description: string;

  status: DeliveryStatus;

  health: DeliveryHealthType;

  expected_delivery_at: string;

  assigned_rider?: BackendRider | null;

  confirmation_token?: string | null;

  created_at?: string;

  assigned_at?: string | null;

  picked_up_at?: string | null;

  in_transit_at?: string | null;

  delivered_at?: string | null;

  updated_at?: string;

  confirmation?: BackendConfirmation | null;

  events?: BackendEvent[];
};

/* =========================
   DEMO FALLBACK RIDERS
========================= */

const INITIAL_RIDERS: Rider[] = [
  {
    id: 'brian',
    name: 'Brian Kamau',
    phone: '0733 112 233',
    vehicle: 'Box Bike (KMD 204C)',
  },
  {
    id: 'james',
    name: 'James Otieno',
    phone: '0734 223 344',
    vehicle: 'Motorcycle (KME 882A)',
  },
  {
    id: 'daniel',
    name: 'Daniel Mwangi',
    phone: '0735 334 455',
    vehicle: 'Motorcycle (KMH 509D)',
  },
  {
    id: 'samuel',
    name: 'Samuel Mutua',
    phone: '0736 445 566',
    vehicle: 'Off Shift',
    isFixedOffline: true,
  },
];

/* =========================
   DISPLAY USERS
========================= */

const INITIAL_USERS: UserAccount[] = [
  {
    id: 'demo-retailer',
    name: 'Demo Retailer',
    email: 'retailer@reflex.demo',
    role: 'retailer',
  },
  {
    id: 'demo-dispatcher',
    name: 'Demo Dispatcher',
    email: 'dispatcher@reflex.demo',
    role: 'dispatcher',
  },
  {
    id: 'demo-rider',
    name: 'Demo Rider',
    email: 'rider@reflex.demo',
    role: 'rider',
  },
];

/* =========================
   HELPERS
========================= */

const normalizeRole = (
  value: string
): UserRole => {
  const role = value
    .trim()
    .toLowerCase();

  if (role === 'retailer') {
    return 'retailer';
  }

  if (role === 'dispatcher') {
    return 'dispatcher';
  }

  if (role === 'rider') {
    return 'rider';
  }

  throw new Error(
    `Unsupported backend role: ${value}`
  );
};

const formatBackendError = (
  error: unknown
): string => {
  if (error instanceof Error) {
    return error.message;
  }

  return 'The Reflex server returned an unexpected error.';
};

/*
 * The frontend form currently produces values such as:
 *
 * 14:00:00
 * 15:30:00
 *
 * Django expects a DateTimeField, so convert those
 * values into an ISO datetime before POSTing.
 */
const toISODateTime = (
  value?: string
): string => {
  if (!value) {
    return new Date(
      Date.now() + 45 * 60 * 1000
    ).toISOString();
  }

  const trimmed = value.trim();

  /*
   * Already a full ISO datetime.
   */
  if (
    trimmed.includes('T') ||
    trimmed.endsWith('Z')
  ) {
    const parsed = new Date(trimmed);

    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }
  }

  /*
   * Handle HH:MM or HH:MM:SS.
   */
  const match = trimmed.match(
    /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/
  );

  if (match) {
    const hours = Number(match[1]);
    const minutes = Number(match[2]);
    const seconds = Number(
      match[3] ?? 0
    );

    const target = new Date();

    target.setHours(
      hours,
      minutes,
      seconds,
      0
    );

    /*
     * If today's selected time has already
     * passed, treat it as tomorrow.
     */
    if (target.getTime() <= Date.now()) {
      target.setDate(
        target.getDate() + 1
      );
    }

    return target.toISOString();
  }

  const parsed = new Date(trimmed);

  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString();
  }

  throw new Error(
    'Invalid expected delivery time.'
  );
};

/* =========================
   BACKEND → FRONTEND MAPPER
========================= */

const mapBackendDelivery = (
  delivery: BackendDelivery,
  retailerName: string
): Delivery => {
  const history: StatusHistoryEntry[] =
    (delivery.events ?? [])
      .filter(
        (event) => event.to_status
      )
      .map((event) => ({
        status:
          event.to_status as DeliveryStatus,

        timestamp:
          event.created_at,

        note:
          event.event_type.replace(
            /_/g,
            ' '
          ),

        actor:
          event.actor?.name ||
          'System',
      }));

  return {
    delivery_id: String(
      delivery.id
    ),

    reference:
      delivery.reference,

    retailer:
      retailerName,

    customer_name:
      delivery.customer_name,

    customer_phone:
      delivery.customer_phone ?? '',

    delivery_address:
      delivery.delivery_address,

    item_description:
      delivery.item_description,

    rider:
      delivery.assigned_rider?.name ??
      null,

    status:
      delivery.status,

    created_at:
      delivery.created_at ?? '',

    updated_at:
      delivery.updated_at ?? '',

    expected_delivery_at:
      delivery.expected_delivery_at,

    confirmation_time:
      delivery.confirmation
        ?.confirmed_at ?? null,

    history,

    transitHealth: {
      health:
        delivery.health,

      reportedAt:
        delivery.updated_at,

      reportedBy:
        delivery.assigned_rider
          ?.name,
    },

    confirmation_token:
      delivery.confirmation_token ??
      null,
  };
};

/* =========================
   CONTEXT
========================= */

const ReflexContext =
  createContext<
    ReflexContextType | undefined
  >(undefined);

/* =========================
   PROVIDER
========================= */

export const ReflexProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [
    currentUser,
    setCurrentUser,
  ] =
    useState<UserAccount | null>(
      null
    );

  const [users] =
    useState<UserAccount[]>(
      INITIAL_USERS
    );

  const [role, setRole] =
    useState<UserRole>(
      'retailer'
    );

  const [
    activeRiderId,
    setActiveRiderId,
  ] = useState<string>('');

  const [
    retailerTab,
    setRetailerTab,
  ] =
    useState<
      | 'dashboard'
      | 'deliveries'
      | 'new_delivery'
    >('dashboard');

  const [
    dispatcherTab,
    setDispatcherTab,
  ] =
    useState<
      'dashboard'
      | 'monitoring'
    >('dashboard');

  const [
    deliveries,
    setDeliveries,
  ] =
    useState<Delivery[]>([]);

  const [
    riders,
    setRiders,
  ] =
    useState<Rider[]>(
      INITIAL_RIDERS
    );

  const [
    selectedDeliveryId,
    setSelectedDeliveryId,
  ] =
    useState<string | null>(null);

  const [
    toasts,
    setToasts,
  ] =
    useState<
      NotificationToast[]
    >([]);

  /* =========================
     TOASTS
  ========================= */

  const addToast =
    useCallback(
      (
        message: string,
        type:
          | 'success'
          | 'info'
          | 'warning' = 'success'
      ) => {
        const id =
          Math.random()
            .toString(36)
            .substring(2, 9);

        setToasts((previous) => [
          ...previous,
          {
            id,
            message,
            type,
            timestamp:
              Date.now(),
          },
        ]);

        window.setTimeout(
          () => {
            setToasts(
              (previous) =>
                previous.filter(
                  (toast) =>
                    toast.id !==
                    id
                )
            );
          },
          4500
        );
      },
      []
    );

  const removeToast =
    useCallback(
      (id: string) => {
        setToasts(
          (previous) =>
            previous.filter(
              (toast) =>
                toast.id !== id
            )
        );
      },
      []
    );

  /* =========================
     LOAD RIDERS
  ========================= */

  const loadRiders =
    useCallback(async () => {
      try {
        const backendRiders =
          await apiFetch<
            BackendRider[]
          >('/api/riders/');

        const mappedRiders =
          backendRiders.map(
            (rider) => ({
              id: String(
                rider.id
              ),

              name:
                rider.name,

              phone: '',

              vehicle:
                'Field Courier',
            })
          );

        setRiders(
          mappedRiders
        );
      } catch (error) {
        console.error(
          'Failed to load riders:',
          error
        );
      }
    }, []);

  /* =========================
     LOAD DELIVERIES
  ========================= */

  const loadDeliveries =
    useCallback(
      async (
        retailerNameOverride?: string
      ) => {
        if (!getAccessToken()) {
          return;
        }

        try {
          const list =
            await apiFetch<
              BackendDelivery[]
            >(
              '/api/deliveries/'
            );

          /*
           * The list endpoint intentionally
           * does not contain events/token.
           *
           * Fetch detail for each delivery.
           */
          const detailed =
            await Promise.all(
              list.map(
                async (
                  delivery
                ) => {
                  try {
                    return await apiFetch<BackendDelivery>(
                      `/api/deliveries/${delivery.id}/`
                    );
                  } catch {
                    return delivery;
                  }
                }
              )
            );

          const retailerName =
            retailerNameOverride ??
            (currentUser?.role ===
            'retailer'
              ? currentUser.name
              : 'Mwangaza Electronics');

          const mapped =
            detailed.map(
              (delivery) =>
                mapBackendDelivery(
                  delivery,
                  retailerName
                )
            );

          setDeliveries(
            mapped
          );

          setSelectedDeliveryId(
            (previous) => {
              if (
                previous &&
                mapped.some(
                  (delivery) =>
                    delivery.delivery_id ===
                    previous
                )
              ) {
                return previous;
              }

              return (
                mapped[0]
                  ?.delivery_id ??
                null
              );
            }
          );
        } catch (error) {
          console.error(
            'Failed to load deliveries:',
            error
          );
        }
      },
      [currentUser]
    );

  /* =========================
     LOGIN
  ========================= */

  const login =
    useCallback(
      async (
        email: string,
        password?: string
      ): Promise<{
        success: boolean;
        error?: string;
      }> => {
        try {
          const cleanEmail =
            email
              .trim()
              .toLowerCase();

          const cleanPassword =
            password?.trim() ??
            '';

          if (
            !cleanEmail ||
            !cleanPassword
          ) {
            return {
              success: false,
              error:
                'Email and password are required.',
            };
          }

          const data =
            await apiFetch<{
              access: string;
              refresh: string;

              user: {
                id: number;
                name: string;
                role: string;
              };
            }>(
              '/api/auth/login/',
              {
                method: 'POST',

                body: JSON.stringify(
                  {
                    email:
                      cleanEmail,

                    password:
                      cleanPassword,
                  }
                ),
              }
            );

          saveTokens(
            data.access,
            data.refresh
          );

          const backendRole =
            normalizeRole(
              data.user.role
            );

          const backendUser:
            UserAccount = {
            id: String(
              data.user.id
            ),

            name:
              data.user.name,

            email:
              cleanEmail,

            role:
              backendRole,

            riderId:
              backendRole ===
              'rider'
                ? String(
                    data.user.id
                  )
                : undefined,
          };

          setCurrentUser(
            backendUser
          );

          setRole(
            backendRole
          );

          /*
           * Riders cannot call /api/riders/
           * because that endpoint is dispatcher-only.
           *
           * Therefore insert the logged-in rider
           * into the local display list using the
           * backend ID.
           */
          if (
            backendRole ===
            'rider'
          ) {
            setActiveRiderId(
              String(
                data.user.id
              )
            );

            setRiders(
              (previous) => [
                {
                  id: String(
                    data.user.id
                  ),

                  name:
                    data.user.name,

                  phone: '',

                  vehicle:
                    'Field Courier',
                },

                ...previous.filter(
                  (rider) =>
                    rider.name
                      .toLowerCase() !==
                    data.user.name
                      .toLowerCase()
                ),
              ]
            );
          } else {
            setActiveRiderId('');
          }

          setRetailerTab(
            'dashboard'
          );

          setDispatcherTab(
            'dashboard'
          );

          /*
           * Only dispatcher can request the
           * complete rider list.
           */
          if (
            backendRole ===
            'dispatcher'
          ) {
            await loadRiders();
          }

          await loadDeliveries(
            backendRole ===
            'retailer'
              ? backendUser.name
              : undefined
          );

          addToast(
            `Welcome back, ${backendUser.name}!`,
            'success'
          );

          return {
            success: true,
          };
        } catch (error) {
          return {
            success: false,
            error:
              formatBackendError(
                error
              ),
          };
        }
      },
      [
        addToast,
        loadDeliveries,
        loadRiders,
      ]
    );

  /* =========================
     SIGNUP
  ========================= */

  const signup =
    useCallback(
      async (
        _name: string,
        _email: string,
        _password: string,
        _newRole: UserRole
      ): Promise<{
        success: boolean;
        error?: string;
      }> => {
        /*
         * The current Django backend intentionally
         * has no public registration endpoint.
         *
         * Demo users are seeded on Render.
         */
        return {
          success: false,

          error:
            'Account registration is not enabled on the current backend. Please use a seeded demo account.',
        };
      },
      []
    );

  /* =========================
     LOGOUT
  ========================= */

  const logout =
    useCallback(() => {
      clearTokens();

      setCurrentUser(
        null
      );

      setRole(
        'retailer'
      );

      setActiveRiderId('');

      setDeliveries([]);

      setSelectedDeliveryId(
        null
      );

      setRetailerTab(
        'dashboard'
      );

      setDispatcherTab(
        'dashboard'
      );

      addToast(
        'You have been logged out.',
        'info'
      );
    }, [addToast]);

  /* =========================
     RESTORE SESSION
  ========================= */

  useEffect(() => {
    const token =
      getAccessToken();

    if (!token) {
      return;
    }

    const restoreSession =
      async () => {
        try {
          const me =
            await apiFetch<{
              id: number;
              name: string;
              email: string;
              role: string;
            }>(
              '/api/auth/me/'
            );

          const restoredRole =
            normalizeRole(
              me.role
            );

          const restoredUser:
            UserAccount = {
            id: String(
              me.id
            ),

            name:
              me.name,

            email:
              me.email,

            role:
              restoredRole,

            riderId:
              restoredRole ===
              'rider'
                ? String(
                    me.id
                  )
                : undefined,
          };

          setCurrentUser(
            restoredUser
          );

          setRole(
            restoredRole
          );

          if (
            restoredRole ===
            'rider'
          ) {
            setActiveRiderId(
              String(me.id)
            );

            setRiders(
              (previous) => [
                {
                  id: String(
                    me.id
                  ),

                  name:
                    me.name,

                  phone: '',

                  vehicle:
                    'Field Courier',
                },

                ...previous.filter(
                  (rider) =>
                    rider.name
                      .toLowerCase() !==
                    me.name
                      .toLowerCase()
                ),
              ]
            );
          }

          if (
            restoredRole ===
            'dispatcher'
          ) {
            await loadRiders();
          }

          await loadDeliveries(
            restoredRole ===
            'retailer'
              ? restoredUser.name
              : undefined
          );
        } catch (error) {
          console.error(
            'Session restore failed:',
            error
          );

          clearTokens();

          setCurrentUser(
            null
          );
        }
      };

    void restoreSession();
  }, [
    loadDeliveries,
    loadRiders,
  ]);

  /* =========================
     POLLING
  ========================= */

  useEffect(() => {
    if (!currentUser) {
      return;
    }

    const interval =
      window.setInterval(
        () => {
          void loadDeliveries();
        },
        4000
      );

    return () =>
      window.clearInterval(
        interval
      );
  }, [
    currentUser,
    loadDeliveries,
  ]);

  /* =========================
     RIDER STATUS
  ========================= */

  const getRiderStatus =
    useCallback(
      (
        riderName: string
      ): RiderStatusType => {
        const rider =
          riders.find(
            (item) =>
              item.name
                .toLowerCase() ===
              riderName
                .toLowerCase()
          );

        if (
          rider?.isFixedOffline
        ) {
          return 'Offline';
        }

        const hasActiveJob =
          deliveries.some(
            (delivery) =>
              delivery.rider
                ?.toLowerCase() ===
                riderName
                  .toLowerCase() &&
              [
                'ASSIGNED',
                'PICKED_UP',
                'IN_TRANSIT',
              ].includes(
                delivery.status
              )
          );

        return hasActiveJob
          ? 'On Delivery'
          : 'Available';
      },
      [
        deliveries,
        riders,
      ]
    );

  /* =========================
     DELIVERY LOOKUP
  ========================= */

  const resolveDeliveryId =
    useCallback(
      (
        deliveryId: string
      ): string => {
        const delivery =
          deliveries.find(
            (item) =>
              item.delivery_id ===
                deliveryId ||
              item.reference ===
                deliveryId
          );

        return (
          delivery?.delivery_id ??
          deliveryId
        );
      },
      [deliveries]
    );

  /* =========================
     CREATE DELIVERY
  ========================= */

  const createDelivery =
    useCallback(
      async (data: {
        customer_name: string;
        customer_phone: string;
        customer_email?: string;
        delivery_address: string;
        item_description: string;
        expected_delivery_at?: string;
        reference?: string;
      }): Promise<
        Delivery | null
      > => {
        try {
          /*
           * IMPORTANT:
           * The backend generates the reference.
           * The backend serializer does not accept
           * the frontend "reference" field.
           */
          const delivery =
            await apiFetch<BackendDelivery>(
              '/api/deliveries/',
              {
                method: 'POST',

                body: JSON.stringify(
                  {
                    customer_name:
                      data.customer_name.trim(),

                    customer_phone:
                      data.customer_phone.trim(),

                    delivery_address:
                      data.delivery_address.trim(),

                    item_description:
                      data.item_description.trim(),

                    expected_delivery_at:
                      toISODateTime(
                        data.expected_delivery_at
                      ),
                  }
                ),
              }
            );

          const mapped =
            mapBackendDelivery(
              delivery,

              currentUser?.name ??
                'Mwangaza Electronics'
            );

          setSelectedDeliveryId(
            mapped.delivery_id
          );

          await loadDeliveries();

          addToast(
            `Delivery ${mapped.reference} created successfully.`,
            'success'
          );

          return mapped;
        } catch (error) {
          addToast(
            formatBackendError(
              error
            ),
            'warning'
          );

          return null;
        }
      },
      [
        addToast,
        currentUser,
        loadDeliveries,
      ]
    );

  /* =========================
     FIND RIDER
  ========================= */

  const findRiderByName =
    useCallback(
      (
        riderName: string
      ) => {
        return riders.find(
          (rider) =>
            rider.name
              .toLowerCase() ===
            riderName
              .toLowerCase()
        );
      },
      [riders]
    );

  /* =========================
     ASSIGN RIDER
  ========================= */

  const assignRider =
    useCallback(
      async (
        deliveryId: string,
        riderName: string
      ): Promise<boolean> => {
        try {
          const rider =
            findRiderByName(
              riderName
            );

          if (!rider) {
            addToast(
              'Rider not found.',
              'warning'
            );

            return false;
          }

          const riderId =
            Number(rider.id);

          if (
            !Number.isInteger(
              riderId
            )
          ) {
            addToast(
              'This rider does not have a valid backend ID. Refresh the dispatcher dashboard.',
              'warning'
            );

            return false;
          }

          await apiFetch<BackendDelivery>(
            `/api/deliveries/${resolveDeliveryId(
              deliveryId
            )}/assign/`,
            {
              method: 'PATCH',

              body: JSON.stringify(
                {
                  rider_id:
                    riderId,
                }
              ),
            }
          );

          await loadDeliveries();

          addToast(
            `Rider ${rider.name} assigned successfully.`,
            'success'
          );

          return true;
        } catch (error) {
          addToast(
            formatBackendError(
              error
            ),
            'warning'
          );

          return false;
        }
      },
      [
        addToast,
        findRiderByName,
        loadDeliveries,
        resolveDeliveryId,
      ]
    );

  /* =========================
     UPDATE RIDER STATUS
  ========================= */

  const updateStatus =
    useCallback(
      async (
        deliveryId: string,
        newStatus:
          | 'PICKED_UP'
          | 'IN_TRANSIT'
      ): Promise<boolean> => {
        try {
          await apiFetch<BackendDelivery>(
            `/api/deliveries/${resolveDeliveryId(
              deliveryId
            )}/status/`,
            {
              method: 'PATCH',

              body: JSON.stringify(
                {
                  status:
                    newStatus,
                }
              ),
            }
          );

          await loadDeliveries();

          if (
            newStatus ===
            'PICKED_UP'
          ) {
            addToast(
              'Pickup confirmed. Package is ready for transit.',
              'success'
            );
          } else {
            addToast(
              'Delivery is now IN TRANSIT.',
              'success'
            );
          }

          return true;
        } catch (error) {
          addToast(
            formatBackendError(
              error
            ),
            'warning'
          );

          return false;
        }
      },
      [
        addToast,
        loadDeliveries,
        resolveDeliveryId,
      ]
    );

  const confirmPickup =
    useCallback(
      async (
        deliveryId: string
      ): Promise<boolean> => {
        return updateStatus(
          deliveryId,
          'PICKED_UP'
        );
      },
      [updateStatus]
    );

  const startTransit =
    useCallback(
      async (
        deliveryId: string
      ): Promise<boolean> => {
        return updateStatus(
          deliveryId,
          'IN_TRANSIT'
        );
      },
      [updateStatus]
    );

  /* =========================
     QR CONFIRMATION
  ========================= */

  const confirmDeliveryQR =
    useCallback(
      async (
        deliveryId: string,
        scannedToken?: string
      ): Promise<boolean> => {
        try {
          const delivery =
            deliveries.find(
              (item) =>
                item.delivery_id ===
                  deliveryId ||
                item.reference ===
                  deliveryId
            );

          if (!delivery) {
            addToast(
              'Delivery not found.',
              'warning'
            );

            return false;
          }

          /*
           * A rider must provide the token
           * obtained from the customer's QR.
           *
           * Never expose the retailer's
           * confirmation token to the rider
           * before scanning.
           */
          const token =
            scannedToken?.trim() ||
            delivery.confirmation_token?.trim();

          if (!token) {
            addToast(
              'No QR token was provided. The rider must scan the customer QR code.',
              'warning'
            );

            return false;
          }

          await apiFetch(
            `/api/deliveries/${delivery.delivery_id}/confirm/`,
            {
              method: 'POST',

              body: JSON.stringify(
                {
                  token,
                }
              ),
            }
          );

          await loadDeliveries();

          addToast(
            'Delivery confirmed successfully.',
            'success'
          );

          return true;
        } catch (error) {
          addToast(
            formatBackendError(
              error
            ),
            'warning'
          );

          return false;
        }
      },
      [
        addToast,
        deliveries,
        loadDeliveries,
      ]
    );

  /* =========================
     DELIVERY HEALTH
  ========================= */

  const updateTransitHealth =
    useCallback(
      (
        _deliveryId: string,
        _health?: DeliveryHealthType,
        _trafficCondition?: TrafficCondition,
        _note?: string
      ): boolean => {
        /*
         * IMPORTANT:
         * The backend calculates health automatically.
         *
         * There is intentionally no PATCH endpoint
         * for manually changing health.
         */
        addToast(
          'Delivery health is calculated automatically by the backend.',
          'info'
        );

        void loadDeliveries();

        return false;
      },
      [
        addToast,
        loadDeliveries,
      ]
    );

  /* =========================
     RESET
  ========================= */

  const resetDemoData =
    useCallback(() => {
      void loadDeliveries();

      addToast(
        'Demo state refreshed from the backend.',
        'info'
      );
    }, [
      addToast,
      loadDeliveries,
    ]);

  /* =========================
     CONTEXT VALUE
  ========================= */

  const value =
    useMemo<ReflexContextType>(
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

  return (
    <ReflexContext.Provider
      value={value}
    >
      {children}
    </ReflexContext.Provider>
  );
};

/* =========================
   HOOK
========================= */

export const useReflex = () => {
  const context =
    useContext(
      ReflexContext
    );

  if (!context) {
    throw new Error(
      'useReflex must be used within a ReflexProvider'
    );
  }

  return context;
};

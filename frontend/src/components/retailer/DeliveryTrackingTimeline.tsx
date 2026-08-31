import React from 'react';
import { Delivery, DeliveryStatus } from '../../types';
import { StatusBadge } from '../StatusBadge';
import { DeliveryHealthBadge } from '../DeliveryHealthBadge';
import { TransitHealthCard } from '../TransitHealthCard';
import {
  CheckCircle2,
  Clock,
  UserCheck,
  Package,
  MapPin,
  Phone,
  Mail,
  Store,
  User,
  ShieldCheck,
  QrCode,
  Tag,
  Truck,
} from 'lucide-react';

interface DeliveryTrackingTimelineProps {
  delivery: Delivery;
}

export const DeliveryTrackingTimeline: React.FC<DeliveryTrackingTimelineProps> = ({ delivery }) => {
  const getStepState = (stepStatus: DeliveryStatus) => {
    const statusOrder: DeliveryStatus[] = ['OPEN', 'ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED'];
    const currentIndex = statusOrder.indexOf(delivery.status);
    const stepIndex = statusOrder.indexOf(stepStatus);

    if (currentIndex > stepIndex) return 'completed';
    if (currentIndex === stepIndex) return 'current';
    return 'upcoming';
  };

  const getHistoryForStatus = (targetStatus: DeliveryStatus) => {
    return delivery.history.find((h) => h.status === targetStatus);
  };

  const steps: {
    status: DeliveryStatus;
    title: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    {
      status: 'OPEN',
      title: 'Request Created',
      description: `Logged by ${delivery.retailer}`,
      icon: Clock,
    },
    {
      status: 'ASSIGNED',
      title: 'Rider Assigned',
      description: delivery.rider ? `Assigned to ${delivery.rider}` : 'Awaiting dispatcher assignment',
      icon: UserCheck,
    },
    {
      status: 'PICKED_UP',
      title: 'Package Picked Up',
      description:
        delivery.status === 'OPEN' || delivery.status === 'ASSIGNED'
          ? 'Awaiting pickup from retailer shop'
          : `Collected by ${delivery.rider || 'rider'} from retailer`,
      icon: Package,
    },
    {
      status: 'IN_TRANSIT',
      title: 'In Transit',
      description:
        delivery.status === 'DELIVERED'
          ? `Transit completed to destination`
          : delivery.status === 'IN_TRANSIT'
          ? `${delivery.rider || 'Rider'} is on route to customer address`
          : delivery.status === 'PICKED_UP'
          ? 'Package secured, en route to customer'
          : 'En route delivery to customer destination',
      icon: Truck,
    },
    {
      status: 'DELIVERED',
      title: 'Delivered',
      description:
        delivery.status === 'DELIVERED'
          ? `Confirmed via QR scan at destination (${delivery.confirmation_time || delivery.updated_at})`
          : 'Pending arrival & QR verification',
      icon: CheckCircle2,
    },
  ];

  return (
    <div id={`tracking-view-${delivery.delivery_id}`} className="space-y-6">
      {/* Header Info */}
      <div className="bg-white dark:bg-zinc-900 p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-zinc-100 dark:border-zinc-800">
          <div>
            <div className="flex items-center flex-wrap gap-2.5">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <span className="font-mono text-zinc-900 dark:text-zinc-100">
                  {delivery.reference || `DEL-${delivery.delivery_id}`}
                </span>
                <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
                  Reference
                </span>
              </h3>
              <StatusBadge status={delivery.status} />
              <DeliveryHealthBadge delivery={delivery} size="md" showElapsed={true} />
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Created at {delivery.created_at} · Expected delivery: <span className="font-semibold text-zinc-800 dark:text-zinc-200 font-mono">{delivery.expected_delivery_at || 'Not set'}</span>
            </p>
          </div>
        </div>

        {/* Core Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 text-xs">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-300">
              <Store className="w-4 h-4 text-zinc-400 shrink-0" />
              <span className="font-semibold text-zinc-800 dark:text-zinc-200">Retailer:</span>
              <span>{delivery.retailer}</span>
            </div>
            {delivery.reference && (
              <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-300">
                <Tag className="w-4 h-4 text-zinc-400 shrink-0" />
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">Reference:</span>
                <span className="font-mono font-semibold text-zinc-900 dark:text-zinc-100">{delivery.reference}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-300">
              <Package className="w-4 h-4 text-zinc-400 shrink-0" />
              <span className="font-semibold text-zinc-800 dark:text-zinc-200">Item:</span>
              <span className="font-medium text-zinc-900 dark:text-zinc-100">{delivery.item_description}</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-300">
              <User className="w-4 h-4 text-zinc-400 shrink-0" />
              <span className="font-semibold text-zinc-800 dark:text-zinc-200">Customer:</span>
              <span>{delivery.customer_name}</span>
            </div>
            <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-300">
              <Phone className="w-4 h-4 text-zinc-400 shrink-0" />
              <span className="font-semibold text-zinc-800 dark:text-zinc-200">Phone:</span>
              <span>{delivery.customer_phone}</span>
            </div>
            {delivery.customer_email && (
              <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-300">
                <Mail className="w-4 h-4 text-zinc-400 shrink-0" />
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">Email:</span>
                <span>{delivery.customer_email}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-300">
              <MapPin className="w-4 h-4 text-zinc-400 shrink-0" />
              <span className="font-semibold text-zinc-800 dark:text-zinc-200">Address:</span>
              <span>{delivery.delivery_address}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Completion Banner (When status === DELIVERED) */}
      {delivery.status === 'DELIVERED' && (
        <div
          id="delivery-confirmed-panel"
          className="bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-500/80 rounded-xl p-5 shadow-sm"
        >
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white shrink-0 shadow-sm">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h4 className="text-base font-bold text-emerald-900 dark:text-emerald-200 uppercase tracking-wide flex items-center gap-2">
                  <span>✓ DELIVERY CONFIRMED</span>
                </h4>
                <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-emerald-200 dark:bg-emerald-800 text-emerald-900 dark:text-emerald-100">
                  Verified via QR
                </span>
              </div>
              <p className="text-xs text-emerald-800 dark:text-emerald-300 mt-1">
                Handed over successfully to customer at destination.
              </p>

              {/* Specific metadata required by spec */}
              <div className="mt-3.5 pt-3 border-t border-emerald-200/80 dark:border-emerald-800/60 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-emerald-700 dark:text-emerald-400 block text-[11px]">Reference</span>
                  <span className="font-bold text-emerald-950 dark:text-emerald-100 font-mono">
                    {delivery.reference || `DEL-${delivery.delivery_id}`}
                  </span>
                </div>
                <div>
                  <span className="text-emerald-700 dark:text-emerald-400 block text-[11px]">Customer</span>
                  <span className="font-bold text-emerald-950 dark:text-emerald-100">{delivery.customer_name}</span>
                </div>
                <div>
                  <span className="text-emerald-700 dark:text-emerald-400 block text-[11px]">Rider</span>
                  <span className="font-bold text-emerald-950 dark:text-emerald-100">{delivery.rider || 'Brian Kamau'}</span>
                </div>
                <div>
                  <span className="text-emerald-700 dark:text-emerald-400 block text-[11px]">Confirmed At</span>
                  <span className="font-bold text-emerald-950 dark:text-emerald-100 font-mono">
                    {delivery.confirmation_time || delivery.updated_at}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* In-Transit Delivery Health & SLA Performance */}
      <TransitHealthCard delivery={delivery} />

      {/* 5-Step Canonical Status Timeline */}
      <div className="bg-white dark:bg-zinc-900 p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-5 pb-3.5 border-b border-zinc-100 dark:border-zinc-800">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
              Canonical Delivery Workflow Timeline
            </h4>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
              Live lifecycle progression across 5 canonical workflow milestones
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Current Status:</span>
            <StatusBadge status={delivery.status} size="sm" />
          </div>
        </div>

        <div className="relative pl-6 space-y-7 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-zinc-200 dark:before:bg-zinc-800">
          {steps.map((step) => {
            const state = getStepState(step.status);
            const historyEntry = getHistoryForStatus(step.status);
            const isLiveCurrent = state === 'current';
            const isCompleted = state === 'completed';

            return (
              <div key={step.status} className="relative flex items-start group">
                {/* Node icon / indicator */}
                <div
                  className={`absolute -left-6 top-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                    isCompleted
                      ? 'bg-emerald-600 text-white ring-4 ring-white dark:ring-zinc-900 shadow-sm'
                      : isLiveCurrent
                      ? step.status === 'DELIVERED'
                        ? 'bg-emerald-600 text-white ring-4 ring-emerald-100 dark:ring-emerald-950'
                        : step.status === 'IN_TRANSIT'
                        ? 'bg-blue-600 text-white ring-4 ring-blue-100 dark:ring-blue-950'
                        : 'bg-zinc-900 text-white ring-4 ring-zinc-100 dark:bg-zinc-100 dark:text-zinc-900 dark:ring-zinc-800'
                      : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400 ring-4 ring-white dark:ring-zinc-900'
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-current" />
                  )}
                </div>

                {/* Content */}
                <div className="ml-4 flex-1">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p
                        className={`text-sm font-semibold ${
                          isCompleted
                            ? 'text-zinc-900 dark:text-zinc-100'
                            : isLiveCurrent
                            ? 'text-zinc-900 dark:text-zinc-100 font-bold'
                            : 'text-zinc-400 dark:text-zinc-500'
                        }`}
                      >
                        {isCompleted ? `✓ ${step.title}` : isLiveCurrent ? `● ${step.title}` : step.title}
                      </p>
                      {isLiveCurrent && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                          Current Status: {step.title}
                        </span>
                      )}
                    </div>
                    {historyEntry && (
                      <span className="text-[11px] font-mono text-zinc-400 dark:text-zinc-500">
                        {historyEntry.timestamp}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{step.description}</p>
                  {historyEntry?.note ? (
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 italic bg-zinc-50 dark:bg-zinc-800/40 px-2.5 py-1 rounded border border-zinc-100 dark:border-zinc-800/60 inline-block">
                      "{historyEntry.note}"
                    </p>
                  ) : isLiveCurrent && step.status === 'IN_TRANSIT' && delivery.transitHealth?.customNote ? (
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 italic bg-blue-50/50 dark:bg-blue-950/30 px-2.5 py-1 rounded border border-blue-100 dark:border-blue-900 inline-block">
                      "{delivery.transitHealth.customNote}"
                    </p>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { useReflex } from '../../context/ReflexContext';
import { Delivery } from '../../types';
import { StatusBadge } from '../StatusBadge';
import { RiderBadge } from '../RiderBadge';
import { DeliveryHealthBadge } from '../DeliveryHealthBadge';
import { AssignRiderModal } from './AssignRiderModal';
import { DispatcherAnalyticsCards } from './DispatcherAnalyticsCards';
import {
  Inbox,
  Clock,
  Bike,
  CheckCircle2,
  UserCheck,
  User,
  MapPin,
  Package,
  Activity,
  AlertTriangle,
} from 'lucide-react';

export const DispatcherDashboard: React.FC = () => {
  const { deliveries, riders, getRiderStatus } = useReflex();
  const [selectedForAssign, setSelectedForAssign] = useState<Delivery | null>(null);

  const openRequests = deliveries.filter((d) => d.status === 'OPEN');
  const activeDeliveries = deliveries.filter((d) => d.status === 'ASSIGNED' || d.status === 'PICKED_UP');
  const deliveredCount = deliveries.filter((d) => d.status === 'DELIVERED').length;

  const availableRidersCount = riders.filter((r) => getRiderStatus(r.name) === 'Available').length;

  return (
    <div className="space-y-6">
      {/* Assign Modal if open */}
      {selectedForAssign && (
        <AssignRiderModal
          delivery={selectedForAssign}
          onClose={() => setSelectedForAssign(null)}
        />
      )}

      {/* Top Title Banner */}
      <div>
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
          Dispatch Command & Rider Health
        </h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
          Triage incoming retail requests, allocate available riders, and monitor network health
        </p>
      </div>

      {/* High-Level Delivery Analytics */}
      <DispatcherAnalyticsCards />

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Open Requests */}
        <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Open Requests
            </span>
            <div className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center justify-center border border-zinc-200 dark:border-zinc-700">
              <Inbox className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {openRequests.length}
            </span>
            <span className="text-[11px] text-zinc-500">needs rider</span>
          </div>
        </div>

        {/* Active Deliveries */}
        <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Active Deliveries
            </span>
            <div className="w-7 h-7 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center border border-sky-200/60 dark:border-sky-800/40">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {activeDeliveries.length}
            </span>
            <span className="text-[11px] text-zinc-500">in transit</span>
          </div>
        </div>

        {/* Available Riders */}
        <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Available Riders
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200/60 dark:border-emerald-800/40">
              <Bike className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {availableRidersCount}
            </span>
            <span className="text-[11px] text-zinc-500">ready to assign</span>
          </div>
        </div>

        {/* Delivered */}
        <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Delivered
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200/60 dark:border-emerald-800/40">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {deliveredCount}
            </span>
            <span className="text-[11px] text-zinc-500">completed</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Open Requests (Left) + Rider Health List (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Open Requests Table */}
        <div className="lg:col-span-8 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <span>Open Requests</span>
                {openRequests.length > 0 && (
                  <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                    {openRequests.length} Pending
                  </span>
                )}
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Orders created by retailers waiting for rider assignment
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 dark:bg-zinc-800/60 text-zinc-500 dark:text-zinc-400 font-semibold border-b border-zinc-200/80 dark:border-zinc-800">
                <tr>
                  <th className="py-3 px-4">ID</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Item</th>
                  <th className="py-3 px-4">Created</th>
                  <th className="py-3 px-4">Expected Delivery</th>
                  <th className="py-3 px-4">Status & Health</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {openRequests.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-zinc-500 dark:text-zinc-400">
                      <Inbox className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
                      <p className="font-semibold text-xs text-zinc-700 dark:text-zinc-300">
                        No open delivery requests
                      </p>
                      <p className="text-[11px] text-zinc-400 mt-0.5">
                        All incoming delivery orders have been assigned or completed.
                      </p>
                    </td>
                  </tr>
                ) : (
                  openRequests.map((del) => (
                    <tr
                      key={del.delivery_id}
                      id={`open-request-row-${del.delivery_id}`}
                      className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors"
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-zinc-900 dark:text-zinc-100 font-mono">
                          #{del.delivery_id}
                        </div>
                        {del.reference && (
                          <div className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 mt-0.5">
                            {del.reference}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-zinc-900 dark:text-zinc-100">
                        <div>{del.customer_name}</div>
                        <div className="text-[11px] text-zinc-400">{del.customer_phone}</div>
                        {del.customer_email && (
                          <div className="text-[10px] text-zinc-500 truncate max-w-[140px]">{del.customer_email}</div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-zinc-600 dark:text-zinc-300">
                        {del.delivery_address}
                      </td>
                      <td className="py-3.5 px-4 text-zinc-700 dark:text-zinc-300 font-medium">
                        {del.item_description}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-zinc-500 dark:text-zinc-400">
                        {del.created_at}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-zinc-800 dark:text-zinc-200">
                        <div className="flex items-center gap-1 font-semibold">
                          <Clock className="w-3.5 h-3.5 text-zinc-400" />
                          <span>{del.expected_delivery_at || '—'}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col gap-1 items-start">
                          <StatusBadge status={del.status} size="sm" />
                          <DeliveryHealthBadge delivery={del} size="xs" />
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          id={`btn-assign-delivery-${del.delivery_id}`}
                          onClick={() => setSelectedForAssign(del)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-900 dark:text-amber-100 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 rounded-md transition-colors"
                        >
                          <UserCheck className="w-3.5 h-3.5 text-amber-700 dark:text-amber-300" />
                          <span>Assign Rider</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Rider Health List */}
        <div className="lg:col-span-4 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Rider Fleet Health</h3>
            </div>
            <span className="text-[11px] text-zinc-400">Live derived status</span>
          </div>

          <div className="space-y-3">
            {riders.map((rider) => {
              const status = getRiderStatus(rider.name);
              // find assigned delivery if on delivery
              const activeJob = deliveries.find(
                (d) =>
                  d.rider?.toLowerCase() === rider.name.toLowerCase() &&
                  (d.status === 'ASSIGNED' || d.status === 'PICKED_UP')
              );

              return (
                <div
                  key={rider.id}
                  id={`rider-card-${rider.id}`}
                  className="p-3.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-800/40 flex flex-col gap-2"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                        {rider.name}
                      </p>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                        {rider.phone} · {rider.vehicle || 'Motorcycle'}
                      </p>
                    </div>
                    <RiderBadge status={status} size="sm" />
                  </div>

                  {activeJob && (
                    <div className="mt-1 pt-2 border-t border-zinc-200/60 dark:border-zinc-700/60 text-[11px] text-zinc-600 dark:text-zinc-400 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span>
                          Active: <strong className="text-zinc-800 dark:text-zinc-200">#{activeJob.delivery_id}</strong>
                        </span>
                        <DeliveryHealthBadge delivery={activeJob} size="xs" showElapsed={true} />
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-zinc-500">
                        <span className="truncate max-w-[140px]">{activeJob.delivery_address}</span>
                        <span>{activeJob.item_description}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="p-3 bg-zinc-100/70 dark:bg-zinc-800/60 rounded-lg text-[11px] text-zinc-500 dark:text-zinc-400 space-y-1">
            <p>
              • <strong>Available:</strong> Rider has no active orders assigned.
            </p>
            <p>
              • <strong>On Delivery:</strong> Rider currently handling an order.
            </p>
            <p>
              • <strong>Offline:</strong> Offline demo state (Samuel Mutua).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

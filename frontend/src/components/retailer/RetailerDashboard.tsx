import React from 'react';
import { useReflex } from '../../context/ReflexContext';
import { StatusBadge } from '../StatusBadge';
import { DeliveryHealthBadge } from '../DeliveryHealthBadge';
import { Package, CheckCircle2, Clock, Plus, ArrowRight, MapPin, User, ChevronRight } from 'lucide-react';

export const RetailerDashboard: React.FC = () => {
  const { deliveries, setRetailerTab, setSelectedDeliveryId } = useReflex();

  // Active deliveries: status in OPEN, ASSIGNED, PICKED_UP
  const activeDeliveries = deliveries.filter((d) => d.status !== 'DELIVERED');
  const deliveredDeliveries = deliveries.filter((d) => d.status === 'DELIVERED');
  const totalDeliveries = deliveries.length;

  const handleRowClick = (deliveryId: string) => {
    setSelectedDeliveryId(deliveryId);
    setRetailerTab('deliveries');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
            Mwangaza Electronics Dashboard
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Store location: Luthuli Ave, Nairobi · Live visibility dispatch desk
          </p>
        </div>
        <button
          id="btn-retailer-new-delivery"
          onClick={() => setRetailerTab('new_delivery')}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-lg shadow-sm transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>+ New Delivery</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Active Deliveries */}
        <div className="bg-white dark:bg-zinc-900 p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Active Deliveries
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-200/60 dark:border-amber-800/40">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
              {activeDeliveries.length}
            </span>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">in progress</span>
          </div>
        </div>

        {/* Delivered */}
        <div className="bg-white dark:bg-zinc-900 p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Delivered
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200/60 dark:border-emerald-800/40">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
              {deliveredDeliveries.length}
            </span>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">confirmed today</span>
          </div>
        </div>

        {/* Total Deliveries */}
        <div className="bg-white dark:bg-zinc-900 p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Total Deliveries
            </span>
            <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 flex items-center justify-center border border-zinc-200 dark:border-zinc-700">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
              {totalDeliveries}
            </span>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">all time session</span>
          </div>
        </div>
      </div>

      {/* Active Deliveries Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Active Deliveries</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Live orders being processed or in transit
            </p>
          </div>
          <button
            onClick={() => setRetailerTab('deliveries')}
            className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 dark:bg-zinc-800/60 text-zinc-500 dark:text-zinc-400 font-semibold border-b border-zinc-200/80 dark:border-zinc-800">
              <tr>
                <th className="py-3 px-4">ID</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Item</th>
                <th className="py-3 px-4">Rider</th>
                <th className="py-3 px-4">Status & Health</th>
                <th className="py-3 px-4">Expected Delivery</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {activeDeliveries.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-zinc-500 dark:text-zinc-400">
                    No active deliveries in progress.
                  </td>
                </tr>
              ) : (
                activeDeliveries.map((del) => (
                  <tr
                    key={del.delivery_id}
                    id={`active-row-${del.delivery_id}`}
                    onClick={() => handleRowClick(del.delivery_id)}
                    className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="font-bold text-zinc-900 dark:text-zinc-100">
                        #{del.delivery_id}
                      </div>
                      {del.reference && (
                        <div className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 mt-0.5">
                          {del.reference}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 font-medium text-zinc-800 dark:text-zinc-200">
                      <div>{del.customer_name}</div>
                      <div className="text-[11px] text-zinc-500">{del.customer_phone}</div>
                      {del.customer_email && (
                        <div className="text-[10px] text-zinc-400 truncate max-w-[140px]">{del.customer_email}</div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-zinc-600 dark:text-zinc-300">
                      {del.delivery_address}
                    </td>
                    <td className="py-3 px-4 text-zinc-700 dark:text-zinc-300 font-medium">
                      {del.item_description}
                    </td>
                    <td className="py-3 px-4">
                      {del.rider ? (
                        <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                          {del.rider}
                        </span>
                      ) : (
                        <span className="text-zinc-400 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-col gap-1 items-start">
                        <StatusBadge status={del.status} size="sm" />
                        <DeliveryHealthBadge delivery={del} size="xs" showElapsed={true} />
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-zinc-700 dark:text-zinc-300">
                      <div className="flex items-center gap-1 font-semibold">
                        <Clock className="w-3.5 h-3.5 text-zinc-400" />
                        <span>{del.expected_delivery_at || '—'}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="inline-flex items-center text-emerald-600 dark:text-emerald-400 font-semibold hover:underline">
                        Track <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

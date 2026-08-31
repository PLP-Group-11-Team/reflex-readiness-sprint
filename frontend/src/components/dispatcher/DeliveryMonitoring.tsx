import React, { useState } from 'react';
import { useReflex } from '../../context/ReflexContext';
import { StatusBadge } from '../StatusBadge';
import { DeliveryHealthBadge } from '../DeliveryHealthBadge';
import { TransitHealthCard } from '../TransitHealthCard';
import { getDeliveryHealth } from '../../utils/deliveryHealth';
import {
  Package,
  Search,
  Radio,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  ChevronDown,
  SlidersHorizontal,
  Car,
  Clock,
  CheckCheck,
} from 'lucide-react';

export const DeliveryMonitoring: React.FC = () => {
  const { deliveries } = useReflex();
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<
    'ALL' | 'PICKED_UP' | 'ASSIGNED' | 'DELIVERED' | 'AT_RISK' | 'DELAYED'
  >('ALL');
  const [expandedDeliveryId, setExpandedDeliveryId] = useState<string | null>('103');

  // Active deliveries & Health metrics
  const activeDeliveries = deliveries.filter((d) => d.status !== 'DELIVERED');
  const inTransitDeliveries = deliveries.filter((d) => d.status === 'PICKED_UP');

  const onTimeActive = activeDeliveries.filter((d) => {
    const { health } = getDeliveryHealth(d);
    return health === 'ON_TIME';
  });

  const atRiskActive = activeDeliveries.filter((d) => {
    const { health } = getDeliveryHealth(d);
    return health === 'AT_RISK';
  });

  const delayedActive = activeDeliveries.filter((d) => {
    const { health } = getDeliveryHealth(d);
    return health === 'DELAYED';
  });

  // Filter deliveries that have been assigned or processed
  const monitoredDeliveries = deliveries.filter((d) => {
    const isMonitored = d.status !== 'OPEN';
    const matchesSearch =
      d.delivery_id.includes(searchTerm) ||
      (d.reference && d.reference.toLowerCase().includes(searchTerm.toLowerCase())) ||
      d.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (d.rider && d.rider.toLowerCase().includes(searchTerm.toLowerCase())) ||
      d.delivery_address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (d.expected_delivery_at && d.expected_delivery_at.toLowerCase().includes(searchTerm.toLowerCase()));

    const computedHealth = getDeliveryHealth(d);

    let matchesFilter = true;
    if (filter === 'ALL') {
      matchesFilter = true;
    } else if (filter === 'PICKED_UP') {
      matchesFilter = d.status === 'PICKED_UP';
    } else if (filter === 'ASSIGNED') {
      matchesFilter = d.status === 'ASSIGNED';
    } else if (filter === 'DELIVERED') {
      matchesFilter = d.status === 'DELIVERED';
    } else if (filter === 'AT_RISK') {
      matchesFilter = computedHealth.health === 'AT_RISK';
    } else if (filter === 'DELAYED') {
      matchesFilter = computedHealth.health === 'DELAYED';
    }

    return isMonitored && matchesFilter && matchesSearch;
  });

  const toggleExpand = (id: string) => {
    setExpandedDeliveryId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
              Delivery Monitoring Desk
            </h2>
            <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 px-2.5 py-0.5 rounded-full">
              <Radio className="w-3 h-3 text-emerald-600 animate-pulse" />
              Live Fleet Stream & Health
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Monitor real-time transit status, frozen health evaluation (ON_TIME, AT_RISK, DELAYED), and deadline adherence
          </p>
        </div>
      </div>

      {/* In-Transit Health Snapshot Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
              In Transit
            </span>
            <div className="w-6 h-6 rounded-md bg-sky-50 dark:bg-sky-950 text-sky-600 flex items-center justify-center">
              <Car className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 font-mono">
              {inTransitDeliveries.length}
            </span>
            <span className="text-[11px] text-zinc-400">active couriers</span>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
              On Time (Active)
            </span>
            <div className="w-6 h-6 rounded-md bg-emerald-50 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">
              {onTimeActive.length}
            </span>
            <span className="text-[11px] text-zinc-400">&gt;30m before deadline</span>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
              At Risk (Active)
            </span>
            <div className="w-6 h-6 rounded-md bg-amber-50 dark:bg-amber-950 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span
              className={`text-2xl font-bold font-mono ${
                atRiskActive.length > 0
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-zinc-800 dark:text-zinc-200'
              }`}
            >
              {atRiskActive.length}
            </span>
            <span className="text-[11px] text-zinc-400">within 30m window</span>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
              Delayed (Active)
            </span>
            <div className="w-6 h-6 rounded-md bg-rose-50 dark:bg-rose-950 text-rose-600 flex items-center justify-center">
              <AlertOctagon className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span
              className={`text-2xl font-bold font-mono ${
                delayedActive.length > 0
                  ? 'text-rose-600 dark:text-rose-400'
                  : 'text-zinc-800 dark:text-zinc-200'
              }`}
            >
              {delayedActive.length}
            </span>
            <span className="text-[11px] text-zinc-400">deadline passed</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by ID, customer, rider, expected time..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        <div className="flex gap-1.5 w-full sm:w-auto overflow-x-auto text-xs">
          <button
            onClick={() => setFilter('ALL')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-colors whitespace-nowrap text-xs ${
              filter === 'ALL'
                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
            }`}
          >
            All Monitored
          </button>
          <button
            onClick={() => setFilter('PICKED_UP')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-colors whitespace-nowrap text-xs flex items-center gap-1.5 ${
              filter === 'PICKED_UP'
                ? 'bg-sky-600 text-white'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
            }`}
          >
            <Car className="w-3 h-3" />
            <span>In Transit ({inTransitDeliveries.length})</span>
          </button>
          <button
            onClick={() => setFilter('ASSIGNED')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-colors whitespace-nowrap text-xs ${
              filter === 'ASSIGNED'
                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
            }`}
          >
            Assigned
          </button>
          <button
            onClick={() => setFilter('AT_RISK')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-colors whitespace-nowrap text-xs flex items-center gap-1 ${
              filter === 'AT_RISK'
                ? 'bg-amber-600 text-white'
                : 'bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 hover:bg-amber-100'
            }`}
          >
            <AlertTriangle className="w-3 h-3" />
            <span>At Risk ({atRiskActive.length})</span>
          </button>
          <button
            onClick={() => setFilter('DELAYED')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-colors whitespace-nowrap text-xs flex items-center gap-1 ${
              filter === 'DELAYED'
                ? 'bg-rose-600 text-white'
                : 'bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 hover:bg-rose-100'
            }`}
          >
            <AlertOctagon className="w-3 h-3" />
            <span>Delayed ({delayedActive.length})</span>
          </button>
          <button
            onClick={() => setFilter('DELIVERED')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-colors whitespace-nowrap text-xs ${
              filter === 'DELIVERED'
                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
            }`}
          >
            Delivered
          </button>
        </div>
      </div>

      {/* Monitoring Table with Health Columns and Expandable Inspector */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 dark:bg-zinc-800/60 text-zinc-500 dark:text-zinc-400 font-semibold border-b border-zinc-200/80 dark:border-zinc-800">
              <tr>
                <th className="py-3 px-4">Reference</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Rider</th>
                <th className="py-3 px-4">Destination</th>
                <th className="py-3 px-4">Expected Delivery</th>
                <th className="py-3 px-4">Combined State</th>
                <th className="py-3 px-4">Health Evaluation</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {monitoredDeliveries.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-zinc-500 dark:text-zinc-400">
                    <Package className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
                    <p className="font-semibold text-xs text-zinc-700 dark:text-zinc-300">
                      No deliveries match the selected filter
                    </p>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      Assign open requests from the Dispatch Dashboard to start monitoring.
                    </p>
                  </td>
                </tr>
              ) : (
                monitoredDeliveries.map((del) => {
                  const isExpanded = expandedDeliveryId === del.delivery_id;
                  const computed = getDeliveryHealth(del);
                  const isDelivered = del.status === 'DELIVERED';
                  const statusKey = del.status;

                  return (
                    <React.Fragment key={del.delivery_id}>
                      <tr
                        id={`monitoring-row-${del.delivery_id}`}
                        className={`hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors ${
                          isExpanded ? 'bg-zinc-50/70 dark:bg-zinc-800/30' : ''
                        }`}
                      >
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-zinc-900 dark:text-zinc-100 font-mono">
                            {del.reference || `DEL-${del.delivery_id}`}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-medium text-zinc-900 dark:text-zinc-100">
                          <div>{del.customer_name}</div>
                          <div className="text-[11px] text-zinc-400">{del.customer_phone}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                            {del.rider || '—'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-zinc-600 dark:text-zinc-300 max-w-[170px] truncate">
                          {del.delivery_address}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5 font-mono text-zinc-800 dark:text-zinc-200">
                            <Clock className="w-3.5 h-3.5 text-zinc-400" />
                            <span className="font-semibold">{computed.expectedTimeFormatted}</span>
                          </div>
                          <span className="text-[10px] text-zinc-400 block font-mono">
                            Risk @ {computed.atRiskWindowStartFormatted}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex flex-col gap-1 items-start">
                            <span className="font-mono text-[11px] bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded text-zinc-700 dark:text-zinc-300">
                              status={statusKey}
                            </span>
                            <span className="font-mono text-[11px] bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded font-bold">
                              health={computed.health}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex flex-col gap-1 items-start">
                            <DeliveryHealthBadge delivery={del} size="sm" />
                            <span className="text-[10px] text-zinc-500 dark:text-zinc-400">
                              {isDelivered
                                ? computed.health === 'DELIVERED_ON_TIME'
                                  ? 'Met SLA'
                                  : 'Delivered late'
                                : computed.minutesDiff > 0
                                ? `${computed.minutesDiff}m remaining`
                                : `${Math.abs(computed.minutesDiff)}m overdue`}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            id={`btn-expand-health-${del.delivery_id}`}
                            onClick={() => toggleExpand(del.delivery_id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                          >
                            <SlidersHorizontal className="w-3 h-3 text-zinc-500" />
                            <span>{isExpanded ? 'Hide' : 'Health Breakdown'}</span>
                            <ChevronDown
                              className={`w-3 h-3 transition-transform ${
                                isExpanded ? 'rotate-180' : ''
                              }`}
                            />
                          </button>
                        </td>
                      </tr>

                      {/* Expanded Transit Health Inspector */}
                      {isExpanded && (
                        <tr className="bg-zinc-50/50 dark:bg-zinc-850/50">
                          <td colSpan={8} className="p-4 sm:p-5">
                            <div className="max-w-3xl">
                              <TransitHealthCard delivery={del} />
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

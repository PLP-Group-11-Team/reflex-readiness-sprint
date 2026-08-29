import React, { useState } from 'react';
import { useReflex } from '../../context/ReflexContext';
import { StatusBadge } from '../StatusBadge';
import { DeliveryHealthBadge } from '../DeliveryHealthBadge';
import { DeliveryTrackingTimeline } from './DeliveryTrackingTimeline';
import { Package, Search, Plus, ArrowRight, User, MapPin, Clock } from 'lucide-react';

export const RetailerDeliveriesView: React.FC = () => {
  const { deliveries, selectedDeliveryId, setSelectedDeliveryId, setRetailerTab } = useReflex();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const filteredDeliveries = deliveries.filter((d) => {
    const matchesSearch =
      d.delivery_id.includes(searchTerm) ||
      (d.reference && d.reference.toLowerCase().includes(searchTerm.toLowerCase())) ||
      d.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.delivery_address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.item_description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (d.rider && d.rider.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || d.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const selectedDelivery =
    deliveries.find((d) => d.delivery_id === selectedDeliveryId) || deliveries[0] || null;

  return (
    <div className="space-y-6">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">My Deliveries & Tracking</h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Real-time status tracking for Mwangaza Electronics orders
          </p>
        </div>
        <button
          id="btn-new-delivery-top"
          onClick={() => setRetailerTab('new_delivery')}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-lg shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>+ New Delivery</span>
        </button>
      </div>

      {/* Two-Column Master-Detail Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left column: List of deliveries */}
        <div className="lg:col-span-5 space-y-4">
          {/* Search & Filter */}
          <div className="bg-white dark:bg-zinc-900 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-2.5">
            <div className="relative">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="search-deliveries"
                type="text"
                placeholder="Search by ID, customer, address..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            {/* Status pills filter */}
            <div className="flex gap-1 overflow-x-auto pb-1 text-[11px] font-medium scrollbar-none">
              {['ALL', 'OPEN', 'ASSIGNED', 'PICKED_UP', 'DELIVERED'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 rounded-md transition-colors whitespace-nowrap ${
                    statusFilter === st
                      ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-semibold'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200'
                  }`}
                >
                  {st === 'PICKED_UP' ? 'PICKED UP' : st}
                </button>
              ))}
            </div>
          </div>

          {/* Deliveries list cards */}
          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {filteredDeliveries.length === 0 ? (
              <div className="text-center py-10 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
                <Package className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
                <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">No deliveries found</p>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Try adjusting your search or filters.
                </p>
              </div>
            ) : (
              filteredDeliveries.map((del) => {
                const isSelected = selectedDelivery?.delivery_id === del.delivery_id;
                return (
                  <div
                    key={del.delivery_id}
                    id={`delivery-card-${del.delivery_id}`}
                    onClick={() => setSelectedDeliveryId(del.delivery_id)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer text-left ${
                      isSelected
                        ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-500/80 shadow-sm'
                        : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-xs text-zinc-900 dark:text-zinc-100">
                          #{del.delivery_id}
                        </span>
                        {del.reference && (
                          <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
                            {del.reference}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap justify-end">
                        <StatusBadge status={del.status} size="sm" />
                        <DeliveryHealthBadge delivery={del} size="xs" compact={true} />
                      </div>
                    </div>

                    <div className="mt-2 text-xs">
                      <p className="font-semibold text-zinc-900 dark:text-zinc-100">{del.item_description}</p>
                      <p className="text-zinc-600 dark:text-zinc-400 mt-0.5 flex items-center gap-1 text-[11px]">
                        <User className="w-3 h-3 text-zinc-400" />
                        <span>{del.customer_name}</span>
                        <span className="text-zinc-300 dark:text-zinc-600">·</span>
                        <MapPin className="w-3 h-3 text-zinc-400" />
                        <span className="truncate">{del.delivery_address}</span>
                      </p>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
                      <span>Rider: <strong className="text-zinc-700 dark:text-zinc-300">{del.rider || 'Unassigned'}</strong></span>
                      <span className="flex items-center gap-1 font-mono font-medium text-zinc-700 dark:text-zinc-300">
                        <Clock className="w-3 h-3 text-zinc-400" />
                        {del.expected_delivery_at}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right column: Selected delivery details & canonical timeline */}
        <div className="lg:col-span-7">
          {selectedDelivery ? (
            <DeliveryTrackingTimeline delivery={selectedDelivery} />
          ) : (
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-8 text-center">
              <Package className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
              <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">No delivery selected</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Select a delivery from the left to view real-time tracking details.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

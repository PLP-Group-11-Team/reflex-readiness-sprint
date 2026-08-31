import React from 'react';
import { useReflex } from '../../context/ReflexContext';
import { RetailerDashboard } from './RetailerDashboard';
import { RetailerDeliveriesView } from './RetailerDeliveriesView';
import { CreateDeliveryForm } from './CreateDeliveryForm';
import { LayoutDashboard, ListOrdered, PackagePlus, Store } from 'lucide-react';

export const RetailerView: React.FC = () => {
  const { retailerTab, setRetailerTab, deliveries } = useReflex();

  const activeCount = deliveries.filter((d) => d.status !== 'DELIVERED').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Sidebar */}
        <aside className="md:col-span-3 lg:col-span-3">
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-4 sticky top-24">
            {/* Retailer Info Header */}
            <div className="flex items-center gap-3 pb-4 mb-4 border-b border-zinc-100 dark:border-zinc-800">
              <div className="w-10 h-10 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold">
                <Store className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 truncate">
                  Mwangaza Electronics
                </h3>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Retailer Portal</p>
              </div>
            </div>

            {/* Nav links */}
            <nav className="space-y-1">
              <button
                id="retailer-nav-dashboard"
                onClick={() => setRetailerTab('dashboard')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors ${
                  retailerTab === 'dashboard'
                    ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Dashboard</span>
                </div>
              </button>

              <button
                id="retailer-nav-deliveries"
                onClick={() => setRetailerTab('deliveries')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors ${
                  retailerTab === 'deliveries'
                    ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <ListOrdered className="w-4 h-4" />
                  <span>My Deliveries</span>
                </div>
                {activeCount > 0 && (
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                      retailerTab === 'deliveries'
                        ? 'bg-emerald-500 text-white'
                        : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300'
                    }`}
                  >
                    {activeCount}
                  </span>
                )}
              </button>

              <button
                id="retailer-nav-new-delivery"
                onClick={() => setRetailerTab('new_delivery')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors ${
                  retailerTab === 'new_delivery'
                    ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <PackagePlus className="w-4 h-4 text-emerald-500" />
                  <span>New Delivery</span>
                </div>
              </button>
            </nav>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="md:col-span-9 lg:col-span-9">
          {retailerTab === 'dashboard' && <RetailerDashboard />}
          {retailerTab === 'deliveries' && <RetailerDeliveriesView />}
          {retailerTab === 'new_delivery' && <CreateDeliveryForm />}
        </main>
      </div>
    </div>
  );
};

import React from 'react';
import { useReflex } from '../../context/ReflexContext';
import { DispatcherDashboard } from './DispatcherDashboard';
import { DeliveryMonitoring } from './DeliveryMonitoring';
import { LayoutDashboard, Radio, Headphones } from 'lucide-react';

export const DispatcherView: React.FC = () => {
  const { dispatcherTab, setDispatcherTab, deliveries } = useReflex();

  const openRequestsCount = deliveries.filter((d) => d.status === 'OPEN').length;
  const inTransitCount = deliveries.filter(
    (d) => d.status === 'ASSIGNED' || d.status === 'PICKED_UP'
  ).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Sidebar */}
        <aside className="md:col-span-3 lg:col-span-3">
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-4 sticky top-24">
            {/* Dispatcher Info Header */}
            <div className="flex items-center gap-3 pb-4 mb-4 border-b border-zinc-100 dark:border-zinc-800">
              <div className="w-10 h-10 rounded-lg bg-amber-600 flex items-center justify-center text-white font-bold">
                <Headphones className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 truncate">
                  Central Dispatch
                </h3>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Nairobi Operations</p>
              </div>
            </div>

            {/* Nav links */}
            <nav className="space-y-1">
              <button
                id="dispatcher-nav-dashboard"
                onClick={() => setDispatcherTab('dashboard')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors ${
                  dispatcherTab === 'dashboard'
                    ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Dashboard</span>
                </div>
                {openRequestsCount > 0 && (
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                      dispatcherTab === 'dashboard'
                        ? 'bg-amber-500 text-white'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    }`}
                  >
                    {openRequestsCount}
                  </span>
                )}
              </button>

              <button
                id="dispatcher-nav-monitoring"
                onClick={() => setDispatcherTab('monitoring')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors ${
                  dispatcherTab === 'monitoring'
                    ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Radio className="w-4 h-4" />
                  <span>Delivery Monitoring</span>
                </div>
                {inTransitCount > 0 && (
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                      dispatcherTab === 'monitoring'
                        ? 'bg-sky-500 text-white'
                        : 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300'
                    }`}
                  >
                    {inTransitCount}
                  </span>
                )}
              </button>
            </nav>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="md:col-span-9 lg:col-span-9">
          {dispatcherTab === 'dashboard' && <DispatcherDashboard />}
          {dispatcherTab === 'monitoring' && <DeliveryMonitoring />}
        </main>
      </div>
    </div>
  );
};

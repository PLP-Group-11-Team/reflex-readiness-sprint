import React, { useState } from 'react';
import { useReflex } from '../../context/ReflexContext';
import { Delivery } from '../../types';
import { StatusBadge } from '../StatusBadge';
import { RiderBadge } from '../RiderBadge';
import { DeliveryHealthBadge } from '../DeliveryHealthBadge';
import { TransitHealthCard } from '../TransitHealthCard';
import { QRScannerModal } from './QRScannerModal';
import {
  Bike,
  Package,
  Phone,
  Mail,
  MapPin,
  User,
  QrCode,
  CheckCircle,
  Clock,
  Truck,
} from 'lucide-react';

export const RiderView: React.FC = () => {
  const {
    activeRiderId,
    setActiveRiderId,
    riders,
    deliveries,
    getRiderStatus,
    confirmPickup,
    startTransit,
  } = useReflex();

  const [qrDelivery, setQrDelivery] = useState<Delivery | null>(null);

  const activeRider = riders.find((r) => r.id === activeRiderId) || riders[0];
  const riderStatus = getRiderStatus(activeRider.name);

  // Deliveries assigned to this rider
  const riderDeliveries = deliveries.filter(
    (d) => d.rider?.toLowerCase() === activeRider.name.toLowerCase()
  );

  const activeDeliveries = riderDeliveries.filter((d) => d.status !== 'DELIVERED');
  const completedDeliveries = riderDeliveries.filter((d) => d.status === 'DELIVERED');

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
      {/* QR Confirmation Modal */}
      {qrDelivery && (
        <QRScannerModal
          delivery={qrDelivery}
          onClose={() => setQrDelivery(null)}
        />
      )}

      {/* Rider Profile Card & Active Rider Selector */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-4 sm:p-5 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
              <Bike className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                  {activeRider.name}
                </h2>
                <RiderBadge status={riderStatus} size="sm" />
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                {activeRider.phone} · {activeRider.vehicle || 'Box Bike'} · Rider Portal
              </p>
            </div>
          </div>

          {/* Quick Identity Switcher for Demo Presenter */}
          <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-800/60 p-2 rounded-lg border border-zinc-200 dark:border-zinc-700">
            <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
              Rider Profile:
            </span>
            <div className="flex gap-1">
              {riders
                .filter((r) => !r.isFixedOffline)
                .map((r) => (
                  <button
                    key={r.id}
                    onClick={() => setActiveRiderId(r.id)}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                      activeRiderId === r.id
                        ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                        : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                    }`}
                  >
                    {r.name.split(' ')[0]}
                  </button>
                ))}
            </div>
          </div>
        </div>
      </div>

      {/* Active Tasks Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              My Assigned Deliveries
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Pick up packages from retailers and confirm handover with customers
            </p>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
            {activeDeliveries.length} Active Run{activeDeliveries.length === 1 ? '' : 's'}
          </span>
        </div>

        {/* Deliveries list */}
        {activeDeliveries.length === 0 ? (
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-8 text-center shadow-sm">
            <Package className="w-10 h-10 text-zinc-300 mx-auto mb-2" />
            <p className="font-bold text-sm text-zinc-800 dark:text-zinc-200">
              No deliveries assigned to you
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-sm mx-auto">
              When the central dispatcher assigns an open request to <strong className="text-zinc-700 dark:text-zinc-300">{activeRider.name}</strong>, it will immediately appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {activeDeliveries.map((delivery) => {
              const isAssigned = delivery.status === 'ASSIGNED';
              const isPickedUp = delivery.status === 'PICKED_UP';
              const isInTransit = delivery.status === 'IN_TRANSIT';

              return (
                <div
                  key={delivery.delivery_id}
                  id={`rider-delivery-card-${delivery.delivery_id}`}
                  className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-md p-5 transition-all"
                >
                  {/* Card Top */}
                  <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                        Ref:
                      </span>
                      <span className="text-base font-bold font-mono text-zinc-900 dark:text-zinc-100">
                        {delivery.reference || `DEL-${delivery.delivery_id}`}
                      </span>
                      <span className="text-xs text-zinc-500 dark:text-zinc-400">· {delivery.retailer}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap justify-end">
                      <StatusBadge status={delivery.status} size="sm" />
                      <DeliveryHealthBadge delivery={delivery} size="sm" showElapsed={true} />
                    </div>
                  </div>

                  {/* Delivery Details */}
                  <div className="py-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <Package className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="text-zinc-500 dark:text-zinc-400 block text-[11px]">Item</span>
                          <span className="font-bold text-zinc-900 dark:text-zinc-100">{delivery.item_description}</span>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <User className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="text-zinc-500 dark:text-zinc-400 block text-[11px]">Customer</span>
                          <span className="font-semibold text-zinc-900 dark:text-zinc-100">{delivery.customer_name}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <Phone className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="text-zinc-500 dark:text-zinc-400 block text-[11px]">Phone</span>
                          <a
                            href={`tel:${delivery.customer_phone}`}
                            className="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                          >
                            {delivery.customer_phone}
                          </a>
                        </div>
                      </div>

                      {delivery.customer_email && (
                        <div className="flex items-start gap-2">
                          <Mail className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="text-zinc-500 dark:text-zinc-400 block text-[11px]">Email</span>
                            <a
                              href={`mailto:${delivery.customer_email}`}
                              className="font-medium text-emerald-600 dark:text-emerald-400 hover:underline"
                            >
                              {delivery.customer_email}
                            </a>
                          </div>
                        </div>
                      )}

                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="text-zinc-500 dark:text-zinc-400 block text-[11px]">Destination</span>
                          <span className="font-medium text-zinc-800 dark:text-zinc-200">{delivery.delivery_address}</span>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <Clock className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="text-zinc-500 dark:text-zinc-400 block text-[11px]">Expected Delivery Deadline</span>
                          <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">{delivery.expected_delivery_at}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* In-Transit Health & Route SLA Performance */}
                  <div className="mb-4">
                    <TransitHealthCard delivery={delivery} />
                  </div>

                  {/* Workflow Action Button */}
                  <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800">
                    {isAssigned && (
                      <button
                        id={`btn-confirm-pickup-${delivery.delivery_id}`}
                        onClick={() => confirmPickup(delivery.delivery_id)}
                        className="w-full py-3 px-4 rounded-xl text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 active:bg-sky-800 shadow-md shadow-sky-600/20 flex items-center justify-center gap-2 transition-colors uppercase tracking-wider cursor-pointer"
                      >
                        <Package className="w-4 h-4" />
                        <span>CONFIRM PICKUP (ASSIGNED → PICKED_UP)</span>
                      </button>
                    )}

                    {isPickedUp && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <button
                          id={`btn-start-transit-${delivery.delivery_id}`}
                          onClick={() => startTransit(delivery.delivery_id)}
                          className="py-3 px-4 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 transition-colors uppercase tracking-wider cursor-pointer"
                        >
                          <Truck className="w-4 h-4" />
                          <span>START TRANSIT (PICKED_UP → IN_TRANSIT)</span>
                        </button>
                        <button
                          id={`btn-confirm-delivery-${delivery.delivery_id}`}
                          onClick={() => setQrDelivery(delivery)}
                          className="py-3 px-4 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-colors uppercase tracking-wider cursor-pointer"
                        >
                          <QrCode className="w-4 h-4" />
                          <span>CONFIRM BY QR</span>
                        </button>
                      </div>
                    )}

                    {isInTransit && (
                      <button
                        id={`btn-confirm-delivery-${delivery.delivery_id}`}
                        onClick={() => setQrDelivery(delivery)}
                        className="w-full py-3 px-4 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-colors uppercase tracking-wider cursor-pointer"
                      >
                        <QrCode className="w-4 h-4" />
                        <span>CONFIRM DELIVERY BY QR</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Completed Deliveries History for this rider */}
        {completedDeliveries.length > 0 && (
          <div className="mt-8 pt-6 border-t border-zinc-200 dark:border-zinc-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-3">
              Completed Deliveries ({completedDeliveries.length})
            </h4>
            <div className="space-y-2">
              {completedDeliveries.map((delivery) => (
                <div
                  key={delivery.delivery_id}
                  className="bg-white dark:bg-zinc-900 p-3.5 rounded-lg border border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    <div>
                      <span className="font-bold font-mono text-zinc-900 dark:text-zinc-100">
                        {delivery.reference || `DEL-${delivery.delivery_id}`}
                      </span>
                      <span className="text-zinc-500 ml-2">
                        {delivery.customer_name} · {delivery.item_description}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                      Confirmed at {delivery.confirmation_time || delivery.updated_at}
                    </span>
                    <StatusBadge status="DELIVERED" size="sm" showIcon={false} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

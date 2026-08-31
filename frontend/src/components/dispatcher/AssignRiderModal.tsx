import React, { useState } from 'react';
import { useReflex } from '../../context/ReflexContext';
import { Delivery } from '../../types';
import { RiderBadge } from '../RiderBadge';
import { UserCheck, X, Bike, AlertCircle, Check } from 'lucide-react';

interface AssignRiderModalProps {
  delivery: Delivery;
  onClose: () => void;
}

export const AssignRiderModal: React.FC<AssignRiderModalProps> = ({ delivery, onClose }) => {
  const { riders, getRiderStatus, assignRider } = useReflex();
  const [selectedRiderName, setSelectedRiderName] = useState<string>('');

  const handleAssign = () => {
    if (!selectedRiderName) return;
    assignRider(delivery.delivery_id, selectedRiderName);
    onClose();
  };

  return (
    <div
      id="assign-rider-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div
        id="assign-rider-modal"
        className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-2xl max-w-md w-full overflow-hidden"
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-200/60 dark:border-amber-800/40">
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                <span>Assign Rider to #{delivery.delivery_id}</span>
                {delivery.reference && (
                  <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
                    {delivery.reference}
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                {delivery.item_description} · {delivery.delivery_address}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1 rounded-md"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body: Rider selection */}
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">
              Select Available Rider
            </label>
            <div className="space-y-2">
              {riders.map((rider) => {
                const status = getRiderStatus(rider.name);
                const isAvailable = status === 'Available';
                const isSelected = selectedRiderName === rider.name;

                return (
                  <div
                    key={rider.id}
                    id={`rider-option-${rider.id}`}
                    onClick={() => {
                      if (isAvailable) {
                        setSelectedRiderName(rider.name);
                      }
                    }}
                    className={`p-3 rounded-lg border transition-all flex items-center justify-between ${
                      !isAvailable
                        ? 'opacity-55 bg-zinc-50 dark:bg-zinc-800/30 border-zinc-200 dark:border-zinc-800 cursor-not-allowed'
                        : isSelected
                        ? 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-500/80 shadow-xs cursor-pointer'
                        : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 cursor-pointer'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          isSelected
                            ? 'border-amber-600 bg-amber-600 text-white'
                            : 'border-zinc-300 dark:border-zinc-600'
                        }`}
                      >
                        {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                            {rider.name}
                          </p>
                          <span className="text-[11px] text-zinc-400">{rider.phone}</span>
                        </div>
                        <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                          {rider.vehicle || 'Motorcycle'}
                        </p>
                      </div>
                    </div>

                    <div>
                      <RiderBadge status={status} size="sm" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-lg text-xs text-zinc-500 dark:text-zinc-400 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
            <span>
              Unavailable or offline riders cannot take new deliveries until their active run is completed.
            </span>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-zinc-50 dark:bg-zinc-800/60 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-end gap-2">
          <button
            id="btn-cancel-assign"
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            id="btn-confirm-assign"
            type="button"
            disabled={!selectedRiderName}
            onClick={handleAssign}
            className={`px-4 py-1.5 text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-1.5 ${
              selectedRiderName
                ? 'bg-amber-600 hover:bg-amber-700 text-white cursor-pointer'
                : 'bg-zinc-300 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400 cursor-not-allowed'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Confirm Assignment</span>
          </button>
        </div>
      </div>
    </div>
  );
};

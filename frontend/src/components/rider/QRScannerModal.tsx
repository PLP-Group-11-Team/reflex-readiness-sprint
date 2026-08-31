import React, { useState } from 'react';
import { useReflex } from '../../context/ReflexContext';
import { Delivery } from '../../types';
import { QrCode, CheckCircle2, X, Sparkles, User, MapPin, Package, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface QRScannerModalProps {
  delivery: Delivery;
  onClose: () => void;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({ delivery, onClose }) => {
  const { confirmDeliveryQR } = useReflex();
  const [isScanning, setIsScanning] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSimulateScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      setIsSuccess(true);
      // Trigger context state transition after showing success state briefly
      setTimeout(() => {
        confirmDeliveryQR(delivery.delivery_id);
        onClose();
      }, 1000);
    }, 900);
  };

  return (
    <div
      id="qr-scanner-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div
        id="qr-scanner-modal"
        className="bg-zinc-900 text-zinc-100 rounded-2xl border border-zinc-800 shadow-2xl max-w-sm w-full overflow-hidden"
      >
        {/* Modal Header */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-sm text-white">Scan Delivery QR</h3>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-200 p-1 rounded-md"
            aria-label="Close QR Modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 flex flex-col items-center text-center">
          <p className="text-xs text-zinc-400 mb-4">
            Point camera at customer's receipt QR or tap below to simulate verification for reference {delivery.reference || `#${delivery.delivery_id}`}.
          </p>

          {/* Optical Scanner Viewfinder Box */}
          <div className="relative w-56 h-56 rounded-xl border-2 border-dashed border-zinc-700 bg-zinc-950/80 flex flex-col items-center justify-center overflow-hidden p-4">
            {/* Viewfinder corner accents */}
            <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-emerald-400" />
            <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-emerald-400" />
            <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-emerald-400" />
            <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-emerald-400" />

            {/* Laser scan line animation while simulating */}
            {isScanning && (
              <motion.div
                initial={{ y: -70 }}
                animate={{ y: 70 }}
                transition={{ repeat: Infinity, repeatType: 'reverse', duration: 0.8, ease: 'easeInOut' }}
                className="absolute inset-x-4 h-0.5 bg-emerald-400 shadow-[0_0_12px_#34d399]"
              />
            )}

            {isSuccess ? (
              <motion.div
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex flex-col items-center text-emerald-400"
              >
                <CheckCircle2 className="w-14 h-14" />
                <span className="mt-2 text-sm font-bold tracking-wider text-emerald-300">
                  ✓ QR CONFIRMED
                </span>
                <span className="text-[11px] text-emerald-400/80">Updating visibility stream...</span>
              </motion.div>
            ) : (
              <div className="flex flex-col items-center text-zinc-400">
                <QrCode className="w-20 h-20 text-zinc-500 stroke-1 mb-2" />
                <span className="text-[11px] text-zinc-500 font-mono">
                  REFLEX-AUTH-REF-{delivery.reference || delivery.delivery_id}
                </span>
              </div>
            )}
          </div>

          {/* Delivery quick recap */}
          <div className="mt-4 w-full p-3 rounded-lg bg-zinc-800/60 border border-zinc-700/60 text-left text-xs text-zinc-300 space-y-1">
            <div className="flex justify-between font-medium">
              <span className="text-zinc-400">Reference:</span>
              <span className="text-zinc-100 font-mono font-bold">{delivery.reference || `#${delivery.delivery_id}`}</span>
            </div>
            <div className="flex justify-between font-medium">
              <span className="text-zinc-400">Customer:</span>
              <span className="text-zinc-100">{delivery.customer_name}</span>
            </div>
            <div className="flex justify-between font-medium">
              <span className="text-zinc-400">Item:</span>
              <span className="text-zinc-100">{delivery.item_description}</span>
            </div>
            <div className="flex justify-between font-medium">
              <span className="text-zinc-400">Address:</span>
              <span className="text-zinc-100 truncate max-w-[180px]">{delivery.delivery_address}</span>
            </div>
          </div>

          {/* Scan button */}
          <div className="mt-5 w-full">
            <button
              id="btn-simulate-qr-scan"
              type="button"
              disabled={isScanning || isSuccess}
              onClick={handleSimulateScan}
              className={`w-full py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg ${
                isSuccess
                  ? 'bg-emerald-600 text-white'
                  : isScanning
                  ? 'bg-zinc-700 text-zinc-300 cursor-wait'
                  : 'bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-zinc-950 hover:text-black cursor-pointer shadow-emerald-500/20'
              }`}
            >
              {isSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>✓ QR CONFIRMED</span>
                </>
              ) : isScanning ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin" />
                  <span>Reading QR Code...</span>
                </>
              ) : (
                <>
                  <QrCode className="w-4 h-4" />
                  <span>[ Simulate QR Scan ]</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

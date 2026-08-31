import React, { useState } from 'react';
import { useReflex } from '../../context/ReflexContext';
import { PackagePlus, User, Phone, Mail, MapPin, Package, Sparkles, Clock, Timer, Info, Tag } from 'lucide-react';
import { addMinutesToTime, formatDisplayTime, AT_RISK_WINDOW_MINUTES } from '../../utils/deliveryHealth';

interface FormErrors {
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  delivery_address?: string;
  item_description?: string;
  expected_delivery_at?: string;
}

export const CreateDeliveryForm: React.FC<{ onSuccess?: () => void }> = ({ onSuccess }) => {
  const { createDelivery, setRetailerTab } = useReflex();

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [itemDescription, setItemDescription] = useState('');
  const [reference, setReference] = useState('');
  const [expectedOffsetMinutes, setExpectedOffsetMinutes] = useState<number>(45);
  const [isCustomTime, setIsCustomTime] = useState(false);
  const [customTime, setCustomTime] = useState('14:00');
  const [errors, setErrors] = useState<FormErrors>({});

  // Compute actual expected delivery timestamp string
  const resolvedExpectedTime = isCustomTime
    ? `${customTime}:00`
    : addMinutesToTime(new Date(), expectedOffsetMinutes);

  const atRiskStart = isCustomTime
    ? addMinutesToTime(resolvedExpectedTime, -AT_RISK_WINDOW_MINUTES)
    : addMinutesToTime(new Date(), Math.max(0, expectedOffsetMinutes - AT_RISK_WINDOW_MINUTES));

  const validate = (): boolean => {
    const errs: FormErrors = {};
    if (!customerName.trim()) {
      errs.customer_name = 'Customer name is required';
    }
    if (!customerPhone.trim()) {
      errs.customer_phone = 'Customer phone is required';
    } else if (!/^[0-9+\s-]{9,15}$/.test(customerPhone.trim())) {
      errs.customer_phone = 'Please enter a valid phone number (e.g. 0712 345 678)';
    }
    if (customerEmail.trim()) {
      if (!customerEmail.includes('@') || customerEmail.indexOf('@') === 0 || customerEmail.lastIndexOf('.') < customerEmail.indexOf('@')) {
        errs.customer_email = 'Please enter a valid email address (e.g. name@example.com)';
      }
    }
    if (!deliveryAddress.trim()) {
      errs.delivery_address = 'Delivery address in Nairobi is required';
    }
    if (!itemDescription.trim()) {
      errs.item_description = 'Item description is required';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    createDelivery({
      customer_name: customerName,
      customer_phone: customerPhone,
      customer_email: customerEmail.trim() || undefined,
      delivery_address: deliveryAddress,
      item_description: itemDescription,
      expected_delivery_at: resolvedExpectedTime,
      reference: reference.trim() || undefined,
    });

    setCustomerName('');
    setCustomerPhone('');
    setCustomerEmail('');
    setDeliveryAddress('');
    setItemDescription('');
    setReference('');
    setErrors({});

    if (onSuccess) {
      onSuccess();
    } else {
      setRetailerTab('deliveries');
    }
  };

  const applyPreset = (name: string, phone: string, email: string, address: string, item: string, ref = '') => {
    setCustomerName(name);
    setCustomerPhone(phone);
    setCustomerEmail(email);
    setDeliveryAddress(address);
    setItemDescription(item);
    setReference(ref);
    setErrors({});
  };

  return (
    <div id="create-delivery-card" className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between pb-5 border-b border-zinc-100 dark:border-zinc-800">
        <div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Create New Delivery</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
            Log an item from <span className="font-semibold text-zinc-800 dark:text-zinc-200">Mwangaza Electronics</span> for dispatch
          </p>
        </div>
        <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/60">
          <PackagePlus className="w-5 h-5" />
        </div>
      </div>

      {/* Demo helper presets */}
      <div className="mt-4 p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-200/80 dark:border-zinc-700/60">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-600 dark:text-zinc-300 mb-2">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>Quick Demo Presets:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => applyPreset('Amina Hassan', '0721 987 654', 'amina.hassan@gmail.com', 'Eastleigh, Section 2, Nairobi', 'Home Audio Soundbar')}
            className="text-xs px-2.5 py-1 bg-white dark:bg-zinc-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 rounded transition-colors"
          >
            Amina Hassan (Eastleigh · Soundbar)
          </button>
          <button
            type="button"
            onClick={() => applyPreset('David Otieno', '0733 456 123', 'david.otieno@yahoo.com', 'South B, Plainsview, Nairobi', 'Wireless Router & Switch')}
            className="text-xs px-2.5 py-1 bg-white dark:bg-zinc-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 rounded transition-colors"
          >
            David Otieno (South B · Router)
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        {/* Customer Name */}
        <div>
          <label htmlFor="customer_name" className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
            Customer Name <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
              <User className="w-4 h-4" />
            </div>
            <input
              id="customer_name"
              type="text"
              placeholder="e.g. Jane Wanjiku"
              value={customerName}
              onChange={(e) => {
                setCustomerName(e.target.value);
                if (errors.customer_name) setErrors((prev) => ({ ...prev, customer_name: undefined }));
              }}
              className={`w-full pl-9 pr-3 py-2 text-sm rounded-lg border bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 ${
                errors.customer_name
                  ? 'border-rose-300 focus:ring-rose-400'
                  : 'border-zinc-300 dark:border-zinc-700 focus:ring-emerald-500'
              }`}
            />
          </div>
          {errors.customer_name && (
            <p id="error-customer-name" className="text-xs text-rose-600 dark:text-rose-400 mt-1 font-medium">
              {errors.customer_name}
            </p>
          )}
        </div>

        {/* Customer Phone */}
        <div>
          <label htmlFor="customer_phone" className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
            Customer Phone <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
              <Phone className="w-4 h-4" />
            </div>
            <input
              id="customer_phone"
              type="text"
              placeholder="e.g. 0712 345 678"
              value={customerPhone}
              onChange={(e) => {
                setCustomerPhone(e.target.value);
                if (errors.customer_phone) setErrors((prev) => ({ ...prev, customer_phone: undefined }));
              }}
              className={`w-full pl-9 pr-3 py-2 text-sm rounded-lg border bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 ${
                errors.customer_phone
                  ? 'border-rose-300 focus:ring-rose-400'
                  : 'border-zinc-300 dark:border-zinc-700 focus:ring-emerald-500'
              }`}
            />
          </div>
          {errors.customer_phone && (
            <p id="error-customer-phone" className="text-xs text-rose-600 dark:text-rose-400 mt-1 font-medium">
              {errors.customer_phone}
            </p>
          )}
        </div>

        {/* Customer Email (Optional) */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label htmlFor="customer_email" className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Customer Email
            </label>
            <span className="text-[11px] text-zinc-400">Optional</span>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
              <Mail className="w-4 h-4" />
            </div>
            <input
              id="customer_email"
              type="email"
              placeholder="e.g. customer@example.com"
              value={customerEmail}
              onChange={(e) => {
                setCustomerEmail(e.target.value);
                if (errors.customer_email) setErrors((prev) => ({ ...prev, customer_email: undefined }));
              }}
              className={`w-full pl-9 pr-3 py-2 text-sm rounded-lg border bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 ${
                errors.customer_email
                  ? 'border-rose-300 focus:ring-rose-400'
                  : 'border-zinc-300 dark:border-zinc-700 focus:ring-emerald-500'
              }`}
            />
          </div>
          {errors.customer_email && (
            <p id="error-customer-email" className="text-xs text-rose-600 dark:text-rose-400 mt-1 font-medium">
              {errors.customer_email}
            </p>
          )}
        </div>

        {/* Delivery Address */}
        <div>
          <label htmlFor="delivery_address" className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
            Delivery Address <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
              <MapPin className="w-4 h-4" />
            </div>
            <input
              id="delivery_address"
              type="text"
              placeholder="e.g. Westlands, Nairobi"
              value={deliveryAddress}
              onChange={(e) => {
                setDeliveryAddress(e.target.value);
                if (errors.delivery_address) setErrors((prev) => ({ ...prev, delivery_address: undefined }));
              }}
              className={`w-full pl-9 pr-3 py-2 text-sm rounded-lg border bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 ${
                errors.delivery_address
                  ? 'border-rose-300 focus:ring-rose-400'
                  : 'border-zinc-300 dark:border-zinc-700 focus:ring-emerald-500'
              }`}
            />
          </div>
          {errors.delivery_address && (
            <p id="error-delivery-address" className="text-xs text-rose-600 dark:text-rose-400 mt-1 font-medium">
              {errors.delivery_address}
            </p>
          )}
        </div>

        {/* Item Description */}
        <div>
          <label htmlFor="item_description" className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
            Item Description <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
              <Package className="w-4 h-4" />
            </div>
            <input
              id="item_description"
              type="text"
              placeholder="e.g. Samsung 55'' TV"
              value={itemDescription}
              onChange={(e) => {
                setItemDescription(e.target.value);
                if (errors.item_description) setErrors((prev) => ({ ...prev, item_description: undefined }));
              }}
              className={`w-full pl-9 pr-3 py-2 text-sm rounded-lg border bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 ${
                errors.item_description
                  ? 'border-rose-300 focus:ring-rose-400'
                  : 'border-zinc-300 dark:border-zinc-700 focus:ring-emerald-500'
              }`}
            />
          </div>
          {errors.item_description && (
            <p id="error-item-description" className="text-xs text-rose-600 dark:text-rose-400 mt-1 font-medium">
              {errors.item_description}
            </p>
          )}
        </div>

        {/* Order Reference */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label htmlFor="reference" className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Order Reference
            </label>
            <span className="text-[11px] text-zinc-400 font-normal">Optional · Auto-generated if left blank</span>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
              <Tag className="w-4 h-4" />
            </div>
            <input
              id="reference"
              type="text"
              placeholder="e.g. DEL-001 or ORD-8842"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-xs"
            />
          </div>
        </div>

        {/* Expected Delivery Time (expected_delivery_at) */}
        <div className="pt-2 pb-1 border-t border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Expected Delivery Time <span className="text-rose-500">*</span>
            </label>
            <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
              Deadline: {formatDisplayTime(resolvedExpectedTime)}
            </span>
          </div>

          {/* Presets */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2.5">
            {[
              { label: '+30 min (Urgent)', mins: 30 },
              { label: '+45 min (Standard)', mins: 45 },
              { label: '+60 min (1 Hour)', mins: 60 },
              { label: '+2 hours (Later)', mins: 120 },
            ].map((preset) => (
              <button
                key={preset.mins}
                type="button"
                onClick={() => {
                  setExpectedOffsetMinutes(preset.mins);
                  setIsCustomTime(false);
                }}
                className={`text-xs py-2 px-2.5 rounded-lg border font-medium transition-colors text-center ${
                  !isCustomTime && expectedOffsetMinutes === preset.mins
                    ? 'bg-emerald-50 border-emerald-400 text-emerald-800 dark:bg-emerald-950/60 dark:border-emerald-700 dark:text-emerald-300 font-semibold ring-1 ring-emerald-400'
                    : 'bg-white dark:bg-zinc-800/80 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Custom Time Option Toggle */}
          <div className="flex items-center justify-between gap-3 p-2.5 bg-zinc-50 dark:bg-zinc-850 rounded-lg border border-zinc-200/80 dark:border-zinc-700/80 mb-2">
            <div className="flex items-center gap-2">
              <input
                id="toggle-custom-time"
                type="checkbox"
                checked={isCustomTime}
                onChange={(e) => setIsCustomTime(e.target.checked)}
                className="w-4 h-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
              />
              <label htmlFor="toggle-custom-time" className="text-xs font-medium text-zinc-700 dark:text-zinc-300 cursor-pointer">
                Set custom time deadline
              </label>
            </div>

            {isCustomTime && (
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-zinc-400" />
                <input
                  id="custom-expected-time"
                  type="time"
                  value={customTime}
                  onChange={(e) => setCustomTime(e.target.value)}
                  className="px-2 py-1 text-xs rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 font-mono text-zinc-800 dark:text-zinc-200"
                />
              </div>
            )}
          </div>

          {/* Health Derivation Explanation Card */}
          <div className="p-2.5 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-800/40 text-[11px] text-zinc-600 dark:text-zinc-400 space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-emerald-800 dark:text-emerald-300">
              <Info className="w-3.5 h-3.5" />
              <span>Automated Health Derivation Engine</span>
            </div>
            <p>
              Delivery starts as <span className="font-semibold text-emerald-700 dark:text-emerald-400">ON_TIME</span>.
              At <span className="font-semibold text-amber-700 dark:text-amber-400">{formatDisplayTime(atRiskStart)}</span> (30-min window before deadline), health automatically shifts to <span className="font-semibold text-amber-700 dark:text-amber-400">AT_RISK</span>.
              If unconfirmed after <span className="font-semibold text-rose-700 dark:text-rose-400">{formatDisplayTime(resolvedExpectedTime)}</span>, health becomes <span className="font-semibold text-rose-700 dark:text-rose-400">DELAYED</span>.
            </p>
          </div>
        </div>

        {/* Submit */}
        <div className="pt-3 flex items-center justify-end gap-3">
          <button
            id="btn-cancel-create"
            type="button"
            onClick={() => setRetailerTab('dashboard')}
            className="px-4 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            id="btn-submit-delivery"
            type="submit"
            className="px-5 py-2.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-lg shadow-sm transition-colors flex items-center gap-2"
          >
            <PackagePlus className="w-4 h-4" />
            <span>Create Delivery</span>
          </button>
        </div>
      </form>
    </div>
  );
};


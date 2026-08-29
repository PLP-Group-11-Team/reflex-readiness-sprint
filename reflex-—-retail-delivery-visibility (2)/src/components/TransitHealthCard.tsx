import React, { useState } from 'react';
import { Delivery } from '../types';
import { getDeliveryHealth, AT_RISK_WINDOW_MINUTES } from '../utils/deliveryHealth';
import { generateActionTimeline, getTimelinePlainText } from '../utils/deliveryTimeline';
import { DeliveryHealthBadge } from './DeliveryHealthBadge';
import {
  Activity,
  Clock,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  ShieldCheck,
  Calendar,
  Lock,
  Timer,
  CheckCheck,
  Copy,
  Check,
  Truck,
  Package,
  UserCheck,
  ListOrdered,
} from 'lucide-react';

interface TransitHealthCardProps {
  delivery: Delivery;
  compact?: boolean;
}

export const TransitHealthCard: React.FC<TransitHealthCardProps> = ({
  delivery,
  compact = false,
}) => {
  const computed = getDeliveryHealth(delivery);
  const isDelivered = delivery.status === 'DELIVERED';
  const timelineItems = generateActionTimeline(delivery);
  const [copied, setCopied] = useState(false);

  const handleCopyTimeline = () => {
    const text = getTimelinePlainText(delivery);
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const latestLoggedAction = timelineItems.filter((i) => !i.isUpcoming).slice(-1)[0];

  if (compact) {
    return (
      <div
        id={`compact-health-${delivery.delivery_id}`}
        className="p-3 bg-zinc-50 dark:bg-zinc-850 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-2 text-xs"
      >
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
              {delivery.reference || `DEL-${delivery.delivery_id}`}
            </span>
            <DeliveryHealthBadge delivery={delivery} size="sm" />
          </div>
          <span className="font-mono text-[11px] text-zinc-500">
            Due: {computed.expectedTimeFormatted}
          </span>
        </div>
        {latestLoggedAction && (
          <div className="flex items-center gap-2 pt-1 border-t border-zinc-200/60 dark:border-zinc-800/60 text-[11px] font-mono text-zinc-700 dark:text-zinc-300">
            <span className="font-bold text-emerald-600 dark:text-emerald-400">
              {latestLoggedAction.time}
            </span>
            <span className="truncate">{latestLoggedAction.action}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      id={`delivery-health-panel-${delivery.delivery_id}`}
      className={`rounded-xl border transition-all ${
        computed.health === 'DELAYED'
          ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/60'
          : computed.health === 'AT_RISK'
          ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/60'
          : computed.health === 'DELIVERED_LATE'
          ? 'bg-orange-50/50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800/60'
          : 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60'
      } p-4 sm:p-5 shadow-xs`}
    >
      {/* Top Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center border shadow-xs ${
              computed.health === 'DELAYED'
                ? 'bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-700'
                : computed.health === 'AT_RISK'
                ? 'bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700'
                : computed.health === 'DELIVERED_LATE'
                ? 'bg-orange-100 dark:bg-orange-900/60 text-orange-700 dark:text-orange-300 border-orange-300 dark:border-orange-700'
                : 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700'
            }`}
          >
            {isDelivered ? (
              computed.health === 'DELIVERED_ON_TIME' ? (
                <CheckCheck className="w-5 h-5" />
              ) : (
                <Clock className="w-5 h-5" />
              )
            ) : computed.health === 'AT_RISK' ? (
              <AlertTriangle className="w-5 h-5" />
            ) : computed.health === 'DELAYED' ? (
              <AlertOctagon className="w-5 h-5" />
            ) : (
              <Activity className="w-5 h-5" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Delivery Health & Expected Time
              </h4>
              <span className="font-mono text-xs font-bold text-zinc-600 dark:text-zinc-400 px-2 py-0.5 rounded bg-white/80 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                {delivery.reference || `DEL-${delivery.delivery_id}`}
              </span>
              <DeliveryHealthBadge delivery={delivery} size="sm" />
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">
              {computed.description}
            </p>
          </div>
        </div>

        {/* Backend Derived Pill */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/80 dark:bg-zinc-850/80 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 text-[11px] font-medium shadow-2xs">
          <Lock className="w-3 h-3 text-zinc-400" />
          <span>Derived by backend</span>
        </div>
      </div>

      {/* Combined State Banner */}
      <div className="mt-4 p-3 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 text-xs flex-wrap">
          <span className="text-zinc-500 font-medium">Combined State:</span>
          <span className="font-mono font-semibold px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200">
            status = <span className="text-emerald-700 dark:text-emerald-400 font-bold">{delivery.status}</span>
          </span>
          <span className="font-mono font-semibold px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200">
            health ={' '}
            <span
              className={`font-bold ${
                computed.health === 'DELAYED' || computed.health === 'DELIVERED_LATE'
                  ? 'text-rose-600 dark:text-rose-400'
                  : computed.health === 'AT_RISK'
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {computed.health}
            </span>
          </span>
        </div>

        <div className="flex items-center gap-1 text-[11px] text-zinc-500">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Automated evaluation</span>
        </div>
      </div>

      {/* Metric Cards (Expected, At-Risk Window, Remaining) */}
      <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
        {/* Expected Delivery Time */}
        <div className="bg-white/90 dark:bg-zinc-900/90 rounded-lg p-3 border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between text-zinc-500 mb-1">
            <span className="font-medium">Expected Deadline</span>
            <Calendar className="w-3.5 h-3.5" />
          </div>
          <div className="font-mono text-sm font-bold text-zinc-900 dark:text-zinc-100">
            {computed.expectedTimeFormatted}
          </div>
          <p className="text-[11px] text-zinc-500 mt-0.5 font-mono">
            Reference: {delivery.reference || `DEL-${delivery.delivery_id}`}
          </p>
        </div>

        {/* 30-Minute At-Risk Window */}
        <div className="bg-white/90 dark:bg-zinc-900/90 rounded-lg p-3 border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between text-zinc-500 mb-1">
            <span className="font-medium">At-Risk Window</span>
            <Timer className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="font-mono text-sm font-bold text-amber-700 dark:text-amber-400">
            {computed.atRiskWindowStartFormatted} – {computed.expectedTimeFormatted}
          </div>
          <p className="text-[11px] text-zinc-500 mt-0.5">
            {AT_RISK_WINDOW_MINUTES} min prior to deadline
          </p>
        </div>

        {/* Current / Delivered Time Status */}
        <div className="bg-white/90 dark:bg-zinc-900/90 rounded-lg p-3 border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between text-zinc-500 mb-1">
            <span className="font-medium">{isDelivered ? 'Confirmed Delivery' : 'Time Remaining'}</span>
            <Clock className="w-3.5 h-3.5" />
          </div>
          <div
            className={`font-mono text-sm font-bold ${
              computed.minutesDiff < 0
                ? 'text-rose-600 dark:text-rose-400'
                : computed.minutesDiff <= AT_RISK_WINDOW_MINUTES && !isDelivered
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-emerald-600 dark:text-emerald-400'
            }`}
          >
            {isDelivered
              ? delivery.confirmation_time || delivery.updated_at
              : computed.minutesDiff > 0
              ? `${computed.minutesDiff} min remaining`
              : `${Math.abs(computed.minutesDiff)} min past deadline`}
          </div>
          <p className="text-[11px] text-zinc-500 mt-0.5">
            {isDelivered
              ? computed.health === 'DELIVERED_ON_TIME'
                ? 'Delivered on schedule'
                : 'Delivered after deadline'
              : computed.minutesDiff > AT_RISK_WINDOW_MINUTES
              ? 'On time corridor'
              : computed.minutesDiff >= 0
              ? 'Inside 30m at-risk window'
              : 'Deadline exceeded'}
          </p>
        </div>
      </div>

      {/* DYNAMIC ACTION TIMELINE (Updates after each action) */}
      <div className="mt-4 pt-4 border-t border-zinc-200/80 dark:border-zinc-800/80">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
          <div className="flex items-center gap-2">
            <ListOrdered className="w-4 h-4 text-zinc-500" />
            <h5 className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
              Live Action Timeline
            </h5>
            <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-100/70 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
              Updates after each action
            </span>
          </div>

          <button
            type="button"
            onClick={handleCopyTimeline}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium rounded-md bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-750 transition-colors cursor-pointer"
            title="Copy formatted action timeline text"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-600" />
                <span className="text-emerald-600 font-semibold">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3 text-zinc-400" />
                <span>Copy Timeline</span>
              </>
            )}
          </button>
        </div>

        {/* Timeline Log Container */}
        <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-3 sm:p-4 space-y-3">
          {timelineItems.map((item, index) => {
            const isLastLogged = item.isCurrent;
            const isCompleted = item.isCompleted;
            const isUpcoming = item.isUpcoming;

            return (
              <div
                key={item.id}
                className={`flex items-start gap-3 text-xs transition-colors ${
                  isUpcoming ? 'opacity-55' : 'opacity-100'
                }`}
              >
                {/* Time badge */}
                <div
                  className={`w-14 sm:w-16 shrink-0 font-mono text-[11px] font-bold px-1.5 py-0.5 rounded text-center ${
                    isCompleted
                      ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700'
                      : isLastLogged
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 shadow-xs'
                      : 'bg-zinc-50 dark:bg-zinc-850 text-zinc-400 border border-dashed border-zinc-300 dark:border-zinc-700'
                  }`}
                >
                  {item.time}
                </div>

                {/* Node icon & connector */}
                <div className="relative flex items-center justify-center pt-0.5">
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      isCompleted
                        ? 'bg-emerald-600 text-white'
                        : isLastLogged
                        ? 'bg-blue-600 text-white ring-4 ring-blue-100 dark:ring-blue-950'
                        : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="w-3 h-3 stroke-3" />
                    ) : isLastLogged ? (
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                    )}
                  </div>
                </div>

                {/* Action line */}
                <div className="flex-1 min-w-0 pt-0.5">
                  <div className="flex items-baseline justify-between flex-wrap gap-1">
                    <p
                      className={`font-mono text-xs ${
                        isCompleted
                          ? 'font-medium text-zinc-800 dark:text-zinc-200'
                          : isLastLogged
                          ? 'font-bold text-zinc-950 dark:text-white'
                          : 'italic text-zinc-400 dark:text-zinc-500'
                      }`}
                    >
                      {item.action}
                    </p>

                    {isLastLogged && (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                        Current
                      </span>
                    )}
                  </div>

                  {item.note && (
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 italic">
                      "{item.note}"
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Formatted Text Box Output for direct inspection */}
        <div className="mt-2.5 p-2.5 rounded-md bg-zinc-950 text-zinc-200 font-mono text-[11px] leading-relaxed select-all overflow-x-auto border border-zinc-800">
          <div className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 mb-1">
            Timeline Output (Live Actions):
          </div>
          {getTimelinePlainText(delivery)}
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { useReflex } from '../context/ReflexContext';
import { UserRole } from '../types';
import { RotateCcw, ChevronDown, Check, Zap, Bike, LogOut, User } from 'lucide-react';

export const Header: React.FC = () => {
  const {
    currentUser,
    logout,
    role,
    setRole,
    activeRiderId,
    setActiveRiderId,
    riders,
    resetDemoData,
  } = useReflex();

  const activeRider = riders.find((r) => r.id === activeRiderId) || riders[0];

  const handleRoleChange = (newRole: UserRole) => {
    setRole(newRole);
  };

  const getRoleUserLabel = () => {
    if (currentUser) {
      const roleCapitalized = currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1);
      return `${currentUser.name} · ${roleCapitalized}`;
    }
    switch (role) {
      case 'retailer':
        return 'Mwangaza Electronics · Retailer';
      case 'dispatcher':
        return 'Dispatch Desk · Dispatcher';
      case 'rider':
        return `${activeRider.name.split(' ')[0]} · Rider`;
    }
  };

  const getUserInitials = () => {
    if (currentUser?.name) {
      const parts = currentUser.name.trim().split(' ');
      if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
      }
      return parts[0][0].toUpperCase();
    }
    return role === 'retailer' ? 'M' : role === 'dispatcher' ? 'D' : activeRider.name[0];
  };

  return (
    <header
      id="app-header"
      className="sticky top-0 z-40 bg-zinc-900 border-b border-zinc-800 text-zinc-100 shadow-sm"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand and Sync Indicator */}
          <div className="flex items-center space-x-6">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-black tracking-tighter text-base shadow-sm">
                R
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-lg tracking-wider text-white">REFLEX</span>
                  <span className="hidden sm:inline-block text-[10px] uppercase font-semibold tracking-wider px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                    Live Visibility
                  </span>
                </div>
              </div>
            </div>

            {/* Sync status badge */}
            <div
              id="sync-indicator"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-800/80 text-emerald-400 text-xs font-medium"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Synced</span>
            </div>
          </div>

          {/* Right Side: Demo Reset, Role Switcher, Current User & Logout */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Demo Reset Button */}
            <button
              id="btn-reset-demo"
              onClick={resetDemoData}
              title="Reset Demo Data to Initial Seed"
              className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-200 bg-zinc-800/80 hover:bg-zinc-800 border border-zinc-700/80 rounded-md transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Demo</span>
            </button>

            {/* Switch Role Dropdown (useful for fast switching in demo) */}
            <div className="flex items-center gap-1.5">
              <div className="relative inline-flex items-center bg-zinc-800 p-1 rounded-lg border border-zinc-700">
                <span className="hidden xl:inline text-xs font-medium text-zinc-400 pl-2 pr-1">
                  View:
                </span>
                
                {/* Select dropdown */}
                <div className="relative">
                  <select
                    id="role-switcher-select"
                    value={role}
                    onChange={(e) => handleRoleChange(e.target.value as UserRole)}
                    className="appearance-none bg-zinc-900 text-zinc-100 font-semibold text-xs py-1.5 pl-2.5 pr-7 rounded-md border border-zinc-700 hover:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                  >
                    <option value="retailer">Retailer</option>
                    <option value="dispatcher">Dispatcher</option>
                    <option value="rider">Rider</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-zinc-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* If Rider role is selected, quick selector to switch between riders */}
              {role === 'rider' && (
                <div className="relative hidden md:inline-block">
                  <select
                    id="rider-switcher-select"
                    value={activeRiderId}
                    onChange={(e) => setActiveRiderId(e.target.value)}
                    className="appearance-none bg-zinc-900 text-zinc-300 text-xs py-1.5 pl-2.5 pr-7 rounded-md border border-zinc-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                  >
                    {riders
                      .filter((r) => !r.isFixedOffline)
                      .map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name}
                        </option>
                      ))}
                  </select>
                  <ChevronDown className="w-3 h-3 text-zinc-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              )}
            </div>

            {/* Current user badge with Name and Role */}
            <div
              id="current-user-badge"
              className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-zinc-800"
            >
              <div className="w-7 h-7 rounded-full bg-emerald-900/70 border border-emerald-700/80 flex items-center justify-center text-emerald-300 text-xs font-bold shrink-0">
                {getUserInitials()}
              </div>
              <div className="hidden sm:block text-left max-w-[170px] truncate">
                <p className="text-xs font-semibold text-zinc-200 truncate">{getRoleUserLabel()}</p>
                {currentUser?.email && (
                  <p className="text-[10px] text-zinc-500 truncate">{currentUser.email}</p>
                )}
              </div>
            </div>

            {/* Logout Button */}
            <button
              id="btn-logout"
              onClick={logout}
              title="Sign Out"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-zinc-400 hover:text-rose-300 bg-zinc-800/80 hover:bg-rose-950/40 border border-zinc-700 hover:border-rose-800/60 rounded-lg transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};


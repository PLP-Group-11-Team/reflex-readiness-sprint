import React, { useState } from 'react';
import { useReflex } from '../../context/ReflexContext';
import { UserRole } from '../../types';
import {
  Lock,
  Mail,
  User,
  Store,
  Compass,
  Bike,
  ArrowRight,
  Loader2,
  AlertCircle,
  ShieldCheck,
  CheckCircle2,
  Zap,
} from 'lucide-react';

export const AuthScreen: React.FC = () => {
  const { login, signup, users } = useReflex();

  const [mode, setMode] = useState<'login' | 'signup'>('login');

  // Login form state
  const [loginEmail, setLoginEmail] = useState('retailer@mwangaza.ke');
  const [loginPassword, setLoginPassword] = useState('password123');

  // Signup form state
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupRole, setSignupRole] = useState<UserRole>('retailer');

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!loginEmail.trim()) {
      setErrorMessage('Please enter your email address.');
      return;
    }
    if (!loginPassword.trim()) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await login(loginEmail, loginPassword);
      if (!result.success && result.error) {
        setErrorMessage(result.error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!signupName.trim()) {
      setErrorMessage('Please enter your full name or company name.');
      return;
    }
    if (!signupEmail.trim()) {
      setErrorMessage('Please enter your email address.');
      return;
    }
    if (!signupPassword.trim()) {
      setErrorMessage('Please enter a password.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await signup(signupName, signupEmail, signupPassword, signupRole);
      if (!result.success && result.error) {
        setErrorMessage(result.error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = (email: string, pass = 'password123') => {
    setErrorMessage(null);
    setLoginEmail(email);
    setLoginPassword(pass);
    setIsLoading(true);
    login(email, pass).finally(() => setIsLoading(false));
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-600 text-white font-black text-2xl shadow-lg shadow-emerald-900/30 mb-3">
            R
          </div>
          <h1 className="text-2xl font-black tracking-wider text-white">REFLEX</h1>
          <p className="text-xs text-zinc-400 font-medium tracking-wide uppercase mt-1">
            Retail Delivery Visibility Desk
          </p>
        </div>

        {/* Auth Card */}
        <div className="mt-8 bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-sm">
          {/* Mode Switcher Tabs */}
          <div className="flex rounded-xl bg-zinc-950 p-1 border border-zinc-800 mb-6">
            <button
              id="tab-auth-login"
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMessage(null);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${
                mode === 'login'
                  ? 'bg-zinc-800 text-white shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Sign In
            </button>
            <button
              id="tab-auth-signup"
              type="button"
              onClick={() => {
                setMode('signup');
                setErrorMessage(null);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${
                mode === 'signup'
                  ? 'bg-zinc-800 text-white shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div
              id="auth-error-banner"
              className="mb-5 p-3 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-start gap-2.5 animate-fadeIn"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <div className="flex-1">
                <span className="font-semibold block">Authentication Error</span>
                <span>{errorMessage}</span>
              </div>
            </div>
          )}

          {/* LOGIN FORM */}
          {mode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="login-email"
                  className="block text-xs font-semibold text-zinc-300 mb-1.5"
                >
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="login-email"
                    type="email"
                    autoComplete="email"
                    placeholder="e.g. retailer@mwangaza.ke"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    disabled={isLoading}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-zinc-700 bg-zinc-950 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-60"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="login-password"
                  className="block text-xs font-semibold text-zinc-300 mb-1.5"
                >
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="login-password"
                    type="password"
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    disabled={isLoading}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-zinc-700 bg-zinc-950 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-60"
                  />
                </div>
              </div>

              <button
                id="btn-login-submit"
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-2.5 px-4 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-60 transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying credentials...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Dashboard</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* SIGNUP FORM */}
          {mode === 'signup' && (
            <form onSubmit={handleSignupSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="signup-name"
                  className="block text-xs font-semibold text-zinc-300 mb-1.5"
                >
                  Full Name / Merchant Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    id="signup-name"
                    type="text"
                    placeholder="e.g. Mwangaza Store or Brian Kamau"
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                    disabled={isLoading}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-zinc-700 bg-zinc-950 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-60"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="signup-email"
                  className="block text-xs font-semibold text-zinc-300 mb-1.5"
                >
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="signup-email"
                    type="email"
                    placeholder="e.g. you@reflex.ke"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    disabled={isLoading}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-zinc-700 bg-zinc-950 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-60"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="signup-password"
                  className="block text-xs font-semibold text-zinc-300 mb-1.5"
                >
                  Create Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="signup-password"
                    type="password"
                    placeholder="At least 4 characters"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    disabled={isLoading}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-zinc-700 bg-zinc-950 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-60"
                  />
                </div>
              </div>

              {/* Role selector */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Select Role & Landing Dashboard <span className="text-emerald-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    id="role-select-retailer"
                    type="button"
                    onClick={() => setSignupRole('retailer')}
                    className={`p-2.5 rounded-lg border text-left transition-colors ${
                      signupRole === 'retailer'
                        ? 'bg-emerald-950/60 border-emerald-500 text-white'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <Store className={`w-4 h-4 mb-1 ${signupRole === 'retailer' ? 'text-emerald-400' : 'text-zinc-500'}`} />
                    <span className="block text-xs font-bold">Retailer</span>
                    <span className="text-[10px] text-zinc-500 block leading-tight">Store Shop</span>
                  </button>

                  <button
                    id="role-select-dispatcher"
                    type="button"
                    onClick={() => setSignupRole('dispatcher')}
                    className={`p-2.5 rounded-lg border text-left transition-colors ${
                      signupRole === 'dispatcher'
                        ? 'bg-emerald-950/60 border-emerald-500 text-white'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <Compass className={`w-4 h-4 mb-1 ${signupRole === 'dispatcher' ? 'text-emerald-400' : 'text-zinc-500'}`} />
                    <span className="block text-xs font-bold">Dispatcher</span>
                    <span className="text-[10px] text-zinc-500 block leading-tight">Fleet Desk</span>
                  </button>

                  <button
                    id="role-select-rider"
                    type="button"
                    onClick={() => setSignupRole('rider')}
                    className={`p-2.5 rounded-lg border text-left transition-colors ${
                      signupRole === 'rider'
                        ? 'bg-emerald-950/60 border-emerald-500 text-white'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <Bike className={`w-4 h-4 mb-1 ${signupRole === 'rider' ? 'text-emerald-400' : 'text-zinc-500'}`} />
                    <span className="block text-xs font-bold">Rider</span>
                    <span className="text-[10px] text-zinc-500 block leading-tight">Field Courier</span>
                  </button>
                </div>
              </div>

              <button
                id="btn-signup-submit"
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-2.5 px-4 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-60 transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Creating account...</span>
                  </>
                ) : (
                  <>
                    <span>Create & Launch {signupRole.toUpperCase()} Dashboard</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Quick 1-Click Role Logins for Fast Review */}
          <div className="mt-6 pt-5 border-t border-zinc-800">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-zinc-400 mb-2.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Instant Test Accounts (1-Click Login):</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                id="btn-quick-retailer"
                type="button"
                onClick={() => handleQuickLogin('retailer@mwangaza.ke')}
                className="p-2 rounded-lg bg-zinc-950 hover:bg-zinc-800/80 border border-zinc-800 hover:border-emerald-800/60 text-left transition-colors group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-200 group-hover:text-emerald-400">Retailer</span>
                  <Store className="w-3.5 h-3.5 text-zinc-500" />
                </div>
                <p className="text-[10px] text-zinc-400 mt-0.5">Mwangaza Store</p>
              </button>

              <button
                id="btn-quick-dispatcher"
                type="button"
                onClick={() => handleQuickLogin('dispatch@reflex.ke')}
                className="p-2 rounded-lg bg-zinc-950 hover:bg-zinc-800/80 border border-zinc-800 hover:border-emerald-800/60 text-left transition-colors group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-200 group-hover:text-emerald-400">Dispatcher</span>
                  <Compass className="w-3.5 h-3.5 text-zinc-500" />
                </div>
                <p className="text-[10px] text-zinc-400 mt-0.5">Central Desk</p>
              </button>

              <button
                id="btn-quick-rider"
                type="button"
                onClick={() => handleQuickLogin('brian@reflex.ke')}
                className="p-2 rounded-lg bg-zinc-950 hover:bg-zinc-800/80 border border-zinc-800 hover:border-emerald-800/60 text-left transition-colors group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-200 group-hover:text-emerald-400">Rider</span>
                  <Bike className="w-3.5 h-3.5 text-zinc-500" />
                </div>
                <p className="text-[10px] text-zinc-400 mt-0.5">Brian Kamau</p>
              </button>
            </div>
          </div>
        </div>

        {/* Footer info note */}
        <p className="text-center text-[11px] text-zinc-400 mt-6">
          Reflex Delivery Hub · Connected Nairobi Dispatch & Retail Network
        </p>
      </div>
    </div>
  );
};

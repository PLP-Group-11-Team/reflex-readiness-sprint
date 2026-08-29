import React from 'react';
import { ReflexProvider, useReflex } from './context/ReflexContext';
import { Header } from './components/Header';
import { AuthScreen } from './components/auth/AuthScreen';
import { RetailerView } from './components/retailer/RetailerView';
import { DispatcherView } from './components/dispatcher/DispatcherView';
import { RiderView } from './components/rider/RiderView';
import { ToastContainer } from './components/Toast';

const AppContent: React.FC = () => {
  const { currentUser, role } = useReflex();

  // If user is not authenticated, show the Login/Signup screen
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-zinc-950">
        <AuthScreen />
        <ToastContainer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-zinc-100 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      {/* Global Header with Logged-in User Identity, Role & Live Sync */}
      <Header />

      {/* Main Role Content View */}
      <div className="flex-1">
        {role === 'retailer' && <RetailerView />}
        {role === 'dispatcher' && <DispatcherView />}
        {role === 'rider' && <RiderView />}
      </div>

      {/* Toast notifications */}
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <ReflexProvider>
      <AppContent />
    </ReflexProvider>
  );
}

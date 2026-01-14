import React from 'react';
import { WifiOff } from 'lucide-react';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';

const OfflineBanner: React.FC = () => {
  const isOnline = useNetworkStatus();

  if (isOnline) return null;

  return (
    <div className="bg-amber-100 dark:bg-amber-900/30 border-b border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs font-bold py-1.5 px-4 flex items-center justify-center gap-2 animate-in slide-in-from-top-full duration-300">
      <WifiOff size={14} />
      <span>You are currently offline. Changes will sync when you reconnect.</span>
    </div>
  );
};

export default OfflineBanner;

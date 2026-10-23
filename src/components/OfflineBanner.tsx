import React from 'react';
import { WifiOff, CheckCircle } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineBanner: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-xl bg-amber-500/90 text-slate-950 font-semibold px-4 py-2.5 text-xs shadow-xl backdrop-blur-md animate-in slide-in-from-bottom-2 duration-200">
      <span className="w-2.5 h-2.5 rounded-full bg-slate-950 animate-ping" />
      <WifiOff className="w-4 h-4 shrink-0" />
      <span>Modo Offline Ativo — O conversor funciona 100% no seu dispositivo sem internet.</span>
    </div>
  );
};

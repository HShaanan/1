import React from 'react';
import { useIsraelTime } from '@/components/time/IsraelTimeProvider';
import { Clock } from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

export default function AdminClock() {
  const { now } = useIsraelTime();

  if (!now) {
    return (
      <div className="flex items-center gap-2 text-xs text-slate-400">
        <Clock className="w-3 h-3" />
        <span>טוען זמן...</span>
      </div>
    );
  }

  const formattedDate = format(now, 'eeee, d MMMM yyyy', { locale: he });
  const formattedTime = format(now, 'HH:mm:ss', { locale: he });

  return (
    <div 
      className="hidden lg:flex items-center gap-2 text-xs text-slate-500 bg-slate-100/70 px-2.5 py-1.5 rounded-lg border"
      title={`זמן אפליקציה מסונכרן: ${now.toISOString()}`}
      dir="rtl"
    >
      <Clock className="w-3.5 h-3.5 text-slate-400" />
      <div className="flex items-center gap-1.5">
        <span className="font-medium tracking-tighter">{formattedDate}</span>
        <span className="text-slate-300">|</span>
        <span className="font-mono font-semibold">{formattedTime}</span>
      </div>
    </div>
  );
}
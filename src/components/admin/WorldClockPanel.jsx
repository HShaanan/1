import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Globe, Clock, Sun, Moon } from "lucide-react";

const CITIES = [
  { id: 'ny', name: 'New York', label: 'ניו יורק', zone: 'America/New_York', color: 'bg-blue-50 text-blue-900 border-blue-100' },
  { id: 'london', name: 'London', label: 'לונדון', zone: 'Europe/London', color: 'bg-purple-50 text-purple-900 border-purple-100' },
  { id: 'tlv', name: 'Jerusalem', label: 'ירושלים', zone: 'Asia/Jerusalem', color: 'bg-amber-50 text-amber-900 border-amber-100 ring-2 ring-amber-200' }, // Highlight local
  { id: 'tokyo', name: 'Tokyo', label: 'טוקיו', zone: 'Asia/Tokyo', color: 'bg-rose-50 text-rose-900 border-rose-100' },
];

export default function WorldClockPanel() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getIsDaytime = (zone) => {
    const hour = parseInt(time.toLocaleTimeString('en-US', { timeZone: zone, hour: 'numeric', hour12: false }));
    return hour >= 6 && hour < 18;
  };

  return (
    <Card className="mt-8 shadow-lg border-0 bg-white/80 backdrop-blur-sm overflow-hidden">
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-4 text-white flex items-center justify-between">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <Globe className="w-5 h-5 text-indigo-400" />
          שעון עולמי - תיאום גלובלי
        </h2>
        <div className="flex items-center gap-2 text-xs text-slate-400 bg-white/10 px-3 py-1 rounded-full">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          זמן אמת
        </div>
      </div>
      
      <div className="p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {CITIES.map((city) => {
            const timeString = time.toLocaleTimeString('he-IL', {
              timeZone: city.zone,
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit'
            });
            
            const dateString = time.toLocaleDateString('he-IL', {
              timeZone: city.zone,
              weekday: 'short',
              day: 'numeric',
              month: 'numeric',
            });

            const isDay = getIsDaytime(city.zone);

            return (
              <div key={city.id} className={`relative p-4 rounded-xl border shadow-sm transition-all duration-300 hover:scale-105 hover:shadow-md ${city.color}`}>
                <div className="flex justify-between items-start mb-2">
                  <div className="text-xs font-bold opacity-70 uppercase tracking-wider">{city.name}</div>
                  {isDay ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-indigo-400" />}
                </div>
                
                <div className="text-lg font-bold mb-1">{city.label}</div>
                <div className="text-3xl font-mono font-bold tracking-tight text-slate-900 tabular-nums" style={{fontFamily: 'monospace'}}>
                  {timeString}
                </div>
                <div className="text-xs font-medium opacity-80 mt-2 bg-white/50 inline-block px-2 py-0.5 rounded-md">
                  {dateString}
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="mt-6 flex items-center gap-2 text-sm text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-100">
          <Clock className="w-4 h-4 text-slate-400" />
          <span>השעונים מסונכרנים אוטומטית לפי סטנדרט UTC ומשמשים לתיאום פעילות מול ספקים ולקוחות בחו"ל.</span>
        </div>
      </div>
    </Card>
  );
}
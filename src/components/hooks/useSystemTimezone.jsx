import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

// Cache the timezone promise to prevent multiple fetches across components
let timezonePromise = null;

export function useSystemTimezone() {
  const [timezoneOffset, setTimezoneOffset] = useState(2); // Default to Israel (UTC+2)
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTimezone = async () => {
      if (!timezonePromise) {
        timezonePromise = base44.entities.AppSettings.filter({ 
          setting_key: 'timezone_offset' 
        }).then(settings => {
          if (settings && settings.length > 0) {
            return parseFloat(settings[0].setting_value);
          }
          return 2; // Default
        }).catch(err => {
          console.error('Failed to load timezone settings:', err);
          return 2;
        });
      }

      const offset = await timezonePromise;
      setTimezoneOffset(offset);
      setIsLoading(false);
    };

    fetchTimezone();
  }, []);

  return { timezoneOffset, isLoading };
}
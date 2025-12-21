import { useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useLocation } from 'react-router-dom';

export default function SessionTracker() {
  const location = useLocation();
  const sessionIdRef = useRef(null);

  useEffect(() => {
    // Generate or retrieve session ID
    if (!sessionIdRef.current) {
      const stored = sessionStorage.getItem('session_id');
      if (stored) {
        sessionIdRef.current = stored;
      } else {
        sessionIdRef.current = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        sessionStorage.setItem('session_id', sessionIdRef.current);
      }
    }

    // Send heartbeat
    const sendHeartbeat = async () => {
      try {
        await base44.functions.invoke('updateSessionHeartbeat', {
          session_id: sessionIdRef.current,
          current_page: location.pathname
        });
      } catch (error) {
        console.error('Failed to send heartbeat:', error);
      }
    };

    // Initial heartbeat
    sendHeartbeat();

    // Set up interval for regular heartbeats (every 30 seconds)
    const interval = setInterval(sendHeartbeat, 30000);

    // Heartbeat on page visibility change
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        sendHeartbeat();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [location.pathname]);

  return null; // This component doesn't render anything
}
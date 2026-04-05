import { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { activityTracker } from '@/services/activityTracker';

// יצירת/קבלת session ID ייחודי
const getSessionId = () => {
  let sessionId = localStorage.getItem('meshlanoo_session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('meshlanoo_session_id', sessionId);
    console.log('🆕 Created new session ID:', sessionId);
  } else {
    console.log('♻️ Using existing session ID:', sessionId);
  }
  return sessionId;
};

// פונקציה לקבלת זמן ישראל
const getIsraelTimestamp = () => {
  const now = new Date();
  const israelTime = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jerusalem',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).formatToParts(now);

  return `${israelTime.find(p => p.type === 'year').value}-${israelTime.find(p => p.type === 'month').value}-${israelTime.find(p => p.type === 'day').value}T${israelTime.find(p => p.type === 'hour').value}:${israelTime.find(p => p.type === 'minute').value}:${israelTime.find(p => p.type === 'second').value}`;
};

export const useBusinessAnalytics = (businessPageId) => {
  const [sessionId] = useState(getSessionId());
  const [impressionRecorded, setImpressionRecorded] = useState(false);

  console.log('🎯 useBusinessAnalytics hook initialized');
  console.log('📄 Business Page ID:', businessPageId);
  console.log('🔑 Session ID:', sessionId);

  // רישום צפייה בעמוד (impression) - ישירות דרך SDK
  useEffect(() => {
    console.log('⚡ useEffect triggered for impression recording');
    console.log('📄 businessPageId:', businessPageId);
    console.log('✓ impressionRecorded:', impressionRecorded);

    if (!businessPageId) {
      console.warn('⚠️ No business page ID - skipping impression');
      return;
    }
    
    if (impressionRecorded) {
      console.log('✓ Impression already recorded - skipping');
      return;
    }

    const recordImpression = async () => {
      try {
        console.log('🔍 Recording impression for business page:', businessPageId);
        console.log('📍 Session ID:', sessionId);
        
        const user = await base44.auth.me().catch((err) => {
          console.log('👤 User not logged in (expected for anonymous):', err.message);
          return null;
        });
        
        if (user) {
          console.log('👤 User logged in:', user.email);
        } else {
          console.log('🔓 Recording as anonymous user');
        }

        const impressionData = {
          business_page_id: businessPageId,
          session_id: sessionId,
          user_email: user?.email || null,
          user_agent: navigator.userAgent || '',
          referrer: document.referrer || '',
          israel_timestamp: getIsraelTimestamp(),
          is_unique_view: true
        };

        console.log('📊 Impression data to save:', impressionData);
        
        const result = await base44.entities.BusinessPageImpression.create(impressionData);
        
        console.log('✅ Impression recorded successfully:', result);
        setImpressionRecorded(true);

        // Also track in user activity for personalization
        activityTracker.trackPageView(businessPageId);
      } catch (error) {
        console.error('❌ Failed to record impression:', error);
        console.error('📋 Error name:', error.name);
        console.error('📋 Error message:', error.message);
        console.error('📋 Error stack:', error.stack);
        if (error.response) {
          console.error('📋 Response status:', error.response.status);
          console.error('📋 Response data:', error.response.data);
        }
      }
    };

    recordImpression();
  }, [businessPageId, sessionId, impressionRecorded]);

  // פונקציה לרישום אירוע (לחיצה על כפתור) - ישירות דרך SDK
  const trackEvent = useCallback(async (eventType, metadata = {}) => {
    console.log('🎯 trackEvent called');
    console.log('📌 Event type:', eventType);
    console.log('📄 Business Page ID:', businessPageId);
    
    if (!businessPageId) {
      console.warn('⚠️ Cannot track event: no business page ID');
      return;
    }

    try {
      console.log('🔍 Tracking event:', eventType);
      console.log('📍 Session ID:', sessionId);
      console.log('📝 Metadata:', metadata);
      
      const user = await base44.auth.me().catch((err) => {
        console.log('👤 User not logged in for event (expected for anonymous):', err.message);
        return null;
      });
      
      if (user) {
        console.log('👤 User logged in:', user.email);
      } else {
        console.log('🔓 Tracking as anonymous user');
      }

      const eventData = {
        business_page_id: businessPageId,
        event_type: eventType,
        session_id: sessionId,
        user_email: user?.email || null,
        user_agent: navigator.userAgent || '',
        referrer: document.referrer || '',
        israel_timestamp: getIsraelTimestamp(),
        metadata: metadata
      };

      console.log('📊 Event data to save:', eventData);
      
      const result = await base44.entities.BusinessPageAnalytics.create(eventData);
      
      console.log('✅ Event tracked successfully:', result);

      // Also track in user activity for personalization
      const activityMap = {
        phone_click: () => activityTracker.trackPhoneClick(businessPageId),
        navigation_click: () => activityTracker.trackNavigationClick(businessPageId),
        website_click: () => activityTracker.trackWebsiteClick(businessPageId),
        whatsapp_click: () => activityTracker.trackWhatsAppClick(businessPageId),
        share_click: () => activityTracker.trackShareClick(businessPageId),
        favorite_click: () => activityTracker.trackFavoriteAdd(businessPageId),
      };
      if (activityMap[eventType]) activityMap[eventType]();
    } catch (error) {
      console.error('❌ Failed to track event:', error);
      console.error('📋 Error name:', error.name);
      console.error('📋 Error message:', error.message);
      console.error('📋 Error stack:', error.stack);
      if (error.response) {
        console.error('📋 Response status:', error.response.status);
        console.error('📋 Response data:', error.response.data);
      }
    }
  }, [businessPageId, sessionId]);

  return { trackEvent, sessionId };
};
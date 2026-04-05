/**
 * User activity tracking service for personalization.
 * Tracks page views, searches, clicks, and interactions.
 */
import { supabase } from '@/lib/supabaseClient';

// Session ID persists per browser tab
const SESSION_ID = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

// Debounce map to prevent duplicate rapid-fire events
const recentEvents = new Map();
const DEBOUNCE_MS = 2000;

function isDuplicate(key) {
  const now = Date.now();
  if (recentEvents.has(key) && now - recentEvents.get(key) < DEBOUNCE_MS) {
    return true;
  }
  recentEvents.set(key, now);
  // Clean old entries
  if (recentEvents.size > 100) {
    for (const [k, v] of recentEvents) {
      if (now - v > 60000) recentEvents.delete(k);
    }
  }
  return false;
}

function getDeviceType() {
  const w = window.innerWidth;
  if (w < 768) return 'mobile';
  if (w < 1024) return 'tablet';
  return 'desktop';
}

async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

/**
 * Track a user activity event.
 */
async function track(activityType, details = {}) {
  try {
    const user = await getCurrentUser();
    if (!user) return; // Only track authenticated users

    const dedupeKey = `${activityType}_${details.business_page_id || ''}_${details.search_query || ''}`;
    if (isDuplicate(dedupeKey)) return;

    const record = {
      user_id: user.id,
      user_email: user.email,
      activity_type: activityType,
      business_page_id: details.business_page_id || null,
      category_id: details.category_id || null,
      search_query: details.search_query || null,
      metadata: details.metadata || {},
      session_id: SESSION_ID,
      referrer: document.referrer || null,
      device_type: getDeviceType(),
    };

    await supabase.from('user_activity').insert(record);
  } catch (err) {
    // Silent fail — activity tracking should never block the UI
    console.warn('[activityTracker] failed:', err.message);
  }
}

/**
 * Update last_activity on the user's profile (called on navigation).
 */
async function touchActivity() {
  try {
    const user = await getCurrentUser();
    if (!user) return;
    await supabase
      .from('profiles')
      .update({ last_activity: new Date().toISOString() })
      .eq('id', user.id);
  } catch {
    // silent
  }
}

// ─── Public API ─────────────────────────────────────────────
export const activityTracker = {
  /** User viewed a business page */
  trackPageView(businessPageId, metadata = {}) {
    return track('page_view', { business_page_id: businessPageId, metadata });
  },

  /** User performed a search */
  trackSearch(query, metadata = {}) {
    return track('search', { search_query: query, metadata });
  },

  /** User browsed a category */
  trackCategoryBrowse(categoryId, metadata = {}) {
    return track('category_browse', { category_id: categoryId, metadata });
  },

  /** User added a favorite */
  trackFavoriteAdd(businessPageId) {
    return track('favorite_add', { business_page_id: businessPageId });
  },

  /** User removed a favorite */
  trackFavoriteRemove(businessPageId) {
    return track('favorite_remove', { business_page_id: businessPageId });
  },

  /** User submitted a review */
  trackReviewSubmit(businessPageId, metadata = {}) {
    return track('review_submit', { business_page_id: businessPageId, metadata });
  },

  /** User placed an order */
  trackOrderPlace(businessPageId, metadata = {}) {
    return track('order_place', { business_page_id: businessPageId, metadata });
  },

  /** User clicked phone number */
  trackPhoneClick(businessPageId) {
    return track('phone_click', { business_page_id: businessPageId });
  },

  /** User clicked WhatsApp */
  trackWhatsAppClick(businessPageId) {
    return track('whatsapp_click', { business_page_id: businessPageId });
  },

  /** User clicked website link */
  trackWebsiteClick(businessPageId) {
    return track('website_click', { business_page_id: businessPageId });
  },

  /** User shared a business */
  trackShareClick(businessPageId) {
    return track('share_click', { business_page_id: businessPageId });
  },

  /** User clicked navigation/directions */
  trackNavigationClick(businessPageId) {
    return track('navigation_click', { business_page_id: businessPageId });
  },

  /** Track login event */
  trackLogin() {
    return track('login', {});
  },

  /** Track signup event */
  trackSignup() {
    return track('signup', {});
  },

  /** Update last_activity timestamp */
  touchActivity,

  /** Get the current session ID */
  getSessionId() {
    return SESSION_ID;
  },
};

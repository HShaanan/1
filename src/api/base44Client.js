/**
 * Supabase-backed compatibility layer for the Base44 SDK.
 *
 * Exports a `base44` object with the same API surface used throughout the app:
 *   base44.entities.<EntityName>.filter(filters, sort, limit)
 *   base44.entities.<EntityName>.list(sort, limit)
 *   base44.entities.<EntityName>.create(data)
 *   base44.entities.<EntityName>.update(id, data)
 *   base44.entities.<EntityName>.delete(id)
 *   base44.auth.me() / .logout() / .redirectToLogin() / .isAuthenticated() / .updateMe()
 *   base44.integrations.Core.*
 */

import { supabase } from '@/lib/supabaseClient';

// ─── Entity name → Supabase table name mapping ──────────────────────────
const TABLE_MAP = {
  BusinessPage: 'businesses',
  Category: 'categories',
  Kashrut: 'kashrut_authorities',
  DynamicPageView: 'dynamic_page_views',
  Favorite: 'favorites',
  Review: 'reviews',
  Order: 'orders',
  Report: 'reports',
  RestaurantSettings: 'restaurant_settings',
  StorePage: 'store_pages',
  FooterLink: 'footer_links',
  UserAgreement: 'user_agreements',
  ReferralLog: 'referral_logs',
  ReferralStats: 'referral_stats',
  AppSettings: 'app_settings',
  EmailLog: 'email_logs',
  NotificationLog: 'notification_logs',
  BusinessPageImpression: 'business_page_impressions',
  BusinessPageAnalytics: 'business_page_analytics',
  LandingPage: 'landing_pages',
  User: 'profiles',
  UserActivity: 'user_activity',
  UserPreference: 'user_preferences',
  SubscriptionPlan: 'subscription_plans',
};

/** Convert PascalCase to snake_case and pluralize as fallback. */
function toTableName(entityName) {
  if (TABLE_MAP[entityName]) return TABLE_MAP[entityName];
  // PascalCase → snake_case
  const snake = entityName.replace(/([A-Z])/g, (m, p, i) =>
    (i > 0 ? '_' : '') + m.toLowerCase()
  );
  // naive plural
  return snake.endsWith('s') ? snake : snake + 's';
}

// ─── Sort string parser ─────────────────────────────────────────────────
// Base44 format: "-created_date" or "sort_order" or "-is_promoted,-created_date"
function parseSortString(sortStr) {
  if (!sortStr) return [];
  return sortStr.split(',').map(part => {
    const trimmed = part.trim();
    if (trimmed.startsWith('-')) {
      return { column: trimmed.slice(1), ascending: false };
    }
    return { column: trimmed, ascending: true };
  });
}

// ─── Filter applier ─────────────────────────────────────────────────────
// Translates Base44 filter objects to Supabase query builder calls.
//   { field: value }             → .eq(field, value)
//   { field: { $contains: v } }  → .contains(field, [v])
//   { field: { $in: [...] } }    → .in(field, [...])
function applyFilters(query, filters) {
  if (!filters) return query;
  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined || value === null) continue;
    if (typeof value === 'object' && !Array.isArray(value)) {
      if ('$contains' in value) {
        query = query.contains(key, [value.$contains]);
      } else if ('$in' in value) {
        query = query.in(key, value.$in);
      } else {
        // Treat as JSONB equality
        query = query.eq(key, value);
      }
    } else {
      query = query.eq(key, value);
    }
  }
  return query;
}

// ─── Entity wrapper factory ─────────────────────────────────────────────
function createEntityProxy(entityName) {
  const table = toTableName(entityName);

  return {
    /**
     * Filter rows. Mimics base44.entities.X.filter(filters, sort, limit)
     * @returns {Promise<Array>}
     */
    async filter(filters = {}, sort, limit) {
      let query = supabase.from(table).select('*');
      query = applyFilters(query, filters);
      for (const s of parseSortString(sort)) {
        query = query.order(s.column, { ascending: s.ascending });
      }
      if (limit) query = query.limit(limit);
      const { data, error } = await query;
      if (error) {
        console.error(`[supabase] ${table}.filter error:`, error.message);
        throw error;
      }
      return data || [];
    },

    /**
     * List all rows (no filter). Mimics base44.entities.X.list(sort, limit)
     * @returns {Promise<Array>}
     */
    async list(sort, limit) {
      let query = supabase.from(table).select('*');
      for (const s of parseSortString(sort)) {
        query = query.order(s.column, { ascending: s.ascending });
      }
      if (limit) query = query.limit(limit);
      const { data, error } = await query;
      if (error) {
        console.error(`[supabase] ${table}.list error:`, error.message);
        throw error;
      }
      return data || [];
    },

    /**
     * Get single row by ID.
     * @returns {Promise<Object|null>}
     */
    async get(id) {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .eq('id', id)
        .single();
      if (error) {
        console.error(`[supabase] ${table}.get error:`, error.message);
        throw error;
      }
      return data;
    },

    /**
     * Create a new row.
     * @returns {Promise<Object>} created row
     */
    async create(rowData) {
      const { data, error } = await supabase
        .from(table)
        .insert(rowData)
        .select()
        .single();
      if (error) {
        console.error(`[supabase] ${table}.create error:`, error.message);
        throw error;
      }
      return data;
    },

    /**
     * Update a row by ID.
     * @returns {Promise<Object>} updated row
     */
    async update(id, updates) {
      const { data, error } = await supabase
        .from(table)
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) {
        console.error(`[supabase] ${table}.update error:`, error.message);
        throw error;
      }
      return data;
    },

    /**
     * Delete a row by ID.
     */
    async delete(id) {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', id);
      if (error) {
        console.error(`[supabase] ${table}.delete error:`, error.message);
        throw error;
      }
    },
  };
}

// ─── Dynamic entity proxy ───────────────────────────────────────────────
// base44.entities.AnyEntityName auto-resolves to the matching Supabase table.
const entityCache = {};
const entitiesProxy = new Proxy(
  {},
  {
    get(_target, entityName) {
      if (typeof entityName !== 'string') return undefined;
      if (!entityCache[entityName]) {
        entityCache[entityName] = createEntityProxy(entityName);
      }
      return entityCache[entityName];
    },
  }
);

// ─── Auth shim (Supabase Auth) ──────────────────────────────────────────
const auth = {
  async me() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) throw error || new Error('Not authenticated');

    // Fetch profile for extra fields (user_type, role, etc.)
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    return {
      id: user.id,
      email: user.email,
      full_name: profile?.full_name || user.user_metadata?.full_name || '',
      user_type: profile?.user_type || 'user',
      role: profile?.role || 'user',
      subscription_type: profile?.subscription_type || null,
      phone: profile?.phone || user.phone || '',
      ...profile,
    };
  },

  async isAuthenticated() {
    const { data: { session } } = await supabase.auth.getSession();
    return !!session;
  },

  async updateMe(updates) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Update auth metadata for fields that belong there
    const metadataUpdates = {};
    if (updates.full_name) metadataUpdates.full_name = updates.full_name;
    if (Object.keys(metadataUpdates).length > 0) {
      await supabase.auth.updateUser({ data: metadataUpdates });
    }

    // Update profile table with all fields
    const profileUpdates = { ...updates };
    const { error } = await supabase
      .from('profiles')
      .update(profileUpdates)
      .eq('id', user.id);
    if (error) throw error;
  },

  logout(returnUrl) {
    supabase.auth.signOut().then(() => {
      if (returnUrl) {
        window.location.href = returnUrl;
      }
    });
  },

  redirectToLogin(returnUrl) {
    // Store return URL then redirect to login page
    if (returnUrl) {
      localStorage.setItem('auth_return_url', returnUrl);
    }
    window.location.href = '/Login';
  },
};

// ─── Integrations shim ─────────────────────────────────────────────────
// These are stubs — they'll need Supabase Edge Functions for full support.
const integrations = {
  Core: {
    async InvokeLLM(params) {
      const { data, error } = await supabase.functions.invoke('invoke-llm', { body: params });
      if (error) throw error;
      return data;
    },
    async SendEmail(params) {
      const { data, error } = await supabase.functions.invoke('send-email', { body: params });
      if (error) throw error;
      return data;
    },
    async SendSMS(params) {
      const { data, error } = await supabase.functions.invoke('send-sms', { body: params });
      if (error) throw error;
      return data;
    },
    async UploadFile(file) {
      const fileName = `${Date.now()}-${file.name}`;
      const { data, error } = await supabase.storage
        .from('uploads')
        .upload(fileName, file);
      if (error) throw error;
      const { data: urlData } = supabase.storage
        .from('uploads')
        .getPublicUrl(data.path);
      // Return both `file_url` (Base44 compat) and `url` (Supabase native)
      return { file_url: urlData.publicUrl, url: urlData.publicUrl, path: data.path };
    },
    async GenerateImage(params) {
      const { data, error } = await supabase.functions.invoke('generate-image', { body: params });
      if (error) throw error;
      return data;
    },
    async ExtractDataFromUploadedFile(params) {
      const { data, error } = await supabase.functions.invoke('extract-data', { body: params });
      if (error) throw error;
      return data;
    },
  },
};

// ─── Functions shim ─────────────────────────────────────────────────────
const functions = {
  async invoke(name, params) {
    const { data, error } = await supabase.functions.invoke(name, { body: params });
    if (error) throw error;
    return data;
  },
};

// ─── appLogs shim ───────────────────────────────────────────────────────
// Base44 used appLogs for in-app activity tracking (e.g. NavigationTracker).
// We keep the method signatures as no-ops so callers don't crash.
const appLogs = {
  async logUserInApp(_pageName) { /* no-op: tracked via Supabase analytics */ },
  async logEvent(_event, _data) { /* no-op */ },
};

// ─── Agents shim ────────────────────────────────────────────────────────
// Base44 agents handled support chat / SEO agent conversations.
// Return empty/safe values so SupportWidget and AdminSeoAgent don't crash.
const agents = {
  async getConversation(_id) { return null; },
  async listConversations(_params) { return []; },
  async createConversation(_params) { return { id: null, messages: [] }; },
  subscribeToConversation(_id, _cb) { return () => {}; },
  async addMessage(_id, _msg) { return null; },
  async getWhatsAppConnectURL(_params) { return ''; },
};

// ─── Export the drop-in replacement ─────────────────────────────────────
export const base44 = {
  entities: entitiesProxy,
  auth,
  integrations,
  functions,
  appLogs,
  agents,
};

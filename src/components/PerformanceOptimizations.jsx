import React, { memo, useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/blur.css';

// Hook לדיבאונס חיפוש
export const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Global Rate Limiter - מונע יותר מדי קריאות במקביל
class GlobalRateLimiter {
  constructor() {
    this.requests = new Map(); // key -> timestamp of last request
    this.activeRequests = new Set(); // active request keys
    this.minInterval = 5000; // הגדלנו ל-5 שניות בין אותן קריאות
    this.maxConcurrent = 2; // הורדנו ל-2 קריאות במקביל
    this.backoffMultiplier = 3; // הגדלנו את הbackoff
    this.maxBackoff = 60000; // 60 שניות max backoff
    this.rateLimitedUntil = 0; // Global rate limit block
  }

  async shouldAllow(key) {
    const now = Date.now();
    
    // אם אנחנו ב-global rate limit block, המתן
    if (now < this.rateLimitedUntil) {
      const waitTime = this.rateLimitedUntil - now;
      // console.log(`🛑 Global rate limit active, waiting ${waitTime}ms`); // Removed debug log
      await this.wait(waitTime);
    }
    
    // Check if too many concurrent requests
    if (this.activeRequests.size >= this.maxConcurrent) {
      // console.log(`🛑 Too many concurrent requests (${this.activeRequests.size}), waiting...`); // Removed debug log
      await this.wait(2000); // Wait 2 seconds
      return this.shouldAllow(key); // Retry
    }

    // Check if this specific request was made too recently
    const lastRequest = this.requests.get(key);
    if (lastRequest) {
      const timeSince = now - lastRequest;
      if (timeSince < this.minInterval) {
        const waitTime = this.minInterval - timeSince;
        // console.log(`⏳ Rate limiter: Waiting ${waitTime}ms for ${key}`); // Removed debug log
        await this.wait(waitTime);
      }
    }

    // Mark request as active
    this.activeRequests.add(key);
    this.requests.set(key, Date.now());
    return true;
  }

  markComplete(key) {
    this.activeRequests.delete(key);
  }

  // קרא כש-rate limit error מתרחש
  handleRateLimit() {
    this.rateLimitedUntil = Date.now() + 30000; // Block for 30 seconds
    console.log('🚨 Rate limit detected, blocking all requests for 30 seconds');
  }

  async wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getBackoffTime(retryCount) {
    return Math.min(
      this.minInterval * Math.pow(this.backoffMultiplier, retryCount),
      this.maxBackoff
    );
  }
}

const globalRateLimiter = new GlobalRateLimiter();

// Enhanced Cache with much longer TTL for critical data
class DataCache {
  constructor(maxAge = 60 * 60 * 1000) { // 1 hour default (הגדלנו)
    this.cache = new Map();
    this.maxAge = maxAge;
    this.emergencyCache = new Map(); // Never expires - for emergencies
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) {
      // Try emergency cache, but return only data, not the full item
      return this.emergencyCache.get(key)?.data || null;
    }

    if (Date.now() - item.timestamp > this.maxAge) {
      // Keep in emergency cache before deleting from main cache
      this.emergencyCache.set(key, item); // ensure emergency cache always has the last known good value
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  set(key, data) {
    const item = {
      data,
      timestamp: Date.now()
    };
    
    this.cache.set(key, item);
    this.emergencyCache.set(key, item); // Always keep a backup, updating its timestamp to the latest

    // Clean old entries (least recently added based on timestamp heuristic)
    if (this.cache.size > 50) {
      let oldestKey = null;
      let oldestTimestamp = Infinity;
      for (const [k, value] of this.cache.entries()) {
        if (value.timestamp < oldestTimestamp) {
          oldestTimestamp = value.timestamp;
          oldestKey = k;
        }
      }
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }
  }

  clear() {
    this.cache.clear();
    // Don't clear emergency cache
  }

  getEmergency(key) {
    return this.emergencyCache.get(key)?.data || null;
  }
}

export const dataCache = new DataCache();

// Enhanced useCachedData with better rate limit handling
export const useCachedData = (key, fetchFunction, deps = [], options = {}) => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastFetchTime, setLastFetchTime] = useState(0);

  const {
    staleTime = 30 * 60 * 1000,
    cacheTime = 60 * 60 * 1000,
    retry = 1,
    retryDelay = 10000,
    emergencyFallback = true
  } = options;

  const mounted = useRef(true);
  const depsKey = useMemo(() => JSON.stringify(deps), [deps]);

  // Memoize fetchFunction to prevent unnecessary re-renders
  const memoizedFetchFunction = useCallback(fetchFunction, [fetchFunction]);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  useEffect(() => {
    let retryCount = 0;
    
    const loadData = async () => {
      if (!mounted.current) return;

      try {
        // Always check cache first
        const cachedData = dataCache.get(key);
        if (cachedData) {
          if (mounted.current) {
            setData(cachedData);
            setIsLoading(false);
            setError(null);
          }
          
          // Check if stale
          const cacheEntry = dataCache.cache.get(key);
          const isStale = cacheEntry && (Date.now() - cacheEntry.timestamp) > staleTime;
          
          if (!isStale) {
            return; // Use fresh cached data
          }
          
          // Don't refetch if too recent
          const timeSinceLastFetch = Date.now() - lastFetchTime;
          if (timeSinceLastFetch < 60000) {
            // console.log(`⏭️ Skipping stale refresh for ${key} - too recent`); // Removed debug log
            return;
          }
        }

        // Rate limiting check
        const now = Date.now();
        if (now - lastFetchTime < 10000) {
          // console.log(`⏳ Skipping fetch for ${key} - too recent`); // Removed debug log
          return;
        }

        if (!await globalRateLimiter.shouldAllow(key)) {
          // console.log(`🛑 Rate limiter blocked ${key}`); // Removed debug log
          return; 
        }
        
        setLastFetchTime(now);

        if (mounted.current && !cachedData) {
          setIsLoading(true);
          setError(null);
        }
        
        try {
          // console.log(`🔄 Fetching fresh data for ${key}...`); // Removed debug log
          const result = await memoizedFetchFunction();
          
          if (mounted.current && result !== null && result !== undefined) {
            dataCache.set(key, result);
            setData(result);
            setError(null);
          } else if (mounted.current) {
            setData(null);
            setError(new Error("No data returned"));
          }
        } finally {
          globalRateLimiter.markComplete(key);
        }

      } catch (err) {
        console.error(`❌ Error loading data for ${key}:`, err);
        globalRateLimiter.markComplete(key);
        
        if (!mounted.current) return;

        // Handle rate limit errors specifically
        const isRateLimitError = err.message?.includes('Rate limit') || 
                                err.response?.status === 429 ||
                                err.message?.includes('429');

        if (isRateLimitError) {
          globalRateLimiter.handleRateLimit();
          setError(new Error('המערכת עמוסה. מציג נתונים שמורים מהמטמון'));
          
          // Use emergency cache
          if (emergencyFallback) {
            const emergencyData = dataCache.getEmergency(key);
            if (emergencyData && !data) {
              // console.log(`🆘 Using emergency cache for ${key}`); // Removed debug log
              setData(emergencyData);
              setIsLoading(false);
              return;
            }
          }
          return;
        }
        
        // Retry logic for other errors
        if (retryCount < retry) {
          retryCount++;
          const backoffTime = globalRateLimiter.getBackoffTime(retryCount);
          // console.log(`🔄 Retrying ${key} in ${backoffTime}ms (attempt ${retryCount}/${retry})`); // Removed debug log
          setTimeout(loadData, backoffTime);
          return;
        }
        
        setError(err);
        setData(null);
      } finally {
        if (mounted.current) {
          setIsLoading(false);
        }
      }
    };

    loadData();
  }, [key, depsKey, staleTime, retry, retryDelay, emergencyFallback, lastFetchTime, memoizedFetchFunction, data]);

  return { data, isLoading, error };
};

// רכיב LazyImage המבוסס על react-lazy-load-image-component לאופטימיזציה מקסימלית
export const LazyImage = memo(({ src, alt, className, imgClassName, placeholderSrc, ...props }) => {
  return (
    <div className={`relative overflow-hidden ${className || ''}`} {...props}>
      <LazyLoadImage
        alt={alt}
        src={src}
        effect="blur"
        wrapperClassName="w-full h-full block"
        className={`w-full h-full object-cover ${imgClassName || ''}`}
        placeholderSrc={placeholderSrc || "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=50&q=10"}
        onError={(e) => {
          e.target.src = 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80';
        }}
        threshold={300} // טוען 300px לפני שרואים
      />
    </div>
  );
});

// Hook לאופטימיציית חיפוש
export const useOptimizedSearch = (items, searchTerm, searchFields) => {
  return useMemo(() => {
    if (!searchTerm || !Array.isArray(items)) return items;
    
    const searchLower = searchTerm.toLowerCase();
    return items.filter(item => {
      return searchFields.some(field => {
        const value = item[field];
        return value && value.toString().toLowerCase().includes(searchLower);
      });
    });
  }, [items, searchTerm, searchFields]);
};

// Hook לקיבוץ נתונים
export const useGroupedData = (items, groupByField) => {
  return useMemo(() => {
    if (!Array.isArray(items)) return {};
    
    return items.reduce((groups, item) => {
      const key = item[groupByField];
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(item);
      return groups;
    }, {});
  }, [items, groupByField]);
};

// רכיב ממוטב לרשימות גדולות
export const VirtualizedList = memo(({ 
  items, 
  renderItem, 
  itemHeight = 100,
  containerHeight = 500,
  overscan = 5 
}) => {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef(null);

  const visibleCount = Math.ceil(containerHeight / itemHeight);
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(items.length, startIndex + visibleCount + overscan * 2);

  const visibleItems = items.slice(startIndex, endIndex);
  const offsetY = startIndex * itemHeight;

  const handleScroll = (e) => {
    setScrollTop(e.target.scrollTop);
  };

  return (
    <div
      ref={containerRef}
      style={{ height: containerHeight, overflow: 'auto' }}
      onScroll={handleScroll}
    >
      <div style={{ height: items.length * itemHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map((item, index) => (
            <div key={startIndex + index} style={{ height: itemHeight }}>
              {renderItem(item, startIndex + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

// מיטוב רכיבי React עם shouldComponentUpdate מתקדם
export const optimizeComponent = (Component, compareProps = []) => {
  return memo(Component, (prevProps, nextProps) => {
    if (compareProps.length === 0) {
      // השוואה רדודה של כל ה-props
      return Object.keys(prevProps).every(key => prevProps[key] === nextProps[key]);
    }
    
    // השוואה רק של props מסוימים
    return compareProps.every(prop => prevProps[prop] === nextProps[prop]);
  });
};


import React, { memo, useState, useEffect, useRef, useMemo, useCallback } from 'react';

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

// Hook לטעינה עצלה משופרת למובייל
const useLazyLoading = () => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    // אופטימיזציה למובייל - margins קטנים יותר
    const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
    const rootMargin = isMobile ? "50px 0px 50px 0px" : "100px 0px 100px 0px";
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsIntersecting(true);
          observer.disconnect();
        }
      },
      { 
        rootMargin,
        threshold: 0.1
      }
    );

    const currentRef = ref.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, []); // Empty dependency array as ref and observer setup should run once

  return [ref, isIntersecting];
};

// קומפוננט תמונה מותנית עם cache מתקדם ומהירות גבוהה למובייל
export const LazyImage = memo(({ src, alt, className, imgClassName, placeholderSrc, ...props }) => {
  const [imageRef, isVisible] = useLazyLoading();
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [imageSrc, setImageSrc] = useState(null);

  // בדיקה אם התמונה כבר נטענה ב-cache
  const isImageCached = useMemo(() => {
    if (!src || typeof window === 'undefined') return false;
    
    const img = new Image();
    img.src = src;
    return img.complete && img.naturalHeight !== 0;
  }, [src]);

  useEffect(() => {
    if (isImageCached) {
      setIsLoaded(true);
      setImageSrc(src);
    } else if (placeholderSrc) {
      // If original image isn't cached, but placeholder exists, show placeholder initially
      setImageSrc(placeholderSrc);
      setIsLoaded(true); // Treat placeholder as "loaded" for initial display
    }
  }, [isImageCached, src, placeholderSrc]);

  // טוענים את התמונה גם אם לא נכנסה עדיין ל-viewport (פתרון למקרים בהם IO לא מתרחש או אלמנטים נמצאים במכולות חדשות)
  useEffect(() => {
    if (!src || isLoaded || hasError) return;

    const img = new Image();
    const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
    const timeout = isMobile ? 3000 : 8000;

    img.onload = () => {
      setImageSrc(src);
      setIsLoaded(true);
      setHasError(false);
    };

    img.onerror = () => {
      setHasError(true);
      setIsLoaded(false);
      if (placeholderSrc) {
        setImageSrc(placeholderSrc);
        setIsLoaded(true);
      }
    };

    const timeoutId = setTimeout(() => {
      if (!isLoaded && !hasError) {
        setHasError(true);
        if (placeholderSrc) {
          setImageSrc(placeholderSrc);
          setIsLoaded(true);
        }
      }
    }, timeout);

    // טעינה מוקדמת – גם אם לא נראה עדיין
    try {
      // חלק מהדפדפנים תומכים במאפיינים הללו
      // אם לא, זה פשוט יתעלם מהם
      // (לא קריטי לפונקציונליות)
      // @ts-ignore
      img.loading = isMobile ? 'eager' : 'lazy';
      // @ts-ignore
      img.decoding = isMobile ? 'sync' : 'async';
    } catch {}

    img.src = src;

    return () => clearTimeout(timeoutId);
  }, [src, isLoaded, hasError, placeholderSrc]);

  useEffect(() => {
    if (isVisible && src && !isLoaded && !hasError) {
      // יצירת תמונה חדשה לטעינה מקדימה עם אופטימיזציה למובייל
      const img = new Image();
      
      // אופטימיזציה למובייל - קטן timeout וטעינה מהירה יותר
      const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
      const timeout = isMobile ? 3000 : 8000; // 3 שניות במובייל, 8 בדסקטופ
      
      img.onload = () => {
        setImageSrc(src);
        setIsLoaded(true);
        setHasError(false);
      };
      
      img.onerror = () => {
        setHasError(true);
        setIsLoaded(false);
        // אם יש placeholder, נטען אותו במקום
        if (placeholderSrc) {
          setImageSrc(placeholderSrc);
          setIsLoaded(true);
        }
      };

      // הגדרת timeout קצר יותר למובייל
      const timeoutId = setTimeout(() => {
        if (!isLoaded && !hasError) {
          setHasError(true);
          if (placeholderSrc) {
            setImageSrc(placeholderSrc);
            setIsLoaded(true);
          }
        }
      }, timeout);

      // במובייל - טען תמונות בצורה מיידית יותר
      if (isMobile) {
        img.loading = 'eager'; // Suggests browser fetch immediately
        img.decoding = 'sync'; // Suggests synchronous decoding
      }

      img.src = src;
      
      return () => clearTimeout(timeoutId);
    }
  }, [isVisible, src, isLoaded, hasError, placeholderSrc]);

  return (
    <div ref={imageRef} className={`relative overflow-hidden ${className || ''}`} {...props}>
      {/* Skeleton loader - פשוט יותר למובייל */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-pulse rounded-lg">
          {/* הסרת האנימציה הכבדה במובייל */}
          {typeof window !== 'undefined' && window.innerWidth > 768 && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent animate-pulse"></div>
          )}
        </div>
      )}
      
      {/* התמונה עצמה */}
      {imageSrc && (
        <img
          src={imageSrc}
          alt={alt}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          } ${imgClassName || ''}`}
          onLoad={() => {
            setIsLoaded(true);
            setHasError(false);
          }}
          onError={() => {
            // If the current image source is not the placeholder and a placeholder exists, try loading the placeholder.
            // Otherwise, set hasError to true.
            if (imageSrc !== placeholderSrc && placeholderSrc) {
              setImageSrc(placeholderSrc);
              setIsLoaded(true); // Placeholder is loaded
              setHasError(false); // No error if placeholder is shown
            } else {
              setHasError(true);
              setIsLoaded(false);
            }
          }}
          loading="lazy"
          decoding="async"
          // אופטימיזציה נוספת למובייל
          style={{ 
            contentVisibility: 'auto',
            containIntrinsicSize: '200px'
          }}
        />
      )}
      
      {/* Fallback במקרה של שגיאה */}
      {hasError && !placeholderSrc && (
        <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
          <span className="text-2xl md:text-4xl text-gray-400">📷</span>
        </div>
      )}
      
      {/* אינדיקטור טעינה פשוט יותר למובייל */}
      {isVisible && !isLoaded && !hasError && typeof window !== 'undefined' && window.innerWidth <= 768 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
        </div>
      )}
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

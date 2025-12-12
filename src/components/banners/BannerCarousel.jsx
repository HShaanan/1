
import React, { useEffect, useRef, useState, useCallback } from "react";
import { BannerAd } from "@/entities/BannerAd";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Pause, Play, Megaphone } from "lucide-react";
import { createPageUrl } from "@/utils";

function isActiveByDate(b) {
  const now = new Date();
  const startOk = !b.start_date || new Date(b.start_date) <= now;
  const endOk = !b.end_date || new Date(b.end_date) >= now;
  return startOk && endOk && b.is_active;
}

// Global cache to prevent multiple components from loading the same data
const bannersCache = new Map();

export default function BannerCarousel({
  placement = "browse_interstitial",
  size = "normal",          // "normal" | "tall"
  fit = "cover",            // "cover" | "contain"
  cropBars = false,         // crop encoded black bars by slight zoom
  zoom = null,              // manual zoom override (e.g. 1.3)
  fadeEffect = true,        // keep fade darken/undarken between slides
  loopVideo = false         // force loop videos (default false per request: play once)
}) {
  const [banners, setBanners] = useState([]);
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [isFading, setIsFading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const timerRef = useRef(null);
  const videoRef = useRef(null);
  const loadedRef = useRef(false); // Prevent multiple loads
  const mountedRef = useRef(true);

  // SLOWER pacing + transitions
  const AUTO_INTERVAL_MS = 11500; // was ~8500
  const FADE_DURATION = 700;      // ms (was ~320)
  const VIDEO_PLAYBACK_RATE = 0.9;

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    // Only load if not already loaded and component is mounted
    if (loadedRef.current || !mountedRef.current) return;
    
    loadedRef.current = true; // Set flag immediately to prevent concurrent loads

    const loadBanners = async () => {
      setIsLoading(true);
      try {
        // Check global cache first
        const cacheKey = `banners-${placement}`;
        if (bannersCache.has(cacheKey)) {
          const cached = bannersCache.get(cacheKey);
          const now = Date.now();
          // Use cache if less than 5 minutes old
          if (now - cached.timestamp < 5 * 60 * 1000) {
            if (mountedRef.current) {
              setBanners(cached.data);
              setIsLoading(false);
              setLoadError(false);
            }
            return;
          }
        }
        
        // Add significant delay to reduce API pressure
        await new Promise(resolve => setTimeout(resolve, Math.random() * 3000 + 2000));
        
        if (!mountedRef.current) return; // Check if still mounted after delay

        const list = await BannerAd.filter({ placement }, "sort_order", 20); // Limiting to 20 items
        const active = (Array.isArray(list) ? list : []).filter(isActiveByDate);
        
        // Cache the results
        bannersCache.set(cacheKey, {
          data: active,
          timestamp: Date.now()
        });
        
        if (mountedRef.current) {
          setBanners(active);
          setIdx(0);
          setLoadError(false);
        }
        
      } catch (err) {
        console.error(`❌ [BannerCarousel] Error loading banners:`, err);
        
        if (!mountedRef.current) return;
        
        // Handle rate limit gracefully - show cached data if available
        if (err.message?.includes('Rate limit') || err.response?.status === 429) {
          
          // Try to use any cached data, even if stale
          const cacheKey = `banners-${placement}`;
          if (bannersCache.has(cacheKey)) {
            const cached = bannersCache.get(cacheKey);
            setBanners(cached.data);
            setLoadError(false);
          } else {
            setLoadError(true);
            setBanners([]);
          }
        } else {
          setLoadError(true);
          setBanners([]);
        }
      } finally {
        if (mountedRef.current) {
          setIsLoading(false);
        }
      }
    };

    // Add random delay before starting to spread out API calls
    const initialDelay = Math.random() * 2000;
    const timeoutId = setTimeout(loadBanners, initialDelay);
    
    return () => clearTimeout(timeoutId);
  }, [placement]); // Only depend on placement

  const current = banners[idx];

  const go = useCallback((dir, isAuto = false) => {
    if (banners.length === 0) return;
    if (fadeEffect) {
      setIsFading(true);
      setTimeout(() => {
        setIdx((i) => (i + (dir === "prev" ? -1 : 1) + banners.length) % banners.length);
        setTimeout(() => setIsFading(false), FADE_DURATION);
      }, FADE_DURATION);
    } else {
      setIdx((i) => (i + (dir === "prev" ? -1 : 1) + banners.length) % banners.length);
    }
    if (!isAuto) {
      clearInterval(timerRef.current);
    }
  }, [banners.length, fadeEffect]);

  const jumpTo = useCallback((targetIndex) => {
    if (targetIndex === idx) return;
    if (fadeEffect) {
      setIsFading(true);
      setTimeout(() => {
        setIdx(targetIndex);
        setTimeout(() => setIsFading(false), FADE_DURATION);
      }, FADE_DURATION);
    } else {
      setIdx(targetIndex);
    }
    clearInterval(timerRef.current);
  }, [idx, fadeEffect]);

  // Autoplay for images/empty slides only. Videos advance on "ended".
  useEffect(() => {
    clearInterval(timerRef.current);
    if (!playing || banners.length <= 1 || !mountedRef.current) return;
    const slide = banners[idx];
    if (slide?.video_url) return;
    timerRef.current = setInterval(() => {
      if (mountedRef.current) {
        go("next", true);
      }
    }, AUTO_INTERVAL_MS);
    return () => clearInterval(timerRef.current);
  }, [playing, banners, idx, go]);

  // Videos play once then advance + slow down playbackRate
  useEffect(() => {
    if (!current?.video_url || !mountedRef.current) return; // Use current as it's derived from banners[idx]
    clearInterval(timerRef.current);
    const v = videoRef.current;
    if (!v) return;

    const handleEnded = () => {
      if (mountedRef.current) {
        go("next", true);
      }
    };
    const applyRate = () => { 
      try { 
        v.playbackRate = VIDEO_PLAYBACK_RATE; 
      } catch (e) { 
        /* ignore */ 
      } 
    };

    v.addEventListener("ended", handleEnded);
    v.addEventListener("loadedmetadata", applyRate);
    v.addEventListener("play", applyRate);
    // Apply immediately if possible
    applyRate();

    return () => {
      v.removeEventListener("ended", handleEnded);
      v.removeEventListener("loadedmetadata", applyRate);
      v.removeEventListener("play", applyRate);
    };
  }, [current?.video_url, go]);

  const onClickBanner = (b) => {
    if (!b) return;
    if (b.listing_id) {
      window.location.href = createPageUrl(`Listing?id=${b.listing_id}`);
    } else if (b.link_url) {
      window.open(b.link_url, "_blank", "noopener,noreferrer");
    }
  };

  // If loading, error, or no banners, don't render anything
  if (isLoading || loadError || !current) {
    return null; 
  }

  const containerHeightClasses =
    size === "tall"
      ? "min-h-[320px] md:min-h-[520px] lg:min-h-[560px]"
      : "min-h-[240px] md:min-h-[320px]";

  const objectFitClass = fit === "contain" ? "object-contain" : "object-cover";

  // Slight extra zoom to crop any encoded black bars when using contain
  const zoomScale =
    typeof zoom === "number"
      ? zoom
      : fit === "contain"
      ? (cropBars ? 1.24 : 1.08)
      : 1;

  // The outline specifies loop={false}, overriding the prop's default behavior
  // const shouldLoopVideo = typeof loopVideo === "boolean" ? loopVideo : false; // not used as per outline
  const shouldAutoplay = current.autoplay ?? true;
  const shouldMute = current.muted ?? true;

  return (
    <div
      className={`relative w-full rounded-2xl overflow-hidden border bg-black group ${containerHeightClasses}`}
      dir="rtl"
      onMouseEnter={() => setPlaying(false)}
      onMouseLeave={() => setPlaying(true)}
    >
      <div
        className="absolute inset-0 transition-opacity duration-500"
        key={current.id}
        onClick={() => onClickBanner(current)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter") onClickBanner(current);
        }}
        style={{ cursor: current.listing_id || current.link_url ? "pointer" : "default" }}
      >
        {current.video_url ? (
          <video
            ref={videoRef}
            src={current.video_url}
            poster={current.poster_url || current.image_url || undefined}
            className={`w-full h-full ${objectFitClass} transition-transform duration-700 ease-out`}
            style={{ transform: `scale(${zoomScale})`, transformOrigin: "center" }}
            autoPlay={shouldAutoplay}
            muted={shouldMute}
            loop={false} // Explicitly set to false as per outline
            playsInline
            preload="metadata"
          />
        ) : current.image_url ? (
          <img
            src={current.image_url}
            alt={current.title || "Banner"}
            className={`w-full h-full object-cover transition-transform duration-700 ease-out`}
            style={{ transform: `scale(${zoomScale})`, transformOrigin: "center" }}
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ background: current.background_color || "#0b0b0b", color: current.text_color || "#e5e7eb" }}
          >
            <div className="text-center p-6">
              <Megaphone className="w-10 h-10 mx-auto mb-2" />
              <div className="text-lg font-bold">{current.title}</div>
              {current.description ? <div className="text-sm opacity-80 mt-1">{current.description}</div> : null}
            </div>
          </div>
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/20 via-black/0 to-transparent" />
      </div>

      {/* Darken/undarken overlay for transitions */}
      {fadeEffect && (
        <div
          className={`absolute inset-0 pointer-events-none bg-black transition-opacity duration-700 ${
            isFading ? "opacity-100" : "opacity-0"
          }`}
          aria-hidden="true"
        />
      )}

      {/* Controls */}
      <div className="absolute inset-x-0 bottom-2 flex items-center justify-between px-2">
        <div className="flex items-center gap-1">
          <Button
            size="icon"
            variant="secondary"
            className="rounded-full bg-white/80 hover:bg-white"
            onClick={() => go("prev")}
            aria-label="הקודם"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button
            size="icon"
            variant="secondary"
            className="rounded-full bg-white/80 hover:bg-white"
            onClick={() => go("next")}
            aria-label="הבא"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex items-center gap-1">
          {banners.map((b, i) => (
            <button
              key={b.id}
              onClick={() => jumpTo(i)}
              className={`w-2 h-2 rounded-full transition ${
                i === idx ? "bg-white" : "bg-white/50"
              } border border-white/70`}
              aria-label={`עבור לבאנר ${i + 1}`}
              title={`באנר ${i + 1}`}
            />
          ))}
          <Button
            size="icon"
            variant="secondary"
            className="rounded-full bg-white/80 hover:bg-white ml-2"
            onClick={() => setPlaying((p) => !p)}
            aria-label={playing ? "השהה" : "נגן"}
          >
            {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}

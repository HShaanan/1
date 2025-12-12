import React, { useState, useEffect, useRef } from "react";
import { BannerAd } from "@/entities/BannerAd";

function isActiveByDate(b) {
  const nowMs = Date.now();
  const startTime = b.start_date ? new Date(b.start_date).getTime() : 0;
  const endTime = b.end_date ? new Date(b.end_date).getTime() : 0;
  const startOk = !b.start_date || Math.sign(startTime - nowMs) !== 1;
  const endOk = !b.end_date || Math.sign(endTime - nowMs) !== -1;
  return startOk && endOk && b.is_active;
}

export default function VideoBackground({ className = "", cropBars = true, zoom = null, overlay = "light", fit = "cover" }) {
  const [videos, setVideos] = useState([]);
  const [idx, setIdx] = useState(0);
  const timerRef = useRef(null);
  const videoRefs = useRef([]);

  useEffect(() => {
    let isMounted = true;
    const loadBanners = async () => {
      try {
        const list = await BannerAd.filter({}, "sort_order", 30);
        if (isMounted) {
          const actives = (Array.isArray(list) ? list : [])
            .filter(isActiveByDate)
            .filter((b) => !!b.video_url);
          setVideos(actives);
        }
      } catch (error) {
        console.error("Error loading video banners:", error);
      }
    };
    loadBanners();
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    videoRefs.current.forEach((video, i) => {
      if (video) {
        if (i === idx) {
          try {
            video.muted = true;
            const playPromise = video.play();
            if (playPromise && typeof playPromise.catch === "function") {
              playPromise.catch(() => {
                setTimeout(() => video.play().catch(() => {}), 100);
              });
            }
          } catch {}
        } else {
          video.pause();
          video.currentTime = 0;
        }
      }
    });
  }, [idx, videos]);

  useEffect(() => {
    clearInterval(timerRef.current);
    if (videos.length <= 1) return;
    timerRef.current = setInterval(() => {
      setIdx((prevIdx) => (prevIdx + 1) % videos.length);
    }, 8000);
    return () => clearInterval(timerRef.current);
  }, [videos.length]);

  const fitClass = fit === "contain" ? "object-contain" : "object-cover";
  const scale = typeof zoom === "number" ? zoom : (cropBars ? 1.2 : 1);

  return (
    <div className={`absolute inset-0 overflow-hidden bg-transparent ${className}`}>
      {videos.map((b, i) => (
        <video
          key={b.id || i}
          ref={(el) => (videoRefs.current[i] = el)}
          className={`absolute inset-0 w-full h-full ${fitClass} transition-opacity duration-300 ${i === idx ? "opacity-100" : "opacity-0"}`}
          src={b.video_url}
          poster={b.poster_url || b.image_url || undefined}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          style={{
            transform: `scale(${scale})`,
            transformOrigin: "center",
            // הבטחת צבעי מקור – ללא עיבוד/השחרה/בלנדינג
            filter: "none",
            WebkitFilter: "none",
            mixBlendMode: "normal"
          }}
          onEnded={(e) => {
            e.currentTarget.currentTime = 0;
            e.currentTarget.play().catch(() => {});
          }}
        />
      ))}

      {/* ללא שכבת הצללה כאשר overlay='none' */}
      {overlay !== "none" && (
        <div
          className={`absolute inset-0 pointer-events-none ${
            overlay === "medium"
              ? "bg-gradient-to-b from-black/25 via-black/20 to-black/30"
              : "bg-gradient-to-b from-black/10 via-black/10 to-black/15"
          }`}
        />
      )}
    </div>
  );
}
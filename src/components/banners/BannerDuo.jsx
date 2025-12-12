import React, { useEffect, useState } from "react";
import { BannerAd } from "@/entities/BannerAd";
import { Megaphone, ImageIcon } from "lucide-react";

function isActiveByDate(b) {
  const now = new Date();
  const startOk = !b.start_date || new Date(b.start_date) <= now;
  const endOk = !b.end_date || new Date(b.end_date) >= now;
  return startOk && endOk && b.is_active;
}

const Placeholder = ({ title = "באנר יופיע כאן" }) => (
  <div className="w-full h-44 md:h-56 rounded-2xl border bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
    <div className="text-center text-slate-500">
      <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-70" />
      <div className="font-semibold">{title}</div>
    </div>
  </div>
);

export default function BannerDuo() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const list = await BannerAd.filter({ placement: "browse_top" }, "sort_order", 6);
        const active = (Array.isArray(list) ? list : []).filter(isActiveByDate);
        if (!mounted) return;
        setBanners(active.slice(0, 2));
      } catch (e) {
        console.error("Failed loading top banners", e);
        if (mounted) setBanners([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const renderBanner = (b) => {
    if (!b) return <Placeholder />;
    const hasVideo = !!b.video_url;
    const hasImage = !!b.image_url;

    return (
      <div
        className="w-full h-44 md:h-56 rounded-2xl overflow-hidden border bg-black group cursor-pointer"
        onClick={() => {
          if (b.listing_id) {
            window.location.href = `/BusinessPage?id=${b.listing_id}`;
          } else if (b.link_url) {
            window.open(b.link_url, "_blank", "noopener,noreferrer");
          }
        }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.click(); }}
      >
        {hasVideo ? (
          <video
            src={b.video_url}
            poster={b.poster_url || b.image_url || undefined}
            className="w-full h-full object-cover"
            autoPlay={b.autoplay ?? true}
            muted={b.muted ?? true}
            loop={false}
            playsInline
            preload="metadata"
          />
        ) : hasImage ? (
          <img src={b.image_url} alt={b.title || "Banner"} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-slate-900 text-slate-100 flex items-center justify-center">
            <div className="text-center p-4">
              <Megaphone className="w-8 h-8 mx-auto mb-2" />
              <div className="font-bold">{b.title || "מודעת קמפיין"}</div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {loading ? (
        <>
          <Placeholder />
          <Placeholder />
        </>
      ) : banners.length > 0 ? (
        <>
          {renderBanner(banners[0])}
          {renderBanner(banners[1])}
        </>
      ) : (
        <>
          <Placeholder />
          <Placeholder />
        </>
      )}
    </div>
  );
}
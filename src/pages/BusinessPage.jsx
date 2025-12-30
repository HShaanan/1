import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { LazyImage } from "@/components/PerformanceOptimizations";
import SeoMeta from "@/components/SeoMeta";
import { useInView } from "react-intersection-observer";
import CountUp from "react-countup";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin, Phone, ExternalLink, Heart, Share2, Star,
  Clock, Globe, AlertTriangle, ChevronLeft, Flag,
  MessageSquare, MessageCircle, ThumbsUp, Loader2, Calendar, ImageIcon,
  Edit, Menu as MenuIcon, Info, DollarSign, Camera, Utensils, Building, ShoppingCart, Plus, Minus,
  Copy, Mail, Link as LinkIcon, Navigation, Settings, ClipboardList, Store, Sparkles, Wand2
} from
  "lucide-react";
import { Badge } from "@/components/ui/badge";
import ImageGallery from "@/components/ImageGallery";
import BusinessHoursDisplay from "@/components/BusinessHoursDisplay";
import SpecialFieldsDisplay from "@/components/listing/SpecialFieldsDisplay";
import ReviewForm from "@/components/reviews/ReviewForm";
import ReviewList from "@/components/reviews/ReviewList";
import StarRating from "@/components/reviews/StarRating";
import KashrutBox from "@/components/kashrut/KashrutBox";
import InfiniteImageMarquee from "@/components/listing/InfiniteImageMarquee";
import EmojiReviewPrompt from "@/components/reviews/EmojiReviewPrompt";
import BrandsCarousel from "@/components/listing/BrandsCarousel";
import { useBusinessAnalytics } from "@/components/analytics/useBusinessAnalytics";
import OrderSidebar from "@/components/order/OrderSidebar";
import ModificationModal from "@/components/order/ModificationModal";
import { LocalBusinessSchema } from "@/components/seo/SchemaOrg";
import { checkBusinessOpen } from "@/components/utils/checkBusinessOpen";

// Helper function to convert hex to rgba
const hexToRgba = (hex, alpha) => {
  let r = 0, g = 0, b = 0;
  // Handle #rgb or #rrggbb
  if (hex && hex.length === 4) {
    r = parseInt(hex[1] + hex[1], 16);
    g = parseInt(hex[2] + hex[2], 16);
    b = parseInt(hex[3] + hex[3], 16);
  } else if (hex && hex.length === 7) {
    r = parseInt(hex.substring(1, 3), 16);
    g = parseInt(hex.substring(3, 5), 16);
    b = parseInt(hex.substring(5, 7), 16);
  } else {
    // Default to a light blue/pinkish fallback if hex is invalid or empty
    return `rgba(193, 221, 255, ${alpha})`;
  }
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const WoltBusinessHero = ({ businessPage, canEdit, onFavorite, isFavorited, onShare, onEditClick, onManageClick, onLogoClick, onKashrutLogoClick, theme, onOrdersManageClick, onGenerateAiSummary }) => {
  const defaultHeroImage = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68815c70a48dd08622dbaf69/e8b173c76_image2.jpg";
  const defaultLogo = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68815c70a48dd08622dbaf69/3f9cfac9b_Gemini_Generated_Image_xr0kiexr0kiexr0k.png";
  
  const mainImage = businessPage.images?.[0] || defaultHeroImage; // This is the main hero image with fallback
  const croppedLogo = businessPage.images?.[1] || defaultLogo; // This is the explicitly cropped logo image (images[1]) with fallback
  const kashrutLogo = businessPage.kashrut_logo_url || null;

  // קריאת הגדרות מיקום לוגו מה-metadata
  // Default values for logo position: zoom 1, center (50% x, 50% y), no rotation (0)
  const logoPosition = businessPage.metadata?.logo_position || { zoom: 1, x: 50, y: 50, rotation: 0 };

  const title = businessPage.display_title || businessPage.business_name;
  const description = businessPage.description ? businessPage.description : "";
  const sentences = description ? description.split(". ") : [];
  const shortDesc = sentences[0] || "";
  const restDesc = sentences.slice(1).join(". ").trim();

  return (
    <section className="relative" aria-label="כותרת עמוד העסק">
      {/* HERO - תמונה ראשית ממורכזת */}
      <div className="h-64 sm:h-80 md:h-[420px] lg:h-[500px] xl:h-[560px] 2xl:h-[600px] bg-gradient-to-br from-slate-100 to-slate-200 relative overflow-hidden">
        <LazyImage
          src={mainImage}
          alt={`תמונה ראשית של ${title}`}
          className="w-full h-full"
          imgClassName="object-contain object-center w-full h-full"
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="absolute top-4 left-4 flex gap-3 z-30" role="group" aria-label="פעולות עמוד">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="secondary"
              size="sm"
              onClick={onShare}
              className="bg-white/90 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-white/90 text-gray-700 hover:text-gray-900 font-medium"
              aria-label="שתף עמוד עסק">
              <Share2 className="w-4 h-4 ml-2 text-blue-500" aria-hidden="true" />
              שתף
            </Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant={isFavorited ? "destructive" : "secondary"}
              size="sm"
              onClick={onFavorite}
              className={`${isFavorited ?
                'bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg hover:shadow-red-300/50' :
                'bg-white/90 backdrop-blur-sm text-gray-700 hover:text-red-500 shadow-lg'} border-0 hover:shadow-xl transition-all duration-300 font-medium`
              }
              aria-label={isFavorited ? 'הסר מהמועדפים' : 'הוסף למועדפים'}
              aria-pressed={isFavorited}>
              <Heart className={`w-4 h-4 ml-2 ${isFavorited ? 'fill-current' : 'text-red-500'}`} aria-hidden="true" />
              {isFavorited ? 'הוסר' : 'שמור'}
            </Button>
          </motion.div>
          {canEdit &&
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="secondary"
                size="sm"
                onClick={onEditClick}
                className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-0 shadow-lg hover:shadow-xl hover:shadow-indigo-300/50 transition-all duration-300 font-medium hover:from-indigo-600 hover:to-purple-700"
                aria-label="עריכת עמוד העסק">
                <Edit className="w-4 h-4 ml-2" aria-hidden="true" />
                ערוך
              </Button>
            </motion.div>
          }
          {/* כפתור ניהול עסק - לבעלים/אדמין בלבד */}
          {canEdit &&
            <Button
              variant="secondary"
              size="sm"
              onClick={onManageClick}
              className="bg-white/90 backdrop-blur-sm text-slate-800 hover:text-indigo-700 border-0 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 font-medium"
              aria-label="ניהול העסק">

              <Settings className="w-4 h-4 ml-2" aria-hidden="true" />
              ניהול עסק
            </Button>
          }
          {/* כפתור ניהול הזמנות - חדש */}
          {canEdit && onOrdersManageClick &&
            <Button
              variant="secondary"
              size="sm"
              onClick={onOrdersManageClick}
              className="text-white border-0 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 font-medium"
              style={{
                backgroundColor: theme?.colors?.primary || '#6366f1',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = theme?.colors?.primaryHover || '#4f46e5';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = theme?.colors?.primary || '#6366f1';
              }}
              aria-label="ניהול הזמנות">
              <ClipboardList className="w-4 h-4 ml-2" aria-hidden="true" />
              ניהול הזמנות
            </Button>
          }
          {canEdit && onGenerateAiSummary && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onGenerateAiSummary}
              className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-200 border shadow-sm hover:scale-105 transition-all duration-300 font-medium"
              aria-label="צור תקציר מנהלים ב-AI">
              <Wand2 className="w-4 h-4 ml-2" aria-hidden="true" />
              AI Summary
            </Button>
          )}
        </div>

        <div className="relative -mt-16 sm:-mt-24 flex items-end space-x-5 space-x-reverse">
          <div className="relative z-10">
            <button
              type="button"
              onClick={onLogoClick}
              className="h-24 w-24 sm:h-32 sm:w-32 rounded-2xl overflow-hidden flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-lg"
              aria-label={`הגדלת לוגו ${title}`}>
              <img
                src={croppedLogo}
                alt={`לוגו ${title}`}
                className="w-full h-full object-cover select-none"
                draggable={false}
              />
            </button>
          </div>

          {kashrutLogo &&
            <div className="relative z-10">
              <button
                type="button"
                onClick={onKashrutLogoClick}
                className="relative group h-12 w-12 sm:h-16 sm:w-16 rounded-xl bg-white shadow-md ring-2 ring-white/60 flex items-center justify-center overflow-hidden focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                aria-label="הצגת תעודת כשרות">

                <LazyImage
                  src={kashrutLogo}
                  alt="לוגו כשרות"
                  className="w-full h-full"
                  imgClassName="object-cover w-full h-full scale-[1.28] -translate-y-1 transition-all duration-200 group-hover:grayscale" />

                <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity duration-200" aria-hidden="true" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-white text-xs sm:text-sm font-bold">
                    תעודה
                  </span>
                </div>
              </button>
            </div>
          }

          <div className="pb-4 flex-1 min-w-0" />
        </div>
      </div>

      {/* סרגל מותגים - מחוץ ל-max-w container */}
      {businessPage.brands_logos && businessPage.brands_logos.length > 0 &&
        <div className="relative z-20 -mt-4">
          <BrandsCarousel logos={businessPage.brands_logos} />
        </div>
      }

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mt-6 sm:mt-8 z-20 relative">
          <div className="bg-transparent p-4 rounded-2xl backdrop-blur-md border border-slate-200 shadow-xl sm:p-6">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-snug">
              {title}
            </h1>
            {shortDesc &&
              <p className="mt-2 text-sm sm:text-base text-slate-700 leading-relaxed">
                {shortDesc}
              </p>
            }
            {restDesc &&
              <p className="mt-2 text-sm sm:text-base text-slate-700 leading-relaxed whitespace-pre-line">
                {restDesc}
              </p>
            }
          </div>
        </div>
      </div>
    </section>);

};

// בתוך קומפוננטת BusinessInfoBar, הוסף props של trackEvent:
const BusinessAddressBar = ({ address }) => {
  if (!address) return null;

  return (
    <div className="bg-white/90 backdrop-blur-sm border-b border-slate-200/80 py-3">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 text-slate-700">
          <MapPin className="w-4 h-4 text-blue-600 flex-shrink-0" />
          <span className="text-sm font-medium">{address}</span>
        </div>
      </div>
    </div>
  );
};

      const BusinessInfoBar = ({ businessPage, onRatingClick, onPhoneClick, onNavigationClick, onWebsiteClick, theme }) => {
  const [navMenuOpen, setNavMenuOpen] = React.useState(false);
  const navBtnRef = React.useRef(null);
  const navMenuRef = React.useRef(null);

  React.useEffect(() => {
    const onDocClick = (e) => {
      if (!navMenuOpen) return;
      const t = e.target;
      if (navBtnRef.current && navBtnRef.current.contains(t)) return;
      if (navMenuRef.current && navMenuRef.current.contains(t)) return;
      setNavMenuOpen(false);
    };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, [navMenuOpen]);

  const cleanPhone = businessPage.contact_phone ? businessPage.contact_phone.replace(/\D/g, '') : '';
  const websiteUrl = businessPage.website_url;

  const iconBtn = "relative h-12 w-12 rounded-2xl text-white flex items-center justify-center shadow-[0_10px_20px_rgba(0,0,0,0.15)] ring-1 ring-white/60 hover:scale-105 active:translate-y-[1px] transition-all duration-200";

  return (
    <div className="bg-transparent border-b relative z-20"> {/* Added z-20 to ensure it's above the background animation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-center md:justify-start gap-4">
          {cleanPhone &&
            <button
              onClick={() => onPhoneClick(cleanPhone)}
              className={`${iconBtn} bg-gradient-to-br from-violet-500 to-fuchsia-500`}
              title="חייגו לעסק"
              aria-label="חייגו לעסק">

              <Phone className="w-6 h-6 drop-shadow-sm" aria-hidden="true" />
              <span className="sr-only">טלפון</span>
            </button>
          }

          {websiteUrl &&
            <button
              onClick={() => onWebsiteClick(websiteUrl)}
              className={`${iconBtn} bg-gradient-to-br from-purple-500 to-pink-500`}
              title="לאתר העסק"
              aria-label="לאתר העסק">
              <Globe className="w-6 h-6 drop-shadow-sm" aria-hidden="true" />
              <span className="sr-only">אתר אינטרנט</span>
            </button>
          }

          {businessPage.address &&
            <div className="relative">
              <button
                ref={navBtnRef}
                onClick={() => setNavMenuOpen((v) => !v)}
                onDoubleClick={() => onNavigationClick(businessPage.address, 'default')}
                className={`${iconBtn} bg-gradient-to-br from-sky-500 to-cyan-500`}
                title="ניווט (לחיצה לפתיחת בחירה • דאבל-קליק לפתיחה מהירה)"
                aria-label="ניווט">

                <MapPin className="w-6 h-6 drop-shadow-sm" aria-hidden="true" />
                <span className="sr-only">ניווט</span>
              </button>

              {navMenuOpen &&
                <div
                  ref={navMenuRef}
                  className="absolute top-[110%] right-0 bg-white rounded-xl border border-slate-200 shadow-xl p-2 flex items-center gap-2 z-20">

                  <button
                    onClick={() => { onNavigationClick(businessPage.address, 'google'); setNavMenuOpen(false); }}
                    className={`${iconBtn} h-10 w-10 bg-gradient-to-br from-emerald-500 to-teal-500`}
                    title="Google Maps"
                    aria-label="Google Maps">

                    <Globe className="w-5 h-5" aria-hidden="true" />
                  </button>
                  <button
                    onClick={() => { onNavigationClick(businessPage.address, 'waze'); setNavMenuOpen(false); }}
                    className={`${iconBtn} h-10 w-10 bg-gradient-to-br from-indigo-500 to-blue-600`}
                    title="Waze"
                    aria-label="Waze">

                    <Navigation className="w-5 h-5" aria-hidden="true" />
                  </button>
                </div>
              }
            </div>
          }

          {(businessPage.smart_rating > 0 || businessPage.reviews_count > 0) &&
            <button
              onClick={onRatingClick}
              className={`${iconBtn} bg-gradient-to-br from-amber-400 to-orange-500`}
              title="צפו בביקורות"
              aria-label="ביקורות">

              <Star className="w-6 h-6 drop-shadow-sm" aria-hidden="true" />
              <span className="sr-only">ביקורות</span>
            </button>
          }
        </div>
      </div>
    </div>);

};

function MenuItem({ item, theme, isBlackTheme, onOpenModifications }) {
  const [imageError, setImageError] = React.useState(false);
  const [imageLoaded, setImageLoaded] = React.useState(false);
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  const hasAddons = item.addons && item.addons.length > 0;

  return (
    <motion.article
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.5 }}
      className={`rounded-2xl shadow-lg border p-4 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex items-start gap-4 ${
      isBlackTheme
        ? 'bg-slate-800/90 border-red-500/30'
        : 'bg-white border-slate-200'
    }`}>
      <div className="flex-1 min-w-0">
        <h4 className={`font-semibold text-base ${isBlackTheme ? 'text-white' : 'text-gray-800'}`}>
          {item.name}
        </h4>
        {item.note && (
          <p className={`text-sm mt-1 ${isBlackTheme ? 'text-gray-400' : 'text-gray-600'}`}>
            {item.note}
          </p>
        )}
        {hasAddons && (
          <p className="text-xs text-indigo-600 mt-1" role="status">✨ זמין עם תוספות</p>
        )}
        <div className="flex items-center justify-between mt-2">
          <p
            className="font-bold"
            style={{ color: isBlackTheme ? '#EF4444' : 'var(--theme-primary)' }}
            aria-label={`מחיר: ${item.price}`}
          >
            {item.price}
          </p>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              onClick={() => onOpenModifications(item)}
              size="sm"
              className="text-white gap-1 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all"
              style={{
                backgroundColor: theme.colors.primary,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = theme.colors.primaryHover;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = theme.colors.primary;
              }}
              aria-label={`הוסף ${item.name} לסל`}>
              <Plus className="w-3 h-3" aria-hidden="true" />
              הוסף
            </Button>
          </motion.div>
        </div>
      </div>
      {item.image && !imageError ? (
        <div className="w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 shadow-md ml-4 relative bg-gray-100">
          {!imageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center" aria-label="טוען תמונה">
              <div
                className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
                style={{
                  borderColor: isBlackTheme ? '#EF4444' : 'var(--theme-primary)',
                  borderTopColor: 'transparent'
                }}
                aria-hidden="true"></div>
            </div>
          )}
          <img
            src={item.image}
            alt={`תמונה של ${item.name}`}
            className={`object-cover w-full h-full transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={() => setImageLoaded(true)}
            onError={() => {
              console.warn(`Failed to load image for ${item.name}:`, item.image);
              setImageError(true);
            }}
            loading="lazy"
          />
        </div>
      ) : item.image && imageError ? (
        <div
          className="w-24 h-24 rounded-xl flex-shrink-0 ml-4 flex items-center justify-center shadow-md"
          style={{
            background: isBlackTheme
              ? 'linear-gradient(to bottom right, #991B1B, #7F1D1D)'
              : `linear-gradient(to bottom right, var(--theme-primary-light), var(--theme-primary-light))`
          }}
          role="img"
          aria-label="תמונה לא זמינה">
          <span className="text-3xl" role="img" aria-label="מזון">🍽️</span>
        </div>
      ) : null}
    </motion.article>
  );
}

export default function BusinessPageView() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const pageId = urlParams.get("id");
  const pageSlug = urlParams.get("slug");

  // Update URL to friendly format without redirect (SEO-friendly)
  useEffect(() => {
    if (pageSlug && window.location.search.includes('slug=')) {
      // Change URL in browser without reload
      const newUrl = `${window.location.origin}/BusinessPage?slug=${pageSlug}`;
      window.history.replaceState({}, '', newUrl);
    } else if (pageId && !pageSlug) {
      // If only ID exists, load page first to get slug and update URL
      (async () => {
        try {
          const pageData = await base44.entities.BusinessPage.filter({ id: pageId });
          const page = Array.isArray(pageData) ? pageData[0] : pageData;
          if (page?.url_slug) {
            const newUrl = `${window.location.origin}/BusinessPage?slug=${page.url_slug}`;
            window.history.replaceState({}, '', newUrl);
          }
        } catch (e) {
          console.error("URL update error:", e);
        }
      })();
    }
  }, [pageId, pageSlug]);

  const [businessPage, setBusinessPage] = useState(null);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [activeTab, setActiveTab] = useState('');
  const [isFavorited, setIsFavorited] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [galleryInitialIndex, setGalleryInitialIndex] = useState(0);
  const [isLogoGalleryOpen, setIsLogoGalleryOpen] = useState(false);
  const [logoGalleryImages, setLogoGalleryImages] = useState([]);
  const [selectedMoodForReview, setSelectedMoodForReview] = useState(null);
  const [isOrderCartOpen, setIsOrderCartOpen] = React.useState(false);
  const [cart, setCart] = React.useState([]);
  const [modificationModalOpen, setModificationModalOpen] = React.useState(false);
  const [selectedItemForMods, setSelectedItemForMods] = React.useState(null);
  const [relatedBusinesses, setRelatedBusinesses] = useState([]);
  const [businessOpenStatus, setBusinessOpenStatus] = useState({ isOpen: true, message: '', nextChange: '' });

  const reviewsRef = useRef(null);
  const menuSectionRefs = useRef({});

  const tags = businessPage?.special_fields?.tags;

  // הוספת מעקב אנליטיקה
  const { trackEvent } = useBusinessAnalytics(businessPage?.id);

  // מערכת צבעים דינמית - תומכת בהגדרות אישיות
  const getBusinessTheme = useCallback(() => {
    // בדיקה אם יש הגדרות נושא אישיות
    const customTheme = businessPage?.theme_settings;

    if (customTheme && customTheme.color_scheme) {
      // אם יש הגדרות מותאמות אישית
      if (customTheme.color_scheme === 'custom' && customTheme.custom_colors) {
        return {
          colors: customTheme.custom_colors,
          gradient: 'bg-white-elegant', // תמיד רקע לבן
          name: 'מותאם אישית'
        };
      }

      // מיפוי ערכות צבעים מוגדרות מראש - כולם עם רקע לבן
      const schemes = {
        'pink': {
          colors: {
            primary: '#EC4899',
            primaryHover: '#DB2777',
            primaryLight: '#FCE7F3',
            primaryDark: '#831843',
          },
          gradient: 'bg-white-elegant',
          name: 'ורוד'
        },
        'gold': {
          colors: {
            primary: '#F59E0B',
            primaryHover: '#D97706',
            primaryLight: '#FEF3C7',
            primaryDark: '#92400E',
          },
          gradient: 'bg-white-elegant',
          name: 'זהב'
        },
        'green': {
          colors: {
            primary: '#10B981',
            primaryHover: '#059669',
            primaryLight: '#D1FAE5',
            primaryDark: '#065F46',
          },
          gradient: 'bg-white-elegant',
          name: 'ירוק'
        },
        'red': {
          colors: {
            primary: '#EF4444',
            primaryHover: '#DC2626',
            primaryLight: '#FEE2E2',
            primaryDark: '#991B1B',
          },
          gradient: 'bg-white-elegant',
          name: 'אדום'
        },
        'blue': {
          colors: {
            primary: '#3B82F6',
            primaryHover: '#2563EB',
            primaryLight: '#DBEAFE',
            primaryDark: '#1E40AF',
          },
          gradient: 'bg-white-elegant',
          name: 'כחול'
        },
        'purple': {
          colors: {
            primary: '#A855F7',
            primaryHover: '#9333EA',
            primaryLight: '#F3E8FF',
            primaryDark: '#6B21A8',
          },
          gradient: 'bg-white-elegant',
          name: 'סגול'
        },
        'orange': {
          colors: {
            primary: '#F97316',
            primaryHover: '#EA580C',
            primaryLight: '#FFEDD5',
            primaryDark: '#9A3412',
          },
          gradient: 'bg-white-elegant',
          name: 'כתום'
        }
      };

      if (schemes[customTheme.color_scheme]) {
        return schemes[customTheme.color_scheme];
      }
    }

    // ברירת מחדל - כחול (רקע לבן אלגנטי תמיד)
    return {
      colors: {
        primary: '#3B82F6',
        primaryHover: '#2563EB',
        primaryLight: '#DBEAFE',
        primaryDark: '#1E40AF'
      },
      gradient: 'bg-white-elegant',
      name: 'ברירת מחדל'
    };
  }, [businessPage?.theme_settings]);

  const theme = getBusinessTheme();
  const isBlackTheme = theme.gradient === 'bg-black-solid'; // This will effectively always be false now
  const isWhiteTheme = theme.gradient === 'bg-white-elegant'; // This will effectively always be true now

  // עטיפה בטוחה לפונקציות tracking
  const safeTrackEvent = useCallback((eventType, metadata = {}) => {
    try {
      trackEvent(eventType, metadata);
    } catch (error) {
      // שגיאות tracking לא צריכות לשבור את האפליקציה
      console.error('Analytics tracking error:', error);
    }
  }, [trackEvent]);

  // פתיחת עגלת הזמנה
  const handleOpenOrderCart = useCallback(() => {
    safeTrackEvent('order_cart_open');
    setIsOrderCartOpen(true);
  }, [safeTrackEvent]);

  const scrollToReviews = useCallback(() => {
    reviewsRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  }, []);

  const isImageUrl = useCallback((u) => /\.(png|jpe?g|webp|gif|bmp|svg)$/i.test(String(u || "")), []);

  // IMPORTANT: Must be before any conditional returns
  // תמונות לגלריה אנימציה - רק מאינדקס 2 ואילך (ללא תמונה ראשית ולוגo)
  const galleryImages = useMemo(() => {
    if (!Array.isArray(businessPage?.images)) return [];
    return businessPage.images.slice(2);
  }, [businessPage?.images]);

  const menuCategories = useMemo(() => {
    const menuData = businessPage?.special_fields?.menu;
    if (!menuData || !Array.isArray(menuData)) {
      return [];
    }
    return menuData.map((category) => ({
      ...category,
      id: category.id || category.name.replace(/\s+/g, '-').toLowerCase()
    }));
  }, [businessPage]);

  const shareInfo = useMemo(() => {
    const title = businessPage?.display_title || businessPage?.business_name || document.title;
    const url = typeof window !== "undefined" ? window.location.href : "";
    const text = `בדקו את ${title} במשֻלנו!`;
    return {
      title,
      url,
      text,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(text)}%20${encodeURIComponent(url)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      telegram: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
      twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
      email: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(text)}%20${encodeURIComponent(url)}`
    };
  }, [businessPage]);


  // The useEffect for setIsMobileView was removed from here, as it's not used.

  useEffect(() => {
    if (menuCategories.length > 0 && !activeTab) {
      setActiveTab(menuCategories[0].id);
    }
  }, [menuCategories, activeTab]);

  const scrollToCategory = useCallback((categoryId) => {
    setActiveTab(categoryId);
    menuSectionRefs.current[categoryId]?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  }, [setActiveTab]);

  const checkUserAndFavorite = useCallback(async (page) => {
    try {
      const currentUser = await base44.auth.me().catch(() => null);
      setUser(currentUser);
      if (currentUser && page) {
        const fav = await base44.entities.Favorite.filter({ user_email: currentUser.email, business_page_id: page.id });
        setIsFavorited(fav.length > 0);
      }
    } catch (err) {
      console.log("User not logged in or error checking favorite:", err);
    }
  }, []);

  const loadBusinessPage = useCallback(async () => {
    if (!pageId && !pageSlug) {
      setError("לא נמצא מזהה עמוד עסק");
      setIsLoading(false);
      return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const isPreview = urlParams.get("preview") === "true";

    try {
      let pageData;

      // Try to load by slug first, then by ID
      if (pageSlug) {
        pageData = await base44.entities.BusinessPage.filter({ url_slug: pageSlug });
      }

      // If no page data from slug or no slug, try by ID
      if (!pageData || (Array.isArray(pageData) && pageData.length === 0)) {
        if (pageId && pageId !== 'null') {
          pageData = await base44.entities.BusinessPage.filter({ id: pageId });
        }
      }

      const page = Array.isArray(pageData) ? pageData[0] : pageData; // Assuming filter returns an array, take the first item

      if (!page) {
        setError("עמוד העסק לא נמצא");
        setIsLoading(false);
        return;
      }

      // בדיקה אם המשתמש יכול לראות את העמוד
      const currentUser = await base44.auth.me().catch(() => null);
      const isOwner = currentUser && page.business_owner_email?.toLowerCase() === currentUser.email?.toLowerCase();
      const isAdmin = currentUser && currentUser.role === 'admin';
      const canPreview = isOwner || isAdmin;

      // אם העמוד לא פעיל או לא מאושר, רק הבעלים/אדמין יכולים לראות (במצב preview)
      if (!page.is_active || page.approval_status !== 'approved') {
        if (!isPreview || !canPreview) {
          setError("עמוד העסק אינו זמין כעת");
          setIsLoading(false);
          return;
        }
      }

      // If loaded by ID and has slug, redirect to slug URL
      // This changes the URL in the browser without a full page reload.
      if (pageId && page.url_slug && !pageSlug) {
        window.history.replaceState(null, '', `${window.location.pathname}?slug=${page.url_slug}`);
      }

      setBusinessPage(page);
      await checkUserAndFavorite(page);
    } catch (err) {
      console.error("Error loading business page:", err);
      setError("שגיאה בטעינת עמוד העסק");
    } finally {
      setIsLoading(false);
    }
  }, [pageId, pageSlug, checkUserAndFavorite]);

  const onReviewSubmitted = useCallback(() => {
    setShowReviewForm(false);
    setSelectedMoodForReview(null);
    window.location.reload();
  }, []);

  useEffect(() => {
    loadBusinessPage();
  }, [loadBusinessPage]);

  // בדיקת סטטוס פתוח/סגור - כל דקה
  useEffect(() => {
    if (!businessPage?.hours) return;

    const updateOpenStatus = () => {
      const status = checkBusinessOpen(businessPage.hours);
      setBusinessOpenStatus(status);
    };

    updateOpenStatus(); // עדכון ראשוני
    const interval = setInterval(updateOpenStatus, 60000); // כל דקה

    return () => clearInterval(interval);
  }, [businessPage?.hours]);

  // Load related businesses from same category
  useEffect(() => {
    if (!businessPage?.category_id || !businessPage?.id) return;

    const loadRelated = async () => {
      try {
        const related = await base44.entities.BusinessPage.filter({
          category_id: businessPage.category_id,
          is_active: true,
          approval_status: "approved",
          is_frozen: false
        });
        
        // Exclude current business and take random 4
        const filtered = related.filter(b => b.id !== businessPage.id);
        const shuffled = filtered.sort(() => 0.5 - Math.random());
        setRelatedBusinesses(shuffled.slice(0, 4));
      } catch (err) {
        console.error("Error loading related businesses:", err);
      }
    };

    loadRelated();
  }, [businessPage?.category_id, businessPage?.id]);

  // JSON-LD Schema is now handled by the LocalBusinessSchema component


  // עדכון כל הפונקציות עם tracking:

  const handlePhoneClick = useCallback((phone) => {
    console.log('📞 Phone button clicked!');
    console.log('📊 About to track phone_click event');
    safeTrackEvent('phone_click', { phone });
    console.log('📊 Track event called');
    window.location.href = `tel:${phone}`;
  }, [safeTrackEvent]);

  const handleNavigationClick = useCallback((address, navigationType = 'default') => {
    safeTrackEvent('navigation_click', { address, type: navigationType });
    const encodedAddress = encodeURIComponent(address);
    let url = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`; // Default for 'default' or 'google'
    if (navigationType === 'waze') {
      url = `https://waze.com/ul?q=${encodedAddress}`;
    } else if (navigationType === 'default') {
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      if (isMobile) {
        url = `https://waze.com/ul?q=${encodedAddress}`;
      } else {
        url = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
      }
    }
    window.open(url, '_blank');
  }, [safeTrackEvent]);


  const handleWebsiteClick = useCallback((url) => {
    if (!url) return;
    safeTrackEvent('website_click', { url });
    const fullUrl = url.startsWith('http') ? url : `https://${url}`;
    window.open(fullUrl, '_blank');
  }, [safeTrackEvent]);


  const handleShare = useCallback(async () => {
    if (!businessPage) return;
    safeTrackEvent('share_click', { method: 'main_button' });

    const title = businessPage.display_title || businessPage.business_name;
    const text = `בדקו את ${title} במשֻלנו!`;
    const url = window.location.href;
    const shareData = { title, text, url };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log('Native share failed or cancelled:', err);
        // Fallback to clipboard if native share fails or user cancels
        try {
          await navigator.clipboard.writeText(url);
          alert('הקישור הועתק ללוח');
        } catch (clipboardErr) {
          console.error("Clipboard write failed:", clipboardErr);
          prompt("העתיקו את הקישור:", url);
        }
      }
    } else {
      // Fallback for browsers that/ don't support navigator.share
      try {
        await navigator.clipboard.writeText(url);
        alert('הקישור הועתק ללוח');
      } catch (clipboardErr) {
        console.error("Clipboard write failed:", clipboardErr);
        prompt("העתיקו את הקישור:", url);
      }
    }
  }, [businessPage, safeTrackEvent]);


  const handleFavoriteToggle = useCallback(async () => {
    safeTrackEvent('favorite_click', { action: isFavorited ? 'remove' : 'add' });

    if (!user) {
      // Changed to use User.loginWithRedirect as per common pattern.
      // If `base44.auth.redirectToLogin` is a specific implementation, adjust accordingly.
      base44.auth.redirectToLogin(window.location.href);
      return;
    }

    try {
      if (isFavorited) {
        // Changed to use Favorite.filter() and Favorite.delete() directly.
        // If `base44.entities` is a specific implementation, adjust accordingly.
        const favs = await base44.entities.Favorite.filter({ user_email: user.email, business_page_id: pageId });
        if (favs.length > 0) {
          await base44.entities.Favorite.delete(favs[0].id);
          setIsFavorited(false);
        }
      } else {
        // Changed to use Favorite.create() directly.
        // If `base44.entities` is a specific implementation, adjust accordingly.
        await base44.entities.Favorite.create({ user_email: user.email, business_page_id: businessPage.id });
        setIsFavorited(true);
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
      alert("שגיאה בשינוי מועדפים.");
    }
  }, [user, isFavorited, businessPage?.id, safeTrackEvent, pageId]);

  const handleImageClick = (index) => {
    setGalleryInitialIndex(index);
    setIsGalleryOpen(true);
  };

  const handleLogoClick = useCallback(() => {
    if (!businessPage) return;
    const businessLogo = businessPage.images?.[1] || businessPage.images?.[0] || null;
    const certsAll = businessPage?.kashrut_certificate_urls;
    const certImages = Array.isArray(certsAll) ? certsAll.filter(isImageUrl) : [];
    const images = [businessLogo, ...certImages].filter(Boolean); // Filtered out `certsAll` directly, changed to `certImages` for image URLs only
    if (!images.length) return;
    setLogoGalleryImages(images);
    setIsLogoGalleryOpen(true);
  }, [businessPage, isImageUrl]);

  const handleKashrutLogoClick = useCallback(() => {
    if (!businessPage) return;
    const kashrutLogo = businessPage?.kashrut_logo_url || null;
    const certsAll = businessPage?.kashrut_certificate_urls;
    const certImages = Array.isArray(certsAll) ? certsAll.filter(isImageUrl) : [];
    const images = [kashrutLogo, ...certImages].filter(Boolean);
    if (!images.length) return;
    setLogoGalleryImages(images);
    setIsLogoGalleryOpen(true);
  }, [businessPage, isImageUrl]);

  // פתיחת מודל תוספות
  const handleOpenModifications = useCallback((item) => {
    // בדיקה אם העסק פתוח
    if (!businessOpenStatus.isOpen) {
      alert(`לא ניתן להזמין כרגע - ${businessOpenStatus.message}`);
      return;
    }
    setSelectedItemForMods(item);
    setModificationModalOpen(true);
  }, [businessOpenStatus]);

  // הוספה לעגלה מהמודל
  const handleAddToCartFromModal = useCallback((itemWithMods) => {
    // Safely parse base price from item
    const rawPrice = itemWithMods.price || itemWithMods.basePrice || 0;
    const basePrice = parseFloat(String(rawPrice).replace(/[^\d.]/g, '')) || 0;
    const quantity = parseInt(itemWithMods.quantity) || 1;
    
    const cartItem = {
      id: itemWithMods.cartItemId || `${Date.now()}-${Math.random()}`,
      categoryName: selectedItemForMods?.categoryName || 'כללי',
      itemName: itemWithMods.name || 'פריט',
      basePrice: basePrice,
      price: basePrice, // Also store as 'price' for compatibility
      quantity: quantity,
      selectedAddons: itemWithMods.selected_modifications || [],
      availableAddons: itemWithMods.addons || [],
      finalPrice: itemWithMods.item_final_price || basePrice,
      image: itemWithMods.image
    };

    console.log('🛒 Adding to cart:', cartItem);
    
    setCart((prevCart) => [...prevCart, cartItem]);
    safeTrackEvent('add_to_cart', {
      item_name: itemWithMods.name,
      price: itemWithMods.item_final_price,
      quantity: itemWithMods.quantity
    });
    setModificationModalOpen(false); // Close modal after adding
    setSelectedItemForMods(null); // Clear selected item
    handleOpenOrderCart(); // Open the order sidebar after adding
  }, [safeTrackEvent, selectedItemForMods, handleOpenOrderCart]);

  // ניהול סל קניות - עדכון הפונקציות הקיימות
  const updateQuantity = useCallback((cartItemId, delta) => {
    safeTrackEvent('update_cart_quantity', { cart_item_id: cartItemId, delta });
    setCart(cart.map(item => {
      if (item.id === cartItemId) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  }, [safeTrackEvent, cart]);

  const toggleAddon = useCallback((cartItemId, addon) => {
    safeTrackEvent('toggle_cart_addon', { cart_item_id: cartItemId, addon_name: addon.name });
    setCart(cart.map(item => {
      if (item.id === cartItemId) {
        const exists = item.selectedAddons.find(a => a.name === addon.name);
        if (exists) {
          return {
            ...item,
            selectedAddons: item.selectedAddons.filter(a => a.name !== addon.name)
          };
        } else {
          return {
            ...item,
            selectedAddons: [...item.selectedAddons, { ...addon }]
          };
        }
      }
      return item;
    }));
  }, [safeTrackEvent, cart]);

  const removeFromCart = useCallback((cartItemId) => {
    safeTrackEvent('remove_from_cart', { cart_item_id: cartItemId });
    setCart(cart.filter(item => item.id !== cartItemId));
  }, [safeTrackEvent, cart]);

  const clearCart = useCallback(() => {
    safeTrackEvent('clear_cart');
    setCart([]);
  }, [safeTrackEvent]);


  if (isLoading) {
    return (
      <div className="min-h-screen relative overflow-hidden" dir="rtl">
        <div className="fixed inset-0 -z-10">
          <div className="absolute inset-0 bg-white-elegant"></div>
          <div className="bubble bubble-1"></div>
          <div className="bubble bubble-2"></div>
          <div className="bubble bubble-3"></div>
          <div className="bubble bubble-4"></div>
          <div className="bubble bubble-5"></div>
          <div className="bubble bubble-6"></div>
          <div className="bubble bubble-7"></div>
          <div className="bubble bubble-8"></div>
        </div>
        
        {/* Modern Loading Skeleton */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hero Skeleton */}
          <div className="h-64 sm:h-80 md:h-96 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 animate-pulse rounded-b-3xl"></div>
          
          <div className="relative -mt-16 flex items-end space-x-5 space-x-reverse px-4">
            <div className="h-32 w-32 rounded-2xl bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 animate-pulse shadow-xl"></div>
          </div>
          
          <div className="mt-8 space-y-4">
            {/* Title skeleton */}
            <div className="h-8 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 animate-pulse rounded-xl w-2/3"></div>
            <div className="h-4 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 animate-pulse rounded-lg w-full"></div>
            <div className="h-4 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 animate-pulse rounded-lg w-5/6"></div>
            
            {/* Menu items skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-32 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 animate-pulse rounded-2xl" style={{ animationDelay: `${i * 100}ms` }}></div>
              ))}
            </div>
          </div>
        </div>
      </div>);

  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden" dir="rtl">
        <div className="fixed inset-0 -z-10">
          <div className="absolute inset-0 bg-white-elegant"></div>
          <div className="bubble bubble-1"></div>
          <div className="bubble bubble-2"></div>
          <div className="bubble bubble-3"></div>
          <div className="bubble bubble-4"></div>
          <div className="bubble bubble-5"></div>
          <div className="bubble bubble-6"></div>
          <div className="bubble bubble-7"></div>
          <div className="bubble bubble-8"></div>
        </div>
        <Alert variant="destructive" className="max-w-md relative z-10">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>);

  }

  if (!businessPage) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden" dir="rtl">
        <div className="fixed inset-0 -z-10">
          <div className="absolute inset-0 bg-white-elegant"></div>
          <div className="bubble bubble-1"></div>
          <div className="bubble bubble-2"></div>
          <div className="bubble bubble-3"></div>
          <div className="bubble bubble-4"></div>
          <div className="bubble bubble-5"></div>
          <div className="bubble bubble-6"></div>
          <div className="bubble bubble-7"></div>
          <div className="bubble bubble-8"></div>
        </div>
        <div className="text-center relative z-10 p-6 bg-white/80 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">עמוד לא נמצא</h2>
          <p className="text-gray-600">העמוד שחיפשת אינו קיים או לא זמין.</p>
        </div>
      </div>);

  }

  const isOwner = user && businessPage.business_owner_email?.toLowerCase() === user.email?.toLowerCase();
  const isAdmin = user && user.role === 'admin';
  const canEdit = isOwner || isAdmin;

  const handleEditClick = () => {
    if (canEdit) {
      window.location.href = createPageUrl(`EditBusinessPage?id=${businessPage.id}`);
    } else {
      alert("אין לך הרשאה לערוך עמוד עסק זה");
    }
  };

  const handleManageClick = () => {
    if (canEdit) {
      window.location.href = createPageUrl(`BusinessManage?id=${businessPage.id}`);
    } else {
      alert("אין לך הרשאה לניהול עמוד עסק זה");
    }
  };

  const handleOrdersManageClick = () => {
    if (canEdit) {
      window.location.href = createPageUrl(`OrdersManagement?business_page_id=${businessPage.id}`);
    } else {
      alert("אין לך הרשאה לניהול הזמנות של עסק זה");
    }
  };

  const handleGenerateAiSummary = async () => {
    if (!canEdit) return;
    const confirmMsg = businessPage.ai_executive_summary 
        ? "קיים כבר תקציר מנהלים. האם לייצר מחדש?" 
        : "האם לייצר תקציר מנהלים חכם (AI) עבור העסק?";
    
    if (!confirm(confirmMsg)) return;

    try {
        // Fetch top positive reviews for context
        const topReviews = await base44.entities.Review.filter(
            { business_page_id: businessPage.id, rating: { $gte: 4 } }, 
            '-created_date', 
            5
        );

        const res = await base44.functions.invoke('generateAiContent', {
            type: 'business_summary',
            data: {
                business_name: businessPage.business_name,
                description: businessPage.description,
                category: businessPage.category_name,
                reviews: topReviews
            }
        });

        if (res.data?.success) {
            const summary = res.data.data.content;
            await base44.entities.BusinessPage.update(businessPage.id, { ai_executive_summary: summary });
            loadBusinessPage(); // Refresh to show changes
            alert("תקציר נוצר בהצלחה!");
        } else {
            alert("שגיאה ביצירת התוכן");
        }
    } catch (e) {
        console.error(e);
        alert("אירעה שגיאה");
    }
  };

  // ScrollReveal wrapper component
  const ScrollReveal = ({ children, delay = 0 }) => {
    const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });
    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 30 }}
        animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
        transition={{ duration: 0.6, delay }}
      >
        {children}
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen relative overflow-hidden" dir="rtl" style={{
      '--theme-primary': theme.colors.primary,
      '--theme-primary-hover': theme.colors.primaryHover,
      '--theme-primary-light': theme.colors.primaryLight,
      '--theme-primary-dark': theme.colors.primaryDark,
      '--theme-background-color': theme.colors.background || theme.colors.primaryLight,
      '--bubble-bg-color-start': hexToRgba(theme.colors.primaryLight, 0.35),
      '--bubble-bg-color-end': hexToRgba(theme.colors.primaryLight, 0.15),
      '--bubble-shadow-color': hexToRgba(theme.colors.primaryLight, 0.15),
    }}>
      {/* SEO Meta Tags */}
      <SeoMeta
        title={businessPage.display_title || businessPage.business_name}
        description={(businessPage.description || "").substring(0, 160)}
        imageUrl={businessPage.preview_image || businessPage.images?.[0]}
        url={window.location.href}
        city={businessPage.city || "ביתר עילית"}
        category={businessPage.category_name || ""}
        kashrut={businessPage.kashrut_authority_type || ""}
      />
      <LocalBusinessSchema business={businessPage} />

      {/* Animated Gradient Background with Bubbles */}
      <div className="fixed inset-0 -z-10">
        {/* Main Gradient - דינמי לפי עסק */}
        <div className={`absolute inset-0 ${theme.gradient}`}></div>

        {/* Animated Bubbles */}
        <div className="bubble bubble-1"></div>
        <div className="bubble bubble-2"></div>
        <div className="bubble bubble-3"></div>
        <div className="bubble bubble-4"></div>
        <div className="bubble bubble-5"></div>
        <div className="bubble bubble-6"></div>
        <div className="bubble bubble-7"></div>
        <div className="bubble bubble-8"></div>
      </div>

      {/* חלונית הזמנה - צד שמאל */}
      {menuCategories.length > 0 && (
        <OrderSidebar
          businessPage={businessPage}
          cart={cart}
          onUpdateQuantity={updateQuantity}
          onRemoveFromCart={removeFromCart}
          onToggleAddon={toggleAddon}
          onClearCart={clearCart}
          isOpen={isOrderCartOpen}
          onClose={() => setIsOrderCartOpen(false)}
          theme={theme}
          businessOpenStatus={businessOpenStatus}
        />
      )}

      {/* הסרנו את כפתור ההזמנה המרחף */}

      {/* כפתור ווטסאפ מרחף - ימין למטה (מעל סרגל תחתון במובייל) */}
      {(businessPage.whatsapp_phone || businessPage.contact_phone) && (
        <a
          href={`https://wa.me/${(businessPage.whatsapp_phone || businessPage.contact_phone || '').replace(/\D/g, '')?.replace(/^0/, '972')}${
            businessPage.whatsapp_message
              ? `?text=${encodeURIComponent(businessPage.whatsapp_message)}`
              : ''
          }`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => {
            const phone = businessPage.whatsapp_phone || businessPage.contact_phone;
            safeTrackEvent('whatsapp_click', { phone });
          }}
          className="fixed right-6 bottom-24 lg:bottom-6 z-50 bg-green-500 hover:bg-green-600 text-white p-4 rounded-full shadow-2xl hover:shadow-green-500/50 transition-all duration-300 hover:scale-110 active:scale-95 group"
          title="שלח הודעה בווטסאפ"
          aria-label="שלח הודעה בווטסאפ"
        >
          <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
          </svg>
          <span className="absolute left-full ml-3 whitespace-nowrap bg-slate-900 text-white px-3 py-1 rounded-lg text-sm opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            שלח הודעה
          </span>
        </a>
      )}

      {/* פס קריאה לבעלות על עסק - מעל הכל */}
      {(!businessPage?.business_owner_email || businessPage?.business_owner_email === '4170531@gmail.com') && businessPage?.url_slug !== 'fruitost' && (
        <div className="sticky top-0 z-50 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 shadow-lg border-b-2 border-amber-600 animate-pulse">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Store className="w-6 h-6 text-amber-900 animate-pulse" />
                <div className="absolute inset-0 rounded-full bg-amber-300 blur-md opacity-50 animate-ping"></div>
              </div>
              <div>
                <p className="text-amber-950 font-bold text-base sm:text-lg">
                  העסק שלך?
                </p>
                <p className="text-amber-800 text-xs sm:text-sm">
                  קח בעלות וקבל חשיפה מקסימלית!
                </p>
              </div>
            </div>
            <a
              href={createPageUrl("BusinessLanding")}
              className="bg-amber-900 hover:bg-amber-950 text-yellow-100 px-4 py-2 rounded-lg font-bold text-sm shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center gap-2 border-2 border-amber-700"
              onClick={() => safeTrackEvent('ownership_banner_click', { from_page: businessPage.id })}
            >
              <Sparkles className="w-4 h-4" />
              <span className="hidden sm:inline">הצטרפו עכשיו</span>
              <span className="sm:hidden">הצטרף</span>
            </a>
          </div>
        </div>
      )}

      <WoltBusinessHero
        businessPage={businessPage}
        canEdit={canEdit}
        isFavorited={isFavorited}
        onFavorite={handleFavoriteToggle}
        onShare={handleShare}
        onEditClick={handleEditClick}
        onManageClick={handleManageClick}
        onOrdersManageClick={handleOrdersManageClick}
        onGenerateAiSummary={handleGenerateAiSummary}
        onLogoClick={handleLogoClick}
        onKashrutLogoClick={handleKashrutLogoClick}
        theme={theme} />


      <BusinessAddressBar address={businessPage.address} />

      <BusinessInfoBar
        businessPage={businessPage}
        onRatingClick={scrollToReviews}
        onPhoneClick={handlePhoneClick}
        onNavigationClick={handleNavigationClick}
        onWebsiteClick={handleWebsiteClick}
        theme={theme} />


      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        <div className="grid grid-cols-1 gap-8 items-start">
          <div className="space-y-8">

            {/* AI Executive Summary (Why Us) - With Scroll Animation */}
            {businessPage.ai_executive_summary && (
              <ScrollReveal>
                <div className="bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6 rounded-2xl shadow-lg border border-indigo-100 relative overflow-hidden hover:shadow-xl transition-shadow duration-300">
                   <div className="absolute top-0 left-0 p-4 opacity-5 pointer-events-none">
                      <Sparkles className="w-32 h-32 text-indigo-600" />
                   </div>
                   <h3 className="text-xl font-bold text-indigo-900 mb-4 flex items-center gap-2 relative z-10">
                      <Sparkles className="w-5 h-5 text-indigo-600" />
                      למה לבחור בנו?
                   </h3>
                   <div 
                      className="prose prose-sm max-w-none text-slate-700 relative z-10 leading-relaxed [&>ul]:list-disc [&>ul]:pr-4 [&>ul>li]:mb-1"
                      dangerouslySetInnerHTML={{ __html: businessPage.ai_executive_summary }}
                   />
                </div>
              </ScrollReveal>
            )}

            {galleryImages.length > 0 &&
              <InfiniteImageMarquee
                images={galleryImages}
                height={{ mobile: 104, desktop: 140 }}
                gap={12}
                speedSeconds={35} />

            }

            {/* לוח שעות פעילות - With Scroll Animation */}
            {businessPage.hours &&
              <ScrollReveal delay={0.1}>
                <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-slate-200/80 hover:shadow-2xl transition-shadow duration-300">
                  <BusinessHoursDisplay hours={businessPage.hours} isBlackTheme={isBlackTheme} />
                </div>
              </ScrollReveal>
            }

            {/* תגיות - דינמי לפי צבע העסק */}
            {Array.isArray(tags) && tags.length > 0 &&
              <div className="bg-transparent p-6 rounded-2xl shadow-xl border border-slate-200/80">
                <h3 className="text-xl font-bold text-slate-800 mb-3">תגיות</h3>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag, idx) =>
                    <Badge
                      key={idx}
                      variant="secondary"
                      className="text-white px-3 py-2 text-sm font-medium rounded-full inline-flex items-center border transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent cursor-pointer"
                      style={{
                        backgroundColor: 'var(--theme-primary)',
                        color: 'white',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'white';
                        e.currentTarget.style.color = 'var(--theme-primary)';
                        e.currentTarget.style.borderColor = 'var(--theme-primary)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--theme-primary)';
                        e.currentTarget.style.color = 'white';
                        e.currentTarget.style.borderColor = 'transparent';
                      }}>
                      #{tag}
                    </Badge>
                  )}
                </div>
              </div>
            }

            {/* תפריט - כפתורים דינמיים */}
            {menuCategories.length > 0 &&
              <div className="bg-transparent py-4 sticky top-0 z-10 border-b">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs text-slate-500 italic">
                    * התמונות להמחשה בלבד
                  </div>
                </div>
                <div className="bg-transparent pb-2 flex items-center space-x-3 overflow-x-auto hide-scrollbar">
                  {menuCategories.map((category) =>
                    <button
                      key={category.id}
                      onClick={() => scrollToCategory(category.id)}
                      className={`text-slate-50 px-6 py-3 text-sm font-semibold rounded-full whitespace-nowrap transition-all duration-300 hover:scale-105 shadow-md hover:bg-gray-50 hover:shadow-lg border ${
                        isBlackTheme
                          ? 'bg-red-600 hover:bg-red-500 border-red-500'
                          : 'border-gray-200'
                      }`}
                      style={!isBlackTheme ? {
                        backgroundColor: 'var(--theme-primary)',
                        color: 'white',
                      } : {}}
                      onMouseEnter={(e) => {
                        if (!isBlackTheme) {
                          e.currentTarget.style.color = 'var(--theme-primary-hover)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isBlackTheme) {
                          e.currentTarget.style.color = 'white';
                        }
                      }}>
                      {category.name}
                    </button>
                  )}
                </div>
              </div>
            }

            {/* תפריט - פריטים */}
            <div className="space-y-12">
              {menuCategories.map((category) =>
                <div key={category.id} ref={(el) => menuSectionRefs.current[category.id] = el}>
                  <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                    <div className="rounded-full w-2 h-8" style={{ backgroundColor: 'var(--theme-primary-hover)' }}></div>
                    {category.name}
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {category.items?.map((item) =>
                      <MenuItem
                        key={item.id || item.name}
                        item={{ ...item, categoryName: category.name }}
                        theme={theme}
                        isBlackTheme={isBlackTheme}
                        onOpenModifications={handleOpenModifications}
                      />
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* SEO Content Footer - Only for thin content */}
            {businessPage.description && businessPage.description.split(' ').length < 50 && (
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-2xl shadow-lg border border-blue-100">
                <p className="text-sm text-slate-700 leading-relaxed">
                  מחפשים <strong>{businessPage.category_name || 'עסקים'}</strong> ב<strong>{businessPage.city || 'ביתר-עילית'}</strong>? 
                  משֻלנו מחבר אותך עם העסקים והמקצוענים הטובים ביותר בקהילה החרדית. 
                  מצא עוד <strong>{businessPage.category_name || 'עסקים'}</strong> ב<strong>{businessPage.city || 'ביתר-עילית'}</strong> היום בפלטפורמה שלנו.
                </p>
              </div>
            )}

            {/* Related Businesses Section - With Scroll Animation */}
            {relatedBusinesses.length > 0 && (
              <ScrollReveal delay={0.2}>
                <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-slate-200/80">
                  <h3 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                    <Store className="w-6 h-6" style={{ color: 'var(--theme-primary)' }} />
                    עוד עסקים בקטגוריה
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {relatedBusinesses.map((related) => (
                      <a
                        key={related.id}
                        href={createPageUrl(`BusinessPage?slug=${related.url_slug || related.id}`)}
                        className="group block bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover:scale-105 border border-slate-200"
                        onClick={(e) => {
                          e.preventDefault();
                          safeTrackEvent('related_business_click', { business_id: related.id });
                          window.location.href = createPageUrl(`BusinessPage?slug=${related.url_slug || related.id}`);
                        }}
                      >
                        <div className="aspect-square bg-gradient-to-br from-slate-100 to-slate-200 relative overflow-hidden">
                          {related.preview_image || related.images?.[0] ? (
                            <LazyImage
                              src={related.preview_image || related.images?.[0]}
                              alt={related.business_name}
                              className="w-full h-full"
                              imgClassName="object-cover w-full h-full group-hover:scale-110 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Store className="w-12 h-12 text-slate-400" />
                            </div>
                          )}
                        </div>
                        <div className="p-3">
                          <h4 className="font-bold text-sm text-slate-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
                            {related.business_name}
                          </h4>
                          {related.smart_rating > 0 && (
                            <div className="flex items-center gap-1 mt-1">
                              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                              <span className="text-xs text-slate-600">{related.smart_rating.toFixed(1)}</span>
                            </div>
                          )}
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              </ScrollReveal>
            )}

            {/* ביקורות - With Scroll Animation */}
            <ScrollReveal delay={0.3}>
              <div id="reviews-section" ref={reviewsRef} className="pt-8 border-t">
                <div className="bg-white rounded-2xl shadow-xl border border-slate-200/80 p-8 space-y-6">
                  <EmojiReviewPrompt
                    businessName={businessPage.business_name || businessPage.display_title || "העסק"}
                    onOpenForm={(mood) => {
                      setSelectedMoodForReview(mood);
                      setShowReviewForm(true);
                    }}
                    theme={theme} />

                  <div className="pt-2">
                    {user && showReviewForm &&
                      <div className="mb-8 bg-gradient-to-r from-slate-50 to-indigo-50 p-6 rounded-xl border border-indigo-200 shadow-lg">
                        <ReviewForm
                          businessPageId={businessPage.id}
                          onSubmit={onReviewSubmitted}
                          onCancel={() => setShowReviewForm(false)}
                          initialMood={selectedMoodForReview} />
                      </div>
                    }

                    <ReviewList businessPageId={businessPage.id} />
                  </div>
                </div>
              </div>
            </ScrollReveal>
                  </div>
                  </div>
                  </div>

      {isGalleryOpen &&
        <ImageGallery
          images={businessPage.images}
          isOpen={isGalleryOpen}
          onClose={() => setIsGalleryOpen(false)}
          initialIndex={galleryInitialIndex}
          alt={businessPage.display_title} />

      }

      {isLogoGalleryOpen &&
        <ImageGallery
          images={logoGalleryImages}
          isOpen={isLogoGalleryOpen}
          onClose={() => setIsLogoGalleryOpen(false)}
          initialIndex={0}
          alt="לוגו ותעודת כשרות" />

      }

      {/* מודל תוספות */}
      <ModificationModal
        item={selectedItemForMods}
        isOpen={modificationModalOpen}
        onClose={() => {
          setModificationModalOpen(false);
          setSelectedItemForMods(null);
        }}
        onAddToCart={handleAddToCartFromModal}
        theme={theme}
      />

      <style>{`
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hover\\:scale-102:hover {
          transform: scale(1.02);
        }

        /* רקע לבן אלגנטי ומודרני */
        .bg-white-elegant {
          background: linear-gradient(135deg, #ffffff 0%, #f8fafc 50%, #f1f5f9 100%);
          position: relative;
        }

        .bg-white-elegant::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-image:
            radial-gradient(circle at 20% 30%, rgba(236, 72, 153, 0.03) 0%, transparent 50%),
            radial-gradient(circle at 80% 70%, rgba(59, 130, 246, 0.03) 0%, transparent 50%),
            radial-gradient(circle at 50% 50%, rgba(168, 85, 247, 0.02) 0%, transparent 50%);
          pointer-events: none;
        }

        /* רקע שחור מוצק */
        .bg-black-solid {
          background: #000000;
        }

        /* רקע מוצק כללי */
        .bg-solid {
          background-color: var(--theme-primary-light);
        }

        /* גרדיאנט מותאם אישית - דינמי לפי צבעים של העסק */
        .animate-gradient-custom {
          background: linear-gradient(
            -45deg,
            var(--theme-primary-light),
            var(--theme-primary-light),
            var(--theme-primary),
            var(--theme-primary),
            var(--theme-primary-light),
            var(--theme-primary-light),
            var(--theme-primary),
            var(--theme-primary)
          );
          background-size: 400% 400%;
          animation: gradient-flow 20s ease infinite;
        }

        /* גרדיאנט ורוד (fruitost) */
        .animate-gradient-smooth {
          background: linear-gradient(
            -45deg,
            #FFD6E8,
            #FFE8F0,
            #FFF5E1,
            #FFE8F5,
            #FFD6E8,
            #FFEEF8,
            #FFF5E1,
            #FFE8F0
          );
          background-size: 400% 400%;
          animation: gradient-flow 20s ease infinite;
        }

        /* גרדיאנט זהב (CLASS) */
        .animate-gradient-smooth-gold {
          background: linear-gradient(
            -45deg,
            #FFF8DC,
            #FFFACD,
            #FFEFD5,
            #FFE4B5,
            #FFF8DC,
            #FFEBCD,
            #FFFACD,
            #FFEFD5
          );
          background-size: 400% 400%;
          animation: gradient-flow 20s ease infinite;
        }

        /* גרדיאנט ירוק (Decocenter / 34452337RJFV) */
        .animate-gradient-smooth-green {
          background: linear-gradient(
            -45deg,
            #D1FAE5,
            #A7F3D0,
            #6EE7B7,
            #34D399,
            #D1FAE5,
            #ECFDF5,
            #A7F3D0,
            #6EE7B7
          );
          background-size: 400% 400%;
          animation: gradient-flow 20s ease infinite;
        }

        /* גרדיאנט אדום */
        .animate-gradient-smooth-red {
          background: linear-gradient(
            -45deg,
            #FEE2E2,
            #FECACA,
            #FCA5A5,
            #EF4444,
            #FEE2E2,
            #FEE2E2,
            #FECACA,
            #FCA5A5
          );
          background-size: 400% 400%;
          animation: gradient-flow 20s ease infinite;
        }

        /* גרדיאנט כחול */
        .animate-gradient-smooth-blue {
          background: linear-gradient(
            -45deg,
            #DBEAFE,
            #BFDBFE,
            #93C5FD,
            #3B82F6,
            #DBEAFE,
            #DBEAFE,
            #BFDBFE,
            #93C5FD
          );
          background-size: 400% 400%;
          animation: gradient-flow 20s ease infinite;
        }

        /* גרדיאנט סגול */
        .animate-gradient-smooth-purple {
          background: linear-gradient(
            -45deg,
            #F3E8FF,
            #E9D5FF,
            #D8B4FE,
            #A855F7,
            #F3E8FF,
            #F3E8FF,
            #E9D5FF,
            #D8B4FE
          );
          background-size: 400% 400%;
          animation: gradient-flow 20s ease infinite;
        }

        @keyframes gradient-flow {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        @keyframes float-up {
          0% {
            transform: translateY(100vh) scale(0);
            opacity: 0;
          }
          10% {
            opacity: 0.5;
          }
          90% {
            opacity: 0.5;
          }
          100% {
            transform: translateY(-100vh) scale(1);
            opacity: 0;
          }
        }

        .bubble {
          position: absolute;
          border-radius: 50%;
          background: radial-gradient(circle at 30% 30%,
            var(--bubble-bg-color-start),
            var(--bubble-bg-color-end)
          );
          box-shadow: 0 8px 32px var(--bubble-shadow-color);
          backdrop-filter: blur(3px);
          animation: float-up linear infinite;
        }

        .bubble-1 {
          width: 80px;
          height: 80px;
          left: 10%;
          animation-duration: 12s;
          animation-delay: 0s;
        }

        .bubble-2 {
          width: 60px;
          height: 60px;
          left: 25%;
          animation-duration: 15s;
          animation-delay: 2s;
        }

        .bubble-3 {
          width: 100px;
          height: 100px;
          left: 45%;
          animation-duration: 18s;
          animation-delay: 4s;
        }

        .bubble-4 {
          width: 70px;
          height: 70px;
          left: 65%;
          animation-duration: 13s;
          animation-delay: 1s;
        }

        .bubble-5 {
          width: 90px;
          height: 90px;
          left: 80%;
          animation-duration: 16s;
          animation-delay: 3s;
        }

        .bubble-6 {
          width: 50px;
          height: 50px;
          left: 15%;
          animation-duration: 14s;
          animation-delay: 5s;
        }

        .bubble-7 {
          width: 110px;
          height: 110px;
          left: 55%;
          animation-duration: 20s;
          animation-delay: 6s;
        }

        .bubble-8 {
          width: 65px;
          height: 65px;
          left: 90%;
          animation-duration: 17s;
          animation-delay: 2.5s;
        }
      `}</style>
    </div>
  );
}
import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import {
  ChevronLeft, ChevronRight, Store, Truck, Clock, Shield, Star,
  CheckCircle, Phone, Sparkles, ShoppingCart, MapPin, Search,
  Zap, Heart, ArrowLeft, Play, Users, TrendingUp, Award } from
"lucide-react";
// Star is already imported for billboard decorations
import { ScrollReveal, StaggerContainer, CountUp, RevealOnScroll } from "@/components/landing/ScrollAnimations";
import WordSlider from "@/components/landing/WordSlider";
import { WebsiteSchema, OrganizationSchema } from "@/components/seo/SchemaOrg";
import { Helmet } from "react-helmet-async";

// Hero images for Orthodox Jewish audience (no women)
const HERO_IMAGES = {
  restaurant: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80",
  delivery: "https://images.unsplash.com/photo-1526367790999-0150786686a2?w=800&q=80",
  food: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80",
  kosherFood: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&q=80",
  bakery: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&q=80",
  market: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&q=80"
};

// Animated Counter with intersection observer
function AnimatedCounter({ target, suffix = "", prefix = "" }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          const duration = 2000;
          const steps = 60;
          const increment = target / steps;
          let current = 0;
          const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
              setCount(target);
              clearInterval(timer);
            } else {
              setCount(Math.floor(current));
            }
          }, duration / steps);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, hasAnimated]);

  return <span ref={ref}>{prefix}{count.toLocaleString()}{suffix}</span>;
}

// Infinite Logo Marquee
function LogoMarquee({ businesses }) {
  const displayLogos = businesses.slice(0, 20);
  const duplicated = [...displayLogos, ...displayLogos];

  return (
    <div className="relative overflow-hidden py-8">
      <div className="flex animate-marquee">
        {duplicated.map((biz, i) =>
        <div
          key={i}
          className="flex-shrink-0 mx-6 w-24 h-24 bg-white rounded-2xl shadow-lg border border-slate-100 flex items-center justify-center p-3 hover:scale-110 transition-transform cursor-pointer">

            {biz.images?.[0] ?
          <img src={biz.images[0]} alt={biz.business_name} className="w-full h-full object-contain rounded-xl" /> :

          <div className="text-4xl">🏪</div>
          }
          </div>
        )}
      </div>
    </div>);

}

export default function LandingPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [businessPages, setBusinessPages] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [pages, cats] = await Promise.all([
        base44.entities.BusinessPage.filter({ is_active: true, approval_status: 'approved' }, '-created_date', 50),
        base44.entities.Category.list()]
        );
        setBusinessPages(pages || []);
        setCategories(cats || []);
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  // Auto-rotate testimonials
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % 3);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const handleSearch = (e) => {
    if (e) e.preventDefault();
    window.location.href = createPageUrl(`Browse${searchQuery.trim() ? `?q=${encodeURIComponent(searchQuery)}` : ''}`);
  };

  const testimonials = [
  { name: "ר' משה כהן", role: "אב למשפחה ברוכה", text: "השירות פשוט מדהים! הזמנתי ארוחת שבת שלמה והכל הגיע חם וטרי. חוסך לנו שעות יקרות!", rating: 5 },
  { name: "יוסי לוי", role: "בעל מסעדה", text: "מאז שהצטרפתי למשלנו ההכנסות שלי עלו ב-40%. הפלטפורמה פשוטה וקלה לשימוש.", rating: 5 },
  { name: "ר' אברהם גולדשטיין", role: "לקוח קבוע", text: "הכשרות ברמה הגבוהה ביותר והמחירים הוגנים. ממליץ בחום!", rating: 5 }];


  // Get subcategories with images for display - alternating food/shopping
  const getSubcategoriesWithImages = () => {
    const foodRegex = /(אוכל|מסעד|קייטר|מזון|גריל|בשר|דגים|פיצה|שווארמה|מאפ|קונדיט|חלבי|בשרי|שף|טבח|קפה|מתוקים|עוגות)/i;
    const shopRegex = /(חנות|קניות|ציוד|חשמל|אלקטרוניקה|מחשבים|ביגוד|אופנה|לבוש|הנעלה|ספרים|צעצוע|ריהוט|בית|קוסמטיקה|פארם|מתנות|כלי|מוצר|יודאיקה|ספרי)/i;

    const subcats = categories.filter((c) => c.parent_id && c.image && c.is_active);

    // Build map of parent names
    const parentNames = {};
    categories.forEach((c) => {
      if (!c.parent_id) parentNames[c.id] = c.name || "";
    });

    // Check if category belongs to food or shopping by parent name
    const isFoodCat = (cat) => {
      const parentName = parentNames[cat.parent_id] || "";
      return foodRegex.test(parentName) || foodRegex.test(cat.name || "");
    };

    const isShopCat = (cat) => {
      const parentName = parentNames[cat.parent_id] || "";
      return shopRegex.test(parentName) || shopRegex.test(cat.name || "");
    };

    const foodCats = subcats.filter(isFoodCat).slice(0, 3);
    const shopCats = subcats.filter(isShopCat).slice(0, 3);

    // Alternate: food, shop, food, shop, food, shop
    const result = [];
    for (let i = 0; i < 3; i++) {
      if (foodCats[i]) result.push(foodCats[i]);
      if (shopCats[i]) result.push(shopCats[i]);
    }
    return result;
  };

  const topSubcategories = getSubcategoriesWithImages();

  // Fallback gradients for categories without images
  const gradients = [
  'from-orange-400 to-red-500',
  'from-yellow-400 to-orange-500',
  'from-green-400 to-emerald-500',
  'from-pink-400 to-rose-500',
  'from-amber-400 to-yellow-500',
  'from-blue-400 to-cyan-500'];


  return (
    <div className="min-h-screen bg-[#FAFBFC] overflow-x-hidden" dir="rtl">
      {/* SEO Meta Tags & Analytics */}
      <Helmet>
        <title>משלנו - פלטפורמת העסקים והשירותים החרדית | מסעדות, משלוחים וקניות כשרות</title>
        <meta name="description" content="משלנו - הפלטפורמה המובילה לעסקים ושירותים בקהילה החרדית. מצאו מסעדות כשרות, שירותי משלוחים, חנויות ועסקים מקומיים בביתר עילית והסביבה." />
        <link rel="canonical" href={typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}` : undefined} />
        
        {/* Open Graph */}
        <meta property="og:title" content="משלנו - פלטפורמת העסקים והשירותים החרדית" />
        <meta property="og:description" content="מצאו מסעדות כשרות, שירותי משלוחים, חנויות ועסקים מקומיים בביתר עילית והסביבה" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={typeof window !== 'undefined' ? window.location.href : undefined} />
        <meta property="og:image" content="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/613960439_ChatGPT_Image_Jul_29__2025__02_28_50_AM-removebg-preview.png" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="משלנו - פלטפורמת העסקים החרדית" />
        <meta name="twitter:description" content="מצאו מסעדות כשרות, משלוחים וחנויות מקומיות" />
        <meta name="twitter:image" content="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/613960439_ChatGPT_Image_Jul_29__2025__02_28_50_AM-removebg-preview.png" />

        {/* Google Analytics */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-M5SP53RELQ"></script>
        <script>
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-M5SP53RELQ');
          `}
        </script>
      </Helmet>

      <WebsiteSchema />
      <OrganizationSchema />
      
      {/* ============== HERO SECTION - FULL IMAGE ============== */}
      <section className="relative w-full overflow-hidden">
        <Link
          to={createPageUrl("Browse")}
          className="block w-full touch-manipulation group">

          <img
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68815c70a48dd08622dbaf69/fb8c8a10a_image3.jpg"
            alt="כל מה שטוב, כשר וקרוב - זירת המסחר הדיגיטלית החדשה של המגזר החרדי"
            className="w-full h-auto max-h-[50vh] sm:max-h-[60vh] lg:max-h-[70vh] object-cover transform group-hover:scale-[1.01] transition-transform duration-700" />

        </Link>
      </section>



      {/* ============== CATEGORIES - BENTO GRID ============== */}
          <section className="py-12 sm:py-16 lg:py-20 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
            <ScrollReveal animation="fadeUp">
              <div className="text-center mb-8 sm:mb-12">
                <span className="inline-block px-3 sm:px-4 py-1 bg-purple-100 text-purple-700 rounded-full text-xs sm:text-sm font-semibold mb-3 sm:mb-4">
                  קטגוריות
                </span>
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-3 sm:mb-4 flex flex-wrap justify-center items-center gap-x-2">
                  <span className="">משלנו - מסעדות כשרות, משלוחים וקניות ב:</span>
                  <WordSlider words={["ביתר עילית", "מודיעין עילית", "בית שמש", "ירושלים", "אלעד", "בני ברק"]} />
                </h1>
                <p className="text-slate-600 text-sm sm:text-base lg:text-lg max-w-2xl mx-auto px-2">
                  פלטפורמת העסקים והשירותים המובילה בקהילה החרדית - מצאו מסעדות, שירותי משלוחים, חנויות ומקצוענים
                </p>
              </div>
            </ScrollReveal>

            <StaggerContainer staggerDelay={80} className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4 sm:gap-5 lg:gap-8">
          {topSubcategories.length > 0 ? topSubcategories.map((cat, i) =>
          <Link
            key={cat.id}
            to={createPageUrl(`Browse?q=${encodeURIComponent(cat.name)}`)}
            className="group relative overflow-hidden rounded-2xl sm:rounded-3xl aspect-square flex flex-col items-center justify-end p-2 sm:p-4 text-white shadow-lg hover:shadow-2xl transition-all duration-300 active:scale-95 sm:hover:scale-[1.03] touch-manipulation">

                <img
              src={cat.image}
              alt={cat.name}
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy" />

                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="relative z-10 text-center pb-1 sm:pb-2">
                  <h3 className="font-bold text-sm sm:text-base lg:text-xl drop-shadow-lg line-clamp-2">{cat.name}</h3>
                </div>
              </Link>
          ) :
          // Fallback while loading
          [...Array(6)].map((_, i) =>
          <div key={i} className={`group relative overflow-hidden rounded-2xl sm:rounded-3xl aspect-square flex flex-col items-center justify-center p-2 sm:p-4 text-white shadow-lg bg-gradient-to-br ${gradients[i]}`}>
                  <div className="w-8 sm:w-12 h-8 sm:h-12 bg-white/20 rounded-full animate-pulse" />
                </div>
          )
          }
        </StaggerContainer>

        <ScrollReveal animation="fadeUp" delay={300}>
          <div className="text-center mt-6 sm:mt-10">
            <Link to={createPageUrl("Browse")}>
              <Button size="lg" className="rounded-full bg-gradient-to-r from-[#667eea] to-[#764ba2] hover:opacity-90 text-white font-bold px-6 sm:px-8 py-4 sm:py-6 text-base sm:text-lg group shadow-xl touch-manipulation min-h-[48px]">
                גלו את החנויות
                <ChevronLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </ScrollReveal>
        </section>

      {/* ============== CINEMATIC SHOWCASE SECTION ============== */}
      <section className="relative overflow-hidden">
        {/* Cinematic black bars */}
        <div className="absolute top-0 left-0 right-0 h-6 sm:h-10 lg:h-14 bg-gradient-to-b from-black to-transparent z-20"></div>
        <div className="absolute bottom-0 left-0 right-0 h-6 sm:h-10 lg:h-14 bg-gradient-to-t from-black to-transparent z-20"></div>

        {/* Dark cinematic background */}
        <div className="bg-slate-950">



          {/* Full-width images container */}
          <div className="relative z-10">

            {/* Business Image */}
            <Link
              to={createPageUrl("BusinessLanding")}
              className="block touch-manipulation group relative">

              <div className="relative overflow-hidden">
                <img
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68815c70a48dd08622dbaf69/4fb3a81ef_image8.jpg"
                  alt="הצטרף כבעל עסק למשלנו - הראש שלכם בעסק, כל השאר עלינו"
                  className="w-full h-auto object-cover transform group-hover:scale-[1.02] transition-transform duration-700 ease-out" />


                {/* Light sweep effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out"></div>
              </div>
            </Link>



          </div>
        </div>
      </section>





      {/* ============== ANIMATIONS ============== */}
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
        
        .animate-pulse-slow {
          animation: pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        
        .animate-pulse-slower {
          animation: pulse 6s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        
        .animate-bounce-slow {
          animation: bounce 3s infinite;
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: .5; }
        }
        
        @keyframes bounce {
          0%, 100% { transform: translateY(-5%); }
          50% { transform: translateY(0); }
        }

        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(2deg); }
        }

        .animate-float {
          animation: float 6s ease-in-out infinite;
        }

        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }

        .animate-shimmer {
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
          background-size: 200% 100%;
          animation: shimmer 2s infinite;
        }

        @keyframes fadeSlideUp {
          0% { 
            opacity: 0; 
            transform: translateY(30px); 
          }
          100% { 
            opacity: 1; 
            transform: translateY(0); 
          }
        }

        .animate-fade-slide-up {
          animation: fadeSlideUp 0.8s ease-out forwards;
          opacity: 0;
        }

        /* Hero Cards - 3D Entrance Animation */
        @keyframes heroCardEntrance {
          0% {
            opacity: 0;
            transform: translateY(80px) scale(0.7) rotateX(20deg);
          }
          50% {
            opacity: 1;
            transform: translateY(-15px) scale(1.05) rotateX(-5deg);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1) rotateX(0deg);
          }
        }

        .hero-card {
          animation: heroCardEntrance 1s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
          animation-delay: var(--delay, 0.2s);
          opacity: 0;
          transform-style: preserve-3d;
        }

        .perspective-1000 {
          perspective: 1000px;
        }

        /* Idle floating animation */
        @keyframes heroFloat {
          0%, 100% { 
            transform: translateY(0); 
          }
          50% { 
            transform: translateY(-12px); 
          }
        }

        .hero-card > div {
          animation: heroFloat 5s ease-in-out infinite;
          animation-delay: calc(var(--delay, 0s) + 1s);
        }

        .hero-card:nth-child(2) > div {
          animation-delay: calc(var(--delay, 0s) + 1.5s);
        }

        /* Slow bounce for decorative elements */
        @keyframes bounceSlow {
          0%, 100% { 
            transform: translateY(0) scale(1); 
            opacity: 0.8;
          }
          50% { 
            transform: translateY(-20px) scale(1.1); 
            opacity: 1;
          }
        }

        .animate-bounce-slow {
          animation: bounceSlow 3s ease-in-out infinite;
        }

        @keyframes gradient-x {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }

        .animate-gradient-x {
          background-size: 200% 200%;
          animation: gradient-x 3s ease infinite;
        }

        .duration-1500 {
          transition-duration: 1500ms;
        }

        @keyframes glow {
          0%, 100% { box-shadow: 0 0 20px rgba(102, 126, 234, 0.3); }
          50% { box-shadow: 0 0 40px rgba(102, 126, 234, 0.6); }
        }

        .animate-glow {
          animation: glow 3s ease-in-out infinite;
        }
      `}</style>
    </div>);

}
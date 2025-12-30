import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ChevronLeft, ChevronDown, Store, TrendingUp, Users,
  Zap, DollarSign, CheckCircle, Star, ArrowLeft,
  Smartphone, BarChart3, HeadphonesIcon, Truck, Sparkles, Play, MessageCircle, ShoppingCart
} from "lucide-react";

// תמונות מותאמות לקהל החרדי (ללא נשים)
const BUSINESS_IMAGES = {
  bakery: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&q=80",
  restaurant: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80",
  grocery: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68815c70a48dd08622dbaf69/15fb42d92_Gemini_Generated_Image_1ctlgd1ctlgd1ctl.png",
  meat: "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=800&q=80",
  delivery: "https://images.unsplash.com/photo-1526367790999-0150786686a2?w=800&q=80",
  coffee: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=80",
  food: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80",
  challah: "https://images.unsplash.com/photo-1603379016822-e6d5e2770ece?w=800&q=80"
};

const benefits = [
  {
    icon: Sparkles,
    title: "עיצוב AI תוך 24 שעות",
    description: "תשכח ממעצבים שלוקחים שבועות. ה-AI שלנו בונה לך עמוד מהמם תוך יום אחד - נראה כאילו משרד מיתוג עיצב.",
    color: "from-purple-500 to-indigo-600"
  },
  {
    icon: TrendingUp,
    title: "חיבור ישיר לגוגל",
    description: "אנחנו מחוברים ל-Google Search Console. אתה רואה נתונים אמיתיים - כמה אנשים מחפשים אותך, מי קולק, מי קונה.",
    color: "from-green-500 to-emerald-600"
  },
  {
    icon: DollarSign,
    title: "תשלומים + סליקה אוטומטית",
    description: "הלקוח משלם דרך האתר, הכסף מגיע אליך. בלי לרדוף אחרי תשלומים, בלי בעיות. הכל אוטומטי.",
    color: "from-blue-500 to-cyan-600"
  },
  {
    icon: MessageCircle,
    title: "הזמנות לוואטסאפ בלחיצה",
    description: "לקוח רוצה להזמין? קליק אחד והוא מדבר איתך בוואטסאפ. בלי אפליקציות, בלי סיפורים - פשוט עובד.",
    color: "from-green-400 to-teal-600"
  },
  {
    icon: Smartphone,
    title: "דאשבורד שמראה הכל",
    description: "כמה הזמנות נכנסו? מי ביקר בעמוד? איזה מוצר הכי מבוקש? כל המידע במקום אחד, בזמן אמת.",
    color: "from-orange-500 to-red-600"
  },
  {
    icon: Store,
    title: "מהירות BASE44",
    description: "הטכנולוגיה הכי מהירה בשוק. העמוד שלך נטען ב-0.8 שניות. למה זה חשוב? כי לקוח לא מחכה - הוא עובר למתחרה.",
    color: "from-pink-500 to-rose-600"
  }
];

const steps = [
  {
    number: "1",
    title: "תן לנו 5 דקות",
    description: "שם העסק + מספר טלפון. זהו. ה-AI שלנו כבר רץ לעבוד עבורך.",
    icon: Sparkles
  },
  {
    number: "2",
    title: "ה-AI מעצב לך עמוד",
    description: "תוך 24 שעות קיבלת עמוד שנראה כמו של חברה ענקית. בלי מעצב, בלי המתנה, בלי הוצאות.",
    icon: Store
  },
  {
    number: "3",
    title: "לקוחות מתחילים להזמין",
    description: "הזמנות בוואטסאפ, תשלומים אוטומטיים, נתוני גוגל בזמן אמת. אתה צופה בכסף נכנס.",
    icon: TrendingUp
  }
];

const testimonials = [
  {
    name: "ר' יוסי כהן",
    business: "מאפיית הטעמים",
    text: "חשבתי שהמאפייה הקטנה שלי לא צריכה 'עמוד מפואר'. טעיתי. תוך שבועיים קיבלתי 60% יותר הזמנות. ההכנסות עלו ב-8,000 ₪ בחודש. רק צר לי שלא עשיתי את זה קודם.",
    rating: 5,
    image: BUSINESS_IMAGES.bakery
  },
  {
    name: "משה לוי",
    business: "גריל הבשרים",
    text: "הייתי בטוח שאנשים יודעים עלי. אבל בגוגל הייתי שקוף לגמרי. עכשיו כשמישהו מחפש 'גריל כשר' - אני הראשון. כל יום מגיעות הזמנות חדשות. משלנו פשוט החזירה לי את העסק.",
    rating: 5,
    image: BUSINESS_IMAGES.meat
  },
  {
    name: "אברהם גולד",
    business: "סושי כשר",
    text: "שילמתי פעם 4,500 ₪ למעצב שלקח חודש. כאן שילמתי 450 ₪ וקיבלתי עמוד מעוצב תוך 24 שעות + חיבור לגוגל + סליקה + דאשבורד. זה לא הגיוני כמה זה שווה. הכי טובה החלטה שעשיתי השנה.",
    rating: 5,
    image: BUSINESS_IMAGES.restaurant
  }
];

const faqs = [
  {
    question: "450 ₪? זה נשמע זול מדי. מה הקאץ'?",
    answer: "אין קאץ'. ברצינות. זה המחיר כי אנחנו משתמשים ב-AI ולא במעצב אנושי שעולה אלפי שקלים. אתה משלם רק על הערך - עמוד מעוצב + חיבור לגוגל + סליקה + דאשבורד. זה לא 'זול', זה פשוט חכם."
  },
  {
    question: "אני לא טכנולוג, זה יהיה מסובך בשבילי?",
    answer: "אם אתה יודע לשלוח הודעת וואטסאפ, אתה יודע לעבוד עם המערכת שלנו. זה בנוי כך שגם מי שלא מבין בטכנולוגיה יצליח. ואם תתקע - יש לנו תמיכה מלאה בעברית."
  },
  {
    question: "מה אם הלקוחות שלי לא משתמשים באינטרנט?",
    answer: "טעות. הם כן משתמשים. הם פשוט לא מוצאים אותך. 87% מהאנשים מחפשים בגוגל לפני שהם קונים משהו. אם אתה לא שם, הם קונים מהמתחרה. זה פשוט."
  },
  {
    question: "למה אני צריך 'עמוד מעוצב'? יש לי פייסבוק.",
    answer: "פייסבוק זה טוב. אבל זה לא שלך. מחר פייסבוק משנים אלגוריתם ואתה נעלם. עמוד בגוגל? זה שלך לנצח. וגוגל הוא המקום שבו אנשים חיפשו אותך - לא פייסבוק."
  },
  {
    question: "כמה זמן לוקח לראות תוצאות?",
    answer: "העמוד מוכן תוך 24 שעות. הלקוחות הראשונים מתחילים להגיע תוך שבוע. אחרי חודש, אתה רואה את ההבדל בהכנסות. זה לא קסם, זה פשוט נוכחות נכונה בגוגל."
  },
  {
    question: "מה אם אני לא אהיה מרוצה מהעיצוב?",
    answer: "אז אנחנו משנים עד שאתה מרוצה. בלי תשלום נוסף. אנחנו לא עוזבים אותך עם משהו שאתה לא אוהב. המטרה שלנו היא שתצליח, לא רק שתשלם."
  }
];

function FAQItem({ question, answer, isOpen, onClick }) {
  return (
    <div 
      className="border-b border-slate-200 last:border-0"
      role="listitem"
    >
      <button
        onClick={onClick}
        className="w-full py-4 sm:py-5 px-3 sm:px-4 flex items-center justify-between text-right hover:bg-slate-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded-lg touch-manipulation min-h-[52px]"
        aria-expanded={isOpen}
        aria-controls={`faq-answer-${question.replace(/\s/g, '-')}`}
      >
        <span className="font-semibold text-slate-800 text-sm sm:text-lg leading-snug">{question}</span>
        <ChevronDown 
          className={`w-5 h-5 text-slate-400 transition-transform duration-300 flex-shrink-0 mr-2 ${isOpen ? 'rotate-180' : ''}`} 
          aria-hidden="true"
        />
      </button>
      <div 
        id={`faq-answer-${question.replace(/\s/g, '-')}`}
        className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-64 pb-4 sm:pb-5' : 'max-h-0'}`}
        role="region"
        aria-hidden={!isOpen}
      >
        <p className="px-3 sm:px-4 text-slate-600 leading-relaxed text-sm sm:text-base">{answer}</p>
      </div>
    </div>
  );
}

// אנימציה של ספירה
function AnimatedCounter({ target, suffix = "", duration = 2000 }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
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
  }, [target, hasAnimated, duration]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

export default function BusinessLanding() {
  const [openFaq, setOpenFaq] = useState(null);
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveTestimonial(prev => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-white" dir="rtl">
      {/* Animations CSS */}
      <style>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        
        @keyframes wiggle {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-10deg); }
          75% { transform: rotate(10deg); }
        }
        
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        
        @keyframes pulse-slow {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
        
        @keyframes slide-in-right {
          from {
            opacity: 0;
            transform: translateX(-50px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes slide-in-left {
          from {
            opacity: 0;
            transform: translateX(50px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.8);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out forwards;
          opacity: 0;
        }
        
        .animate-float {
          animation: float 4s ease-in-out infinite;
        }
        
        .animate-wiggle {
          animation: wiggle 0.5s ease-in-out;
        }
        
        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }
        
        .animate-pulse-slow {
          animation: pulse-slow 3s ease-in-out infinite;
        }
        
        .animate-slide-in-right {
          animation: slide-in-right 0.6s ease-out forwards;
        }
        
        .animate-slide-in-left {
          animation: slide-in-left 0.6s ease-out forwards;
        }
        
        .animate-scale-in {
          animation: scale-in 0.5s ease-out forwards;
        }
        
        .group:hover .group-hover\\:animate-wiggle {
          animation: wiggle 0.5s ease-in-out;
        }
      `}</style>
      
      {/* Marquee Animation for image banner */}
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
      `}</style>
      
      {/* Skip to main content - Accessibility */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:right-4 focus:z-50 focus:bg-blue-600 focus:text-white focus:px-4 focus:py-2 focus:rounded-lg"
      >
        דלג לתוכן הראשי
      </a>

      {/* Hero Section */}
      <section className="relative min-h-[75vh] sm:min-h-[90vh] flex items-center overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#667eea] via-[#764ba2] to-[#f093fb]" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-20 sm:opacity-30" />
        
        {/* Floating orbs - Hidden on mobile for performance */}
        <div className="hidden sm:block absolute top-20 left-[10%] w-72 h-72 bg-white/10 rounded-full blur-3xl animate-pulse" />
        <div className="hidden sm:block absolute bottom-20 right-[15%] w-96 h-96 bg-pink-300/20 rounded-full blur-3xl" />

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-20">
          <div className="text-center">
            {/* Back button */}
            <Link 
              to={createPageUrl("LandingPage")} 
              className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-4 sm:mb-8 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-purple-600 rounded-lg px-2 py-2 touch-manipulation min-h-[44px]"
              aria-label="חזרה לדף הבית"
            >
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
              <span className="text-sm sm:text-base">חזרה לדף הבית</span>
            </Link>

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black text-white leading-[1.2] sm:leading-tight mb-4 sm:mb-6 px-2">
              בזמן שאתה קורא את זה,
              <br />
              <span className="bg-gradient-to-r from-yellow-300 via-amber-200 to-yellow-400 bg-clip-text text-transparent">
                המתחרה שלך גונב את הלקוחות
              </span>
            </h1>

            <p className="text-base sm:text-xl md:text-2xl text-white/90 max-w-3xl mx-auto mb-6 sm:mb-10 leading-relaxed px-4">
              <span className="font-bold text-yellow-300">תוך 24 שעות</span> אנחנו הופכים את העסק שלך למכונת כסף דיגיטלית עם AI מתקדם + חיבור ישיר לגוגל.
              <br className="hidden sm:block" />
              <span className="hidden sm:inline">בלי מעצבים, בלי שבועות המתנה, בלי אלפי שקלים. רק תוצאות.</span>
              <span className="sm:hidden">AI + גוגל = לקוחות חדשים כל יום.</span>
            </p>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center px-4">
              <Link to={createPageUrl("ContactPage")} className="w-full sm:w-auto">
                <Button 
                  size="lg" 
                  className="w-full sm:w-auto rounded-full bg-white text-[#667eea] hover:bg-white/95 font-bold px-8 sm:px-10 py-5 sm:py-7 text-lg sm:text-xl shadow-2xl active:scale-95 sm:hover:scale-105 transition-all duration-300 touch-manipulation min-h-[52px] relative overflow-hidden"
                >
                  <span className="relative z-10">אני רוצה לעצב את העסק שלי עכשיו</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-400 opacity-0 hover:opacity-20 transition-opacity"></div>
                  <Zap className="w-5 h-5 sm:w-6 sm:h-6 mr-2 animate-pulse" aria-hidden="true" />
                </Button>
              </Link>
              <div className="text-white/90 text-sm sm:text-base font-semibold bg-red-600 px-4 py-2 rounded-full animate-pulse">
                ⏰ 47 עסקים הצטרפו היום
              </div>
            </div>

          </div>
        </div>

        {/* Wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full" aria-hidden="true">
            <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="white"/>
          </svg>
        </div>
      </section>

      <main id="main-content">
        {/* Benefits Section */}
        <section id="benefits" className="py-12 sm:py-20 bg-white" aria-labelledby="benefits-heading">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8 sm:mb-16">
              <span className="inline-block px-3 sm:px-4 py-1 bg-red-100 text-red-700 rounded-full text-xs sm:text-sm font-semibold mb-3 sm:mb-4 animate-fade-in-up">
                🚨 תפסיק להפסיד כסף
              </span>
              <h2 id="benefits-heading" className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-3 sm:mb-4 animate-fade-in-up px-2" style={{ animationDelay: '0.1s' }}>
                המתחרה שלך כבר פה.<br/>
                <span className="text-red-600">אתה מחכה למה?</span>
              </h2>
              <p className="text-slate-600 text-sm sm:text-lg max-w-2xl mx-auto animate-fade-in-up px-4 font-bold" style={{ animationDelay: '0.2s' }}>
                כל יום בלי עמוד מקצועי = לקוחות שבוחרים במתחרה שלך
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6" role="list">
              {benefits.map((benefit, i) => (
                <Card 
                  key={i} 
                  className="group hover:shadow-xl transition-all duration-300 active:scale-[0.98] sm:hover:-translate-y-2 border-0 bg-slate-50 animate-fade-in-up touch-manipulation"
                  style={{ animationDelay: `${i * 0.1}s` }}
                  role="listitem"
                >
                  <CardContent className="p-4 sm:p-6">
                    <div className={`w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br ${benefit.color} flex items-center justify-center mb-3 sm:mb-5 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                      <benefit.icon className="w-5 h-5 sm:w-7 sm:h-7 text-white" aria-hidden="true" />
                    </div>
                    <h3 className="text-sm sm:text-xl font-bold text-slate-900 mb-1 sm:mb-2">{benefit.title}</h3>
                    <p className="text-slate-600 text-xs sm:text-base leading-relaxed hidden sm:block">{benefit.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Why Partner With Us - 3 Cards Section */}
        <section className="py-12 sm:py-20 bg-gradient-to-b from-slate-50 to-white" aria-labelledby="why-partner-heading">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8 sm:mb-16">
              <h2 id="why-partner-heading" className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-4 animate-fade-in-up px-2">
                למה כדאי להיות שותפים שלנו?
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-8">
              {/* Card 1 - Growth */}
              <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-lg sm:shadow-xl hover:shadow-2xl transition-all duration-300 active:scale-[0.98] sm:hover:-translate-y-2 animate-fade-in-up text-center touch-manipulation" style={{ animationDelay: '0.1s' }}>
                <div className="relative h-32 sm:h-48 mb-4 sm:mb-6 flex items-center justify-center">
                  {/* Illustration - Growth with Mashlanoo */}
                  <div className="relative">
                    <img 
                      src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/613960439_ChatGPT_Image_Jul_29__2025__02_28_50_AM-removebg-preview.png"
                      alt="לוגו משלנו"
                      className="w-20 h-20 object-contain animate-float"
                    />
                    <div className="absolute -top-2 -right-2 text-3xl animate-bounce">⭐</div>
                    <div className="absolute -bottom-2 -left-2 text-2xl animate-pulse">👍</div>
                    <div className="absolute top-0 left-0 text-xl animate-bounce" style={{ animationDelay: '0.5s' }}>😊</div>
                  </div>
                  {/* Orthodox Jewish figures illustration */}
                  <div className="absolute bottom-0 right-4 flex gap-1">
                    <div className="w-12 h-16 bg-gradient-to-b from-slate-800 to-slate-900 rounded-t-full relative">
                      <div className="absolute top-1 left-1/2 -translate-x-1/2 w-8 h-8 bg-[#E8BEAC] rounded-full"></div>
                      <div className="absolute top-6 left-1/2 -translate-x-1/2 w-6 h-3 bg-slate-900 rounded-sm"></div>
                    </div>
                    <div className="w-10 h-14 bg-gradient-to-b from-blue-800 to-blue-900 rounded-t-full relative">
                      <div className="absolute top-1 left-1/2 -translate-x-1/2 w-6 h-6 bg-[#E8BEAC] rounded-full"></div>
                    </div>
                  </div>
                </div>
                <h3 className="text-base sm:text-xl font-bold text-cyan-600 mb-2 sm:mb-3">בואו לצמוח עם משלנו</h3>
                <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                  קבלו עמוד עסק מקצועי, קידום בגוגל, סליקה ודאשבורד מתקדם. הכל במקום אחד.
                </p>
              </div>

              {/* Card 2 - More Orders */}
              <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-lg sm:shadow-xl hover:shadow-2xl transition-all duration-300 active:scale-[0.98] sm:hover:-translate-y-2 animate-fade-in-up text-center touch-manipulation" style={{ animationDelay: '0.2s' }}>
                <div className="relative h-32 sm:h-48 mb-4 sm:mb-6 flex items-center justify-center">
                  {/* Store Illustration */}
                  <div className="relative">
                    <div className="w-32 h-24 bg-gradient-to-b from-yellow-400 to-yellow-500 rounded-lg shadow-lg relative">
                      <div className="absolute -top-4 left-0 right-0 h-6 bg-gradient-to-b from-red-500 to-red-600 rounded-t-lg"></div>
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-10 bg-cyan-400 rounded-t-lg"></div>
                      <div className="absolute top-4 left-2 w-5 h-5 bg-cyan-300 rounded"></div>
                      <div className="absolute top-4 right-2 w-5 h-5 bg-cyan-300 rounded"></div>
                    </div>
                    {/* Delivery scooter */}
                    <div className="absolute -bottom-2 -right-8 w-16 h-12">
                      <div className="w-10 h-6 bg-cyan-500 rounded-lg"></div>
                      <div className="absolute bottom-0 left-1 w-3 h-3 bg-slate-800 rounded-full"></div>
                      <div className="absolute bottom-0 right-1 w-3 h-3 bg-slate-800 rounded-full"></div>
                    </div>
                    <div className="absolute -top-4 right-0 text-2xl animate-bounce">❤️</div>
                  </div>
                </div>
                <h3 className="text-base sm:text-xl font-bold text-cyan-600 mb-2 sm:mb-3">קבלו יותר הזמנות</h3>
                <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                  הזמנות דרך האתר בעמלה קטנה, קידום בגוגל שמביא לקוחות חדשים, וכל ההזמנות ישירות אליכם לוואטסאפ.
                </p>
              </div>

              {/* Card 3 - Fast Delivery */}
              <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-lg sm:shadow-xl hover:shadow-2xl transition-all duration-300 active:scale-[0.98] sm:hover:-translate-y-2 animate-fade-in-up text-center touch-manipulation" style={{ animationDelay: '0.3s' }}>
                <div className="relative h-32 sm:h-48 mb-4 sm:mb-6 flex items-center justify-center">
                  {/* Delivery Flow Illustration */}
                  <div className="flex items-center gap-2">
                    <div className="w-14 h-14 bg-cyan-100 rounded-full flex items-center justify-center">
                      <ShoppingCart className="w-7 h-7 text-cyan-600" />
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-0.5 bg-cyan-400"></div>
                      <div className="text-xs text-cyan-600 mt-1">→</div>
                    </div>
                    <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center relative">
                      <ShoppingCart className="w-7 h-7 text-green-600" />
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-3 h-3 text-white" />
                      </div>
                    </div>
                  </div>
                </div>
                <h3 className="text-base sm:text-xl font-bold text-cyan-600 mb-2 sm:mb-3">טכנולוגיה מתקדמת לעסק שלך</h3>
                <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                  עמוד עסק מושלם, סליקה מאובטחת, ניהול הזמנות חכם ודאשבורד מתקדם - כל מה שעסק מצליח צריך.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-12 sm:py-20 bg-white" aria-labelledby="how-it-works-heading">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8 sm:mb-16">
              <span className="inline-block px-3 sm:px-4 py-1 bg-green-100 text-green-700 rounded-full text-xs sm:text-sm font-semibold mb-3 sm:mb-4">
                💰 תוך 24 שעות לתוצאות
              </span>
              <h2 id="how-it-works-heading" className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
                הפוך את העסק ל"נכס דיגיטלי" תוך יום אחד
              </h2>
              <p className="text-slate-600 text-base max-w-2xl mx-auto">
                עד היום עיצוב תדמית עלה <span className="line-through">5,000 ₪</span> ולקח שבועות.<br/>
                <span className="font-bold text-green-600">אצלנו? 450 ₪ + AI עושה הכל תוך 24 שעות.</span>
              </p>
            </div>

            <div className="relative">
              {/* Connection line - Hidden on mobile */}
              <div className="hidden md:block absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full transform -translate-y-1/2" aria-hidden="true" />
              
              <div className="grid grid-cols-3 md:grid-cols-3 gap-3 sm:gap-8" role="list">
                {steps.map((step, i) => (
                  <div key={i} className="relative text-center" role="listitem">
                    <div className="relative z-10 w-14 h-14 sm:w-20 sm:h-20 mx-auto mb-3 sm:mb-6 rounded-full bg-white shadow-lg sm:shadow-xl flex items-center justify-center border-2 sm:border-4 border-purple-500">
                      <span className="text-xl sm:text-3xl font-black text-purple-600">{step.number}</span>
                    </div>
                    <h3 className="text-sm sm:text-xl font-bold text-slate-900 mb-1 sm:mb-3">{step.title}</h3>
                    <p className="text-slate-600 text-xs sm:text-base hidden sm:block">{step.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-center mt-8 sm:mt-12">
              <Link to={createPageUrl("ContactPage")}>
                <Button 
                  size="lg" 
                  className="rounded-full bg-gradient-to-r from-[#667eea] to-[#764ba2] hover:opacity-90 text-white font-bold px-8 sm:px-10 py-5 sm:py-6 text-base sm:text-lg shadow-xl active:scale-95 sm:hover:scale-105 transition-transform touch-manipulation min-h-[52px]"
                >
                  בואו נתחיל!
                  <Sparkles className="w-5 h-5 mr-2" aria-hidden="true" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-12 sm:py-20 bg-gradient-to-br from-[#667eea] to-[#764ba2]" aria-labelledby="testimonials-heading">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8 sm:mb-12">
              <span className="inline-block px-3 sm:px-4 py-1 bg-yellow-400 text-slate-900 rounded-full text-xs sm:text-sm font-semibold mb-3 sm:mb-4">
                ⚠️ לא רק הבטחות - תוצאות אמיתיות
              </span>
              <h2 id="testimonials-heading" className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2">
                בעלי עסקים שהפסיקו לאבד לקוחות
              </h2>
              <p className="text-white/80 text-sm sm:text-base font-bold">הם היו בדיוק במצב שלך. עכשיו הם מרוויחים כפול.</p>
            </div>

            <div className="relative" role="region" aria-label="סיפורי הצלחה">
              {testimonials.map((t, i) => (
                <div
                  key={i}
                  className={`transition-all duration-500 ${activeTestimonial === i ? 'opacity-100 scale-100' : 'opacity-0 absolute inset-0 scale-95 pointer-events-none'}`}
                  aria-hidden={activeTestimonial !== i}
                >
                  <Card className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-8 md:p-10 shadow-2xl overflow-hidden mx-2 sm:mx-0">
                    <CardContent className="p-0">
                      <div className="flex flex-col md:flex-row items-center gap-4 sm:gap-6">
                        {/* Business Image */}
                        <div className="w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 rounded-xl sm:rounded-2xl overflow-hidden shadow-lg flex-shrink-0">
                          <img src={t.image} alt={t.business} className="w-full h-full object-cover" />
                        </div>
                        
                        <div className="text-center md:text-right flex-1">
                          <div className="flex justify-center md:justify-start mb-2 sm:mb-3" role="img" aria-label={`דירוג ${t.rating} מתוך 5 כוכבים`}>
                            {[...Array(t.rating)].map((_, j) => (
                              <Star key={j} className="w-4 h-4 sm:w-5 sm:h-5 fill-yellow-400 text-yellow-400" aria-hidden="true" />
                            ))}
                          </div>
                          <blockquote>
                            <p className="text-sm sm:text-lg md:text-xl text-slate-700 mb-3 sm:mb-4 leading-relaxed">"{t.text}"</p>
                            <footer>
                              <cite className="not-italic">
                                <div className="font-bold text-slate-900 text-base sm:text-lg">{t.name}</div>
                                <div className="text-slate-500 text-sm sm:text-base">{t.business}</div>
                              </cite>
                            </footer>
                          </blockquote>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
              
              {/* Dots - Larger touch targets on mobile */}
              <div className="flex justify-center gap-3 sm:gap-2 mt-6 sm:mt-8" role="tablist" aria-label="בחר סיפור">
                {testimonials.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveTestimonial(i)}
                    className={`h-3 rounded-full transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-white touch-manipulation min-w-[44px] sm:min-w-0 ${activeTestimonial === i ? 'bg-white w-10 sm:w-8' : 'bg-white/40 w-10 sm:w-3 hover:bg-white/60'}`}
                    aria-label={`סיפור ${i + 1}`}
                    aria-selected={activeTestimonial === i}
                    role="tab"
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-12 sm:py-20 bg-white" aria-labelledby="faq-heading">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8 sm:mb-12">
              <span className="inline-block px-3 sm:px-4 py-1 bg-orange-100 text-orange-700 rounded-full text-xs sm:text-sm font-semibold mb-3 sm:mb-4">
                💭 אתה לא לבד בספקות
              </span>
              <h2 id="faq-heading" className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                השאלות שעוצרות אותך מלהצליח
              </h2>
              <p className="text-slate-600 text-sm sm:text-base">בואו נשבור את החששות ונתחיל להרוויח</p>
            </div>

            <Card className="bg-slate-50 border-0 shadow-lg">
              <CardContent className="p-1 sm:p-2" role="list">
                {faqs.map((faq, i) => (
                  <FAQItem
                    key={i}
                    question={faq.question}
                    answer={faq.answer}
                    isOpen={openFaq === i}
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  />
                ))}
              </CardContent>
            </Card>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-12 sm:py-20 bg-slate-900 pb-28 sm:pb-20" aria-labelledby="cta-heading">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-block px-4 py-2 bg-red-600 text-white rounded-full text-sm font-bold mb-4 animate-pulse">
              ⚠️ מבצע מייסדים - רק ל-100 העסקים הראשונים
            </div>
            <h2 id="cta-heading" className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 sm:mb-6">
              תפסיק להסתכל איך המתחרים מצליחים.<br/>
              <span className="text-yellow-300">זה התור שלך.</span>
            </h2>
            <p className="text-white text-sm sm:text-lg mb-6 sm:mb-10 max-w-2xl mx-auto px-4 font-bold">
              עיצוב AI ששווה 5,000 ₪ - <span className="text-yellow-300 text-xl">רק 450 ₪</span>
              <br className="hidden sm:block" />
              <span className="hidden sm:inline text-slate-300">+ חיבור לגוגל + סליקה + דאשבורד + תמיכה מלאה</span>
              <br/>
              <span className="text-red-400 text-base">המחיר עולה ל-890 ₪ ברגע שנגמרים המקומות</span>
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center px-4">
              <Link to={createPageUrl("ContactPage")} className="w-full sm:w-auto">
                <Button 
                  size="lg" 
                  className="w-full sm:w-auto rounded-full bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 hover:opacity-90 text-white font-black px-8 sm:px-10 py-6 sm:py-8 text-lg sm:text-2xl shadow-2xl active:scale-95 sm:hover:scale-110 transition-all duration-300 touch-manipulation min-h-[52px] animate-pulse"
                >
                  כן! תעצבו לי את העסק תוך 24 שעות
                  <Zap className="w-6 h-6 sm:w-7 sm:h-7 mr-2" aria-hidden="true" />
                </Button>
              </Link>
              <div className="text-white text-sm sm:text-base">
                <div className="font-bold mb-1">💯 אחריות מלאה:</div>
                <div className="text-slate-300">לא מרוצה? נחזיר כסף. בלי שאלות.</div>
              </div>
            </div>

            <div className="mt-8 text-white/70 text-xs sm:text-sm max-w-xl mx-auto">
              <strong className="text-white">הסיכון האמיתי?</strong> להישאר עם עמוד גנרי בזמן שהמתחרים גונבים את הלקוחות שלך.
              <br/>
              <span className="text-yellow-300">450 ₪ עכשיו חוסכים לך אלפים בעתיד.</span>
            </div>
          </div>
        </section>
      </main>
      

    </div>
  );
}
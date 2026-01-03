import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import {
  ChevronLeft, ChevronDown, Store, TrendingUp, Users,
  Zap, DollarSign, CheckCircle, Star, ArrowLeft,
  Smartphone, BarChart3, HeadphonesIcon, Truck, Sparkles, Play, MessageCircle, ShoppingCart, AlertTriangle
} from "lucide-react";
import ImageComparison from "@/components/ImageComparison";

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
    title: "עיצוב מקצועי בזמן קצר",
    description: "אנחנו מעצבים לך עמוד יוקרתי ומותאם אישית. בימים ספורים - עמוד שנראה כמו של חברה ענקית, במקום שבועות המתנה.",
    color: "from-purple-500 to-indigo-600"
  },
  {
    icon: TrendingUp,
    title: "דאשבורד נתונים מתקדם",
    description: ". אתה רואה דאטה אמיתית - כמה אנשים מחפשים אותך, מי קולק, מי מתעניין. לא הבטחות באוויר.",
    color: "from-green-500 to-emerald-600"
  },
  {
    icon: MessageCircle,
    title: "יש לך שירות משלוחים? הזמנות יזרמו לך לווטסאפ!",
    description: "לקוח רוצה להזמין? כמה קליקים וההזמנה אצלך בוואטסאפ. בלי מסך ביניים, בלי אפליקציות - ישר לעניין.",
    color: "from-green-400 to-teal-600"
  },
  {
    icon: Smartphone,
    title: "דאשבורד ניהול מתקדם",
    description: "כמה הזמנות היום? מי ביקר בעמוד? איזה מוצר הכי פופולרי? כל הנתונים החיוניים במקום אחד, עדכון בזמן אמת.",
    color: "from-orange-500 to-red-600"
  },
  {
    icon: Store,
    title: "נראות דיגיטלית מושלמת? זה קטן עלינו (ועליכם)",
    description: "חבל על הזמן והאנרגיה שלכם. במשלנו אנחנו עושים את העבודה הקשה בשבילכם עם כלי AI חכמים וגרפיקה נקייה. מקבלים תוצאה ברמה הכי גבוהה בלי כאב ראש מיותר. בואו תראו איך העסק שלכם הופך למותג בקליק אחד.",
    color: "from-pink-500 to-rose-600"
  },
  {
    icon: BarChart3,
    title: "גוגל פשוט יעוף עליכם!",
    description: "העמוד שלך מותאם באופן מושלם למנועי חיפוש. כשמחפשים את הקטגוריה שלך - אתה מופיע בראש התוצאות. זה מה שמביא לקוחות.",
    color: "from-blue-500 to-cyan-600"
  }
];

const steps = [
  {
    number: "1",
    title: "תן לנו 5 דקות",
    description: "שם העסק + מספר טלפון. זהו. אנחנו כבר מתחילים לעבוד עבורך.",
    icon: Sparkles
  },
  {
    number: "2",
    title: "אנחנו מעצבים לך עמוד מקצועי",
    description: "בימים ספורים - אתה מקבל עמוד שנראה כמו של חברה ענקית. תהליך של ימים במקום שבועות של המתנה.",
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
    text: "חשבתי שהמאפייה הקטנה שלי לא צריכה 'עמוד מפואר'. טעיתי. העמוד המקצועי שיצר לי אמון ומהימנות, והלקוחות התחילו להגיע גם מחוץ לשכונה. צר לי שלא עשיתי את זה קודם.",
    rating: 5,
    image: BUSINESS_IMAGES.bakery
  },
  {
    name: "משה לוי",
    business: "גריל הבשרים",
    text: "הייתי בטוח שאנשים יודעים עלי. אבל בגוגל הייתי שקוף לגמרי. עכשיו כשמישהו מחפש 'גריל כשר' - אני שם. הנוכחות הדיגיטלית שינתה לי את העסק לגמרי.",
    rating: 5,
    image: BUSINESS_IMAGES.meat
  },
  {
    name: "אברהם גולד",
    business: "סושי כשר",
    text: "שילמתי פעם אלפי שקלים למעצב שלקח שבועות. הפעם העבודה נעשתה תוך ימים, מקצועית ובמחיר הוגן. העמוד נראה מדהים והחיבור לגוגל עובד מצוין. החלטה מצוינת.",
    rating: 5,
    image: BUSINESS_IMAGES.restaurant
  }
];

const faqs = [
  {
    question: "כמה עולה שירות העיצוב והפלטפורמה?",
    answer: "יש לנו 3 מסלולים: חשיפה (300₪ הקמה + 199₪/חודש), תנופה (500₪ הקמה + 349₪/חודש) - הכי פופולרי, ומהדרין (800₪ הקמה + 699₪/חודש) לשותפות עסקית מלאה. כל מסלול כולל עמוד מעוצב + חיבור לגוגל + דאשבורד מתקדם."
  },
  {
    question: "אני לא טכנולוג, זה יהיה מסובך בשבילי?",
    answer: "אם אתה יודע לשלוח הודעת וואטסאפ, אתה יודע לעבוד עם המערכת שלנו. זה בנוי כך שגם מי שלא מבין בטכנולוגיה יצליח. ואם תתקע - אנחנו תמיד נהיה כאן איתך."
  },
  {
    question: "מה אם הלקוחות שלי לא משתמשים באינטרנט?",
    answer: "טעות. הם כן משתמשים. הם פשוט לא מוצאים אותך. 87% מהאנשים מחפשים בגוגל לפני שהם קונים משהו. אם אתה לא שם, הם קונים מהמתחרה. זה פשוט."
  },
  {
    question: "למה אני צריך 'עמוד מעוצב'? יש לי אתר פשוט.",
    answer: "אתר פשוט זה טוב. אבל אם הוא לא מעוצב ולא מופיע בגוגל - אף אחד לא רואה אותו. עמוד מקצועי עם  אופטימיזציה לגוגל? זה מה שגורם ללקוחות למצוא אותך ולבחור בך על פני המתחרים."
  },
  {
    question: "כמה זמן לוקח לראות תוצאות?",
    answer: "העמוד מוכן תוך ימים ספורים. הלקוחות הראשונים מתחילים להגיע תוך שבוע. אחרי חודש, אתה רואה את ההבדל בהכנסות. זה לא קסם, זה פשוט נוכחות נכונה בגוגל."
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
        @import url('https://fonts.googleapis.com/css2?family=Assistant:wght@300;400;600;700;800&display=swap');

        * {
          font-family: 'Assistant', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

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
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(5deg); }
        }

        @keyframes grid-flow {
          0% { transform: translateX(0) translateY(0); }
          100% { transform: translateX(50px) translateY(50px); }
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
      <section className="relative w-full overflow-hidden">
        <img 
          src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68815c70a48dd08622dbaf69/85db3e7c0_image1.jpg"
          alt="ראש שלכם בעסק, כל השאר עלינו - משלנו"
          className="w-full h-auto max-h-[50vh] sm:max-h-[60vh] lg:max-h-[70vh] object-cover"
        />

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
              <div className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 bg-gradient-to-r from-red-500/10 via-orange-500/10 to-red-500/10 border border-red-500/30 rounded-full text-xs sm:text-sm font-semibold mb-3 sm:mb-4 animate-fade-in-up backdrop-blur-sm">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-red-700">תפסיק להפסיד כסף</span>
                <AlertTriangle className="w-4 h-4 text-red-600" aria-hidden="true" />
              </div>
              <h2 id="benefits-heading" className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-3 sm:mb-4 animate-fade-in-up px-2" style={{ animationDelay: '0.1s' }}>
                המתחרה שלך <span className="relative inline-block">כבר פה
                  <svg className="absolute -bottom-2 left-0 w-full" height="8" viewBox="0 0 100 8" preserveAspectRatio="none">
                    <path d="M0,5 Q25,0 50,5 T100,5" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-500" />
                  </svg>
                </span>
                <br/>
                <span className="bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">למה אתה מחכה?</span>
              </h2>
              <p className="text-slate-600 text-sm sm:text-lg max-w-2xl mx-auto animate-fade-in-up px-4 font-bold" style={{ animationDelay: '0.2s' }}>
                כל יום בלי עמוד מקצועי = <span className="text-red-600">לקוחות שבוחרים במתחרה</span>
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6" role="list">
              {benefits.map((benefit, i) => (
                <Card 
                  key={i} 
                  className="group hover:shadow-2xl transition-all duration-500 active:scale-[0.98] sm:hover:-translate-y-3 border border-slate-200/50 bg-gradient-to-br from-white via-slate-50 to-white hover:border-indigo-200 animate-fade-in-up touch-manipulation overflow-hidden relative"
                  style={{ animationDelay: `${i * 0.1}s` }}
                  role="listitem"
                >
                  {/* Premium Glow Effect */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    <div className={`absolute inset-0 bg-gradient-to-br ${benefit.color} opacity-5 blur-xl`}></div>
                  </div>

                  <CardContent className="p-4 sm:p-6 relative z-10">
                    <div className="relative mb-3 sm:mb-5">
                      <div className={`absolute inset-0 bg-gradient-to-br ${benefit.color} rounded-xl sm:rounded-2xl blur-md opacity-30 group-hover:opacity-50 transition-opacity`}></div>
                      <div className={`relative w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br ${benefit.color} flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-500`}>
                        <benefit.icon className="w-5 h-5 sm:w-7 sm:h-7 text-white" aria-hidden="true" />
                      </div>
                    </div>
                    <h3 className="text-sm sm:text-xl font-bold text-slate-900 mb-1 sm:mb-2 group-hover:text-indigo-700 transition-colors">{benefit.title}</h3>
                    <p className="text-slate-600 text-xs sm:text-base leading-relaxed hidden sm:block">{benefit.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>



        {/* Before/After Comparison Section */}
        <section className="py-12 sm:py-20 bg-gradient-to-b from-white to-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <span className="inline-block px-4 py-2 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 rounded-full text-sm font-semibold mb-4 border border-blue-200">
                  🔄 ההבדל בין רגיל למקצועי
                </span>
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 mb-4">
                  מה ההבדל בין עמוד רגיל לעמוד מקצועי?
                </h2>
                <p className="text-slate-600 text-lg max-w-2xl mx-auto">
                  גרור את המחוון כדי לראות את השינוי המדהים
                </p>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <ImageComparison
                beforeImage="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68815c70a48dd08622dbaf69/c21619598_image.png"
                afterImage="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68815c70a48dd08622dbaf69/1d773a7c9_image.png"
                beforeLabel="עמוד רגיל"
                afterLabel="עמוד מקצועי"
              />
            </motion.div>

            <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">



            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="py-12 sm:py-20 bg-gradient-to-b from-slate-50 to-white" aria-labelledby="pricing-heading">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <span className="inline-block px-4 py-2 bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-800 rounded-full text-sm font-semibold mb-4 border border-indigo-200">
                  💎 בחר את המסלול המתאים לך
                </span>
                <h2 id="pricing-heading" className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 mb-4">
                  מסלולים שמתאימים לכל עסק
                </h2>
                <p className="text-slate-600 text-lg max-w-2xl mx-auto">
                  מנוכחות דיגיטלית בסיסית ועד שותפות עסקית מלאה
                </p>
              </motion.div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
              {/* Standard Plan */}
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
                whileHover={{ y: -8, transition: { duration: 0.3 } }}
                className="relative"
              >
                <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-slate-200 h-full flex flex-col">
                  <div className="mb-6">
                    <h3 className="text-2xl font-bold text-slate-900 mb-2">חשיפה</h3>
                    <p className="text-slate-600 text-sm">נוכחות דיגיטלית בסיסית</p>
                  </div>

                  <div className="mb-6">
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold text-slate-900">₪199</span>
                      <span className="text-slate-600 text-lg">/חודש</span>
                    </div>
                    <div className="mt-2 text-slate-500 text-sm">
                      דמי הקמה: <span className="font-semibold text-slate-700">₪300</span>
                    </div>
                  </div>

                  <div className="flex-1 space-y-4 mb-8">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-700">פרופיל עסק בסיסי</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-700">עיצוב תמונת רקע + לוגו</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-700">דאשבורד ניהול מתקדם</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-700">תמיכה בסיסית</span>
                    </div>
                  </div>

                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Link to={createPageUrl("ContactPage")} className="block">
                      <Button className="w-full bg-slate-900 hover:bg-slate-800 text-white py-6 rounded-xl font-semibold">
                        התחל עכשיו
                      </Button>
                    </Link>
                  </motion.div>
                </div>
              </motion.div>

              {/* Growth Plan - MOST POPULAR */}
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
                whileHover={{ y: -12, transition: { duration: 0.3 } }}
                className="relative md:-mt-4"
              >
                {/* Popular Badge */}
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                  <motion.div
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.4, type: "spring" }}
                    className="bg-gradient-to-r from-amber-400 to-orange-500 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg"
                  >
                    ⭐ הכי פופולרי
                  </motion.div>
                </div>

                <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-8 shadow-2xl h-full flex flex-col relative overflow-hidden">
                  {/* Animated Background Effect */}
                  <motion.div
                    className="absolute inset-0 opacity-20"
                    animate={{
                      backgroundPosition: ['0% 0%', '100% 100%'],
                    }}
                    transition={{
                      duration: 10,
                      repeat: Infinity,
                      repeatType: "reverse"
                    }}
                    style={{
                      backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.2) 0%, transparent 50%)',
                      backgroundSize: '200% 200%'
                    }}
                  />

                  <div className="relative z-10">
                    <div className="mb-6">
                      <h3 className="text-2xl font-bold text-white mb-2">תנופה</h3>
                      <p className="text-indigo-100 text-sm">הכי נמכר - צמיחה מהירה</p>
                    </div>

                    <div className="mb-6">
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-bold text-white">₪350</span>
                        <span className="text-indigo-100 text-lg">/חודש</span>
                      </div>
                      <div className="mt-2 text-indigo-200 text-sm">
                        דמי הקמה: <span className="font-semibold text-white">₪500</span>
                      </div>
                    </div>

                    <div className="flex-1 space-y-4 mb-8">
                      <div className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-amber-300 flex-shrink-0 mt-0.5" />
                        <span className="text-white font-medium">3עיצוב מותאם בדיוק לעסק שלכם</span>
                      </div>
                      <div className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-amber-300 flex-shrink-0 mt-0.5" />
                        <span className="text-white font-medium">קידום באתר!</span>
                      </div>
                      <div className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-amber-300 flex-shrink-0 mt-0.5" />
                        <span className="text-white font-medium">תפריט + זרימת הזמנות בווטסאפ / אפליקציה</span>
                      </div>
                      <div className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-amber-300 flex-shrink-0 mt-0.5" />
                        <span className="text-white font-medium">תמיכה מועדפת</span>
                      </div>
                    </div>

                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Link to={createPageUrl("ContactPage")} className="block">
                        <Button className="w-full bg-white hover:bg-amber-50 text-indigo-700 py-6 rounded-xl font-semibold shadow-lg">
                          בחר תנופה
                        </Button>
                      </Link>
                    </motion.div>
                  </div>
                </div>
              </motion.div>

              {/* VIP Plan */}
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.3 }}
                whileHover={{ y: -8, transition: { duration: 0.3 } }}
                className="relative"
              >
                <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-amber-400 h-full flex flex-col">
                  <div className="mb-6">
                    <h3 className="text-2xl font-bold text-slate-900 mb-2 flex items-center gap-2">
                      מהדרין
                      <span className="text-amber-500">👑</span>
                    </h3>
                    <p className="text-slate-600 text-sm">שותפות עסקית מלאה</p>
                  </div>

                  <div className="mb-6">
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold text-slate-900">₪699</span>
                      <span className="text-slate-600 text-lg">/חודש</span>
                    </div>
                    <div className="mt-2 text-slate-500 text-sm">
                      דמי הקמה: <span className="font-semibold text-slate-700">₪800</span>
                    </div>
                  </div>

                  <div className="flex-1 space-y-4 mb-8">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-700 font-medium">כל היתרונות של תנופה</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-700 font-medium">עדכוני AI חודשיים</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-700 font-medium">ניהול תקציב פרסום</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-700 font-medium">ייעוץ אסטרטגי חודשי</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-700 font-medium">תמיכה VIP 24/6</span>
                    </div>
                  </div>

                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Link to={createPageUrl("ContactPage")} className="block">
                      <Button className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white py-6 rounded-xl font-semibold shadow-lg">
                        דברו איתנו
                      </Button>
                    </Link>
                  </motion.div>
                </div>
              </motion.div>
            </div>


          </div>
        </section>

        {/* How It Works */}
        <section className="py-12 sm:py-20 bg-white" aria-labelledby="how-it-works-heading">

        </section>

        {/* Testimonials */}


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

            <h2 id="cta-heading" className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 sm:mb-6">
              תפסיק להסתכל איך המתחרים מצליחים.<br/>
              <span className="text-yellow-300">זה התור שלך.</span>
            </h2>
            
            
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center px-4">
              <Link to={createPageUrl("ContactPage")} className="w-full sm:w-auto">
                <Button 
                  size="lg" 
                  className="w-full sm:w-auto rounded-full bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 hover:opacity-90 text-white font-black px-8 sm:px-10 py-6 sm:py-8 text-lg sm:text-2xl shadow-2xl active:scale-95 sm:hover:scale-110 transition-all duration-300 touch-manipulation min-h-[52px] animate-pulse"
                >
                  כן! תעצבו לי את העסק 
                  <Zap className="w-6 h-6 sm:w-7 sm:h-7 mr-2" aria-hidden="true" />
                </Button>
              </Link>
              <div className="text-white text-sm sm:text-base">


              </div>
            </div>

            <div className="mt-8 text-slate-300 text-xs sm:text-sm max-w-xl mx-auto">
              <strong className="text-white">הסיכון האמיתי?</strong> להישאר עם עמוד גנרי בזמן שהמתחרים גונבים את הלקוחות שלך.
              <br/>
              <span className="text-cyan-400 font-bold">תהליך בימים ספורים. השקעה חכמה היום = לקוחות חדשים מחר.</span>
            </div>
          </div>
        </section>
      </main>
      

    </div>
  );
}
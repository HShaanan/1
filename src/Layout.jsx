import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import AccessibilityWidget from "@/components/AccessibilityWidget";
import SupportWidget from "@/components/SupportWidget";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { createPageUrl } from "@/utils";
import { HelmetProvider } from "react-helmet-async";
import {
  Menu, X, Store, Plus, Search, User as UserIcon, Heart,
  Tag, UserCircle, LogOut, Shield,
  AlertTriangle, Users, FileText, Settings, Sparkles, Zap, Mail, Wand2, Layers,
  MessageSquare, Activity, Key, ImageIcon, Megaphone, FileText as ReviewsIcon,
  Bug, Bot, ListChecks, Clock, Truck
  } from "lucide-react";

import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";


function AnimatedCounter({ value, className = "" }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTime = null;
    const startValue = 0;
    const endValue = value;
    const duration = 2000;

    const updateCounter = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);

      const currentValue = Math.floor(startValue + (endValue - startValue) * progress);
      setDisplayValue(currentValue);

      if (progress < 1) {
        requestAnimationFrame(updateCounter);
      }
    };

    requestAnimationFrame(updateCounter);
  }, [value]);

  return <span className={className}>{displayValue.toLocaleString()}</span>;
}

export default function Layout({ children, currentPageName }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [categories, setCategories] = useState([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [pendingBusinessPages, setPendingBusinessPages] = useState(0);
  const [newReportsCount, setNewReportsCount] = useState(0);
  const [onlineUsers, setOnlineUsers] = useState(0);
  const statsFetchInProgress = useRef(false);

  const isWizardPage = currentPageName === "Add" || currentPageName === "AddWizard";

  const isAdmin = user && user.role === 'admin';

  const loadAdminStats = useCallback(async () => {
    if (statsFetchInProgress.current) return;
    statsFetchInProgress.current = true;

    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Admin stats request timed out after 10 seconds')), 10000)
      );

      // Using base44.functions.invoke instead of direct import
      const statsPromise = base44.functions.invoke('getAdminStats', {});

      const result = await Promise.race([statsPromise, timeoutPromise]);
      const data = result?.data;

      if (!data?.success) {
        console.warn("Admin stats returned success: false", data);
        setPendingBusinessPages(0);
        setNewReportsCount(0);
        setOnlineUsers(1);
        return;
      }

      const stats = data.data;
      setPendingBusinessPages(stats.pendingBusinessPagesCount || 0);
      setNewReportsCount(stats.newReportsCount || 0);
      setOnlineUsers(stats.onlineUsersCount || 1);

    } catch (error) {
      console.warn("Failed to load admin stats (non-critical):", error.message || error);
      setPendingBusinessPages(0);
      setNewReportsCount(0);
      setOnlineUsers(1);
    } finally {
      statsFetchInProgress.current = false;
    }
  }, []);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);

        if (currentUser?.role === 'admin') {
          await loadAdminStats();
        }
      } catch (error) {
        console.log("User not logged in");
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    const loadCategories = async () => {
      try {
        const categoryList = await base44.entities.Category.list();
        setCategories(categoryList);
      } catch (error) {
        console.error("Error loading categories:", error);
      }
    };

    loadUser();
    loadCategories();
  }, [currentPageName, loadAdminStats]);

  useEffect(() => {
    if (isWizardPage) {
      setOpenDropdown(null);
    }
  }, [isWizardPage]);

  useEffect(() => {
    if (!isAdmin) return;

    loadAdminStats();
    const intervalId = setInterval(loadAdminStats, 300000);
    return () => clearInterval(intervalId);
  }, [isAdmin, loadAdminStats]);

  const handleLogout = async () => {
    try {
      await base44.auth.logout();
      window.location.href = createPageUrl("LandingPage");
      setUser(null);
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const clearAppCache = () => {
    try {
      localStorage.removeItem('meshlanoo_user_session');
      Object.keys(localStorage).forEach((k) => {
        if (k.toLowerCase().includes('cache') || k.startsWith('meshlanoo_')) {
          try { localStorage.removeItem(k); } catch (e) {}
        }
      });
      sessionStorage.clear();
      window.location.reload();
    } catch (e) {
      console.error('Cache clear failed', e);
    }
  };

  const handleDropdownOpen = (dropdownName) => {
    setOpenDropdown(openDropdown === dropdownName ? null : dropdownName);
  };

  const handleDropdownClose = () => {
    setOpenDropdown(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <HelmetProvider>
      <div
        dir="rtl"
        lang="he"
        className="min-h-screen font-sans text-text-primary"
        style={{ fontFamily: '"Ronda", "Heebo", "Noto Sans Hebrew", system-ui, -apple-system, "Rubik", Arial, Helvetica, sans-serif' }}
      >
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        href="https://fonts.googleapis.com/css2?family=Ronda:wght@300;400;500;600;700;800&display=swap&subset=hebrew"
        rel="stylesheet"
      />

      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50" />
        <div className="absolute -top-24 -right-20 w-[36rem] h-[36rem] bg-indigo-300/10 blur-3xl rounded-full" />
        <div className="absolute top-1/3 -left-24 w-[32rem] h-[32rem] bg-purple-300/10 blur-3xl rounded-full" />
        <div className="absolute bottom-[-10rem] right-1/4 w-[28rem] h-[28rem] bg-blue-300/10 blur-3xl rounded-full" />
      </div>

      <style>{`
        html, body {
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          text-rendering: optimizeLegibility;
          -webkit-text-size-adjust: 100%;
          background: transparent;
          font-family: "Ronda", "Heebo", "Noto Sans Hebrew", system-ui, -apple-system, "Rubik", Arial, Helvetica, sans-serif;
          font-synthesis: none;
          font-kerning: normal;
          font-variant-ligatures: none;
          letter-spacing: normal;
        }

        @keyframes fadeInSlow { from { opacity: 0 } to { opacity: 1 } }
        .animate-fadeInSlow { animation: fadeInSlow 0.8s ease forwards; }

        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-slide-in { animation: fadeSlideIn .4s ease-out forwards; opacity: 0; }

        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(-20px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .slide-in-right { animation: slideInRight .4s ease-out forwards; opacity: 0; }

        .animation-delay-75 { animation-delay: 75ms; }
        .animation-delay-100 { animation-delay: 100ms; }
        .animation-delay-150 { animation-delay: 150ms; }
        .animation-delay-200 { animation-delay: 200ms; }
        .animation-delay-225 { animation-delay: 225ms; }
        .animation-delay-300 { animation-delay: 300ms; }
        .animation-delay-400 { animation-delay: 400ms; }
        .animation-delay-500 { animation-delay: 500ms; }
        .animation-delay-600 { animation-delay: 600ms; }

        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .button-hover { transition: all 0.15s ease; }
        .button-hover:hover { transform: translateY(-1px); }
        .focus-ring:focus { outline: 2px solid #3b82f6; outline-offset: 2px; }
        .category-item { position: relative; }

        .heart-pulse { animation: heartPulse 2s infinite; }
        @keyframes heartPulse { 0%{transform:scale(1)}50%{transform:scale(1.05)}100%{transform:scale(1)} }

        .ai-sparkle { animation: aiSparkle 2s infinite; }
        @keyframes aiSparkle {
          0%,100% { transform: rotate(0deg) scale(1); opacity: 1; }
          25% { transform: rotate(45deg) scale(1.05); opacity: 0.9; }
          50% { transform: rotate(90deg) scale(1); opacity: 1; }
          75% { transform: rotate(135deg) scale(1.05); opacity: 0.9; }
        }

        *:focus-visible {
          outline: 3px solid #3b82f6;
          outline-offset: 2px;
          border-radius: 4px;
        }

        .skip-to-content {
          position: absolute;
          top: -100px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 9999;
          padding: 12px 24px;
          background: #1e40af;
          color: white;
          text-decoration: none;
          border-radius: 8px;
          font-weight: bold;
          transition: top 0.3s;
        }
        .skip-to-content:focus {
          top: 20px;
        }

        .text-gray-500 { color: #6b7280; }
        .text-gray-600 { color: #4b5563; }
        
        html {
          font-size: 16px;
        }
        @media (min-width: 768px) {
          html { font-size: clamp(14px, 1vw, 18px); }
        }
      `}</style>

      <div className="relative z-10 min-h-screen flex flex-col">
        <a 
          href="#main-content" 
          className="skip-to-content"
          tabIndex={0}
        >
          דלג לתוכן הראשי
        </a>

        <header 
          className="bg-white border-b px-3 lg:px-6 py-3 sticky top-0 z-40 h-24 lg:h-28 flex items-center shadow-sm" 
          role="banner"
          aria-label="ניווט ראשי"
        >
          <div className="relative flex items-center justify-between w-full max-w-7xl mx-auto">
            <div className="flex items-center gap-2 lg:gap-4">
              {user ? (
                <div
                  className="relative z-[100]"
                  onMouseEnter={() => handleDropdownOpen('user-profile')}
                  onMouseLeave={handleDropdownClose}
                >
                  <button
                    className="w-10 h-10 lg:w-10 lg:h-10 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105 focus:outline-none"
                    aria-expanded={openDropdown === 'user-profile'}
                    aria-label={`תפריט משתמש - ${user.full_name || 'משתמש'}`}
                    onClick={() => handleDropdownOpen('user-profile')}
                  >
                    <span className="text-white font-bold text-sm lg:text-sm" aria-hidden="true">
                      {user.full_name ? user.full_name.charAt(0) : 'מ'}
                    </span>
                  </button>

                  {openDropdown === 'user-profile' && (
                    <div 
                      className="absolute top-full right-0 lg:left-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 min-w-48 opacity-100 visible z-50 fade-slide-in"
                      role="menu"
                      aria-label="תפריט משתמש"
                    >
                      <div className="p-2">
                        <button
                          className="flex items-center gap-3 w-full p-2 hover:bg-gray-50 rounded-md text-slate-700 text-sm transition-colors"
                          onClick={() => {
                            window.location.href = createPageUrl('UserProfile');
                            handleDropdownClose();
                          }}
                          role="menuitem"
                        >
                          <UserCircle className="w-4 h-4 ml-2 text-blue-600" aria-hidden="true" />
                          <span>איזור אישי</span>
                        </button>

                        <button
                          className="flex items-center gap-3 w-full p-2 hover:bg-gray-50 rounded-md text-slate-700 text-sm transition-colors"
                          onClick={() => {
                            handleDropdownClose();
                            clearAppCache();
                          }}
                          role="menuitem"
                        >
                          <Zap className="w-4 h-4 ml-2 text-indigo-600" aria-hidden="true" />
                          <span>נקה מטמון</span>
                        </button>

                        <div className="border-t border-gray-100 my-1"></div>

                        <button
                          className="flex items-center gap-3 w-full p-2 hover:bg-gray-50 rounded-md text-slate-700 text-sm transition-colors"
                          onClick={() => {
                            handleLogout();
                            handleDropdownClose();
                          }}
                          role="menuitem"
                        >
                          <LogOut className="w-4 h-4 ml-2 text-red-600" aria-hidden="true" />
                          <span>התנתק</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={async () => {
                    try {
                      await base44.auth.redirectToLogin(window.location.href);
                    } catch (error) {
                      console.error("Login failed:", error);
                    }
                  }}
                  className="lg:block hidden"
                  aria-label="התחבר למערכת"
                >
                  <Button variant="outline" className="button-hover rounded-xl shadow-sm text-xs lg:text-sm px-2 lg:px-4 py-1 lg:py-2">
                    <UserIcon className="w-3 h-3 lg:w-4 lg:h-4 ml-1 lg:ml-2" aria-hidden="true" />
                    <span className="hidden sm:inline">התחברות</span>
                    <span className="sm:hidden">כניסה</span>
                  </Button>
                </button>
              )}

              <nav className="hidden lg:flex items-center gap-1" aria-label="ניווט ראשי">
                <Link to={createPageUrl("Browse")} aria-label="עמוד משלנו ביזנעס">
                  <Button
                    variant="ghost"
                    className={`button-hover rounded-xl text-sm px-3 py-2 focus-ring ${
                      currentPageName === "Browse" ? "bg-blue-100 text-blue-700" : "text-slate-600 hover:text-slate-900 hover:bg-gray-100"
                    }`}
                    aria-current={currentPageName === "Browse" ? "page" : undefined}
                  >
                    <Store className="w-4 h-4 ml-2" aria-hidden="true" />
                    משלנו ביזנעס
                  </Button>
                </Link>

                <Link to={createPageUrl("Add")} aria-label="הצטרף למשלנו והוסף עסק">
                  <Button
                    variant="ghost"
                    className={`button-hover rounded-xl text-sm px-3 py-2 focus-ring relative overflow-hidden ${
                      currentPageName === "Add" ? "bg-blue-100 text-blue-700" : "text-slate-600 hover:text-slate-900 hover:bg-gray-100"
                    }`}
                    aria-current={currentPageName === "Add" ? "page" : undefined}
                  >
                    <div className="relative flex items-center">
                      <Sparkles className="w-4 h-4 ml-2 ai-sparkle" aria-hidden="true" />
                      <span>הצטרפו למשלנו</span>
                      <Zap className="w-3 h-3 mr-1 text-yellow-500 opacity-75" aria-hidden="true" />
                    </div>
                  </Button>
                </Link>

                <Link to={createPageUrl("Search")} aria-label="בצע חיפוש מתקדם לעסקים">
                  <Button
                    variant="ghost"
                    className={`button-hover rounded-xl text-sm px-3 py-2 focus-ring ${
                      currentPageName === "Search" ? "bg-blue-100 text-blue-700" : "text-slate-600 hover:text-slate-900 hover:bg-gray-100"
                    }`}
                    aria-current={currentPageName === "Search" ? "page" : undefined}
                  >
                    <Search className="w-4 h-4 ml-2" aria-hidden="true" />
                    חיפוש מתקדם
                  </Button>
                </Link>

                {user && (user.user_type === 'business' || user.role === 'admin') && (
                  <Link to={createPageUrl("MyBusinessPages")} aria-label="צפה בעסקים שברשותי">
                    <Button
                      variant="ghost"
                      className={`button-hover rounded-xl text-sm px-3 py-2 focus-ring ${
                        currentPageName === "MyBusinessPages" ? "bg-blue-100 text-blue-700" : "text-slate-600 hover:text-slate-900 hover:bg-gray-100"
                      }`}
                      aria-current={currentPageName === "MyBusinessPages" ? "page" : undefined}
                    >
                      <ListChecks className="w-4 h-4 ml-2" aria-hidden="true" />
                      העסקים שלי
                    </Button>
                  </Link>
                )}

                {user && (
                  <Link to={createPageUrl("Favorites")} aria-label="צפה בעסקים מועדפים">
                    <Button
                      variant="ghost"
                      className={`button-hover rounded-xl text-sm px-3 py-2 focus-ring ${
                        currentPageName === "Favorites" ? "bg-blue-100 text-blue-700" : "text-slate-600 hover:text-slate-900 hover:bg-gray-100"
                      }`}
                      aria-current={currentPageName === "Favorites" ? "page" : undefined}
                    >
                      <Heart className="w-4 h-4 ml-2 heart-pulse text-red-500" aria-hidden="true" />
                      מועדפים
                    </Button>
                  </Link>
                )}

                {isAdmin && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="button-hover rounded-xl text-sm px-3 py-2 focus-ring text-slate-600 hover:text-slate-900 hover:bg-gray-100"
                        aria-label="כלי ניהול מערכת"
                      >
                        <Shield className="w-4 h-4 ml-2 text-purple-600" aria-hidden="true" />
                        כלי ניהול
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56" role="menu">
                      <DropdownMenuItem asChild role="menuitem">
                        <Link to={createPageUrl('AdminBusinessPages')} className="flex items-center gap-2 cursor-pointer">
                          <FileText className="w-4 h-4 text-orange-600" aria-hidden="true" />
                          <span>ניהול עמודי עסק</span>
                          {pendingBusinessPages > 0 && (
                            <Badge variant="destructive" className="mr-auto">{pendingBusinessPages}</Badge>
                          )}
                        </Link>
                      </DropdownMenuItem>

                      <DropdownMenuItem asChild role="menuitem">
                        <Link to={createPageUrl('AdminUsers')} className="flex items-center gap-2 cursor-pointer">
                          <Users className="w-4 h-4 text-blue-600" aria-hidden="true" />
                          <span>ניהול משתמשים</span>
                        </Link>
                      </DropdownMenuItem>

                      <DropdownMenuItem asChild role="menuitem">
                        <Link to={createPageUrl('AdminReports')} className="flex items-center gap-2 cursor-pointer">
                          <AlertTriangle className="w-4 h-4 text-red-600" aria-hidden="true" />
                          <span>דיווחים</span>
                          {newReportsCount > 0 && (
                            <Badge variant="destructive" className="mr-auto">{newReportsCount}</Badge>
                          )}
                        </Link>
                      </DropdownMenuItem>

                      <DropdownMenuItem asChild role="menuitem">
                        <Link to={createPageUrl('AdminStats')} className="flex items-center gap-2 cursor-pointer">
                          <Settings className="w-4 h-4 text-green-600" aria-hidden="true" />
                          <span>סטטיסטיקות</span>
                        </Link>
                      </DropdownMenuItem>

                      <DropdownMenuItem asChild role="menuitem">
                        <Link to={createPageUrl('AdminKashrut')} className="flex items-center gap-2 cursor-pointer">
                          <Shield className="w-4 h-4 text-emerald-600" aria-hidden="true" />
                          <span>ניהול כשרות</span>
                        </Link>
                      </DropdownMenuItem>

                      <DropdownMenuItem asChild role="menuitem">
                        <Link to={createPageUrl('AdminBanners')} className="flex items-center gap-2 cursor-pointer">
                          <Megaphone className="w-4 h-4 text-fuchsia-600" aria-hidden="true" />
                          <span>ניהול באנרים</span>
                        </Link>
                      </DropdownMenuItem>

                      <DropdownMenuItem asChild role="menuitem">
                        <Link to={createPageUrl('AdminTimezone')} className="flex items-center gap-2 cursor-pointer">
                          <Clock className="w-4 h-4 text-blue-600" aria-hidden="true" />
                          <span>הגדרות זמן</span>
                        </Link>
                      </DropdownMenuItem>

                      <DropdownMenuItem asChild role="menuitem">
                        <Link to={createPageUrl('AdminDynamicPagesAnalytics')} className="flex items-center gap-2 cursor-pointer">
                          <Activity className="w-4 h-4 text-purple-600" aria-hidden="true" />
                          <span>דפים דינמיים</span>
                        </Link>
                      </DropdownMenuItem>

                      <DropdownMenuItem asChild role="menuitem">
                        <Link to={createPageUrl('DeliveryManagement')} className="flex items-center gap-2 cursor-pointer">
                          <Truck className="w-4 h-4 text-indigo-600" aria-hidden="true" />
                          <span>ניהול משלוחים</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild role="menuitem">
                        <Link to={createPageUrl('CourierFleetManagement')} className="flex items-center gap-2 cursor-pointer">
                          <Users className="w-4 h-4 text-cyan-600" aria-hidden="true" />
                          <span>ניהול צי שליחים</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild role="menuitem">
                        <Link to={createPageUrl('AdminPaymentDebug')} className="flex items-center gap-2 cursor-pointer">
                          <Key className="w-4 h-4 text-red-600" aria-hidden="true" />
                          <span>אבחון תשלומים</span>
                        </Link>
                      </DropdownMenuItem>

                      <DropdownMenuItem asChild role="menuitem">
                        <Link to={createPageUrl('AdminBulkImprove')} className="flex items-center gap-2 cursor-pointer">
                          <Wand2 className="w-4 h-4 text-purple-600" aria-hidden="true" />
                          <span>שיפור אוטומטי</span>
                        </Link>
                      </DropdownMenuItem>

                      <DropdownMenuItem asChild role="menuitem">
                        <Link to={createPageUrl('AdminAddDefaultLogo')} className="flex items-center gap-2 cursor-pointer">
                          <ImageIcon className="w-4 h-4 text-blue-600" aria-hidden="true" />
                          <span>הוסף לוגו ברירת מחדל</span>
                        </Link>
                      </DropdownMenuItem>

                      <DropdownMenuItem asChild role="menuitem">
                        <Link to={createPageUrl('AdminDeleteRecent')} className="flex items-center gap-2 cursor-pointer">
                          <AlertTriangle className="w-4 h-4 text-red-600" aria-hidden="true" />
                          <span>מחק עסקים חדשים</span>
                        </Link>
                      </DropdownMenuItem>

                      <div className="border-t border-gray-100 my-1"></div>

                      <DropdownMenuItem asChild role="menuitem">
                        <Link to={createPageUrl('AdminSettings')} className="flex items-center gap-2 cursor-pointer bg-slate-50">
                          <Settings className="w-4 h-4 text-slate-700" aria-hidden="true" />
                          <span className="font-bold text-slate-700">הגדרות מערכת</span>
                        </Link>
                      </DropdownMenuItem>
                      </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </nav>
            </div>

            <Link to={createPageUrl("Browse")} className="flex-shrink-0" aria-label="חזרה לדף הבית - משלנו">
              <img
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/613960439_ChatGPT_Image_Jul_29__2025__02_28_50_AM-removebg-preview.png"
                alt="לוגו משלנו - חזרה לדף הבית"
                className="h-36 lg:h-42 w-auto object-contain hover:scale-105 transition-transform duration-200"
              />
            </Link>

            <div className="lg:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setOpenDropdown(openDropdown === 'mobile-menu' ? null : 'mobile-menu')}
                className="p-2 relative z-[100]"
                aria-label={openDropdown === 'mobile-menu' ? "סגור תפריט ניווט" : "פתח תפריט ניווט"}
                aria-expanded={openDropdown === 'mobile-menu'}
              >
                {openDropdown === 'mobile-menu' ? <X className="w-5 h-5" aria-hidden="true" /> : <Menu className="w-5 h-5" aria-hidden="true" />}
              </Button>

              {openDropdown === 'mobile-menu' && (
                <div 
                  className="absolute top-full right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 min-w-48 z-50 fade-slide-in"
                  role="menu"
                  aria-label="תפריט ניווט ראשי"
                >
                  <div className="p-2">
                    {!user && (
                      <>
                        <button
                          onClick={async () => {
                            try {
                              await base44.auth.redirectToLogin(window.location.href);
                              handleDropdownClose();
                            } catch (error) {
                              console.error("Login failed:", error);
                            }
                          }}
                          className="flex items-center gap-3 w-full p-2 hover:bg-gray-50 rounded-md text-slate-700 text-sm transition-colors"
                          role="menuitem"
                        >
                          <UserIcon className="w-4 h-4 ml-2 text-blue-600" aria-hidden="true" />
                          <span>התחברות</span>
                        </button>
                        <div className="border-t border-gray-100 my-1"></div>
                      </>
                    )}

                    <Link
                      to={createPageUrl("Browse")}
                      className="flex items-center gap-3 w-full p-2 hover:bg-gray-50 rounded-md text-slate-700 text-sm transition-colors"
                      onClick={handleDropdownClose}
                      role="menuitem"
                      aria-current={currentPageName === "Browse" ? "page" : undefined}
                    >
                      <Store className="w-4 h-4 ml-2 text-green-600" aria-hidden="true" />
                      <span>משלנו ביזנעס</span>
                    </Link>

                    <Link
                      to={createPageUrl("Add")}
                      className="flex items-center gap-3 w-full p-2 hover:bg-gray-50 rounded-md text-slate-700 text-sm transition-colors"
                      onClick={handleDropdownClose}
                      role="menuitem"
                      aria-current={currentPageName === "Add" ? "page" : undefined}
                    >
                      <div className="flex items-center">
                        <Sparkles className="w-4 h-4 ml-2 text-blue-600 ai-sparkle" aria-hidden="true" />
                        <span>הצטרפו למשלנו</span>
                        <Zap className="w-3 h-3 mr-1 text-yellow-500 opacity-75" aria-hidden="true" />
                      </div>
                    </Link>

                    <Link
                      to={createPageUrl("Search")}
                      className="flex items-center gap-3 w-full p-2 hover:bg-gray-50 rounded-md text-slate-700 text-sm transition-colors"
                      onClick={handleDropdownClose}
                      role="menuitem"
                      aria-current={currentPageName === "Search" ? "page" : undefined}
                    >
                      <Search className="w-4 h-4 ml-2 text-purple-600" aria-hidden="true" />
                      <span>חיפוש מתקדם</span>
                    </Link>

                    {user && (user.user_type === 'business' || user.role === 'admin') && (
                      <Link
                        to={createPageUrl("MyBusinessPages")}
                        className="flex items-center gap-3 w-full p-2 hover:bg-gray-50 rounded-md text-slate-700 text-sm transition-colors"
                        onClick={handleDropdownClose}
                        role="menuitem"
                        aria-current={currentPageName === "MyBusinessPages" ? "page" : undefined}
                      >
                        <ListChecks className="w-4 h-4 ml-2 text-teal-600" aria-hidden="true" />
                        <span>העסקים שלי</span>
                      </Link>
                    )}

                    {user && (
                      <Link
                        to={createPageUrl("Favorites")}
                        className="flex items-center gap-3 w-full p-2 hover:bg-gray-50 rounded-md text-slate-700 text-sm transition-colors"
                        onClick={handleDropdownClose}
                        role="menuitem"
                        aria-current={currentPageName === "Favorites" ? "page" : undefined}
                      >
                        <Heart className="w-4 h-4 ml-2 text-red-600 heart-pulse" aria-hidden="true" />
                        <span>מועדפים</span>
                      </Link>
                    )}

                    {user && isAdmin && (
                      <>
                        <div className="border-t border-gray-100 my-1"></div>
                        <div className="px-2 py-1">
                          <span className="text-xs font-semibold text-purple-600 uppercase tracking-wide">ניהול</span>
                        </div>
                        <Link
                          to={createPageUrl("AdminBusinessPages")}
                          className="flex items-center gap-3 w-full p-2 hover:bg-gray-50 rounded-md text-slate-700 text-sm transition-colors"
                          onClick={handleDropdownClose}
                          role="menuitem"
                        >
                          <FileText className="w-4 h-4 ml-2 text-orange-600" aria-hidden="true" />
                          <span>ניהול עמודי עסק</span>
                        </Link>
                        <Link
                          to={createPageUrl("AdminUsers")}
                          className="flex items-center gap-3 w-full p-2 hover:bg-gray-50 rounded-md text-slate-700 text-sm transition-colors"
                          onClick={handleDropdownClose}
                          role="menuitem"
                        >
                          <Users className="w-4 h-4 ml-2 text-blue-600" aria-hidden="true" />
                          <span>ניהול משתמשים</span>
                        </Link>
                        <Link
                          to={createPageUrl("AdminStats")}
                          className="flex items-center gap-3 w-full p-2 hover:bg-gray-50 rounded-md text-slate-700 text-sm transition-colors"
                          onClick={handleDropdownClose}
                          role="menuitem"
                        >
                          <Settings className="w-4 h-4 ml-2 text-green-600" aria-hidden="true" />
                          <span>סטטיסטיקות</span>
                        </Link>
                        <Link
                          to={createPageUrl("AdminReports")}
                          className="flex items-center gap-3 w-full p-2 hover:bg-gray-50 rounded-md text-slate-700 text-sm transition-colors"
                          onClick={handleDropdownClose}
                          role="menuitem"
                        >
                          <AlertTriangle className="w-4 h-4 ml-2 text-red-600" aria-hidden="true" />
                          <span>דיווחים</span>
                        </Link>
                        <Link
                          to={createPageUrl("AdminKashrut")}
                          className="flex items-center gap-3 w-full p-2 hover:bg-gray-50 rounded-md text-slate-700 text-sm transition-colors"
                          onClick={handleDropdownClose}
                          role="menuitem"
                        >
                          <Shield className="w-4 h-4 ml-2 text-emerald-600" aria-hidden="true" />
                          <span>ניהול כשרות</span>
                        </Link>

                        <Link
                          to={createPageUrl("AdminBanners")}
                          className="flex items-center gap-3 w-full p-2 hover:bg-gray-50 rounded-md text-slate-700 text-sm transition-colors"
                          onClick={handleDropdownClose}
                          role="menuitem"
                        >
                          <Megaphone className="w-4 h-4 ml-2 text-fuchsia-600" aria-hidden="true" />
                          <span>ניהול באנרים</span>
                        </Link>

                        <Link
                          to={createPageUrl("AdminTimezone")}
                          className="flex items-center gap-3 w-full p-2 hover:bg-gray-50 rounded-md text-slate-700 text-sm transition-colors"
                          onClick={handleDropdownClose}
                          role="menuitem"
                        >
                          <Clock className="w-4 h-4 ml-2 text-blue-600" aria-hidden="true" />
                          <span>הגדרות זמן</span>
                        </Link>

                        <Link
                          to={createPageUrl("AdminDynamicPagesAnalytics")}
                          className="flex items-center gap-3 w-full p-2 hover:bg-gray-50 rounded-md text-slate-700 text-sm transition-colors"
                          onClick={handleDropdownClose}
                          role="menuitem"
                        >
                          <Activity className="w-4 h-4 ml-2 text-purple-600" aria-hidden="true" />
                          <span>דפים דינמיים</span>
                        </Link>

                        <Link
                          to={createPageUrl("DeliveryManagement")}
                          className="flex items-center gap-3 w-full p-2 hover:bg-gray-50 rounded-md text-slate-700 text-sm transition-colors"
                          onClick={handleDropdownClose}
                          role="menuitem"
                        >
                          <Truck className="w-4 h-4 ml-2 text-indigo-600" aria-hidden="true" />
                          <span>ניהול משלוחים</span>
                        </Link>
                        <Link
                          to={createPageUrl("CourierFleetManagement")}
                          className="flex items-center gap-3 w-full p-2 hover:bg-gray-50 rounded-md text-slate-700 text-sm transition-colors"
                          onClick={handleDropdownClose}
                          role="menuitem"
                        >
                          <Users className="w-4 h-4 ml-2 text-cyan-600" aria-hidden="true" />
                          <span>ניהול צי שליחים</span>
                        </Link>
                        </>
                        )}

                        {user && user.user_type === 'courier' && (
                          <Link
                            to={createPageUrl("CourierDashboard")}
                            className="flex items-center gap-3 w-full p-2 hover:bg-gray-50 rounded-md text-slate-700 text-sm transition-colors"
                            onClick={handleDropdownClose}
                            role="menuitem"
                          >
                            <Truck className="w-4 h-4 ml-2 text-indigo-600" aria-hidden="true" />
                            <span>איזור שליח</span>
                          </Link>
                          )}

                          <div className="border-t border-gray-100 my-1"></div>
                          <Link
                          to={createPageUrl("AdminSettings")}
                          className="flex items-center gap-3 w-full p-2 hover:bg-gray-50 rounded-md text-slate-700 text-sm transition-colors font-bold bg-slate-50"
                          onClick={handleDropdownClose}
                          role="menuitem"
                          >
                          <Settings className="w-4 h-4 ml-2 text-slate-700" aria-hidden="true" />
                          <span>הגדרות מערכת</span>
                          </Link>

                          </div>
                        </div>
              )}
            </div>
          </div>
        </header>

        <main 
          id="main-content"
          className={isWizardPage ? "flex-1 overflow-y-auto" : "flex-1 pb-28 lg:pb-0"}
          role="main"
          aria-label="תוכן ראשי"
          tabIndex={-1}
        >
          {children}
        </main>

        {!isWizardPage && (
          <nav 
            className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200/50 z-[100] shadow-lg min-h-20 block"
            role="navigation"
            aria-label="ניווט תחתון"
          >
            <div className="flex items-center justify-around px-2 py-3">
              <Link
                to={createPageUrl("Browse")}
                className={`flex flex-col items-center justify-center w-14 h-14 rounded-2xl transition-all duration-200 ${
                  currentPageName === "Browse"
                    ? "bg-blue-100 text-blue-700 shadow-md scale-105"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                }`}
                aria-label="משלנו ביזנעס"
                aria-current={currentPageName === "Browse" ? "page" : undefined}
              >
                <Store className="w-6 h-6" aria-hidden="true" />
              </Link>

              <Link
                to={createPageUrl("Search")}
                className={`flex flex-col items-center justify-center w-14 h-14 rounded-2xl transition-all duration-200 ${
                  currentPageName === "Search"
                    ? "bg-blue-100 text-blue-700 shadow-md scale-105"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                }`}
                aria-label="חיפוש מתקדם"
                aria-current={currentPageName === "Search" ? "page" : undefined}
              >
                <Search className="w-6 h-6" aria-hidden="true" />
              </Link>

              <Link
                to={createPageUrl("Add")}
                className="flex flex-col items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-110 -mt-2"
                aria-label="הצטרף למשלנו והוסף עסק"
                aria-current={currentPageName === "Add" ? "page" : undefined}
              >
                <Plus className="w-7 h-7" aria-hidden="true" />
              </Link>

              {user ? (
                <Link
                  to={createPageUrl("Favorites")}
                  className={`flex flex-col items-center justify-center w-14 h-14 rounded-2xl transition-all duration-200 relative ${
                    currentPageName === "Favorites"
                      ? "bg-blue-100 text-blue-700 shadow-md scale-105"
                      : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                  }`}
                  aria-label="מועדפים"
                  aria-current={currentPageName === "Favorites" ? "page" : undefined}
                >
                  <Heart className="w-6 h-6 heart-pulse" aria-hidden="true" />
                </Link>
              ) : (
                <button
                  onClick={async () => {
                    try {
                      await base44.auth.redirectToLogin(window.location.href);
                    } catch (error) {
                      console.error("Login failed:", error);
                    }
                  }}
                  className="flex flex-col items-center justify-center w-14 h-14 rounded-2xl transition-all duration-200 text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                  aria-label="התחבר למערכת"
                >
                  <UserIcon className="w-6 h-6" aria-hidden="true" />
                </button>
              )}

              {user && (
                <button
                  onClick={() => handleDropdownOpen('user-profile')}
                  className="flex flex-col items-center justify-center w-14 h-14 rounded-2xl transition-all duration-200 text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                  aria-label={`תפריט משתמש - ${user.full_name || 'משתמש'}`}
                  aria-expanded={openDropdown === 'user-profile'}
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center shadow-sm">
                    <span className="text-white font-bold text-sm" aria-hidden="true">
                      {user.full_name ? user.full_name.charAt(0) : 'מ'}
                    </span>
                  </div>
                </button>
              )}
            </div>
          </nav>
        )}
      </div>

      {/* וידג'ט נגישות */}
      <AccessibilityWidget />
      {/* וידג'ט תמיכה וצ'אט */}
      <SupportWidget />
        </div>
      </HelmetProvider>
    );
  }
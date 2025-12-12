
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@/entities/User';

const AuthContext = createContext();

// Hook לשימוש ב-AuthContext
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Provider לניהול authentication
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastActivity, setLastActivity] = useState(Date.now());

  // משתני קבוע לניהול ה-session
  const SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 שעות
  const REFRESH_INTERVAL = 5 * 60 * 1000; // רענון כל 5 דקות
  const ACTIVITY_EVENTS = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];

  // פונקציה לשמירת המשתמש ב-localStorage
  const saveUserToStorage = (userData) => {
    try {
      const sessionData = {
        user: userData,
        timestamp: Date.now(),
        lastActivity: Date.now()
      };
      localStorage.setItem('meshlanoo_user_session', JSON.stringify(sessionData));
    } catch (error) {
      console.error('Error saving user to storage:', error);
    }
  };

  // פונקציה לטעינת המשתמש מ-localStorage
  const loadUserFromStorage = () => {
    try {
      const sessionData = localStorage.getItem('meshlanoo_user_session');
      if (!sessionData) return null;

      const parsed = JSON.parse(sessionData);
      const now = Date.now();
      
      // בדיקה שה-session לא פג
      if (now - parsed.timestamp > SESSION_TIMEOUT) {
        localStorage.removeItem('meshlanoo_user_session');
        return null;
      }

      return parsed;
    } catch (error) {
      console.error('Error loading user from storage:', error);
      localStorage.removeItem('meshlanoo_user_session');
      return null;
    }
  };

  // פונקציה לעדכון זמן הפעילות האחרונה
  const updateActivity = () => {
    const now = Date.now();
    setLastActivity(now);
    
    // עדכון ב-localStorage
    const sessionData = loadUserFromStorage();
    if (sessionData) {
      sessionData.lastActivity = now;
      localStorage.setItem('meshlanoo_user_session', JSON.stringify(sessionData));
    }
  };

  // פונקציה לרענון המשתמש
  const refreshUser = async () => {
    try {
      const currentUser = await User.me();
      if (currentUser) {
        setUser(currentUser);
        saveUserToStorage(currentUser);
        return currentUser;
      }
    } catch (error) {
      console.log('User session expired or invalid');
      // אם יש שגיאה, ננסה לטעון מ-storage
      const storedSession = loadUserFromStorage();
      if (storedSession && storedSession.user) {
        setUser(storedSession.user);
        return storedSession.user;
      }
      
      // אם גם מה-storage לא עובד, נוציא מהזיכרון
      setUser(null);
      localStorage.removeItem('meshlanoo_user_session');
      return null;
    }
  };

  // פונקציה להתחברות
  const login = async () => {
    try {
      setIsLoading(true);
      await User.login();
      // אחרי התחברות מוצלחת, נרענן את המשתמש
      await refreshUser();
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // פונקציה להתנתקות
  const logout = async () => {
    try {
      setIsLoading(true);
      await User.logout();
      setUser(null);
      localStorage.removeItem('meshlanoo_user_session');
    } catch (error) {
      console.error('Logout failed:', error);
      // גם במקרה של שגיאה, נוציא מהזיכרון המקומי
      setUser(null);
      localStorage.removeItem('meshlanoo_user_session');
    } finally {
      setIsLoading(false);
    }
  };

  // פונקציה להתחברות עם redirect
  const loginWithRedirect = async (redirectUrl) => {
    try {
      // שמירת ה-URL לחזרה אליו אחרי התחברות
      if (redirectUrl) {
        sessionStorage.setItem('meshlanoo_redirect_after_login', redirectUrl);
      }
      await User.loginWithRedirect(redirectUrl);
    } catch (error) {
      console.error('Login with redirect failed:', error);
      throw error;
    }
  };

  // Effect לטעינה ראשונית
  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);
      
      // ניסיון לטעינה מ-storage קודם
      const storedSession = loadUserFromStorage();
      if (storedSession && storedSession.user) {
        setUser(storedSession.user);
        setLastActivity(storedSession.lastActivity || Date.now());
      }
      
      // רענון מהשרת בכל מקרה
      await refreshUser();
      setIsLoading(false);
    };

    initAuth();
  }, []);

  // Effect לניטור פעילות המשתמש
  useEffect(() => {
    const handleActivity = () => updateActivity();
    
    // הוספת listeners לכל האירועים
    ACTIVITY_EVENTS.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    // ניקוי
    return () => {
      ACTIVITY_EVENTS.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
    };
  }, []);

  // Effect לרענון תקופתי
  useEffect(() => {
    const refreshInterval = setInterval(async () => {
      if (user) {
        const now = Date.now();
        const timeSinceLastActivity = now - lastActivity;
        
        // אם עבר יותר מ-SESSION_TIMEOUT מפעילות אחרונה, נתנתק
        if (timeSinceLastActivity > SESSION_TIMEOUT) {
          console.log('Session expired due to inactivity');
          await logout();
          return;
        }
        
        // אחרת, נרענן את המשתמש
        try {
          await refreshUser();
        } catch (error) {
          console.error('Failed to refresh user:', error);
        }
      }
    }, REFRESH_INTERVAL);

    return () => clearInterval(refreshInterval);
  }, [user, lastActivity]);

  // Effect לטיפול ב-visibility changes (כאשר עוברים בין tabs)
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && user) {
        // כאשר חוזרים ל-tab, נרענן את המשתמש
        await refreshUser();
        updateActivity();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user]);

  // NEW: פעימת נוכחות – מעדכן last_activity בשרת כל דקה כשמחוברים
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(async () => {
      try {
        await User.updateMyUserData({ last_activity: new Date().toISOString() });
      } catch (error) {
        // שקט – ננסה במחזור הבא
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [user]);

  const contextValue = {
    user,
    isLoading,
    login,
    logout,
    loginWithRedirect,
    refreshUser,
    updateActivity,
    lastActivity
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

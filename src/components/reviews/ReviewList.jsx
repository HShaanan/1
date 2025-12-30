import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Review } from "@/entities/Review";
import { User } from "@/entities/User";
import { formatDateTimeWithOffset } from "@/components/utils/dateUtils";
import { useSystemTimezone } from "@/components/hooks/useSystemTimezone";
import { Button } from "@/components/ui/button";
import { ThumbsUp, ThumbsDown, RefreshCw, Trash2 } from "lucide-react";
import { toggleReviewReaction } from "@/functions/toggleReviewReaction";
import { getMyReviewReaction } from "@/functions/getMyReviewReaction";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import CountUp from "react-countup";

// עזר לשם פרטי בלבד
const firstNameOnly = (v) => {
  if (!v) return "משתמש";
  const s = String(v).trim();
  if (!s) return "משתמש";
  if (s.includes("@")) {
    // אימייל -> קח חלק לפני @ עד מפריד ראשון
    const left = s.split("@")[0];
    return left.split(/[._\- ]/)[0] || "משתמש";
  }
  return s.split(/\s+/)[0];
};

const initialOf = (v) => {
  const s = firstNameOnly(v);
  return s.charAt(0).toUpperCase();
};

// Separate ReviewItem component with scroll animation
function ReviewItem({ review: r, index, displayName, initial, my, emoji, me, handleToggle, handleAdminDelete, timezoneOffset }) {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  return (
    <motion.li
      ref={ref}
      initial={{ opacity: 0, x: -20 }}
      animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
    >
      <article className="border rounded-lg p-3 bg-white hover:shadow-lg transition-shadow duration-300">
        <header className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold"
              style={{ backgroundColor: "#1a73e8" }}
              aria-hidden="true">
              {initial}
            </div>
            <h3 className="font-semibold text-slate-900">{displayName}</h3>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xl" role="img" aria-label={`דירוג: ${emoji}`}>{emoji}</span>
            {me?.role === 'admin' && (
              <Button
                variant="ghost"
                size="icon"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={() => handleAdminDelete(r.id)}
                aria-label="מחק חוות דעת">
                <Trash2 className="w-4 h-4" aria-hidden="true" />
              </Button>
            )}
          </div>
        </header>

        <time className="text-xs text-slate-500 mb-2 block" dateTime={r.created_date}>
          {formatDateTimeWithOffset(r.created_date, timezoneOffset)}
        </time>
        
        <p className="text-sm text-slate-800 whitespace-pre-wrap">{r.review_text}</p>
        
        {r.response_from_owner && (
          <aside className="mt-2 p-2 bg-slate-50 rounded border text-sm text-slate-700" aria-label="תגובת בעל העסק">
            <strong className="font-semibold">תגובת בעל המודעה: </strong>
            {r.response_from_owner}
            {r.response_date && (
              <time className="text-xs text-slate-400 mt-1 block" dateTime={r.response_date}>
                {formatDateTimeWithOffset(r.response_date, timezoneOffset)}
              </time>
            )}
          </aside>
        )}

        {/* כפתורי אהבתי / לא אהבתי */}
        <div className="mt-3 flex items-center gap-2" dir="rtl" role="group" aria-label="תגובות על חוות הדעת">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant={my === "like" ? "default" : "outline"}
              size="sm"
              className={my === "like" ? "bg-green-600 hover:bg-green-700 text-white" : ""}
              onClick={() => handleToggle(r.id, "like")}
              aria-label={`אהבתי (${typeof r.like_count === "number" ? r.like_count : 0})`}
              aria-pressed={my === "like"}>
              <ThumbsUp className="w-4 h-4 ml-1" aria-hidden="true" />
              {typeof r.like_count === "number" ? r.like_count : 0}
            </Button>
          </motion.div>

          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant={my === "dislike" ? "default" : "outline"}
              size="sm"
              className={my === "dislike" ? "bg-red-600 hover:bg-red-700 text-white" : ""}
              onClick={() => handleToggle(r.id, "dislike")}
              aria-label={`לא אהבתי (${typeof r.dislike_count === "number" ? r.dislike_count : 0})`}
              aria-pressed={my === "dislike"}>
              <ThumbsDown className="w-4 h-4 ml-1" aria-hidden="true" />
              {typeof r.dislike_count === "number" ? r.dislike_count : 0}
            </Button>
          </motion.div>
        </div>
      </article>
    </motion.li>
  );
}

export default function ReviewList({ businessPageId, onAfterChange }) {
  const { timezoneOffset } = useSystemTimezone();
  const [reviews, setReviews] = useState([]);
  const [me, setMe] = useState(null);
  const [loadingReviews, setLoadingReviews] = useState(true); // Tracks review fetching
  const [loadingReactions, setLoadingReactions] = useState(false); // Tracks user reaction fetching
  const [myReactions, setMyReactions] = useState({}); // { [reviewId]: 'like' | 'dislike' | null }
  const [error, setError] = useState('');
  const [filterMood, setFilterMood] = useState("all"); // "all" | 1..5

  const loadReviews = useCallback(async () => {
    setLoadingReviews(true);
    setError(''); // Clear error related to reviews loading
    
    try {
      const fetchedReviews = await Review.filter(
        { business_page_id: businessPageId, is_active: true },
        '-created_date',
        100 // Retaining the original limit of 100 reviews
      );
      setReviews(fetchedReviews || []);
    } catch (err) {
      console.error('❌ Error loading reviews:', err);
      setError('שגיאה בטעינת חוות הדעת');
      setReviews([]);
    } finally {
      setLoadingReviews(false);
    }
  }, [businessPageId]);

  // Effect 1: Load current user once
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await User.me().catch(() => null);
        setMe(user);
      } catch (err) {
        console.warn('Failed to load current user:', err);
        // Non-critical error, reaction functionality will just be unavailable if not logged in.
      }
    };
    fetchUser();
  }, []); // Empty dependency array means this runs once on mount

  // Effect 2: Load reviews when businessPageId changes
  useEffect(() => {
    if (businessPageId) {
      loadReviews();
    } else {
      setReviews([]); // Clear reviews if businessPageId is not provided
    }
  }, [businessPageId, loadReviews]); // Depends on businessPageId and loadReviews function

  // Effect 3: Load user reactions when reviews or 'me' changes (and 'me' is logged in)
  useEffect(() => {
    if (me && Array.isArray(reviews) && reviews.length) {
      setLoadingReactions(true);
      const fetchReactions = async () => {
        try {
          const entries = await Promise.all(
            reviews.map(async (r) => {
              const { data } = await getMyReviewReaction({ review_id: r.id }).catch(() => ({ data: null }));
              return [r.id, data?.my_reaction || null];
            })
          );
          const map = Object.fromEntries(entries);
          setMyReactions(map);
        } catch (e) {
          console.warn('Failed to load user reactions:', e);
          setMyReactions({}); // Clear reactions if an error occurs
        } finally {
          setLoadingReactions(false);
        }
      };
      fetchReactions();
    } else {
      setMyReactions({}); // Clear reactions if no user or no reviews
      setLoadingReactions(false);
    }
  }, [reviews, me]); // Depends on reviews and me state

  // Effect 4: Call onAfterChange callback
  useEffect(() => {
    if (onAfterChange) onAfterChange(reviews);
  }, [reviews, onAfterChange]);

  const handleToggle = async (reviewId, type) => {
    // דורש התחברות
    if (!me) {
      User.loginWithRedirect(window.location.href);
      return;
    }
    
    try {
      const { data } = await toggleReviewReaction({ review_id: reviewId, type });
      if (data?.success) {
        // עדכן מוני אהבתי/לא אהבתי ברשימה המקומית
        setReviews((prev) =>
          prev.map((r) =>
            r.id === reviewId
              ? { ...r, like_count: data.like_count, dislike_count: data.dislike_count }
              : r
          )
        );
        // עדכן את תגובת המשתמש הנוכחית
        setMyReactions((prev) => ({ ...prev, [reviewId]: data.my_reaction || null }));
      }
    } catch (err) {
      console.error('Error toggling reaction:', err);
    }
  };

  // מחיקת ביקורת (למנהל בלבד)
  const handleAdminDelete = async (reviewId) => {
    if (!me || me.role !== 'admin') {
      alert('אין לך הרשאה למחוק חוות דעת.');
      return;
    }
    const confirmed = window.confirm('למחוק את חוות הדעת הזו? הפעולה בלתי הפיכה.');
    if (!confirmed) return;

    try {
      await Review.delete(reviewId);
      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
    } catch (err) {
      console.error('Error deleting review:', err);
      alert('נכשלה מחיקת חוות הדעת');
    }
  };

  // המרה מ-rating או משדות האימוג׳י ל-mood 1..5
  const moodFromReview = (r) => {
    if (typeof r.emoji_mood === "number") return r.emoji_mood;
    if (typeof r.rating === "number") {
      const x = Math.round(Math.min(5, Math.max(1, r.rating)));
      return x;
    }
    return 3; // Default to neutral if no rating or emoji_mood
  };

  const EMOJIS = ["😡","😕","😐","😊","😍"];

  // מונים לפי אימוג׳י
  const moodCounts = useMemo(() => {
    const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    (reviews || []).forEach((r) => {
      const m = moodFromReview(r);
      counts[m] = (counts[m] || 0) + 1;
    });
    return counts;
  }, [reviews]);

  // מסנן את הרשימה לפי mood
  const visibleReviews = useMemo(() => {
    if (filterMood === "all") return reviews;
    return (reviews || []).filter((r) => moodFromReview(r) === filterMood);
  }, [reviews, filterMood]);

  const overallLoading = loadingReviews || loadingReactions;

  if (overallLoading && reviews.length === 0 && !error) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="border rounded-lg p-3 bg-white animate-pulse">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-slate-200 to-slate-100"></div>
              <div className="h-4 bg-gradient-to-r from-slate-200 to-slate-100 rounded w-24"></div>
            </div>
            <div className="h-3 bg-gradient-to-r from-slate-200 to-slate-100 rounded w-full mb-2"></div>
            <div className="h-3 bg-gradient-to-r from-slate-200 to-slate-100 rounded w-5/6"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-sm text-red-600 p-3 bg-red-50 rounded-lg border border-red-200 flex items-center justify-between">
        <span>{error}</span>
        <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
          נסה שוב
        </Button>
      </div>
    );
  }

  if (!reviews.length && !overallLoading) { // Only show this if not loading and no reviews
    return (
      <div className="text-sm text-slate-500 p-4 text-center bg-gray-50 rounded-lg">
        עדיין אין חוות דעת. היו הראשונים לדרג! 🌟
      </div>
    );
  }

  return (
    <section className="space-y-3" aria-labelledby="reviews-heading">
      <h2 id="reviews-heading" className="sr-only">חוות דעת לקוחות</h2>
      
      {/* סרגל סינון לפי אימוג׳י עם מונים - With CountUp animation */}
      <nav className="flex items-center justify-between mb-2 flex-wrap gap-2" aria-label="סינון חוות דעת">
        <div className="text-sm text-gray-600 flex-shrink-0" role="status" aria-live="polite">
          📊 <CountUp end={reviews.length} duration={1.5} /> חוות דעת
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end" dir="rtl" role="group" aria-label="סינון לפי דירוג">
          <Button
            variant={filterMood === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterMood("all")}
            className={filterMood === "all" ? "bg-slate-800 hover:bg-slate-900 text-white" : ""}
            aria-label="הצג את כל החוות דעת"
            aria-pressed={filterMood === "all"}>
            הכל
          </Button>
          {[1,2,3,4,5].map((m) => (
            <Button
              key={m}
              variant={filterMood === m ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterMood(m)}
              className={`gap-1 ${filterMood === m ? "bg-sky-600 hover:bg-sky-700 text-white" : ""}`}
              aria-label={`סנן לפי דירוג ${EMOJIS[m-1]} (${moodCounts[m] || 0} חוות דעת)`}
              aria-pressed={filterMood === m}>
              <span className="text-base" aria-hidden="true">{EMOJIS[m-1]}</span>
              <span className="text-xs opacity-80">({moodCounts[m] || 0})</span>
            </Button>
          ))}
        </div>
      </nav>
      
      {/* רשימת הביקורות (לאחר סינון) - With Scroll Animations */}
      <ul className="space-y-3" role="list" aria-label="רשימת חוות דעת">
        {visibleReviews.map((r, index) => {
          const displayName = firstNameOnly(r.reviewer_name || r.reviewer_email || "משתמש");
          const initial = initialOf(displayName);
          const my = myReactions[r.id] || null;
          const mood = moodFromReview(r);
          const emoji = EMOJIS[mood - 1];

          return (
            <ReviewItem key={r.id} review={r} index={index} displayName={displayName} initial={initial} my={my} emoji={emoji} me={me} handleToggle={handleToggle} handleAdminDelete={handleAdminDelete} timezoneOffset={timezoneOffset} />
          );
        })}
      </ul>
                <header className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold"
                      style={{ backgroundColor: "#1a73e8" }}
                      aria-hidden="true">
                      {initial}
                    </div>
                    <h3 className="font-semibold text-slate-900">{displayName}</h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xl" role="img" aria-label={`דירוג: ${emoji}`}>{emoji}</span>
                    {me?.role === 'admin' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleAdminDelete(r.id)}
                        aria-label="מחק חוות דעת">
                        <Trash2 className="w-4 h-4" aria-hidden="true" />
                      </Button>
                    )}
                  </div>
                </header>

                <time className="text-xs text-slate-500 mb-2 block" dateTime={r.created_date}>
                  {formatDateTimeWithOffset(r.created_date, timezoneOffset)}
                </time>
                
                <p className="text-sm text-slate-800 whitespace-pre-wrap">{r.review_text}</p>
                
                {r.response_from_owner && (
                  <aside className="mt-2 p-2 bg-slate-50 rounded border text-sm text-slate-700" aria-label="תגובת בעל העסק">
                    <strong className="font-semibold">תגובת בעל המודעה: </strong>
                    {r.response_from_owner}
                    {r.response_date && (
                      <time className="text-xs text-slate-400 mt-1 block" dateTime={r.response_date}>
                        {formatDateTimeWithOffset(r.response_date, timezoneOffset)}
                      </time>
                    )}
                  </aside>
                )}

                {/* כפתורי אהבתי / לא אהבתי */}
                <div className="mt-3 flex items-center gap-2" dir="rtl" role="group" aria-label="תגובות על חוות הדעת">
                  <Button
                    variant={my === "like" ? "default" : "outline"}
                    size="sm"
                    className={my === "like" ? "bg-green-600 hover:bg-green-700 text-white" : ""}
                    onClick={() => handleToggle(r.id, "like")}
                    aria-label={`אהבתי (${typeof r.like_count === "number" ? r.like_count : 0})`}
                    aria-pressed={my === "like"}>
                    <ThumbsUp className="w-4 h-4 ml-1" aria-hidden="true" />
                    {typeof r.like_count === "number" ? r.like_count : 0}
                  </Button>

                  <Button
                    variant={my === "dislike" ? "default" : "outline"}
                    size="sm"
                    className={my === "dislike" ? "bg-red-600 hover:bg-red-700 text-white" : ""}
                    onClick={() => handleToggle(r.id, "dislike")}
                    aria-label={`לא אהבתי (${typeof r.dislike_count === "number" ? r.dislike_count : 0})`}
                    aria-pressed={my === "dislike"}>
                    <ThumbsDown className="w-4 h-4 ml-1" aria-hidden="true" />
                    {typeof r.dislike_count === "number" ? r.dislike_count : 0}
                  </Button>
                </div>
              </article>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
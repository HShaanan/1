import React from "react";
import { Review } from "@/entities/Review";
import { User } from "@/entities/User";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send, AlertCircle, CheckCircle2, Sparkles } from "lucide-react";
import { analyzeReview } from "@/functions/analyzeReview";
import { aggregateSmartRatings } from "@/functions/aggregateSmartRatings";
import { getIsraelTime } from "@/functions/getIsraelTime";
import { motion, AnimatePresence } from "framer-motion";
import Lottie from "react-lottie";

// עזר לשם פרטי בלבד
const firstNameOnly = (v) => {
  if (!v) return "משתמש";
  const s = String(v).trim();
  if (!s) return "משתמש";
  if (s.includes("@")) {
    const left = s.split("@")[0];
    return left.split(/[._\- ]/)[0] || "משתמש";
  }
  return s.split(/\s+/)[0];
};

// המרות בטוחות מקלט האימוג׳י/מצב רוח
const parseMoodNumber = (m) => {
  if (m == null) return null;
  if (typeof m === "object" && m.mood !== undefined) return Number(m.mood) || null;
  return Number(m) || null;
};
const parseEmojiString = (m, fallback = null) => {
  if (typeof m === "object" && m.emoji) return String(m.emoji);
  if (typeof m === "string") return m; // If m is already a string emoji
  return fallback;
};

export default function ReviewForm({ businessPageId, onSubmit, initialEmoji, initialMood }) { // הוספת פרופס
  const [user, setUser] = React.useState(null);
  const [existingReview, setExistingReview] = React.useState(null);

  // Initialize with parsed values, ensuring types
  const initialParsedMood = parseMoodNumber(initialMood) ?? 5; // Default to 5 if parsing results in null
  const initialParsedEmoji = initialEmoji ?? parseEmojiString(initialMood, null);

  const [rating, setRating] = React.useState(initialParsedMood); // שמור תמיד כמספר (1-5)
  const [text, setText] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [emoji, setEmoji] = React.useState(initialParsedEmoji); // שמור תמיד כסטרינג או null
  const [emojiMood, setEmojiMood] = React.useState(parseMoodNumber(initialMood)); // שמור תמיד כמספר או null
  const [showSuccess, setShowSuccess] = React.useState(false);

  React.useEffect(() => {
    // אם המשתמש פתח את הטופס מאוחר יותר עם mood אחר
    if (initialEmoji !== undefined) {
      setEmoji(initialEmoji ?? parseEmojiString(initialMood, null));
    }
    if (initialMood !== undefined) {
      const m = parseMoodNumber(initialMood);
      if (m !== null) { // Only update if mood is a valid number
        setEmojiMood(m);
        setRating(m); // מגדיר דירוג ברירת מחדל לפי האימוג׳י
      }
      // אם הגיע גם אמוג׳י בתוך האובייקט - עדכן
      const e = parseEmojiString(initialMood, null);
      if (e) setEmoji(e);
    }
  }, [initialEmoji, initialMood]);

  React.useEffect(() => {
    const loadUserAndReview = async () => {
      try {
        const currentUser = await User.me().catch(() => null);
        if (!currentUser) {
          setUser(null);
          setLoading(false);
          return;
        }

        setUser(currentUser);

        // בדיקה אם יש כבר ביקורת של המשתמש לעמוד העסק הזה
        const existingReviews = await Review.filter({
          business_page_id: businessPageId,
          reviewer_email: currentUser.email,
          is_active: true
        });

        if (existingReviews && existingReviews.length > 0) {
          // אם נמצאה ביקורת, נציג אותה במצב קריאה בלבד
          const review = existingReviews[0];
          setExistingReview(review);
          setRating(typeof review.rating === 'number' ? review.rating : 5); // Ensure rating is number, default to 5
          setText(review.review_text || "");
          setEmoji(review.emoji || null); // emoji is string or null
          setEmojiMood(typeof review.emoji_mood === 'number' ? review.emoji_mood : null); // Ensure emojiMood is number or null
        } else {
          // אין ביקורת קיימת, נאפשר יצירה חדשה
          setExistingReview(null);
          const m = parseMoodNumber(initialMood) ?? 5; // Use parsed initial mood, default to 5 for rating
          setRating(m);
          setText("");
          setEmoji(initialEmoji ?? parseEmojiString(initialMood, null)); // Use parsed initial emoji
          setEmojiMood(parseMoodNumber(initialMood)); // Use parsed initial mood (can be null)
        }
      } catch (error) {
        console.error('Error loading user and review:', error);
        setUser(null);
        setExistingReview(null);
      } finally {
        setLoading(false);
      }
    };

    if (businessPageId) {
      loadUserAndReview();
    }
  }, [businessPageId, initialEmoji, initialMood]);

  const handleSubmit = async () => {
    if (!user) {
      await User.loginWithRedirect(window.location.href);
      return;
    }

    // אם קיימת ביקורת, לא נאפשר שליחה נוספת או עריכה, אלא נציג הודעה
    if (existingReview) {
      alert('כבר כתבת ביקורת על עמוד עסק זה.');
      return;
    }

    // הבטחת ש-finalRating יהיה מספר תקין (1-5)
    // emojiMood or rating should already be numbers or null due to parsing logic in states
    const finalRating = emojiMood ?? rating ?? 5;

    if (!text.trim()) {
      alert('אנא כתב ביקורת');
      return;
    }

    setSaving(true);
    try {
      let israelTime;
      try {
        const { data: timeData } = await getIsraelTime();
        // Check for both israelTime and full_iso_string as possible returns
        israelTime = timeData?.israelTime || timeData?.full_iso_string || new Date().toISOString();
      } catch (_e) { // Fallback to local time if API fails
        israelTime = new Date().toISOString();
      }

      const textLen = text.trim().length;
      const reviewData = {
        business_page_id: businessPageId,
        reviewer_email: user.email,
        reviewer_name: firstNameOnly(user.full_name || user.email),
        rating: finalRating,                 // מספר 1..5
        review_text: text.trim(),
        text_length: textLen,
        is_active: true,
        created_date: israelTime,
        updated_date: israelTime,
        emoji: emoji || null,                // אימוג׳י כסטרינג
        emoji_mood: finalRating              // מספר 1..5
      };

      const createdReview = await Review.create(reviewData);

      // ניתוח AI לביקורת החדשה
      try { await analyzeReview({ review_id: createdReview.id }); } catch (e) { console.warn('AI analysis failed:', e); }

      // עדכון הדירוג החכם של עמוד העסק
      try { await aggregateSmartRatings({ business_page_id: businessPageId }); } catch (e) { console.warn('Smart rating aggregation failed:', e); }

      // Show success animation
      setShowSuccess(true);
      
      // לאחר יצירת ביקורת, נעדכן את ה-state כדי שהטופס יהפוך לבלתי פעיל ויציג את הביקורת הקיימת.
      setTimeout(() => {
        setExistingReview(createdReview);
        setRating(typeof createdReview.rating === 'number' ? createdReview.rating : finalRating); // Ensure it's a number
        setText(createdReview.review_text || "");
        setEmoji(createdReview.emoji || emoji || null); // Prefer created review emoji, then current state, then null
        setEmojiMood(typeof createdReview.emoji_mood === 'number' ? createdReview.emoji_mood : finalRating); // Ensure it's a number or null
        setShowSuccess(false);
        
        // קריאה לפונקציית callback
        if (onSubmit) {
          onSubmit();
        }
      }, 2000);

    } catch (error) {
      console.error('❌ Error saving review:', error);
      alert('שגיאה בשליחת הביקורת: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 bg-slate-50 rounded-lg border text-right flex items-center justify-center">
        <Loader2 className="w-4 h-4 animate-spin ml-2" />
        <span className="text-sm text-slate-700">טוען...</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-4 bg-slate-50 rounded-lg border text-right">
        <p className="text-sm text-slate-700 mb-3">כדי לכתוב חוות דעת יש להתחבר.</p>
        <Button
          onClick={() => User.loginWithRedirect(window.location.href)}
          className="bg-indigo-600 hover:bg-indigo-700"
        >
          התחבר/י
        </Button>
      </div>
    );
  }

  // Success confetti animation data
  const successAnimation = {
    loop: false,
    autoplay: true,
    animationData: {
      v: "5.5.7",
      fr: 60,
      ip: 0,
      op: 60,
      w: 400,
      h: 400,
      nm: "Success",
      ddd: 0,
      assets: [],
      layers: [{
        ddd: 0,
        ind: 1,
        ty: 4,
        nm: "check",
        sr: 1,
        ks: {
          o: { a: 0, k: 100 },
          r: { a: 0, k: 0 },
          p: { a: 0, k: [200, 200, 0] },
          a: { a: 0, k: [0, 0, 0] },
          s: { a: 1, k: [
            { t: 0, s: [0, 0, 100], e: [120, 120, 100] },
            { t: 30, s: [120, 120, 100], e: [100, 100, 100] },
            { t: 40 }
          ]}
        },
        ao: 0,
        shapes: [{
          ty: "gr",
          it: [{
            ty: "rc",
            d: 1,
            s: { a: 0, k: [100, 100] },
            p: { a: 0, k: [0, 0] },
            r: { a: 0, k: 50 }
          }, {
            ty: "fl",
            c: { a: 0, k: [0.4, 0.8, 0.4, 1] },
            o: { a: 0, k: 100 }
          }],
          nm: "Circle"
        }],
        ip: 0,
        op: 60,
        st: 0
      }]
    },
    rendererSettings: { preserveAspectRatio: 'xMidYMid slice' }
  };

  return (
    <div className="p-4 bg-white rounded-lg border relative">
      {/* Success Animation Overlay */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute inset-0 z-50 bg-white/95 backdrop-blur-sm rounded-lg flex flex-col items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            >
              <CheckCircle2 className="w-20 h-20 text-green-500 mb-4" />
            </motion.div>
            <motion.h3
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-2xl font-bold text-slate-900 mb-2"
            >
              תודה רבה! 🎉
            </motion.h3>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-slate-600"
            >
              הביקורת שלך פורסמה בהצלחה
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between mb-3">
        <span className="font-semibold text-slate-900">
          {existingReview ? "חוות הדעת שלך" : "הוסף חוות דעת"}
        </span>
        <div className="flex items-center gap-2">
          {emoji && (
            <motion.span 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
              className="text-2xl" 
              title="האימוג׳י שנבחר"
            >
              {emoji}
            </motion.span>
          )}
        </div>
      </div>

      {existingReview && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-3 p-2 bg-amber-50 border border-amber-200 rounded-md"
        >
          <div className="flex items-center gap-2 text-amber-700">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">כבר פרסמת חוות דעת על עמוד עסק זה.</span>
          </div>
        </motion.div>
      )}

      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="ספר/י לאחרים על הניסיון שלך..."
        rows={4}
        className="text-right"
        disabled={!!existingReview || saving}
      />
      <div className="flex justify-end mt-3">
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            onClick={handleSubmit}
            disabled={saving || !text.trim() || !!existingReview}
            className="gap-2 transition-all"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {existingReview ? "פורסם" : "פרסם"}
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
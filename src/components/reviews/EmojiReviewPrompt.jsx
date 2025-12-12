import React from "react";
import { User } from "@/entities/User";

export default function EmojiReviewPrompt({ businessName = "העסק", onOpenForm, theme, isBlackTheme }) {
  const [hovered, setHovered] = React.useState(null);
  const emojis = ["😡", "😕", "😐", "😊", "😍"];

  const handleClick = async (moodIndex) => {
    const me = await User.me().catch(() => null);
    if (!me) {
      await User.loginWithRedirect(window.location.href);
      return;
    }
    const mood = moodIndex + 1;
    const emoji = emojis[moodIndex];
    onOpenForm?.({ mood, emoji });
  };

  // צבע ברירת מחדל אם לא קיים theme
  const primaryColor = theme?.colors?.primary || '#F59E0B';
  const primaryHover = theme?.colors?.primaryHover || '#0EA5E9';

  return (
    <div className="w-full flex flex-col items-center gap-4 py-2" dir="rtl">
      {/* בועת שאלה - דינמי */}
      <div 
        className={`px-4 py-2 text-sm rounded-full relative shadow-sm ${
          isBlackTheme ? 'bg-red-600 text-white' : 'text-white'
        }`}
        style={!isBlackTheme ? { backgroundColor: primaryColor } : {}}
      >
        קיבלתם שירות יוצא דופן מ{businessName}? ספרו לנו!
        <span 
          className="absolute -top-1 right-6 w-2 h-2 rotate-45" 
          style={{ backgroundColor: isBlackTheme ? '#DC2626' : primaryHover }} 
          aria-hidden="true" 
        />
      </div>

      {/* אימוג'ים */}
      <div className="flex items-center gap-4">
        {emojis.map((e, i) => (
          <button
            key={i}
            type="button"
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
            onClick={() => handleClick(i)}
            className="w-12 h-12 rounded-full border bg-white flex items-center justify-center text-2xl shadow-[0_6px_12px_rgba(0,0,0,0.08)] hover:shadow-[0_10px_18px_rgba(0,0,0,0.12)] transition-all"
            title="דרג והוסף ביקורת"
            aria-label="הוסף ביקורת"
            style={{
              borderColor: primaryHover,
              filter: hovered === i ? "none" : "grayscale(100%) saturate(0.7) opacity(0.9)",
              transform: hovered === i ? "translateY(-2px)" : "translateY(0)"
            }}
          >
            <span role="img" aria-hidden="true">{e}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
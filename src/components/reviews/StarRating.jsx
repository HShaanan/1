import React from "react";
import { Star } from "lucide-react";

export default function StarRating({ value = 0, onChange, size = 18, readOnly = false }) {
  const [hover, setHover] = React.useState(null);
  const show = hover ?? value;

  return (
    <div 
      className="flex items-center gap-0.5" 
      dir="ltr" 
      role={readOnly ? "img" : "radiogroup"}
      aria-label={readOnly ? `דירוג: ${value} מתוך 5 כוכבים` : "בחר דירוג"}
    >
      {[1,2,3,4,5].map((i) => (
        <button
          key={i}
          type="button"
          className={`p-0.5 ${readOnly ? "cursor-default" : "cursor-pointer"}`}
          onMouseEnter={() => !readOnly && setHover(i)}
          onMouseLeave={() => !readOnly && setHover(null)}
          onClick={() => !readOnly && onChange?.(i)}
          disabled={readOnly}
          aria-label={readOnly ? undefined : `${i} כוכבים`}
          role={readOnly ? "presentation" : "radio"}
          aria-checked={readOnly ? undefined : i === value}
          tabIndex={readOnly ? -1 : 0}
        >
          <Star
            className={`${i <= show ? "fill-yellow-400 text-yellow-400" : "text-gray-300"} transition-colors`}
            style={{ width: size, height: size }}
            aria-hidden="true"
          />
        </button>
      ))}
    </div>
  );
}
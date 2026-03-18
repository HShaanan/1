import React from "react";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function MenuItem({ item, theme, isBlackTheme, onOpenModifications }) {
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
              style={{ backgroundColor: theme.colors.primary }}
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
                aria-hidden="true"
              />
            </div>
          )}
          <img
            src={item.image}
            alt={`תמונה של ${item.name}`}
            className={`object-cover w-full h-full transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
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

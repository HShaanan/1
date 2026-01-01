import React, { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring, AnimatePresence } from 'framer-motion';

export default function BlobCursor() {
  const [isVisible, setIsVisible] = useState(false);
  const [isPointer, setIsPointer] = useState(false);
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);

  const springConfig = { damping: 28, stiffness: 180, mass: 0.5 };
  const cursorXSpring = useSpring(cursorX, springConfig);
  const cursorYSpring = useSpring(cursorY, springConfig);

  useEffect(() => {
    const moveCursor = (e) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);

      const target = e.target;
      const isClickable = target.closest('button, a, input, textarea, select, [role="button"], [onclick]');
      setIsPointer(!!isClickable);
    };

    const handleMouseEnter = () => setIsVisible(true);
    const handleMouseLeave = () => setIsVisible(false);

    window.addEventListener('mousemove', moveCursor);
    document.body.addEventListener('mouseenter', handleMouseEnter);
    document.body.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', moveCursor);
      document.body.removeEventListener('mouseenter', handleMouseEnter);
      document.body.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [cursorX, cursorY]);

  // הסתר על מכשירים ניידים
  if (typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0)) {
    return null;
  }

  return (
    <>
      <style>{`
        *, *::before, *::after {
          cursor: none !important;
        }
        
        @keyframes blob-morph {
          0%, 100% { 
            border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%;
          }
          20% { 
            border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%;
          }
          40% { 
            border-radius: 50% 60% 30% 60% / 30% 60% 70% 40%;
          }
          60% { 
            border-radius: 60% 40% 60% 40% / 70% 50% 60% 40%;
          }
          80% { 
            border-radius: 40% 60% 50% 60% / 60% 40% 60% 50%;
          }
        }
        
        @keyframes blob-float {
          0%, 100% { transform: translate(-50%, -50%) rotate(0deg) scale(1); }
          25% { transform: translate(-50%, -50%) rotate(90deg) scale(1.05); }
          50% { transform: translate(-50%, -50%) rotate(180deg) scale(0.95); }
          75% { transform: translate(-50%, -50%) rotate(270deg) scale(1.05); }
        }
      `}</style>

      <AnimatePresence>
        {isVisible && (
          <motion.div
            className="fixed pointer-events-none z-[9999]"
            style={{
              left: cursorXSpring,
              top: cursorYSpring,
            }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Blob אורגני עם אפקט זוהר */}
            <motion.div
              className="absolute"
              style={{
                width: isPointer ? 60 : 40,
                height: isPointer ? 60 : 40,
                background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 40%, #EC4899 100%)',
                animation: 'blob-morph 6s ease-in-out infinite',
                filter: 'blur(4px)',
                transform: 'translate(-50%, -50%)',
                boxShadow: '0 0 20px rgba(59, 130, 246, 0.6), 0 0 40px rgba(139, 92, 246, 0.4)',
              }}
              animate={{
                width: isPointer ? 60 : 40,
                height: isPointer ? 60 : 40,
                opacity: isPointer ? 0.85 : 0.7,
              }}
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 28,
              }}
            />

            {/* שכבת זוהר חיצונית */}
            <motion.div
              className="absolute"
              style={{
                width: isPointer ? 90 : 65,
                height: isPointer ? 90 : 65,
                background: 'radial-gradient(circle, rgba(59,130,246,0.25) 0%, rgba(139,92,246,0.15) 35%, transparent 65%)',
                filter: 'blur(12px)',
                transform: 'translate(-50%, -50%)',
              }}
              animate={{
                width: isPointer ? 90 : 65,
                height: isPointer ? 90 : 65,
                scale: [1, 1.15, 1],
              }}
              transition={{
                scale: {
                  duration: 2.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                },
                width: {
                  type: "spring",
                  stiffness: 400,
                  damping: 28,
                },
                height: {
                  type: "spring",
                  stiffness: 400,
                  damping: 28,
                },
              }}
            />

            {/* נקודה מרכזית חדה */}
            <motion.div
              className="absolute rounded-full"
              style={{
                width: 4,
                height: 4,
                background: 'white',
                transform: 'translate(-50%, -50%)',
                boxShadow: '0 0 8px rgba(255, 255, 255, 0.8)',
              }}
              animate={{
                scale: isPointer ? 0 : 1,
                opacity: isPointer ? 0 : 1,
              }}
              transition={{
                type: "spring",
                stiffness: 500,
                damping: 30,
              }}
            />

            {/* טבעות הרחבה בלחיצה */}
            {isPointer && (
              <motion.div
                className="absolute rounded-full border-2 border-white/40"
                style={{
                  width: 70,
                  height: 70,
                  transform: 'translate(-50%, -50%)',
                }}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1.2, opacity: [0.6, 0] }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  ease: "easeOut",
                }}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
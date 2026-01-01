import React, { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring, AnimatePresence } from 'framer-motion';

export default function BlobCursor() {
  const [isVisible, setIsVisible] = useState(false);
  const [isPointer, setIsPointer] = useState(false);
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);

  const springConfig = { damping: 30, stiffness: 200, mass: 0.6 };
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

    // הסתר את הסמן הרגיל
    document.body.style.cursor = 'none';
    const allElements = document.querySelectorAll('*');
    allElements.forEach(el => {
      el.style.cursor = 'none';
    });

    return () => {
      window.removeEventListener('mousemove', moveCursor);
      document.body.removeEventListener('mouseenter', handleMouseEnter);
      document.body.removeEventListener('mouseleave', handleMouseLeave);
      document.body.style.cursor = '';
      allElements.forEach(el => {
        el.style.cursor = '';
      });
    };
  }, [cursorX, cursorY]);

  // הסתר על מכשירים ניידים
  if (typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0)) {
    return null;
  }

  return (
    <>
      <style>{`
        * {
          cursor: none !important;
        }
        
        @keyframes blob-morph {
          0%, 100% { border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; }
          25% { border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%; }
          50% { border-radius: 50% 60% 30% 60% / 30% 60% 70% 40%; }
          75% { border-radius: 60% 40% 60% 40% / 70% 50% 60% 40%; }
        }
        
        @keyframes blob-rotate {
          0% { transform: translate(-50%, -50%) rotate(0deg); }
          100% { transform: translate(-50%, -50%) rotate(360deg); }
        }
      `}</style>

      <AnimatePresence>
        {isVisible && (
          <>
            {/* Blob אורגני ראשי */}
            <motion.div
              className="fixed pointer-events-none z-[9999]"
              style={{
                left: cursorXSpring,
                top: cursorYSpring,
              }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              transition={{ duration: 0.3 }}
            >
              <motion.div
                className="absolute"
                style={{
                  width: isPointer ? 70 : 50,
                  height: isPointer ? 70 : 50,
                  background: 'linear-gradient(135deg, #60A5FA 0%, #A78BFA 50%, #EC4899 100%)',
                  animation: 'blob-morph 8s ease-in-out infinite, blob-rotate 20s linear infinite',
                  filter: 'blur(8px)',
                  opacity: 0.6,
                  transform: 'translate(-50%, -50%)',
                }}
                animate={{
                  width: isPointer ? 70 : 50,
                  height: isPointer ? 70 : 50,
                  opacity: isPointer ? 0.8 : 0.6,
                }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 25,
                }}
              />

              {/* Glow חיצוני */}
              <motion.div
                className="absolute"
                style={{
                  width: isPointer ? 100 : 70,
                  height: isPointer ? 100 : 70,
                  background: 'radial-gradient(circle, rgba(96,165,250,0.3) 0%, rgba(167,139,250,0.2) 40%, transparent 70%)',
                  filter: 'blur(20px)',
                  transform: 'translate(-50%, -50%)',
                }}
                animate={{
                  width: isPointer ? 100 : 70,
                  height: isPointer ? 100 : 70,
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  scale: {
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  },
                  width: {
                    type: "spring",
                    stiffness: 300,
                    damping: 25,
                  },
                  height: {
                    type: "spring",
                    stiffness: 300,
                    damping: 25,
                  },
                }}
              />

              {/* נקודה מרכזית */}
              <motion.div
                className="absolute bg-white rounded-full shadow-lg"
                style={{
                  width: 6,
                  height: 6,
                  transform: 'translate(-50%, -50%)',
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
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
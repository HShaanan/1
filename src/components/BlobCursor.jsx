import React, { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring, AnimatePresence } from 'framer-motion';

export default function BlobCursor() {
  const [isVisible, setIsVisible] = useState(false);
  const [isPointer, setIsPointer] = useState(false);
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);

  const springConfig = { damping: 25, stiffness: 200, mass: 0.5 };
  const cursorXSpring = useSpring(cursorX, springConfig);
  const cursorYSpring = useSpring(cursorY, springConfig);

  useEffect(() => {
    const moveCursor = (e) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);

      // בדיקה אם העכבר מעל אלמנט לחיץ
      const target = e.target;
      const isClickable = target.closest('button, a, input, textarea, [role="button"], [onclick]');
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

  // הסתר על מכשירים ניידים (ללא עכבר)
  if (typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0)) {
    return null;
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed top-0 left-0 pointer-events-none z-[9999] mix-blend-difference"
          style={{
            x: cursorXSpring,
            y: cursorYSpring,
          }}
        >
          {/* Blob חיצוני - גדול יותר עם אפקט מורפינג */}
          <motion.div
            className="absolute -translate-x-1/2 -translate-y-1/2"
            animate={{
              scale: isPointer ? 1.5 : 1,
              width: isPointer ? 60 : 40,
              height: isPointer ? 60 : 40,
            }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 20,
            }}
          >
            <svg
              width="100%"
              height="100%"
              viewBox="0 0 200 200"
              xmlns="http://www.w3.org/2000/svg"
            >
              <motion.path
                fill="white"
                animate={{
                  d: isPointer
                    ? "M44.7,-76.4C58.8,-69.2,71.8,-59.1,79.6,-45.8C87.4,-32.6,90,-16.3,88.5,-0.9C87,14.6,81.4,29.2,73.1,42.8C64.8,56.4,53.8,69,40.1,76.3C26.4,83.6,10,85.6,-5.8,84.4C-21.6,83.2,-43.2,78.8,-58.4,68.6C-73.6,58.4,-82.4,42.4,-86.8,25.2C-91.2,8,-91.2,-10.4,-85.8,-26.8C-80.4,-43.2,-69.6,-57.6,-55.8,-65C-42,-72.4,-24.2,-72.8,-8.4,-77.6C7.4,-82.4,30.6,-83.6,44.7,-76.4Z"
                    : "M37.8,-65.5C49.5,-58.3,59.7,-48.9,66.2,-37.1C72.7,-25.3,75.5,-11.1,75.1,3.3C74.7,17.7,71.1,32.4,63.2,44.3C55.3,56.2,43.1,65.3,29.4,70.8C15.7,76.3,0.5,78.2,-14.3,75.8C-29.1,73.4,-43.5,66.7,-55.8,56.8C-68.1,46.9,-78.3,33.8,-82.4,19.1C-86.5,4.4,-84.5,-11.9,-77.8,-25.5C-71.1,-39.1,-59.7,-50,-46.5,-57.6C-33.3,-65.2,-18.2,-69.5,-2.8,-68.4C12.6,-67.3,26.1,-72.7,37.8,-65.5Z",
                  scale: isPointer ? [1, 1.05, 1] : [1, 1.02, 1],
                }}
                transition={{
                  d: {
                    duration: 0.8,
                    ease: "easeInOut",
                  },
                  scale: {
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  },
                }}
              />
            </svg>
          </motion.div>

          {/* נקודה מרכזית קטנה */}
          <motion.div
            className="absolute w-1.5 h-1.5 bg-white rounded-full -translate-x-1/2 -translate-y-1/2"
            animate={{
              scale: isPointer ? 0 : 1,
            }}
            transition={{
              type: "spring",
              stiffness: 500,
              damping: 30,
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
import React, { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring, AnimatePresence } from 'framer-motion';

export default function BlobCursor() {
  const [isVisible, setIsVisible] = useState(false);
  const [isPointer, setIsPointer] = useState(false);
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);

  const springConfig = { damping: 20, stiffness: 150, mass: 0.8 };
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
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Blob אורגני מרכזי */}
          <motion.div
            className="fixed top-0 left-0 pointer-events-none z-[9999]"
            style={{
              x: cursorXSpring,
              y: cursorYSpring,
            }}
          >
            <motion.div
              className="absolute -translate-x-1/2 -translate-y-1/2"
              animate={{
                scale: isPointer ? 1.8 : 1,
              }}
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 25,
              }}
            >
              <svg
                width={isPointer ? "80" : "50"}
                height={isPointer ? "80" : "50"}
                viewBox="0 0 200 200"
                xmlns="http://www.w3.org/2000/svg"
                className="transition-all duration-300"
              >
                <defs>
                  <linearGradient id="blobGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{ stopColor: '#60A5FA', stopOpacity: 0.9 }} />
                    <stop offset="50%" style={{ stopColor: '#A78BFA', stopOpacity: 0.9 }} />
                    <stop offset="100%" style={{ stopColor: '#EC4899', stopOpacity: 0.9 }} />
                  </linearGradient>
                  <filter id="gooey">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur" />
                    <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -8" result="goo" />
                    <feComposite in="SourceGraphic" in2="goo" operator="atop"/>
                  </filter>
                </defs>
                <motion.path
                  fill="url(#blobGradient)"
                  filter="url(#gooey)"
                  animate={{
                    d: isPointer
                      ? [
                          "M47.3,-77.9C59.9,-70.1,67.8,-54.2,74.2,-38.1C80.6,-22,85.5,-5.7,83.8,9.8C82.1,25.3,73.8,40.1,62.6,51.8C51.4,63.5,37.3,72.1,21.8,77.4C6.3,82.7,-10.6,84.7,-26.3,81.2C-42,77.7,-56.5,68.7,-67.8,55.9C-79.1,43.1,-87.2,26.5,-89.1,9.2C-91,-8.1,-86.7,-26.1,-77.9,-40.8C-69.1,-55.5,-55.8,-66.9,-41.1,-73.9C-26.4,-80.9,-10.4,-83.5,4.7,-81.2C19.8,-78.9,34.7,-85.7,47.3,-77.9Z",
                          "M51.2,-83.8C64.8,-74.5,73.8,-58.3,79.3,-41.8C84.8,-25.3,86.8,-8.5,84.3,7.4C81.8,23.3,74.8,38.3,64.9,50.6C55,62.9,42.2,72.5,27.8,78.2C13.4,83.9,-2.6,85.7,-18.2,82.3C-33.8,78.9,-49,70.3,-61.5,58.3C-74,46.3,-83.8,30.9,-87.4,14.2C-91,-2.5,-88.4,-20.5,-80.6,-35.8C-72.8,-51.1,-59.8,-63.7,-45.1,-72.6C-30.4,-81.5,-14.2,-86.7,2.3,-85.6C18.8,-84.5,37.6,-93.1,51.2,-83.8Z",
                          "M44.7,-76.4C58.8,-69.2,71.8,-59.1,79.6,-45.8C87.4,-32.6,90,-16.3,88.5,-0.9C87,14.6,81.4,29.2,73.1,42.8C64.8,56.4,53.8,69,40.1,76.3C26.4,83.6,10,85.6,-5.8,84.4C-21.6,83.2,-43.2,78.8,-58.4,68.6C-73.6,58.4,-82.4,42.4,-86.8,25.2C-91.2,8,-91.2,-10.4,-85.8,-26.8C-80.4,-43.2,-69.6,-57.6,-55.8,-65C-42,-72.4,-24.2,-72.8,-8.4,-77.6C7.4,-82.4,30.6,-83.6,44.7,-76.4Z"
                        ]
                      : [
                          "M37.8,-65.5C49.5,-58.3,59.7,-48.9,66.2,-37.1C72.7,-25.3,75.5,-11.1,75.1,3.3C74.7,17.7,71.1,32.4,63.2,44.3C55.3,56.2,43.1,65.3,29.4,70.8C15.7,76.3,0.5,78.2,-14.3,75.8C-29.1,73.4,-43.5,66.7,-55.8,56.8C-68.1,46.9,-78.3,33.8,-82.4,19.1C-86.5,4.4,-84.5,-11.9,-77.8,-25.5C-71.1,-39.1,-59.7,-50,-46.5,-57.6C-33.3,-65.2,-18.2,-69.5,-2.8,-68.4C12.6,-67.3,26.1,-72.7,37.8,-65.5Z",
                          "M42.1,-71.8C54.3,-63.9,63.7,-52.1,69.8,-38.9C75.9,-25.7,78.7,-11.1,78.2,3.7C77.7,18.5,73.9,33.5,66.3,46.2C58.7,58.9,47.3,69.3,33.8,75.4C20.3,81.5,4.7,83.3,-10.2,81.7C-25.1,80.1,-39.3,75.1,-52.4,67.2C-65.5,59.3,-77.5,48.5,-83.8,35.1C-90.1,21.7,-90.7,5.7,-87.9,-9.1C-85.1,-23.9,-78.9,-37.5,-69.3,-48.4C-59.7,-59.3,-46.7,-67.5,-33.2,-75C-19.7,-82.5,-4.7,-89.3,8.9,-86.8C22.5,-84.3,29.9,-79.7,42.1,-71.8Z",
                          "M39.4,-68.2C50.8,-60.5,59.4,-48.7,65.7,-35.6C72,-22.5,76,-8.1,75.8,6.4C75.6,20.9,71.2,35.5,63.4,47.8C55.6,60.1,44.4,70.1,31.2,75.8C18,81.5,2.8,82.9,-13.1,81.2C-29,79.5,-45.6,74.7,-58.9,65.4C-72.2,56.1,-82.2,42.3,-86.5,26.8C-90.8,11.3,-89.4,-5.9,-83.7,-21.2C-78,-36.5,-68,-50,-55.4,-57.4C-42.8,-64.8,-27.6,-66.1,-13.7,-68.9C0.2,-71.7,28,-75.9,39.4,-68.2Z"
                        ]
                  }}
                  transition={{
                    duration: isPointer ? 0.6 : 4,
                    repeat: Infinity,
                    repeatType: "reverse",
                    ease: "easeInOut",
                  }}
                />
              </svg>
            </motion.div>

            {/* Glow effect */}
            <motion.div
              className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(96,165,250,0.4) 0%, rgba(167,139,250,0.3) 50%, transparent 70%)',
                filter: 'blur(15px)',
              }}
              animate={{
                width: isPointer ? 100 : 60,
                height: isPointer ? 100 : 60,
              }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 20,
              }}
            />
          </motion.div>

          {/* נקודה מרכזית */}
          <motion.div
            className="fixed top-0 left-0 pointer-events-none"
            style={{
              x: cursorX,
              y: cursorY,
            }}
          >
            <motion.div
              className="absolute w-2 h-2 bg-white rounded-full -translate-x-1/2 -translate-y-1/2 shadow-lg"
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
        </>
      )}
    </AnimatePresence>
  );
}
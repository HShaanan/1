import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const slogans = [
  'הכי קרוב אליך',
  'קרוב לבית, קרוב ללב', 
  'עסקים ושירותים שמותאמים רק לך'
];

export default function SloganBanner() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slogans.length);
    }, 5000); // החלפה כל 5 שניות

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="sticky top-20 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 shadow-lg z-10 overflow-hidden">
      {/* רקע עדין */}
      <div className="absolute inset-0">
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/3 to-transparent"
          animate={{
            x: ['-200%', '200%']
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: 'linear'
          }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 relative">
        <div className="flex items-center justify-center min-h-[80px]">
          
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              className="text-center"
            >
              <motion.h2 
                className="text-2xl md:text-3xl lg:text-4xl font-bold text-white drop-shadow-lg"
                initial={{ 
                  opacity: 0,
                  y: 30,
                  filter: 'blur(8px)',
                  scale: 0.9
                }}
                animate={{ 
                  opacity: 1,
                  y: 0,
                  filter: 'blur(0px)',
                  scale: 1
                }}
                exit={{ 
                  opacity: 0,
                  y: -30,
                  filter: 'blur(8px)',
                  scale: 0.9
                }}
                transition={{
                  duration: 1.2,
                  ease: [0.25, 0.46, 0.45, 0.94]
                }}
              >
                {slogans[currentIndex].split(' ').map((word, wordIndex) => (
                  <motion.span
                    key={wordIndex}
                    className="inline-block ml-2"
                    initial={{ 
                      opacity: 0, 
                      y: 20,
                      filter: 'blur(4px)'
                    }}
                    animate={{ 
                      opacity: 1, 
                      y: 0,
                      filter: 'blur(0px)'
                    }}
                    transition={{
                      delay: wordIndex * 0.15,
                      duration: 0.8,
                      ease: "easeOut"
                    }}
                  >
                    {word.split('').map((char, charIndex) => (
                      <motion.span
                        key={charIndex}
                        className="inline-block"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{
                          delay: (wordIndex * 0.15) + (charIndex * 0.03),
                          duration: 0.3
                        }}
                        whileHover={{
                          scale: 1.1,
                          color: '#fbbf24',
                          transition: { duration: 0.2 }
                        }}
                      >
                        {char}
                      </motion.span>
                    ))}
                    {wordIndex < slogans[currentIndex].split(' ').length - 1 && '\u00A0'}
                  </motion.span>
                ))}
              </motion.h2>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* קו תחתון זורם */}
      <div className="absolute bottom-0 left-0 right-0 h-1">
        <motion.div
          className="h-full bg-gradient-to-r from-yellow-400/80 via-pink-400/80 to-purple-400/80"
          animate={{
            backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'linear'
          }}
          style={{
            backgroundSize: '200% 100%'
          }}
        />
      </div>
    </div>
  );
}
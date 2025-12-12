import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function WordSlider({ words = [], interval = 2500, className = "" }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % words.length);
    }, interval);
    return () => clearInterval(timer);
  }, [words.length, interval]);

  // Calculate the maximum width to avoid layout shifts
  // Ideally this would be dynamic, but a min-width helps
  
  return (
    <span className={`inline-flex relative overflow-hidden h-[1.3em] align-top justify-center px-1 ${className}`}>
      <AnimatePresence mode="popLayout">
        <motion.span
          key={index}
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: "0%", opacity: 1 }}
          exit={{ y: "-100%", opacity: 0 }}
          transition={{ type: "spring", stiffness: 100, damping: 20 }}
          className="absolute whitespace-nowrap text-purple-600"
        >
          {words[index]}
        </motion.span>
      </AnimatePresence>
      {/* Invisible element to reserve space for the longest word to prevent jumping */}
      <span className="invisible" aria-hidden="true">
        {words.reduce((a, b) => a.length > b.length ? a : b, "")}
      </span>
    </span>
  );
}
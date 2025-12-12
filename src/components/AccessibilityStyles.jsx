import React from 'react';

export default function AccessibilityStyles() {
  return (
    <style>{`
      /* High Contrast */
      .high-contrast body {
        background-color: #000000 !important;
        color: #ffffff !important;
      }
      
      /* התפריט עצמו יישאר תמיד לבן */
      #accessibility-panel,
      #accessibility-panel *,
      #accessibility-overlay {
        background-color: white !important;
        color: black !important;
        border-color: #e5e7eb !important;
      }
      
      /* כפתורי התפריט יישארו גלויים תמיד */
      #accessibility-panel button {
        background-color: white !important;
        color: black !important;
        border: 1px solid #d1d5db !important;
      }
      
      /* כפתורים פעילים */
      #accessibility-panel button[data-active="true"],
      #accessibility-panel .bg-blue-600,
      #accessibility-panel .bg-primary {
        background-color: #2563eb !important;
        color: white !important;
        border-color: #2563eb !important;
      }
      
      /* כפתורים בהובר */
      #accessibility-panel button:hover {
        background-color: #f3f4f6 !important;
        color: black !important;
      }
      
      /* כפתורים פעילים בהובר */
      #accessibility-panel button[data-active="true"]:hover,
      #accessibility-panel .bg-blue-600:hover {
        background-color: #1d4ed8 !important;
        color: white !important;
      }
      
      /* החרגת התפריט מהניגודיות */
      .high-contrast *:not(#accessibility-panel):not(#accessibility-panel *):not(#accessibility-overlay) {
        color: #ffffff !important;
        border-color: #ffffff !important;
      }

      /* רקעים יהיו שחורים - מלבד התפריט */
      .high-contrast [class*="bg-"]:not(#accessibility-panel):not(#accessibility-panel *):not(#accessibility-overlay),
      .high-contrast .card:not(#accessibility-panel):not(#accessibility-panel *):not(#accessibility-overlay),
      .high-contrast button:not(#accessibility-panel button):not(#accessibility-panel button *):not(#accessibility-overlay),
      .high-contrast input:not(#accessibility-panel input):not(#accessibility-panel input *):not(#accessibility-overlay),
      .high-contrast select:not(#accessibility-panel select):not(#accessibility-panel select *):not(#accessibility-overlay),
      .high-contrast textarea:not(#accessibility-panel textarea):not(#accessibility-panel textarea *):not(#accessibility-overlay) {
          background-color: #000000 !important;
          background-image: none !important;
          border: 1px solid #ffffff !important;
      }

      /* תמונות - הופך צבעים - מלבד התפריט */
      .high-contrast img:not(#accessibility-panel img):not(#accessibility-panel img *):not(#accessibility-overlay), 
      .high-contrast svg:not(#accessibility-panel svg):not(#accessibility-panel svg *):not(#accessibility-overlay) {
        filter: invert(1) !important;
      }
      
      /* קישורים - מלבד התפריט */
      .high-contrast a:not(#accessibility-panel a):not(#accessibility-panel a *):not(#accessibility-overlay) {
        color: #ffff00 !important;
        text-decoration: underline !important;
      }

      /* הדגשת קישורים */
      .highlight-links a:not(#accessibility-panel a) {
        background-color: yellow !important;
        color: black !important;
        padding: 2px 4px !important;
        border-radius: 3px !important;
      }

      /* עצירת אנימציות */
      .pause-animations *:not(#accessibility-panel *) {
        animation-duration: 0s !important;
        transition-duration: 0s !important;
      }

      /* ניווט מקלדת */
      .keyboard-navigation *:focus {
        outline: 3px solid #0066cc !important;
        outline-offset: 2px !important;
      }

      /* אנימציות LED מתקדמות */
      @keyframes ledPulse {
        0% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.05); opacity: 0.8; }
        100% { transform: scale(1); opacity: 1; }
      }
      
      @keyframes ledGlow {
        0% { box-shadow: 0 0 5px currentColor; }
        50% { box-shadow: 0 0 20px currentColor, 0 0 30px currentColor; }
        100% { box-shadow: 0 0 5px currentColor; }
      }
      
      @keyframes radioWave {
        0% { transform: scale(1); opacity: 1; }
        100% { transform: scale(1.5); opacity: 0; }
      }
      
      /* דיליי אנימציות */
      .animation-delay-75 { animation-delay: 75ms; }
      .animation-delay-100 { animation-delay: 100ms; }
      .animation-delay-150 { animation-delay: 150ms; }
      .animation-delay-200 { animation-delay: 200ms; }
      .animation-delay-225 { animation-delay: 225ms; }
      .animation-delay-300 { animation-delay: 300ms; }
      .animation-delay-400 { animation-delay: 400ms; }
      .animation-delay-500 { animation-delay: 500ms; }
      .animation-delay-600 { animation-delay: 600ms; }
      
      /* אפקטים מיוחדים */
      .led-emergency {
        animation: ledPulse 0.5s ease-in-out infinite;
      }
      
      .led-warning {
        animation: ledPulse 1s ease-in-out infinite;
      }
      
      .led-info {
        animation: ledPulse 2s ease-in-out infinite;
      }
      
      /* רספונסיביות LED */
      @media (max-width: 768px) {
        .led-button {
          padding: 0.5rem 0.75rem;
        }
        .led-button span {
          font-size: 0.75rem;
        }
      }
    `}</style>
  );
}
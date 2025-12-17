import React from 'react';

export default function AccessibilityStyles({ settings }) {
  if (!settings) return null;

  return (
    <style>{`
      :root {
        --a11y-font-scale: ${settings.fontSize / 100};
      }

      html {
        font-size: ${settings.fontSize}% !important; /* Base REM adjustment */
      }

      /* Exclude the widget itself from effects */
      #accessibility-widget,
      #accessibility-widget * {
        filter: none !important;
        font-family: system-ui, -apple-system, sans-serif !important;
        font-size: 16px !important; 
        line-height: 1.5 !important;
        letter-spacing: normal !important;
        background-color: transparent; /* Reset specifically for high contrast modes */
        color: inherit;
        text-shadow: none !important;
        box-shadow: none;
      }
      
      /* Force widget panel background and text */
      #accessibility-panel {
        background-color: #ffffff !important;
        color: #1f2937 !important;
        opacity: 1 !important;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25) !important;
        border: 1px solid #e5e7eb !important;
      }
      #accessibility-panel * {
        color: #1f2937 !important;
        opacity: 1 !important;
      }
      #accessibility-panel button {
         background-color: #ffffff;
      }
      #accessibility-panel button:hover {
         background-color: #f9fafb;
      }
      #accessibility-panel button[aria-pressed="true"] {
         background-color: #eff6ff !important; /* Light blue bg */
         color: #1e40af !important; /* Dark blue text */
         border-color: #bfdbfe !important;
      }
      #accessibility-panel button[aria-pressed="true"] * {
         color: #1e40af !important;
      }
      #accessibility-panel .bg-blue-600 {
         background-color: #2563eb !important;
         color: white !important;
      }
      #accessibility-panel .bg-blue-600 * {
         color: white !important;
      }


      /* --- Features --- */

      ${settings.grayscale ? `
        html { filter: grayscale(100%); }
        body { position: relative; } 
      ` : ''}

      ${settings.invertColors ? `
        html { filter: invert(100%); }
        img, video, iframe, #accessibility-widget { filter: invert(100%); }
      ` : ''}

      ${settings.highContrast ? `
        body, main, div, span, p, a, h1, h2, h3, h4, h5, h6, input, button, select, label {
           background-color: #000000 !important;
           color: #ffff00 !important;
           border-color: #ffff00 !important;
        }
        img, video, svg:not(#accessibility-widget svg) {
           filter: grayscale(100%) contrast(150%);
        }
        /* Buttons in high contrast */
        button, a.button {
           border: 2px solid #ffff00 !important;
           background: #000000 !important;
           color: #ffff00 !important;
        }
        a {
           text-decoration: underline !important;
           color: #00ff00 !important; /* Slightly different for links */
        }
      ` : ''}

      ${settings.highlightLinks ? `
        a:not(#accessibility-widget a) {
           text-decoration: underline !important;
           text-decoration-thickness: 2px !important;
           text-underline-offset: 4px !important;
           background-color: rgba(255, 255, 0, 0.2) !important;
           color: inherit !important;
           font-weight: 700 !important;
        }
      ` : ''}

      ${settings.readableFont ? `
        body, h1, h2, h3, h4, h5, h6, p, a, span, div, button, input, textarea, select {
           font-family: "Segoe UI", "Roboto", "Arial", sans-serif !important;
           letter-spacing: 0.5px !important;
           word-spacing: 2px !important;
           line-height: 1.8 !important;
        }
      ` : ''}

      ${settings.highlightHeaders ? `
        h1, h2, h3, h4, h5, h6 {
           background-color: rgba(37, 99, 235, 0.1) !important;
           border-right: 4px solid #2563eb !important;
           padding: 8px 12px !important;
           width: fit-content;
           border-radius: 4px;
        }
      ` : ''}

      ${settings.pauseAnimations ? `
        *, *::before, *::after {
           animation-duration: 0.001s !important;
           animation-iteration-count: 1 !important;
           transition-duration: 0.001s !important;
           scroll-behavior: auto !important;
        }
      ` : ''}

      ${settings.bigCursor ? `
        html, body, a, button, [role="button"] {
           cursor: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 24 24' fill='black' stroke='white' stroke-width='2'%3E%3Cpath d='M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z'/%3E%3C/svg%3E"), auto !important;
        }
      ` : ''}

      ${settings.focusHighlight ? `
        *:focus-visible {
           outline: 4px solid #ff0000 !important;
           outline-offset: 4px !important;
           box-shadow: 0 0 0 6px rgba(255, 255, 255, 0.9) !important;
           z-index: 99999;
        }
      ` : ''}
      
      ${settings.hideImages ? `
        img, video, [role="img"], [style*="background-image"] {
           opacity: 0 !important;
           visibility: hidden !important;
        }
      ` : ''}

      ${settings.readingGuide ? `
        body::after {
           content: "";
           display: block;
           position: fixed;
           top: var(--reading-guide-top, 50%);
           left: 0;
           width: 100vw;
           height: 4px;
           background-color: rgba(255, 0, 0, 0.7);
           z-index: 999999;
           pointer-events: none;
           box-shadow: 0 0 0 100vh rgba(0, 0, 0, 0.5);
        }
      ` : ''}

    `}</style>
  );
}
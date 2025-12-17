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
        /* Ensure widget text size stays readable but not double-scaled if using rems inside */
        font-size: 16px !important; 
        line-height: 1.5 !important;
        letter-spacing: normal !important;
        background-color: transparent; /* Reset specifically for high contrast modes */
        color: inherit;
      }
      
      /* Force widget panel background and text */
      #accessibility-panel {
        background-color: #ffffff !important;
        color: #1f2937 !important;
      }
      #accessibility-panel * {
        color: #1f2937 !important;
      }
      #accessibility-panel button {
         background-color: #f3f4f6; /* Default gray for buttons */
      }
      #accessibility-panel button[aria-pressed="true"] {
         background-color: #2563eb !important; /* Blue for active */
         color: #ffffff !important;
      }
      #accessibility-panel button[aria-pressed="true"] * {
         color: #ffffff !important;
      }


      /* --- Features --- */

      ${settings.grayscale ? `
        html { filter: grayscale(100%); }
        /* Fix fixed elements getting weird with filters */
        body { position: relative; } 
      ` : ''}

      ${settings.highContrast ? `
        body, main, div, span, p, a, h1, h2, h3, h4, h5, h6, input, button, select, label {
           background-color: #000000 !important;
           color: #ffff00 !important;
           border-color: #ffff00 !important;
        }
        img, video, svg:not(#accessibility-widget svg) {
           filter: invert(1) grayscale(100%) contrast(200%);
        }
        /* Buttons in high contrast */
        button, a.button {
           border: 2px solid #ffff00 !important;
           background: #000000 !important;
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
           padding: 0 4px;
        }
      ` : ''}

      ${settings.readableFont ? `
        body, h1, h2, h3, h4, h5, h6, p, a, span, div, button, input, textarea, select {
           font-family: "Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif !important;
           letter-spacing: 0.5px !important;
           word-spacing: 2px !important;
        }
      ` : ''}

      ${settings.highlightHeaders ? `
        h1, h2, h3, h4, h5, h6 {
           background-color: rgba(0, 0, 255, 0.1) !important;
           border-right: 4px solid #2563eb !important;
           padding-right: 8px !important;
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
           box-shadow: 0 0 0 8px rgba(255, 255, 255, 0.8) !important;
           z-index: 99999;
        }
      ` : ''}
      
      ${settings.hideImages ? `
        img, video, [role="img"] {
           opacity: 0 !important;
           visibility: hidden !important;
        }
        /* Show alt text if possible, though CSS can't easily force alt text display for hidden imgs. 
           Instead we usually hide the image. Users use screen readers. */
      ` : ''}

    `}</style>
  );
}
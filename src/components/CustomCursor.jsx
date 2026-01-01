import React, { useEffect, useState } from 'react';

export default function CustomCursor() {
  const [position, setPosition] = useState({ x: -100, y: -100 });
  const [isClicking, setIsClicking] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    const updatePosition = (e) => {
      setPosition({ x: e.clientX, y: e.clientY });
    };

    const handleMouseDown = () => setIsClicking(true);
    const handleMouseUp = () => setIsClicking(false);

    const handleMouseOver = (e) => {
      const target = e.target;
      const isInteractive = target.closest('button, a, [role="button"], input, textarea, select, [onclick]');
      setIsHovering(!!isInteractive);
    };

    window.addEventListener('mousemove', updatePosition);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mouseover', handleMouseOver);

    return () => {
      window.removeEventListener('mousemove', updatePosition);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mouseover', handleMouseOver);
    };
  }, []);

  return (
    <>
      <style>{`
        * {
          cursor: none !important;
        }
        
        .custom-cursor {
          position: fixed;
          pointer-events: none;
          z-index: 99999;
          mix-blend-mode: difference;
        }
        
        .cursor-dot {
          width: 12px;
          height: 12px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 50%;
          transform: translate(-50%, -50%);
          transition: transform 0.15s ease, width 0.2s ease, height 0.2s ease;
          box-shadow: 0 0 20px rgba(102, 126, 234, 0.6), 0 0 40px rgba(118, 75, 162, 0.4);
        }
        
        .cursor-dot.clicking {
          transform: translate(-50%, -50%) scale(0.7);
        }
        
        .cursor-dot.hovering {
          width: 18px;
          height: 18px;
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          box-shadow: 0 0 25px rgba(240, 147, 251, 0.7), 0 0 50px rgba(245, 87, 108, 0.5);
        }
        
        .cursor-ring {
          width: 40px;
          height: 40px;
          border: 2px solid;
          border-image: linear-gradient(135deg, #667eea, #764ba2, #f093fb) 1;
          border-radius: 50%;
          transform: translate(-50%, -50%);
          transition: width 0.3s ease, height 0.3s ease, opacity 0.2s ease;
          opacity: 0.6;
          animation: pulse-ring 2s ease-in-out infinite;
        }
        
        .cursor-ring.clicking {
          width: 30px;
          height: 30px;
          opacity: 1;
        }
        
        .cursor-ring.hovering {
          width: 55px;
          height: 55px;
          opacity: 0.8;
          border-width: 3px;
        }
        
        @keyframes pulse-ring {
          0%, 100% {
            opacity: 0.4;
          }
          50% {
            opacity: 0.7;
          }
        }
        
        .cursor-trail {
          position: absolute;
          width: 6px;
          height: 6px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 50%;
          opacity: 0.4;
          animation: fade-out 0.6s ease-out forwards;
        }
        
        @keyframes fade-out {
          to {
            opacity: 0;
            transform: scale(0);
          }
        }
      `}</style>

      <div className="custom-cursor" style={{ left: position.x, top: position.y }}>
        <div className={`cursor-ring ${isClicking ? 'clicking' : ''} ${isHovering ? 'hovering' : ''}`} />
        <div className={`cursor-dot ${isClicking ? 'clicking' : ''} ${isHovering ? 'hovering' : ''}`} />
      </div>
    </>
  );
}
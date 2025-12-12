import React, { useRef, useEffect, useState } from 'react';

// Hook for scroll-triggered animations
export function useScrollAnimation(options = {}) {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setIsVisible(true);
          if (!options.repeat) {
            setHasAnimated(true);
          }
        } else if (options.repeat) {
          setIsVisible(entry.isIntersecting);
        }
      },
      { 
        threshold: options.threshold || 0.1,
        rootMargin: options.rootMargin || '0px 0px -50px 0px'
      }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [hasAnimated, options.repeat, options.threshold, options.rootMargin]);

  return { ref, isVisible };
}

// Animated wrapper component
export function ScrollReveal({ 
  children, 
  animation = 'fadeUp', 
  delay = 0, 
  duration = 600,
  className = '',
  ...props 
}) {
  const { ref, isVisible } = useScrollAnimation(props);

  const animations = {
    fadeUp: {
      initial: 'opacity-0 translate-y-12',
      animate: 'opacity-100 translate-y-0'
    },
    fadeDown: {
      initial: 'opacity-0 -translate-y-12',
      animate: 'opacity-100 translate-y-0'
    },
    fadeLeft: {
      initial: 'opacity-0 translate-x-12',
      animate: 'opacity-100 translate-x-0'
    },
    fadeRight: {
      initial: 'opacity-0 -translate-x-12',
      animate: 'opacity-100 translate-x-0'
    },
    fadeIn: {
      initial: 'opacity-0',
      animate: 'opacity-100'
    },
    scaleUp: {
      initial: 'opacity-0 scale-90',
      animate: 'opacity-100 scale-100'
    },
    scaleDown: {
      initial: 'opacity-0 scale-110',
      animate: 'opacity-100 scale-100'
    },
    rotateIn: {
      initial: 'opacity-0 rotate-12',
      animate: 'opacity-100 rotate-0'
    },
    slideUp: {
      initial: 'opacity-0 translate-y-24',
      animate: 'opacity-100 translate-y-0'
    },
    blur: {
      initial: 'opacity-0 blur-sm',
      animate: 'opacity-100 blur-0'
    }
  };

  const { initial, animate } = animations[animation] || animations.fadeUp;

  return (
    <div
      ref={ref}
      className={`
        transition-all transform
        ${isVisible ? animate : initial}
        ${className}
      `}
      style={{
        transitionDuration: `${duration}ms`,
        transitionDelay: `${delay}ms`,
        transitionTimingFunction: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
      }}
    >
      {children}
    </div>
  );
}

// Stagger children animation
export function StaggerContainer({ 
  children, 
  staggerDelay = 100, 
  animation = 'fadeUp',
  className = '',
  ...props
}) {
  const { ref, isVisible } = useScrollAnimation(props);

  return (
    <div ref={ref} className={className}>
      {React.Children.map(children, (child, index) => (
        <div
          className={`
            transition-all transform
            ${isVisible 
              ? 'opacity-100 translate-y-0' 
              : 'opacity-0 translate-y-8'
            }
          `}
          style={{
            transitionDuration: '600ms',
            transitionDelay: `${index * staggerDelay}ms`,
            transitionTimingFunction: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
          }}
        >
          {child}
        </div>
      ))}
    </div>
  );
}

// Parallax scroll effect
export function ParallaxSection({ 
  children, 
  speed = 0.5, 
  className = '' 
}) {
  const ref = useRef(null);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const scrolled = window.innerHeight - rect.top;
      setOffset(scrolled * speed * 0.1);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [speed]);

  return (
    <div 
      ref={ref} 
      className={className}
      style={{ transform: `translateY(${offset}px)` }}
    >
      {children}
    </div>
  );
}

// Number counter animation
export function CountUp({ target, duration = 2000, suffix = '', prefix = '' }) {
  const [count, setCount] = useState(0);
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.3 });
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    if (isVisible && !hasStarted) {
      setHasStarted(true);
      const steps = 60;
      const increment = target / steps;
      let current = 0;
      const interval = setInterval(() => {
        current += increment;
        if (current >= target) {
          setCount(target);
          clearInterval(interval);
        } else {
          setCount(Math.floor(current));
        }
      }, duration / steps);
      return () => clearInterval(interval);
    }
  }, [isVisible, target, duration, hasStarted]);

  return <span ref={ref}>{prefix}{count.toLocaleString()}{suffix}</span>;
}

// Scroll progress indicator
export function useScrollProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrolled = (window.scrollY / scrollHeight) * 100;
      setProgress(Math.min(100, Math.max(0, scrolled)));
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return progress;
}

// Reveal on scroll with different effects
export function RevealOnScroll({ 
  children, 
  effect = 'slide', 
  direction = 'up',
  className = ''
}) {
  const { ref, isVisible } = useScrollAnimation();

  const getTransform = () => {
    if (!isVisible) {
      switch (direction) {
        case 'up': return 'translateY(60px)';
        case 'down': return 'translateY(-60px)';
        case 'left': return 'translateX(60px)';
        case 'right': return 'translateX(-60px)';
        default: return 'translateY(60px)';
      }
    }
    return 'translate(0)';
  };

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: getTransform(),
        transition: 'all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
      }}
    >
      {children}
    </div>
  );
}

export default ScrollReveal;
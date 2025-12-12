import React from "react";

export default function AnimatedCounter({ value = 0, duration = 1200, prefix = "", suffix = "", className = "" }) {
  const [display, setDisplay] = React.useState(0);

  React.useEffect(() => {
    const start = performance.now();
    const from = 0;
    const to = Number(value) || 0;

    const step = (t) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      const current = Math.round(from + (to - from) * eased);
      setDisplay(current);
      if (p < 1) requestAnimationFrame(step);
    };

    requestAnimationFrame(step);
  }, [value, duration]);

  return (
    <span className={className}>
      {prefix}{display.toLocaleString()}{suffix}
    </span>
  );
}
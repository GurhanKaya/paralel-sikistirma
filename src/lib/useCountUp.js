import { useEffect, useRef, useState } from "react";

// Bir sayıyı 0'dan hedefe doğru animasyonlu sayar (count-up efekti)
export function useCountUp(target, duration = 900, decimals = 0) {
  const [value, setValue] = useState(0);
  const rafRef = useRef();

  useEffect(() => {
    const to = Number(target) || 0;
    let startTime;

    function step(now) {
      if (!startTime) startTime = now;
      const p = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
      setValue(to * eased);
      if (p < 1) rafRef.current = requestAnimationFrame(step);
    }

    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);

  return Number(value).toFixed(decimals);
}

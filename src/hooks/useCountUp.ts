import { useEffect, useRef, useState } from "react";
import { AccessibilityInfo } from "react-native";
import { motion } from "../utils/tokens";

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

/**
 * Eases a headline number from its previous value to `target` — Home's
 * Worth/Month totals, Overview hero figures. JS-driven (not Reanimated): it
 * runs once per value change, not continuously, so a `requestAnimationFrame`
 * loop is simpler than standing up a worklet for it.
 */
export const useCountUp = (target: number, duration = motion.countUpDuration) => {
  const [value, setValue] = useState(target);
  const fromRef = useRef(target);
  const rafRef = useRef<number | null>(null);
  const reducedMotionRef = useRef(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled?.()
      .then((enabled) => {
        reducedMotionRef.current = enabled;
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const from = fromRef.current;
    if (from === target || reducedMotionRef.current) {
      fromRef.current = target;
      setValue(target);
      return;
    }
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutCubic(progress);
      setValue(from + (target - from) * eased);
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = target;
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, duration]);

  return value;
};

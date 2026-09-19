"use client";

import { useEffect, useRef, useState } from "react";
import { useInView, useReducedMotion } from "framer-motion";

type Parsed = { prefix: string; number: number; suffix: string; decimals: number };

/** Split "98%" or "₹1.2M+" into an animatable number plus its decoration. */
function parseValue(value: string): Parsed | null {
  const match = value.match(/^(\D*?)(\d+(?:\.\d+)?)(.*)$/s);
  if (!match) return null;
  const [, prefix = "", digits = "0", suffix = ""] = match;
  const decimals = digits.includes(".") ? digits.split(".")[1]!.length : 0;
  return { prefix, number: Number(digits), suffix, decimals };
}

/**
 * Counts up to a CMS-provided metric when it scrolls into view. Non-numeric
 * values (e.g. "Growing") are rendered verbatim.
 */
export function Counter({ value, className }: { value: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const reduce = useReducedMotion();
  const parsed = parseValue(value);
  const [display, setDisplay] = useState(() => (parsed && !reduce ? formatted(parsed, 0) : value));

  useEffect(() => {
    if (!parsed || reduce || !inView) {
      if (parsed && reduce) setDisplay(value);
      return;
    }

    let frame = 0;
    const duration = 1400;
    const start = performance.now();

    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(formatted(parsed, parsed.number * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [inView, parsed, reduce, value]);

  return (
    <span ref={ref} className={className}>
      {parsed ? display : value}
    </span>
  );
}

function formatted(parsed: Parsed, current: number): string {
  const number = parsed.decimals
    ? current.toFixed(parsed.decimals)
    : Math.round(current).toLocaleString("en-IN");
  return `${parsed.prefix}${number}${parsed.suffix}`;
}

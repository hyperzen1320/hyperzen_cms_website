"use client";

import { useCallback, useRef } from "react";
import { cn } from "@/lib/utils";

/**
 * Card with a cursor-following highlight. Implemented with CSS custom
 * properties so no React state updates (and therefore no re-renders) happen
 * while the pointer moves.
 */
export function SpotlightCard({
  children,
  className,
  as: Component = "div",
  radius = 340,
}: {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
  radius?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const handleMove = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "mouse") return;
    const element = ref.current;
    if (!element) return;
    const rect = element.getBoundingClientRect();
    element.style.setProperty("--spot-x", `${event.clientX - rect.left}px`);
    element.style.setProperty("--spot-y", `${event.clientY - rect.top}px`);
    element.style.setProperty("--spot-opacity", "1");
  }, []);

  const handleLeave = useCallback(() => {
    ref.current?.style.setProperty("--spot-opacity", "0");
  }, []);

  return (
    <Component
      ref={ref}
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
      className={cn(
        "group/spot relative isolate overflow-hidden rounded-2xl border border-white/8 bg-white/[0.02] transition-colors duration-500 hover:border-white/16",
        className,
      )}
      style={{ "--spot-opacity": 0, "--spot-radius": `${radius}px` } as React.CSSProperties}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 opacity-[var(--spot-opacity)] transition-opacity duration-500"
        style={{
          background:
            "radial-gradient(var(--spot-radius) circle at var(--spot-x) var(--spot-y), color-mix(in oklab, var(--accent) 14%, transparent), transparent 70%)",
        }}
      />
      {children}
    </Component>
  );
}

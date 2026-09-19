"use client";

import { useEffect, useRef } from "react";

type Node = { x: number; y: number; z: number; r: number; phase: number };
type Edge = { a: number; b: number };
type Pulse = { edge: number; t: number; speed: number };

/**
 * The hero's interactive visual: an isometric lattice of system nodes with data
 * pulses travelling along its connections. Canvas 2D, ~6kb of logic, no WebGL.
 *
 * Performance guards: renders at a capped DPR, pauses when scrolled out of view
 * or when the tab is hidden, and degrades to a static frame for visitors who
 * prefer reduced motion.
 */
export function HeroVisual({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d", { alpha: true });
    if (!context) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const accent = readAccent();

    let width = 0;
    let height = 0;
    let dpr = 1;
    let nodes: Node[] = [];
    let edges: Edge[] = [];
    let pulses: Pulse[] = [];
    let frame = 0;
    let running = true;
    let pointerX = 0;
    let pointerY = 0;
    let targetX = 0;
    let targetY = 0;

    const build = () => {
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);

      const columns = width < 520 ? 5 : width < 900 ? 6 : 7;
      const rows = width < 520 ? 5 : 6;
      const stepX = width / (columns - 1);
      const stepY = (height * 0.78) / (rows - 1);
      const skew = Math.min(width * 0.07, 56);

      nodes = [];
      for (let row = 0; row < rows; row += 1) {
        for (let column = 0; column < columns; column += 1) {
          // Deterministic jitter keeps the lattice organic without randomness on resize.
          const jitter = Math.sin(row * 12.9898 + column * 78.233) * 0.5;
          const depth = row / (rows - 1);
          nodes.push({
            x: column * stepX + (row - rows / 2) * skew * 0.34 + jitter * stepX * 0.16,
            y: height * 0.12 + row * stepY + jitter * stepY * 0.14,
            z: depth,
            r: 1.4 + (1 - depth) * 1.9,
            phase: (row * columns + column) * 0.7,
          });
        }
      }

      edges = [];
      for (let row = 0; row < rows; row += 1) {
        for (let column = 0; column < columns; column += 1) {
          const index = row * columns + column;
          if (column < columns - 1) edges.push({ a: index, b: index + 1 });
          if (row < rows - 1) edges.push({ a: index, b: index + columns });
          if (row < rows - 1 && column < columns - 1 && (row + column) % 3 === 0) {
            edges.push({ a: index, b: index + columns + 1 });
          }
        }
      }

      pulses = Array.from({ length: reduceMotion ? 0 : Math.min(10, Math.round(edges.length / 8)) }, (_, i) => ({
        edge: Math.floor((i * 37) % edges.length),
        t: (i / 10) % 1,
        speed: 0.0022 + ((i * 13) % 7) * 0.00042,
      }));
    };

    const draw = (time: number) => {
      context.clearRect(0, 0, width, height);

      pointerX += (targetX - pointerX) * 0.06;
      pointerY += (targetY - pointerY) * 0.06;

      const project = (node: Node) => {
        const parallax = 10 + node.z * 22;
        const bob = reduceMotion ? 0 : Math.sin(time * 0.0007 + node.phase) * (2.4 + node.z * 3);
        return {
          x: node.x + pointerX * parallax,
          y: node.y + pointerY * parallax * 0.55 + bob,
        };
      };

      const projected = nodes.map(project);

      // Connections
      for (const edge of edges) {
        const from = projected[edge.a]!;
        const to = projected[edge.b]!;
        const depth = (nodes[edge.a]!.z + nodes[edge.b]!.z) / 2;
        context.beginPath();
        context.moveTo(from.x, from.y);
        context.lineTo(to.x, to.y);
        context.strokeStyle = `rgba(${accent}, ${0.16 - depth * 0.09})`;
        context.lineWidth = 1;
        context.stroke();
      }

      // Travelling pulses
      for (const pulse of pulses) {
        const edge = edges[pulse.edge];
        if (!edge) continue;
        const from = projected[edge.a]!;
        const to = projected[edge.b]!;
        const x = from.x + (to.x - from.x) * pulse.t;
        const y = from.y + (to.y - from.y) * pulse.t;

        const trail = context.createLinearGradient(from.x, from.y, x, y);
        trail.addColorStop(0, `rgba(${accent}, 0)`);
        trail.addColorStop(1, `rgba(${accent}, 0.55)`);
        context.beginPath();
        context.moveTo(from.x, from.y);
        context.lineTo(x, y);
        context.strokeStyle = trail;
        context.lineWidth = 1.4;
        context.stroke();

        context.beginPath();
        context.arc(x, y, 2.2, 0, Math.PI * 2);
        context.fillStyle = `rgba(${accent}, 0.9)`;
        context.fill();

        pulse.t += pulse.speed;
        if (pulse.t >= 1) {
          pulse.t = 0;
          pulse.edge = (pulse.edge + 7) % edges.length;
        }
      }

      // Nodes
      nodes.forEach((node, index) => {
        const point = projected[index]!;
        const glow = reduceMotion ? 0.5 : 0.5 + Math.sin(time * 0.0012 + node.phase) * 0.32;
        context.beginPath();
        context.arc(point.x, point.y, node.r + glow * 1.4, 0, Math.PI * 2);
        context.fillStyle = `rgba(${accent}, ${0.28 + (1 - node.z) * 0.4})`;
        context.fill();

        if (index % 5 === 0) {
          context.beginPath();
          context.arc(point.x, point.y, node.r + 7 + glow * 5, 0, Math.PI * 2);
          context.strokeStyle = `rgba(${accent}, ${0.09 * (1 - node.z)})`;
          context.lineWidth = 1;
          context.stroke();
        }
      });

      if (running && !reduceMotion) frame = requestAnimationFrame(draw);
    };

    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      const rect = canvas.getBoundingClientRect();
      targetX = (event.clientX - (rect.left + rect.width / 2)) / rect.width;
      targetY = (event.clientY - (rect.top + rect.height / 2)) / rect.height;
    };

    const onPointerLeave = () => {
      targetX = 0;
      targetY = 0;
    };

    const start = () => {
      if (running) return;
      running = true;
      if (!reduceMotion) frame = requestAnimationFrame(draw);
    };

    const stop = () => {
      running = false;
      cancelAnimationFrame(frame);
    };

    build();
    frame = requestAnimationFrame(draw);
    if (reduceMotion) {
      running = false;
      draw(0);
    }

    const resizeObserver = new ResizeObserver(() => {
      build();
      if (reduceMotion) draw(0);
    });
    resizeObserver.observe(canvas);

    const intersectionObserver = new IntersectionObserver(
      ([entry]) => (entry?.isIntersecting ? start() : stop()),
      { threshold: 0.01 },
    );
    intersectionObserver.observe(canvas);

    const onVisibility = () => (document.hidden ? stop() : start());
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerleave", onPointerLeave);

    return () => {
      stop();
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerleave", onPointerLeave);
    };
  }, []);

  return (
    <div className={className} aria-hidden="true">
      <canvas ref={canvasRef} className="h-full w-full" />
    </div>
  );
}

/** Read the CMS accent colour and convert it to an "r, g, b" string for canvas. */
function readAccent(): string {
  if (typeof window === "undefined") return "91, 140, 255";
  const value = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim();
  const hex = value.replace("#", "");
  if (hex.length === 6) {
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    if (![r, g, b].some(Number.isNaN)) return `${r}, ${g}, ${b}`;
  }
  return "91, 140, 255";
}

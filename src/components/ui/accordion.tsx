"use client";

import { useId, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export type AccordionItem = { question: string; answer: string };

export function Accordion({
  items,
  className,
  defaultOpen = 0,
}: {
  items: AccordionItem[];
  className?: string;
  defaultOpen?: number | null;
}) {
  const [open, setOpen] = useState<number | null>(defaultOpen);
  const id = useId();

  if (!items.length) return null;

  return (
    <div className={cn("divide-y divide-white/8 border-y border-white/8", className)}>
      {items.map((item, index) => {
        const isOpen = open === index;
        return (
          <div key={`${item.question}-${index}`}>
            <h3>
              <button
                type="button"
                id={`${id}-trigger-${index}`}
                aria-expanded={isOpen}
                aria-controls={`${id}-panel-${index}`}
                onClick={() => setOpen(isOpen ? null : index)}
                className="flex w-full items-start justify-between gap-6 py-6 text-left transition-colors hover:text-ink-50"
              >
                <span className="text-[16.5px] font-medium leading-snug text-ink-50">
                  {item.question}
                </span>
                <span
                  className={cn(
                    "mt-0.5 grid size-7 shrink-0 place-items-center rounded-full border border-white/12 text-ink-200 transition-all duration-300",
                    isOpen && "rotate-45 border-[color-mix(in_oklab,var(--accent)_50%,transparent)] text-[var(--accent)]",
                  )}
                >
                  <Plus className="size-3.5" />
                </span>
              </button>
            </h3>

            <AnimatePresence initial={false}>
              {isOpen ? (
                <motion.div
                  id={`${id}-panel-${index}`}
                  role="region"
                  aria-labelledby={`${id}-trigger-${index}`}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  className="overflow-hidden"
                >
                  <p className="max-w-3xl pb-7 pr-10 text-[15px] leading-relaxed text-ink-300">
                    {item.answer}
                  </p>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

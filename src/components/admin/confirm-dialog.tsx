"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  onConfirm,
  onCancel,
  children,
}: {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  /** Extra input the confirmation needs, such as choosing a replacement. */
  children?: React.ReactNode;
}) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && open) onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[320] flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm"
          onClick={onCancel}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.18 }}
            onClick={(event) => event.stopPropagation()}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            className="admin w-full max-w-md rounded-2xl border border-[var(--a-border)] bg-[var(--a-elevated)] p-6 shadow-[var(--a-shadow)]"
          >
            <div className="flex items-start gap-3.5">
              {destructive ? (
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-danger/12 text-danger">
                  <AlertTriangle className="size-5" />
                </span>
              ) : null}
              <div>
                <h2
                  id="confirm-title"
                  className="text-[16px] font-medium text-[var(--a-fg-strong)]"
                >
                  {title}
                </h2>
                {description ? (
                  <p className="mt-2 text-[13.5px] leading-relaxed text-[var(--a-muted)]">
                    {description}
                  </p>
                ) : null}
              </div>
            </div>

            {children}

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={onCancel}
                className="h-9 rounded-lg border border-[var(--a-border)] px-4 text-[13.5px] text-[var(--a-fg)] transition-colors hover:border-[var(--a-border-strong)]"
              >
                {cancelLabel}
              </button>
              <button
                type="button"
                autoFocus
                onClick={onConfirm}
                className={cn(
                  "h-9 rounded-lg px-4 text-[13.5px] font-medium text-white transition-opacity hover:opacity-90",
                  destructive ? "bg-danger" : "",
                )}
                style={
                  destructive
                    ? undefined
                    : { background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }
                }
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

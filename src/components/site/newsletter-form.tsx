"use client";

import { useState } from "react";
import { ArrowRight, Check, Loader2 } from "lucide-react";

export function NewsletterForm({ source = "footer" }: { source?: string }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (state === "loading") return;
    setState("loading");
    setMessage("");

    const formData = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          source,
          company_website: formData.get("company_website") ?? "",
        }),
      });
      const data = (await response.json()) as { ok: boolean; message?: string };

      if (!response.ok || !data.ok) {
        setState("error");
        setMessage(data.message ?? "Something went wrong. Please try again.");
        return;
      }

      setState("done");
      setMessage(data.message ?? "You're subscribed.");
      setEmail("");
    } catch {
      setState("error");
      setMessage("Network error. Please try again.");
    }
  }

  if (state === "done") {
    return (
      <p className="flex items-center gap-2 rounded-xl border border-[color-mix(in_oklab,var(--accent)_35%,transparent)] bg-[color-mix(in_oklab,var(--accent)_8%,transparent)] px-4 py-3 text-[13.5px] text-ink-50">
        <Check className="size-4 shrink-0 text-[var(--accent)]" />
        {message}
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md" noValidate>
      <div className="flex w-full items-center gap-1.5 rounded-full border border-white/12 bg-white/[0.03] p-1 transition-colors focus-within:border-white/30">
        <label htmlFor={`newsletter-${source}`} className="sr-only">
          Email address
        </label>
        <input
          id={`newsletter-${source}`}
          type="email"
          name="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@company.com"
          autoComplete="email"
          inputMode="email"
          className="h-10 w-full min-w-0 flex-1 bg-transparent pl-4 pr-1 text-[14px] text-ink-50 outline-none placeholder:text-ink-400"
        />
        {/* Honeypot */}
        <input
          type="text"
          name="company_website"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className="pointer-events-none absolute size-0 opacity-0"
        />
        <button
          type="submit"
          disabled={state === "loading"}
          aria-label="Subscribe"
          className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-ink-50 text-ink-950 transition-transform duration-300 hover:scale-105 disabled:opacity-60"
        >
          {state === "loading" ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <ArrowRight className="size-4" />
          )}
        </button>
      </div>
      {state === "error" && message ? (
        <p className="mt-2 text-[12.5px] text-danger" role="alert">
          {message}
        </p>
      ) : null}
    </form>
  );
}

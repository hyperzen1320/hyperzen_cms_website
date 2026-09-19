"use client";

import { useState } from "react";
import { ArrowUpRight, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Values = {
  name: string;
  email: string;
  phone: string;
  linkedin: string;
  portfolio: string;
  message: string;
  company_website: string;
};

const EMPTY: Values = {
  name: "",
  email: "",
  phone: "",
  linkedin: "",
  portfolio: "",
  message: "",
  company_website: "",
};

export function JobApplicationForm({
  jobId,
  jobTitle,
  applyEmail,
  applyUrl,
}: {
  jobId: string;
  jobTitle: string;
  applyEmail?: string | null;
  applyUrl?: string | null;
}) {
  const [values, setValues] = useState<Values>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  if (applyUrl) {
    return (
      <aside className="rounded-2xl border border-white/8 bg-white/[0.02] p-7">
        <h2 className="text-[18px] font-medium tracking-tight text-ink-50">Apply for this role</h2>
        <p className="mt-3 text-[14px] leading-relaxed text-ink-300">
          Applications for {jobTitle} are handled through our recruitment portal.
        </p>
        <a
          href={applyUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-ink-50 px-6 text-[14px] font-semibold text-ink-950 transition-colors hover:bg-white"
        >
          Open application
          <ArrowUpRight className="size-4" />
        </a>
      </aside>
    );
  }

  const set = (key: keyof Values, value: string) => {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  };

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "submitting") return;

    const nextErrors: Record<string, string> = {};
    if (values.name.trim().length < 2) nextErrors.name = "Tell us your name";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(values.email.trim()))
      nextErrors.email = "Enter a valid email address";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setStatus("submitting");
    setMessage("");

    try {
      const response = await fetch("/api/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, jobId }),
      });
      const data = (await response.json()) as {
        ok: boolean;
        message?: string;
        errors?: Record<string, string>;
      };

      if (!response.ok || !data.ok) {
        setStatus("error");
        setErrors(data.errors ?? {});
        setMessage(data.message ?? "Something went wrong. Please try again.");
        return;
      }

      setStatus("done");
      setMessage(data.message ?? "Application received.");
    } catch {
      setStatus("error");
      setMessage("Network error. Please try again.");
    }
  }

  if (status === "done") {
    return (
      <aside className="rounded-2xl border border-white/8 bg-white/[0.02] p-7 text-center">
        <span className="mx-auto grid size-12 place-items-center rounded-full border border-[color-mix(in_oklab,var(--accent)_45%,transparent)] bg-[color-mix(in_oklab,var(--accent)_12%,transparent)]">
          <Check className="size-5 text-[var(--accent)]" />
        </span>
        <h2 className="mt-5 text-[18px] font-medium tracking-tight text-ink-50">
          Application received
        </h2>
        <p className="mt-3 text-[14px] leading-relaxed text-ink-300">{message}</p>
      </aside>
    );
  }

  return (
    <aside className="rounded-2xl border border-white/8 bg-white/[0.02] p-7">
      <h2 className="text-[18px] font-medium tracking-tight text-ink-50">Apply for this role</h2>
      <p className="mt-2 text-[13.5px] leading-relaxed text-ink-300">
        Share a few details and a link to your work. We read every application.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
        <Field label="Full name" error={errors.name} required>
          <input
            className={inputClass(errors.name)}
            value={values.name}
            onChange={(event) => set("name", event.target.value)}
            autoComplete="name"
          />
        </Field>
        <Field label="Email" error={errors.email} required>
          <input
            type="email"
            className={inputClass(errors.email)}
            value={values.email}
            onChange={(event) => set("email", event.target.value)}
            autoComplete="email"
          />
        </Field>
        <Field label="Phone">
          <input
            type="tel"
            className={inputClass()}
            value={values.phone}
            onChange={(event) => set("phone", event.target.value)}
            autoComplete="tel"
          />
        </Field>
        <Field label="LinkedIn or GitHub">
          <input
            className={inputClass()}
            value={values.linkedin}
            onChange={(event) => set("linkedin", event.target.value)}
            placeholder="https://"
          />
        </Field>
        <Field label="Portfolio or resume link">
          <input
            className={inputClass()}
            value={values.portfolio}
            onChange={(event) => set("portfolio", event.target.value)}
            placeholder="https://"
          />
        </Field>
        <Field label="Anything else">
          <textarea
            rows={4}
            className={cn(inputClass(), "h-auto resize-y py-3 leading-relaxed")}
            value={values.message}
            onChange={(event) => set("message", event.target.value)}
            placeholder="What would you like us to know?"
          />
        </Field>

        <input
          type="text"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          value={values.company_website}
          onChange={(event) => set("company_website", event.target.value)}
          className="pointer-events-none absolute left-[-9999px] size-0 opacity-0"
        />

        {message && status === "error" ? (
          <p className="rounded-lg border border-danger/40 bg-danger/10 px-4 py-2.5 text-[13px] text-danger" role="alert">
            {message}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={status === "submitting"}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-ink-50 px-6 text-[14px] font-semibold text-ink-950 transition-colors hover:bg-white disabled:opacity-70"
        >
          {status === "submitting" ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Sending
            </>
          ) : (
            "Submit application"
          )}
        </button>

        {applyEmail ? (
          <p className="text-center text-[12.5px] text-ink-400">
            Or email us directly at{" "}
            <a href={`mailto:${applyEmail}`} className="text-ink-200 underline-offset-4 hover:underline">
              {applyEmail}
            </a>
          </p>
        ) : null}
      </form>
    </aside>
  );
}

function Field({
  label,
  error,
  required,
  children,
}: {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[12.5px] font-medium text-ink-100">
        {label} {required ? <span className="text-[var(--accent)]">*</span> : null}
      </span>
      {children}
      {error ? <span className="mt-1 block text-[12px] text-danger">{error}</span> : null}
    </label>
  );
}

function inputClass(error?: string): string {
  return cn(
    "h-11 w-full rounded-xl border bg-ink-950/60 px-3.5 text-[14px] text-ink-50 outline-none transition-colors placeholder:text-ink-500",
    error
      ? "border-danger/60 focus:border-danger"
      : "border-white/10 focus:border-[color-mix(in_oklab,var(--accent)_55%,transparent)]",
  );
}

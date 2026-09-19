"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Loader2, Sparkles } from "lucide-react";
import { track } from "@/components/site/analytics";
import { BUDGET_OPTIONS, SERVICE_OPTIONS, TIMELINE_OPTIONS } from "@/lib/validation";
import { cn } from "@/lib/utils";

type FormState = {
  name: string;
  email: string;
  phone: string;
  company: string;
  website: string;
  service: string;
  budget: string;
  timeline: string;
  message: string;
  company_website: string;
};

const EMPTY: FormState = {
  name: "",
  email: "",
  phone: "",
  company: "",
  website: "",
  service: "",
  budget: "",
  timeline: "",
  message: "",
  company_website: "",
};

const STEPS = [
  { title: "Tell us about yourself", hint: "So we know who we are speaking with." },
  { title: "What do you want to build?", hint: "Pick the closest fit — we will refine it together." },
  { title: "Tell us about the project", hint: "Context, constraints, and the outcome you need." },
  { title: "Review and submit", hint: "One last look before it reaches our team." },
];

export function ContactForm({
  defaultService,
  compact = false,
}: {
  defaultService?: string;
  compact?: boolean;
}) {
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<FormState>({ ...EMPTY, service: defaultService ?? "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">("idle");
  const [serverMessage, setServerMessage] = useState("");
  const [utm, setUtm] = useState<Record<string, string>>({});
  const reduce = useReducedMotion();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const collected: Record<string, string> = {};
    for (const key of ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"]) {
      const value = params.get(key);
      if (value) collected[key] = value;
    }
    const service = params.get("service");
    if (service) setValues((current) => ({ ...current, service }));
    setUtm(collected);
  }, []);

  const set = (key: keyof FormState, value: string) => {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  };

  const validateStep = (index: number): boolean => {
    const next: Record<string, string> = {};
    if (index === 0) {
      if (values.name.trim().length < 2) next.name = "Tell us your name";
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(values.email.trim()))
        next.email = "Enter a valid email address";
    }
    if (index === 1 && !values.service) next.service = "Choose the closest fit";
    if (index === 2 && values.message.trim().length < 10)
      next.message = "A sentence or two helps us prepare";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const goNext = () => {
    if (!validateStep(step)) return;
    if (step === 0) track("form_step", { label: "contact", value: "details" });
    setStep((current) => Math.min(current + 1, STEPS.length - 1));
  };

  const goBack = () => setStep((current) => Math.max(current - 1, 0));

  async function handleSubmit() {
    if (status === "submitting") return;
    for (let index = 0; index < 3; index += 1) {
      if (!validateStep(index)) {
        setStep(index);
        return;
      }
    }

    setStatus("submitting");
    setServerMessage("");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          sourcePage: window.location.pathname,
          referrer: document.referrer || undefined,
          utmSource: utm.utm_source,
          utmMedium: utm.utm_medium,
          utmCampaign: utm.utm_campaign,
          utmTerm: utm.utm_term,
          utmContent: utm.utm_content,
        }),
      });

      const data = (await response.json()) as {
        ok: boolean;
        message?: string;
        errors?: Record<string, string>;
      };

      if (!response.ok || !data.ok) {
        setStatus("error");
        setErrors(data.errors ?? {});
        setServerMessage(data.message ?? "Something went wrong. Please try again.");
        return;
      }

      track("lead_submitted", { label: values.service || "unspecified" });
      setStatus("done");
    } catch {
      setStatus("error");
      setServerMessage("Network error. Please check your connection and try again.");
    }
  }

  const progress = useMemo(() => ((step + 1) / STEPS.length) * 100, [step]);

  if (status === "done") {
    return (
      <motion.div
        initial={reduce ? false : { opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] p-10 text-center sm:p-14"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 opacity-25 blur-3xl"
          style={{ background: "radial-gradient(50% 50% at 50% 30%, var(--accent), transparent 70%)" }}
        />
        <span className="mx-auto grid size-14 place-items-center rounded-full border border-[color-mix(in_oklab,var(--accent)_45%,transparent)] bg-[color-mix(in_oklab,var(--accent)_12%,transparent)]">
          <Check className="size-6 text-[var(--accent)]" />
        </span>
        <h3 className="mt-7 text-[clamp(1.6rem,3vw,2.3rem)] font-semibold tracking-tight text-ink-50">
          Your idea is now in motion.
        </h3>
        <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-ink-200">
          Thank you, {values.name.split(" ")[0] || "there"}. We have your brief and a confirmation is
          on the way to {values.email}. Expect a considered response within one business day.
        </p>
        <button
          type="button"
          onClick={() => {
            setValues({ ...EMPTY, service: defaultService ?? "" });
            setStep(0);
            setStatus("idle");
          }}
          className="mt-8 text-[13.5px] font-medium text-ink-300 underline-offset-4 transition-colors hover:text-ink-50 hover:underline"
        >
          Submit another enquiry
        </button>
      </motion.div>
    );
  }

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]",
        compact ? "p-6 sm:p-8" : "p-6 sm:p-10",
      )}
    >
      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between text-[12px] text-ink-400">
          <span className="font-mono uppercase tracking-[0.18em]">
            Step {step + 1} / {STEPS.length}
          </span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="mt-2.5 h-1 w-full overflow-hidden rounded-full bg-white/8">
          <motion.div
            className="h-full rounded-full"
            style={{
              background: "linear-gradient(90deg, var(--accent), var(--accent-2))",
            }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: reduce ? 0 : 0.5, ease: [0.16, 1, 0.3, 1] }}
          />
        </div>
      </div>

      <div className="mb-7">
        <h3 className="text-[21px] font-semibold tracking-tight text-ink-50">{STEPS[step]!.title}</h3>
        <p className="mt-1.5 text-[14px] text-ink-300">{STEPS[step]!.hint}</p>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={step}
          initial={reduce ? false : { opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, x: -16 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
        >
          {step === 0 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name" error={errors.name} required>
                <input
                  className={inputClass(errors.name)}
                  value={values.name}
                  onChange={(event) => set("name", event.target.value)}
                  placeholder="Ada Lovelace"
                  autoComplete="name"
                />
              </Field>
              <Field label="Work email" error={errors.email} required>
                <input
                  type="email"
                  className={inputClass(errors.email)}
                  value={values.email}
                  onChange={(event) => set("email", event.target.value)}
                  placeholder="you@company.com"
                  autoComplete="email"
                />
              </Field>
              <Field label="Phone">
                <input
                  type="tel"
                  className={inputClass()}
                  value={values.phone}
                  onChange={(event) => set("phone", event.target.value)}
                  placeholder="+91 00000 00000"
                  autoComplete="tel"
                />
              </Field>
              <Field label="Company">
                <input
                  className={inputClass()}
                  value={values.company}
                  onChange={(event) => set("company", event.target.value)}
                  placeholder="Company name"
                  autoComplete="organization"
                />
              </Field>
              <Field label="Website" className="sm:col-span-2">
                <input
                  className={inputClass()}
                  value={values.website}
                  onChange={(event) => set("website", event.target.value)}
                  placeholder="https://"
                  autoComplete="url"
                />
              </Field>
            </div>
          ) : null}

          {step === 1 ? (
            <div className="space-y-7">
              <div>
                <p className="mb-3 text-[13px] font-medium text-ink-100">
                  Service required <span className="text-[var(--accent)]">*</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {SERVICE_OPTIONS.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => set("service", option)}
                      className={cn(
                        "rounded-full border px-4 py-2 text-[13.5px] transition-all duration-300",
                        values.service === option
                          ? "border-[color-mix(in_oklab,var(--accent)_60%,transparent)] bg-[color-mix(in_oklab,var(--accent)_14%,transparent)] text-ink-50"
                          : "border-white/12 text-ink-200 hover:border-white/28 hover:text-ink-50",
                      )}
                    >
                      {option}
                    </button>
                  ))}
                </div>
                {errors.service ? (
                  <p className="mt-2 text-[12.5px] text-danger">{errors.service}</p>
                ) : null}
              </div>

              <div>
                <p className="mb-3 text-[13px] font-medium text-ink-100">Budget range</p>
                <div className="flex flex-wrap gap-2">
                  {BUDGET_OPTIONS.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => set("budget", values.budget === option ? "" : option)}
                      className={cn(
                        "rounded-full border px-4 py-2 text-[13.5px] transition-all duration-300",
                        values.budget === option
                          ? "border-white/35 bg-white/[0.08] text-ink-50"
                          : "border-white/12 text-ink-200 hover:border-white/28 hover:text-ink-50",
                      )}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="space-y-7">
              <div>
                <p className="mb-3 text-[13px] font-medium text-ink-100">Timeline</p>
                <div className="flex flex-wrap gap-2">
                  {TIMELINE_OPTIONS.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => set("timeline", values.timeline === option ? "" : option)}
                      className={cn(
                        "rounded-full border px-4 py-2 text-[13.5px] transition-all duration-300",
                        values.timeline === option
                          ? "border-white/35 bg-white/[0.08] text-ink-50"
                          : "border-white/12 text-ink-200 hover:border-white/28 hover:text-ink-50",
                      )}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>

              <Field label="Project description" error={errors.message} required>
                <textarea
                  rows={6}
                  className={cn(inputClass(errors.message), "resize-y py-3 leading-relaxed")}
                  value={values.message}
                  onChange={(event) => set("message", event.target.value)}
                  placeholder="What are you building, what exists today, and what does success look like?"
                />
              </Field>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="space-y-4">
              <dl className="divide-y divide-white/8 overflow-hidden rounded-xl border border-white/8">
                {[
                  ["Name", values.name],
                  ["Email", values.email],
                  ["Phone", values.phone],
                  ["Company", values.company],
                  ["Website", values.website],
                  ["Service", values.service],
                  ["Budget", values.budget],
                  ["Timeline", values.timeline],
                ]
                  .filter(([, value]) => Boolean(value))
                  .map(([label, value]) => (
                    <div key={label} className="flex gap-4 px-4 py-3">
                      <dt className="w-28 shrink-0 text-[13px] text-ink-400">{label}</dt>
                      <dd className="min-w-0 flex-1 break-words text-[13.5px] text-ink-100">
                        {value}
                      </dd>
                    </div>
                  ))}
                <div className="px-4 py-3">
                  <dt className="text-[13px] text-ink-400">Project</dt>
                  <dd className="mt-1.5 whitespace-pre-wrap text-[13.5px] leading-relaxed text-ink-100">
                    {values.message}
                  </dd>
                </div>
              </dl>

              <p className="flex items-start gap-2 text-[12.5px] leading-relaxed text-ink-400">
                <Sparkles className="mt-0.5 size-3.5 shrink-0 text-[var(--accent)]" />
                We use these details only to respond to your enquiry. No lists, no resale.
              </p>
            </div>
          ) : null}
        </motion.div>
      </AnimatePresence>

      {/* Honeypot */}
      <input
        type="text"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        value={values.company_website}
        onChange={(event) => set("company_website", event.target.value)}
        className="pointer-events-none absolute left-[-9999px] size-0 opacity-0"
      />

      {serverMessage ? (
        <p className="mt-6 rounded-lg border border-danger/40 bg-danger/10 px-4 py-3 text-[13px] text-danger" role="alert">
          {serverMessage}
        </p>
      ) : null}

      <div className="mt-8 flex items-center justify-between gap-3 border-t border-white/8 pt-6">
        <button
          type="button"
          onClick={goBack}
          disabled={step === 0}
          className="inline-flex h-11 items-center gap-2 rounded-full px-4 text-[14px] font-medium text-ink-300 transition-colors hover:text-ink-50 disabled:pointer-events-none disabled:opacity-0"
        >
          <ArrowLeft className="size-4" />
          Back
        </button>

        {step < STEPS.length - 1 ? (
          <button
            type="button"
            onClick={goNext}
            className="group inline-flex h-11 items-center gap-2 rounded-full bg-ink-50 px-6 text-[14px] font-semibold text-ink-950 transition-all duration-300 hover:bg-white"
          >
            Continue
            <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={status === "submitting"}
            className="group inline-flex h-11 items-center gap-2 rounded-full bg-ink-50 px-6 text-[14px] font-semibold text-ink-950 transition-all duration-300 hover:bg-white disabled:opacity-70"
          >
            {status === "submitting" ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Sending
              </>
            ) : (
              <>
                Send enquiry
                <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5" />
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  error,
  required,
  className,
  children,
}: {
  label: string;
  error?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-2 block text-[13px] font-medium text-ink-100">
        {label} {required ? <span className="text-[var(--accent)]">*</span> : null}
      </span>
      {children}
      {error ? <span className="mt-1.5 block text-[12.5px] text-danger">{error}</span> : null}
    </label>
  );
}

function inputClass(error?: string): string {
  return cn(
    "h-12 w-full rounded-xl border bg-ink-950/60 px-4 text-[14.5px] text-ink-50 outline-none transition-colors placeholder:text-ink-500",
    error
      ? "border-danger/60 focus:border-danger"
      : "border-white/10 focus:border-[color-mix(in_oklab,var(--accent)_55%,transparent)]",
  );
}

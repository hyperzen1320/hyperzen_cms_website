"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { AlertCircle, ArrowRight, Eye, EyeOff, Loader2 } from "lucide-react";
import { portalSignInAction, portalSignUpAction } from "@/app/(portal)/login/actions";
import { ResetForm } from "@/app/(portal)/login/reset-form";
import { cn } from "@/lib/utils";
import type { ActionResult } from "@/types";

type Tab = "signin" | "signup";

/**
 * One form, two doors.
 *
 * Signing in is shared: the server decides from the email whether the visitor
 * belongs in the ERP portal or the CMS. Creating an account only ever makes an
 * ERP customer — staff accounts are added by an administrator inside the CMS.
 */
export function PortalAuthForm({
  defaultTab,
  next,
  companyName,
}: {
  defaultTab: Tab;
  next: string;
  companyName: string;
}) {
  const [tab, setTab] = useState<Tab>(defaultTab);
  const [resetting, setResetting] = useState(false);
  const reduce = useReducedMotion();

  const [signInState, signInAction] = useActionState<ActionResult | null, FormData>(
    portalSignInAction,
    null,
  );
  const [signUpState, signUpAction] = useActionState<ActionResult | null, FormData>(
    portalSignUpAction,
    null,
  );

  const state = tab === "signin" ? signInState : signUpState;
  const errors = (state && !state.ok ? state.errors : undefined) ?? {};

  if (resetting) {
    return <ResetForm onBack={() => setResetting(false)} />;
  }

  return (
    <div>
      {/* Tabs */}
      <div
        role="tablist"
        aria-label="Sign in or create an account"
        className="mb-7 grid grid-cols-2 gap-1 rounded-xl border border-white/8 bg-ink-950/60 p-1"
      >
        {(
          [
            { id: "signin", label: "Sign in" },
            { id: "signup", label: "Create account" },
          ] as const
        ).map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            onClick={() => setTab(item.id)}
            className={cn(
              "relative rounded-lg px-4 py-2 text-[13.5px] font-medium transition-colors",
              tab === item.id ? "text-ink-950" : "text-ink-300 hover:text-ink-50",
            )}
          >
            {tab === item.id ? (
              <motion.span
                layoutId="portal-tab"
                className="absolute inset-0 -z-10 rounded-lg bg-ink-50"
                transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 380, damping: 32 }}
              />
            ) : null}
            {item.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={tab}
          initial={reduce ? false : { opacity: 0, x: tab === "signin" ? -12 : 12 }}
          animate={{ opacity: 1, x: 0 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, x: tab === "signin" ? 12 : -12 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        >
          {tab === "signin" ? (
            <>
              <h1 className="text-[22px] font-semibold tracking-tight text-ink-50">Welcome back</h1>
              <p className="mt-2 text-[14px] leading-relaxed text-ink-300">
                Sign in to your {companyName} workspace.
              </p>

              <form action={signInAction} className="mt-6 space-y-4" noValidate>
                <input type="hidden" name="next" value={next} />

                <Field label="Email" error={errors.email}>
                  <input
                    type="email"
                    name="email"
                    required
                    autoFocus
                    autoComplete="username"
                    placeholder="you@company.com"
                    className={inputClass(errors.email)}
                  />
                </Field>

                <PasswordField
                  label="Password"
                  name="password"
                  autoComplete="current-password"
                  error={errors.password}
                />

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setResetting(true)}
                    className="text-[13px] text-ink-400 underline-offset-4 transition-colors hover:text-ink-100 hover:underline"
                  >
                    Forgot your password?
                  </button>
                </div>

                <FormError state={signInState} />
                <Submit label="Sign in" />
              </form>
            </>
          ) : (
            <>
              <h1 className="text-[22px] font-semibold tracking-tight text-ink-50">
                Create your account
              </h1>
              <p className="mt-2 text-[14px] leading-relaxed text-ink-300">
                Set up access to your ERP workspace. It takes a minute.
              </p>

              <form action={signUpAction} className="mt-6 space-y-4" noValidate>
                <Field label="Full name" error={errors.name}>
                  <input
                    name="name"
                    required
                    autoComplete="name"
                    placeholder="Ada Lovelace"
                    className={inputClass(errors.name)}
                  />
                </Field>

                <Field label="Work email" error={errors.email}>
                  <input
                    type="email"
                    name="email"
                    required
                    autoComplete="email"
                    placeholder="you@company.com"
                    className={inputClass(errors.email)}
                  />
                </Field>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Company" error={errors.company} optional>
                    <input
                      name="company"
                      autoComplete="organization"
                      placeholder="Company name"
                      className={inputClass(errors.company)}
                    />
                  </Field>
                  <Field label="Phone" error={errors.phone} optional>
                    <input
                      type="tel"
                      name="phone"
                      autoComplete="tel"
                      placeholder="+91 00000 00000"
                      className={inputClass(errors.phone)}
                    />
                  </Field>
                </div>

                <PasswordField
                  label="Password"
                  name="password"
                  autoComplete="new-password"
                  error={errors.password}
                  hint="At least 8 characters, with a letter and a number."
                />

                <PasswordField
                  label="Confirm password"
                  name="confirmPassword"
                  autoComplete="new-password"
                  error={errors.confirmPassword}
                />

                {/* Honeypot */}
                <input
                  type="text"
                  name="company_website"
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                  className="pointer-events-none absolute left-[-9999px] size-0 opacity-0"
                />

                <FormError state={signUpState} />
                <Submit label="Create account" />

                <p className="text-center text-[12px] leading-relaxed text-ink-500">
                  Team members do not sign up here — an administrator creates staff accounts in the
                  CMS.
                </p>
              </form>
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function Field({
  label,
  error,
  optional,
  children,
}: {
  label: string;
  error?: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-baseline justify-between text-[13px] font-medium text-ink-100">
        {label}
        {optional ? <span className="text-[11.5px] text-ink-500">optional</span> : null}
      </span>
      {children}
      {error ? <span className="mt-1.5 block text-[12.5px] text-danger">{error}</span> : null}
    </label>
  );
}

function PasswordField({
  label,
  name,
  autoComplete,
  error,
  hint,
}: {
  label: string;
  name: string;
  autoComplete: string;
  error?: string;
  hint?: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-medium text-ink-100">{label}</span>
      <span className="relative block">
        <input
          type={visible ? "text" : "password"}
          name={name}
          required
          autoComplete={autoComplete}
          placeholder="••••••••"
          className={cn(inputClass(error), "pr-11")}
        />
        <button
          type="button"
          onClick={() => setVisible((value) => !value)}
          aria-label={visible ? "Hide password" : "Show password"}
          className="absolute right-1.5 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-ink-400 transition-colors hover:text-ink-100"
        >
          {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </span>
      {error ? (
        <span className="mt-1.5 block text-[12.5px] text-danger">{error}</span>
      ) : hint ? (
        <span className="mt-1.5 block text-[12px] text-ink-500">{hint}</span>
      ) : null}
    </label>
  );
}

function FormError({ state }: { state: ActionResult | null }) {
  if (!state || state.ok) return null;
  return (
    <p
      role="alert"
      className="flex items-start gap-2 rounded-xl border border-danger/40 bg-danger/10 px-3.5 py-2.5 text-[13px] text-danger"
    >
      <AlertCircle className="mt-0.5 size-4 shrink-0" />
      {state.message}
    </p>
  );
}

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="group inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-ink-50 text-[14.5px] font-semibold text-ink-950 transition-colors hover:bg-white disabled:opacity-70"
    >
      {pending ? (
        <>
          <Loader2 className="size-4 animate-spin" />
          Please wait
        </>
      ) : (
        <>
          {label}
          <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5" />
        </>
      )}
    </button>
  );
}

function inputClass(error?: string): string {
  return cn(
    "h-11 w-full rounded-xl border bg-ink-950/70 px-3.5 text-[14.5px] text-ink-50 outline-none transition-colors placeholder:text-ink-500",
    error
      ? "border-danger/60 focus:border-danger"
      : "border-white/10 focus:border-[color-mix(in_oklab,var(--accent)_55%,transparent)]",
  );
}

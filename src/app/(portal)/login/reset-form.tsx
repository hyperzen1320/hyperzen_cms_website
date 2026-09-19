"use client";

import { useState, useTransition } from "react";
import { AlertCircle, ArrowLeft, Check, Loader2, Mail, MessageSquare } from "lucide-react";
import {
  completeResetAction,
  requestResetCodeAction,
  verifyResetCodeAction,
} from "@/app/(portal)/login/reset-actions";
import { cn } from "@/lib/utils";

type Step = "request" | "verify" | "password" | "done";

/**
 * Forgotten password, in three steps: ask for a code, prove it arrived, choose
 * a new password. The code goes to the email address on the account, or by text
 * when a number is on file and an SMS gateway is configured.
 */
export function ResetForm({ onBack }: { onBack: () => void }) {
  const [pending, startTransition] = useTransition();
  const [step, setStep] = useState<Step>("request");
  const [identifier, setIdentifier] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [sentTo, setSentTo] = useState<{ channel: string; destination: string } | null>(null);
  const [smsAvailable, setSmsAvailable] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const request = (channel?: "EMAIL" | "SMS") =>
    startTransition(async () => {
      setError("");
      const result = await requestResetCodeAction({ identifier, channel });
      if (!result.ok) {
        setError(result.message);
        return;
      }
      if (result.data) {
        setSentTo({ channel: result.data.channel, destination: result.data.destination });
        setSmsAvailable(result.data.smsAvailable);
      }
      setMessage(result.message ?? "");
      setStep("verify");
    });

  const verify = () =>
    startTransition(async () => {
      setError("");
      const result = await verifyResetCodeAction({ identifier, code });
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setStep("password");
    });

  const complete = () =>
    startTransition(async () => {
      setError("");
      const result = await completeResetAction({ password, confirmPassword });
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setStep("done");
    });

  if (step === "done") {
    return (
      <div className="text-center">
        <span className="mx-auto grid size-12 place-items-center rounded-full border border-[color-mix(in_oklab,var(--accent)_45%,transparent)] bg-[color-mix(in_oklab,var(--accent)_12%,transparent)]">
          <Check className="size-5 text-[var(--accent)]" />
        </span>
        <h1 className="mt-6 text-[21px] font-semibold tracking-tight text-ink-50">
          Password updated
        </h1>
        <p className="mx-auto mt-3 max-w-sm text-[14px] leading-relaxed text-ink-300">
          Every device has been signed out. Use your new password to sign in.
        </p>
        <button
          type="button"
          onClick={onBack}
          className="mt-7 inline-flex h-11 w-full items-center justify-center rounded-xl bg-ink-50 text-[14.5px] font-semibold text-ink-950 transition-colors hover:bg-white"
        >
          Back to sign in
        </button>
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={step === "request" ? onBack : () => setStep("request")}
        className="mb-5 inline-flex items-center gap-1.5 text-[13px] text-ink-400 transition-colors hover:text-ink-100"
      >
        <ArrowLeft className="size-3.5" />
        {step === "request" ? "Back to sign in" : "Use a different address"}
      </button>

      {step === "request" ? (
        <>
          <h1 className="text-[22px] font-semibold tracking-tight text-ink-50">
            Reset your password
          </h1>
          <p className="mt-2 text-[14px] leading-relaxed text-ink-300">
            Enter the email address or phone number on your account. We will send a six-digit code.
          </p>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              request();
            }}
            className="mt-6 space-y-4"
            noValidate
          >
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-medium text-ink-100">
                Email or phone number
              </span>
              <input
                value={identifier}
                onChange={(event) => setIdentifier(event.target.value)}
                required
                autoFocus
                placeholder="you@company.com"
                className={inputClass(error)}
              />
            </label>

            {error ? <Alert>{error}</Alert> : null}

            <button
              type="submit"
              disabled={pending || identifier.trim().length < 3}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-ink-50 text-[14.5px] font-semibold text-ink-950 transition-colors hover:bg-white disabled:opacity-60"
            >
              {pending ? <Loader2 className="size-4 animate-spin" /> : null}
              Send code
            </button>
          </form>
        </>
      ) : null}

      {step === "verify" ? (
        <>
          <h1 className="text-[22px] font-semibold tracking-tight text-ink-50">Enter the code</h1>
          <p className="mt-2 text-[14px] leading-relaxed text-ink-300">
            {sentTo ? (
              <>
                Sent by {sentTo.channel === "SMS" ? "text message" : "email"} to{" "}
                <span className="text-ink-100">{sentTo.destination}</span>. It expires in 10 minutes.
              </>
            ) : (
              message
            )}
          </p>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              verify();
            }}
            className="mt-6 space-y-4"
            noValidate
          >
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-medium text-ink-100">
                Six-digit code
              </span>
              <input
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                inputMode="numeric"
                autoComplete="one-time-code"
                autoFocus
                placeholder="000000"
                className={cn(inputClass(error), "text-center font-mono text-[22px] tracking-[0.5em]")}
              />
            </label>

            {error ? <Alert>{error}</Alert> : null}

            <button
              type="submit"
              disabled={pending || code.length !== 6}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-ink-50 text-[14.5px] font-semibold text-ink-950 transition-colors hover:bg-white disabled:opacity-60"
            >
              {pending ? <Loader2 className="size-4 animate-spin" /> : null}
              Verify code
            </button>

            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 pt-1">
              <button
                type="button"
                disabled={pending}
                onClick={() => request("EMAIL")}
                className="inline-flex items-center gap-1.5 text-[12.5px] text-ink-400 transition-colors hover:text-ink-100"
              >
                <Mail className="size-3.5" />
                Resend by email
              </button>
              {smsAvailable ? (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => request("SMS")}
                  className="inline-flex items-center gap-1.5 text-[12.5px] text-ink-400 transition-colors hover:text-ink-100"
                >
                  <MessageSquare className="size-3.5" />
                  Send by text instead
                </button>
              ) : null}
            </div>
          </form>
        </>
      ) : null}

      {step === "password" ? (
        <>
          <h1 className="text-[22px] font-semibold tracking-tight text-ink-50">
            Choose a new password
          </h1>
          <p className="mt-2 text-[14px] leading-relaxed text-ink-300">
            At least 8 characters, with a letter and a number.
          </p>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              complete();
            }}
            className="mt-6 space-y-4"
            noValidate
          >
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-medium text-ink-100">New password</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="new-password"
                autoFocus
                required
                className={inputClass(error)}
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-[13px] font-medium text-ink-100">
                Confirm new password
              </span>
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                autoComplete="new-password"
                required
                className={inputClass(error)}
              />
            </label>

            {error ? <Alert>{error}</Alert> : null}

            <button
              type="submit"
              disabled={pending || password.length < 8}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-ink-50 text-[14.5px] font-semibold text-ink-950 transition-colors hover:bg-white disabled:opacity-60"
            >
              {pending ? <Loader2 className="size-4 animate-spin" /> : null}
              Update password
            </button>
          </form>
        </>
      ) : null}
    </div>
  );
}

function Alert({ children }: { children: React.ReactNode }) {
  return (
    <p
      role="alert"
      className="flex items-start gap-2 rounded-xl border border-danger/40 bg-danger/10 px-3.5 py-2.5 text-[13px] text-danger"
    >
      <AlertCircle className="mt-0.5 size-4 shrink-0" />
      {children}
    </p>
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

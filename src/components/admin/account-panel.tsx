"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { Card, CardTitle } from "@/components/admin/ui";
import { changeOwnPasswordAction, updateOwnProfileAction } from "@/app/admin/settings/actions";
import { cn } from "@/lib/utils";

export function AccountPanel({ name, email }: { name: string; email: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [profile, setProfile] = useState({ name, email });
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const saveProfile = () =>
    startTransition(async () => {
      const result = await updateOwnProfileAction(profile);
      if (result.ok) {
        toast.success(result.message ?? "Saved.");
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });

  const changePassword = () => {
    if (passwords.newPassword !== passwords.confirmPassword) {
      setErrors({ confirmPassword: "Passwords do not match" });
      return;
    }
    setErrors({});

    startTransition(async () => {
      const result = await changeOwnPasswordAction({
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });
      if (result.ok) {
        toast.success(result.message ?? "Password changed.");
        setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
        // Every session was invalidated, so send them back to sign in.
        setTimeout(() => router.push("/login"), 1200);
      } else {
        setErrors(result.errors ?? {});
        toast.error(result.message);
      }
    });
  };

  return (
    <>
      <Card className="mb-4">
        <CardTitle title="Profile" />
        <form
          onSubmit={(event) => {
            event.preventDefault();
            saveProfile();
          }}
          className="grid gap-4 sm:grid-cols-2"
        >
          <label className="block">
            <span className="a-label">Name</span>
            <input
              value={profile.name}
              onChange={(event) => setProfile((current) => ({ ...current, name: event.target.value }))}
              className="a-input"
              required
            />
          </label>
          <label className="block">
            <span className="a-label">Email</span>
            <input
              type="email"
              value={profile.email}
              onChange={(event) =>
                setProfile((current) => ({ ...current, email: event.target.value }))
              }
              className="a-input"
              required
            />
          </label>
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={pending}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg px-4 text-[13px] font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
              style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}
            >
              {pending ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
              Save profile
            </button>
          </div>
        </form>
      </Card>

      <Card>
        <CardTitle
          title="Password"
          description="Changing your password signs out every other session."
        />
        <form
          onSubmit={(event) => {
            event.preventDefault();
            changePassword();
          }}
          className="grid gap-4 sm:grid-cols-2"
        >
          <label className="block sm:col-span-2">
            <span className="a-label">Current password</span>
            <input
              type="password"
              autoComplete="current-password"
              value={passwords.currentPassword}
              onChange={(event) =>
                setPasswords((current) => ({ ...current, currentPassword: event.target.value }))
              }
              className={cn("a-input", errors.currentPassword && "border-danger/60")}
              required
            />
            {errors.currentPassword ? (
              <span className="mt-1.5 block text-[12px] text-danger">{errors.currentPassword}</span>
            ) : null}
          </label>

          <label className="block">
            <span className="a-label">New password</span>
            <input
              type="password"
              autoComplete="new-password"
              value={passwords.newPassword}
              onChange={(event) =>
                setPasswords((current) => ({ ...current, newPassword: event.target.value }))
              }
              className={cn("a-input", errors.newPassword && "border-danger/60")}
              required
              minLength={8}
            />
            {errors.newPassword ? (
              <span className="mt-1.5 block text-[12px] text-danger">{errors.newPassword}</span>
            ) : null}
          </label>

          <label className="block">
            <span className="a-label">Confirm new password</span>
            <input
              type="password"
              autoComplete="new-password"
              value={passwords.confirmPassword}
              onChange={(event) =>
                setPasswords((current) => ({ ...current, confirmPassword: event.target.value }))
              }
              className={cn("a-input", errors.confirmPassword && "border-danger/60")}
              required
              minLength={8}
            />
            {errors.confirmPassword ? (
              <span className="mt-1.5 block text-[12px] text-danger">{errors.confirmPassword}</span>
            ) : null}
          </label>

          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={pending}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[var(--a-border)] px-4 text-[13px] font-medium text-[var(--a-fg)] transition-colors hover:border-[var(--a-border-strong)] disabled:opacity-60"
            >
              {pending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <KeyRound className="size-3.5" />
              )}
              Change password
            </button>
          </div>
        </form>
      </Card>
    </>
  );
}

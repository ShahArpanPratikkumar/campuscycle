"use client";

import { Eye, EyeOff, LogIn } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { FormAlert } from "@/components/ui/form-alert";
import { Input } from "@/components/ui/input";
import { ApiClientError } from "@/lib/api/client";
import { zodIssuesToFieldErrors } from "@/lib/form-errors";
import { loginSchema } from "@/lib/validators/auth";

type FormErrors = Partial<Record<"email" | "password", string>>;

export function LoginForm({
  next,
  registered,
}: {
  next: string;
  registered: boolean;
}) {
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function clearField(field: keyof FormErrors) {
    setErrors((current) => ({ ...current, [field]: undefined }));
    setFormError(null);
    setSuccess(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setSuccess(null);

    const parsed = loginSchema.safeParse({ email, password, remember });
    if (!parsed.success) {
      setErrors(zodIssuesToFieldErrors(parsed.error.issues));
      setFormError("Please fix the highlighted fields and try again.");
      return;
    }

    setErrors({});
    setPending(true);

    try {
      await login({ ...parsed.data, next });
      setSuccess("Login successful. Taking you to your dashboard…");
    } catch (error) {
      if (error instanceof ApiClientError) {
        setErrors((current) => ({ ...current, ...error.fieldErrors() }));
        setFormError(error.message);
      } else {
        setFormError("Something went wrong. Please try again.");
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="flex flex-col gap-5" onSubmit={handleSubmit} noValidate>
      {registered ? (
        <div
          role="status"
          className="rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-800"
        >
          Registration successful. Log in with your new account to continue.
        </div>
      ) : null}

      {success ? (
        <div
          role="status"
          className="rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-800"
        >
          {success}
        </div>
      ) : null}

      <FormAlert message={formError} />

      <Field htmlFor="login-email" label="Email" required error={errors.email}>
        <Input
          id="login-email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@campus.edu"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            clearField("email");
          }}
          disabled={pending}
        />
      </Field>

      <Field
        htmlFor="login-password"
        label="Password"
        required
        error={errors.password}
      >
        <div className="relative">
          <Input
            id="login-password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="Your password"
            className="pr-11"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              clearField("password");
            }}
            disabled={pending}
          />
          <button
            type="button"
            onClick={() => setShowPassword((current) => !current)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
            className="absolute inset-y-0 right-0 inline-flex w-11 items-center justify-center rounded-r-lg text-slate-500 transition-colors hover:text-slate-800"
          >
            {showPassword ? (
              <EyeOff className="size-4" aria-hidden="true" />
            ) : (
              <Eye className="size-4" aria-hidden="true" />
            )}
          </button>
        </div>
      </Field>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="inline-flex items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            name="remember"
            checked={remember}
            onChange={(event) => {
              setRemember(event.target.checked);
              setFormError(null);
              setSuccess(null);
            }}
            disabled={pending}
            className="size-4 rounded border-slate-300 text-brand-600 accent-brand-600 focus:ring-brand-500"
          />
          Remember me
        </label>

        <Link
          href="/login#forgot-password"
          className="text-sm font-medium text-brand-700 hover:text-brand-800 hover:underline"
        >
          Forgot password?
        </Link>
      </div>

      <Button type="submit" loading={pending} icon={<LogIn className="size-4" aria-hidden="true" />}>
        {pending ? "Signing in…" : "Log in"}
      </Button>

      {/* Placeholder only — password recovery is not part of this step. */}
      <p
        id="forgot-password"
        className="hidden scroll-mt-24 text-xs leading-relaxed text-slate-500 target:block"
      >
        Password recovery is not available yet. Contact your campus administrator if you need help accessing your account.
      </p>
    </form>
  );
}

"use client";

import { Eye, EyeOff, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { FormAlert } from "@/components/ui/form-alert";
import { Input } from "@/components/ui/input";
import { ApiClientError } from "@/lib/api/client";
import { zodIssuesToFieldErrors } from "@/lib/form-errors";
import { registerSchema } from "@/lib/validators/auth";

function getPasswordStrength(password: string): {
  label: "Weak" | "Fair" | "Good" | "Strong";
  score: number;
  color: string;
} {
  if (!password) return { label: "Weak", score: 0, color: "bg-slate-200" };
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  const normalized = Math.min(4, Math.max(1, score)) as 1 | 2 | 3 | 4;
  const map = {
    1: { label: "Weak", color: "bg-rose-500" },
    2: { label: "Fair", color: "bg-amber-500" },
    3: { label: "Good", color: "bg-sky-500" },
    4: { label: "Strong", color: "bg-emerald-500" },
  } as const;
  return { score: normalized, ...map[normalized] };
}

type FieldName = "name" | "email" | "phone" | "password" | "confirmPassword";
type FormErrors = Partial<Record<FieldName, string>>;

const EMPTY_ERRORS: FormErrors = {};

export function RegisterForm() {
  const router = useRouter();
  const { register } = useAuth();

  const [form, setForm] = useState<Record<FieldName, string>>({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<FormErrors>(EMPTY_ERRORS);
  const [formError, setFormError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState(false);
  const passwordStrength = useMemo(
    () => getPasswordStrength(form.password),
    [form.password],
  );

  function update(field: FieldName, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setFormError(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const parsed = registerSchema.safeParse({
      name: form.name,
      email: form.email,
      phone: form.phone,
      password: form.password,
      confirmPassword: form.confirmPassword,
    });

    if (!parsed.success) {
      setErrors(zodIssuesToFieldErrors(parsed.error.issues));
      setFormError("Please fix the highlighted fields and try again.");
      return;
    }

    setErrors(EMPTY_ERRORS);
    setPending(true);

    try {
      await register({
        name: parsed.data.name,
        email: parsed.data.email,
        phone: parsed.data.phone,
        password: parsed.data.password,
        confirmPassword: form.confirmPassword,
      });
      // Registration deliberately does not log the user in. The login page
      // shows a success banner via ?registered=1.
      router.push("/login?registered=1");
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
      <FormAlert message={formError} />
      {pending ? (
        <div
          role="status"
          className="rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-700"
        >
          Creating your account…
        </div>
      ) : null}

      <Field htmlFor="register-name" label="Full name" required error={errors.name}>
        <Input
          id="register-name"
          name="name"
          autoComplete="name"
          placeholder="Aarav Sharma"
          value={form.name}
          onChange={(event) => update("name", event.target.value)}
          disabled={pending}
        />
      </Field>

      <Field htmlFor="register-email" label="Email" required error={errors.email}>
        <Input
          id="register-email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@campus.edu"
          value={form.email}
          onChange={(event) => update("email", event.target.value)}
          disabled={pending}
        />
      </Field>

      <Field htmlFor="register-phone" label="Phone number" optional error={errors.phone}>
        <Input
          id="register-phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          placeholder="+91 98765 43210"
          value={form.phone}
          onChange={(event) => update("phone", event.target.value)}
          disabled={pending}
        />
      </Field>

      <Field
        htmlFor="register-password"
        label="Password"
        required
        hint="At least 8 characters."
        error={errors.password}
      >
        <div className="relative">
          <Input
            id="register-password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            className="pr-11"
            value={form.password}
            onChange={(event) => update("password", event.target.value)}
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
        <div className="mt-2 flex items-center gap-3" aria-live="polite">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full transition-all ${passwordStrength.color}`}
              style={{ width: `${(passwordStrength.score / 4) * 100}%` }}
            />
          </div>
          <span className="text-xs font-medium text-slate-600">
            {form.password ? `Strength: ${passwordStrength.label}` : "Password strength"}
          </span>
        </div>
      </Field>

      <Field
        htmlFor="register-confirm"
        label="Confirm password"
        required
        error={errors.confirmPassword}
      >
        <Input
          id="register-confirm"
          name="confirmPassword"
          type={showPassword ? "text" : "password"}
          autoComplete="new-password"
          value={form.confirmPassword}
          onChange={(event) => update("confirmPassword", event.target.value)}
          disabled={pending}
        />
      </Field>

      <Button
        type="submit"
        loading={pending}
        icon={<UserPlus className="size-4" aria-hidden="true" />}
      >
        {pending ? "Creating account…" : "Create account"}
      </Button>
    </form>
  );
}

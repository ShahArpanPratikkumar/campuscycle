"use client";

import { Check, Plus, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup } from "@/components/ui/field";
import { FormAlert } from "@/components/ui/form-alert";
import { Input, Select, Textarea } from "@/components/ui/input";
import { useIdentity } from "@/hooks/use-identity";
import { useToast } from "@/hooks/use-toast";
import { ApiClientError, fetchJson } from "@/lib/api/client";
import { CONTACT_PREFERENCES } from "@/lib/constants";
import { zodIssuesToFieldErrors } from "@/lib/form-errors";
import { createUserSchema } from "@/lib/validators/user";
import type { ApiUser } from "@/lib/types";
import { cn } from "@/lib/utils";

interface NewProfileForm {
  displayName: string;
  email: string;
  campus: string;
  department: string;
  year: string;
  bio: string;
  contactPreference: string;
}

type FormErrors = Partial<Record<keyof NewProfileForm | "handle", string>>;

const EMPTY_FORM: NewProfileForm = {
  displayName: "",
  email: "",
  campus: "",
  department: "",
  year: "",
  bio: "",
  contactPreference: "message",
};

/**
 * Identity bootstrap.
 *
 * CampusCycle has no login. A student is simply the `_id` of a `User` document,
 * so this form either adopts an existing profile or creates a new one, then
 * stores the id in a cookie (`lib/identity.ts`) and returns the visitor to
 * wherever they were heading (`next`).
 *
 * The create path validates with the *same* `createUserSchema` the API uses, so
 * the client can never submit something the server would reject.
 */
export function SetupForm({
  profiles,
  next,
}: {
  profiles: ApiUser[];
  next: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const { setStudentId } = useIdentity();

  const [form, setForm] = useState<NewProfileForm>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null);

  function update<K extends keyof NewProfileForm>(
    key: K,
    value: NewProfileForm[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
    setFormError(null);
  }

  function enter(studentId: string, name: string) {
    setStudentId(studentId);
    toast({
      title: `Welcome, ${name}`,
      description: "You are now acting as this student.",
    });
    router.push(next);
    router.refresh();
  }

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const parsed = createUserSchema.safeParse({
      displayName: form.displayName.trim(),
      email: form.email.trim(),
      campus: form.campus.trim(),
      department: form.department.trim() || undefined,
      year: form.year ? Number(form.year) : undefined,
      bio: form.bio.trim() || undefined,
      contactPreference: form.contactPreference || undefined,
    });

    if (!parsed.success) {
      setErrors(zodIssuesToFieldErrors(parsed.error.issues));
      setFormError("Please fix the highlighted fields and try again.");
      return;
    }

    setErrors({});
    setPending("create");

    try {
      const created = await fetchJson<ApiUser>("/api/users", {
        method: "POST",
        body: JSON.stringify(parsed.data),
      });
      toast({
        title: "Profile created",
        description: `You are now acting as ${created.displayName}.`,
      });
      enter(created.id, created.displayName);
    } catch (error) {
      if (error instanceof ApiClientError) {
        setErrors((current) => ({ ...current, ...error.fieldErrors() }));
        setFormError(error.message);
      } else {
        setFormError("Something went wrong. Please try again.");
      }
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
      {/* Existing profiles ------------------------------------------------- */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <FieldGroup
          title="Continue as an existing student"
          description="Pick one of the profiles already on this campus."
        >
          {profiles.length > 0 ? (
            <ul className="flex flex-col gap-2">
              {profiles.map((profile) => {
                return (
                  <li key={profile.id}>
                    <button
                      type="button"
                      onClick={() => enter(profile.id, profile.displayName)}
                      disabled={pending !== null}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors disabled:opacity-60",
                        "border-slate-200 hover:border-brand-300 hover:bg-brand-50/60",
                      )}
                    >
                      <Avatar name={profile.displayName} src={profile.avatarUrl} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-slate-900">
                          {profile.displayName}
                        </span>
                        <span className="block truncate text-xs text-slate-500">
                          @{profile.handle} · {profile.campus}
                        </span>
                      </span>
                      {pending === profile.id ? (
                        <Check className="size-4 text-brand-600" aria-hidden="true" />
                      ) : (
                        <UserRound
                          className="size-4 text-slate-300"
                          aria-hidden="true"
                        />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50/60 px-4 py-6 text-center text-sm text-slate-500">
              No profiles exist yet. Create the first one on the right.
            </p>
          )}
        </FieldGroup>
      </div>

      {/* New profile -------------------------------------------------------- */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <FieldGroup
          title="Create a new profile"
          description="No password, no email verification — just enough for other students to recognise you."
        >
          {formError ? (
            <FormAlert message={formError} className="mb-1" />
          ) : null}

          <form className="flex flex-col gap-4" onSubmit={handleCreate} noValidate>
            <Field
              htmlFor="setup-name"
              label="Display name"
              required
              error={errors.displayName}
            >
              <Input
                id="setup-name"
                name="displayName"
                maxLength={60}
                value={form.displayName}
                onChange={(event) => update("displayName", event.target.value)}
                placeholder="e.g. Aarav Sharma"
              />
            </Field>

            <Field
              htmlFor="setup-email"
              label="Email"
              required
              error={errors.email}
              hint="Only used to identify your profile — nothing is ever sent."
            >
              <Input
                id="setup-email"
                name="email"
                type="email"
                value={form.email}
                onChange={(event) => update("email", event.target.value)}
                placeholder="aarav@campus.edu"
              />
            </Field>

            <Field
              htmlFor="setup-campus"
              label="Campus"
              required
              error={errors.campus}
            >
              <Input
                id="setup-campus"
                name="campus"
                maxLength={80}
                value={form.campus}
                onChange={(event) => update("campus", event.target.value)}
                placeholder="e.g. North Campus"
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                htmlFor="setup-department"
                label="Department"
                optional
                error={errors.department}
              >
                <Input
                  id="setup-department"
                  name="department"
                  maxLength={80}
                  value={form.department}
                  onChange={(event) => update("department", event.target.value)}
                  placeholder="e.g. Computer Science"
                />
              </Field>

              <Field htmlFor="setup-year" label="Year" optional error={errors.year}>
                <Select
                  id="setup-year"
                  name="year"
                  value={form.year}
                  onChange={(event) => update("year", event.target.value)}
                >
                  <option value="">Not specified</option>
                  {[1, 2, 3, 4, 5].map((year) => (
                    <option key={year} value={year}>
                      Year {year}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>

            <Field
              htmlFor="setup-bio"
              label="Short bio"
              optional
              error={errors.bio}
              labelAccessory={
                <span className="text-xs text-slate-400">
                  {form.bio.length}/300
                </span>
              }
            >
              <Textarea
                id="setup-bio"
                name="bio"
                rows={3}
                maxLength={300}
                value={form.bio}
                onChange={(event) => update("bio", event.target.value)}
                placeholder="Final-year CS student. Usually selling textbooks once the semester ends."
              />
            </Field>

            <Field
              htmlFor="setup-contact"
              label="Contact preference"
              optional
              error={errors.contactPreference}
              hint="How you would like buyers to reach you. Shown on your profile — never your email."
            >
              <Select
                id="setup-contact"
                name="contactPreference"
                value={form.contactPreference}
                onChange={(event) =>
                  update("contactPreference", event.target.value)
                }
              >
                {CONTACT_PREFERENCES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </Field>

            <Button
              type="submit"
              loading={pending === "create"}
              icon={<Plus className="size-4" aria-hidden="true" />}
              className="self-start"
            >
              Create profile &amp; continue
            </Button>
          </form>
        </FieldGroup>
      </div>
    </div>
  );
}

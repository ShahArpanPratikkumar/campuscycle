"use client";

import { ImagePlus, Sparkles, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ListingCard } from "@/components/listings/listing-card";
import { Button, ButtonLink } from "@/components/ui/button";
import { Field, FieldGroup } from "@/components/ui/field";
import { FormAlert } from "@/components/ui/form-alert";
import { Input, Select, Textarea } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ApiClientError, fetchJson } from "@/lib/api/client";
import {
  CATEGORIES,
  CONDITIONS,
  LISTING_TYPES,
  MARKETPLACE_LIMITS,
} from "@/lib/constants";
import { zodIssuesToFieldErrors } from "@/lib/form-errors";
import { createProductSchema } from "@/lib/validators/product";
import type {
  ApiProduct,
  Category,
  Condition,
  Listing,
  ListingType,
} from "@/lib/types";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/*  Form state                                                                 */
/* -------------------------------------------------------------------------- */

export interface ListingFormValues {
  title: string;
  description: string;
  category: Category;
  condition: Condition;
  listingType: ListingType;
  price: string;
  exchangeFor: string;
  location: string;
  tags: string;
  images: string[];
}

type FormField = keyof ListingFormValues;
type FormErrors = Partial<Record<FormField, string>>;

export const EMPTY_LISTING_FORM: ListingFormValues = {
  title: "",
  description: "",
  category: "books",
  condition: "good",
  listingType: "sale",
  price: "",
  exchangeFor: "",
  location: "",
  tags: "",
  images: [],
};

export interface ListingFormProps {
  mode?: "create" | "edit";
  /** Required in edit mode — the product being updated. */
  productId?: string;
  /** Pre-filled values (edit mode, or a re-opened draft). */
  initial?: ListingFormValues;
}

/**
 * Create / edit form for a product.
 *
 * Validation is not hand-written: the payload is parsed with the *same*
 * `createProductSchema` the API route uses, so a field the client accepts can
 * never be rejected by the server (and vice versa). The parse output — with
 * prices zeroed for free/exchange and tags normalised — is what gets submitted.
 *
 * On success the user is sent to the listing's detail page and a toast
 * confirms the write.
 */
export function ListingForm({
  mode = "create",
  productId,
  initial = EMPTY_LISTING_FORM,
}: ListingFormProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [form, setForm] = useState<ListingFormValues>(initial);
  const [errors, setErrors] = useState<FormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function update<K extends FormField>(key: K, value: ListingFormValues[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
    setFormError(null);
  }

  function updateImage(index: number, value: string) {
    setForm((current) => ({
      ...current,
      images: current.images.map((image, i) => (i === index ? value : image)),
    }));
    setErrors((current) => ({ ...current, images: undefined }));
    setFormError(null);
  }

  function addImage() {
    setForm((current) => ({
      ...current,
      images:
        current.images.length >= MARKETPLACE_LIMITS.maxImages
          ? current.images
          : [...current.images, ""],
    }));
  }

  function removeImage(index: number) {
    setForm((current) => ({
      ...current,
      images: current.images.filter((_, i) => i !== index),
    }));
  }

  /** The payload the API expects, before normalisation. */
  function buildPayload(state: ListingFormValues) {
    return {
      title: state.title.trim(),
      description: state.description.trim(),
      price: state.listingType === "sale" ? Number(state.price) : 0,
      listingType: state.listingType,
      category: state.category,
      condition: state.condition,
      images: state.images.map((image) => image.trim()).filter(Boolean),
      location: state.location.trim(),
      exchangeFor:
        state.listingType === "exchange" ? state.exchangeFor.trim() : undefined,
      tags: state.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    };
  }

  const preview: Listing = useMemo(() => {
    const now = new Date().toISOString();
    return {
      id: "preview",
      sellerId: "preview",
      title: form.title.trim() || "Your listing title",
      description:
        form.description.trim() ||
        "Your description will appear here as you type, so you can see exactly how the card looks in the marketplace.",
      price: form.listingType === "sale" ? Number(form.price) || 0 : 0,
      listingType: form.listingType,
      category: form.category,
      condition: form.condition,
      images: form.images.map((image) => image.trim()).filter(Boolean),
      location: form.location.trim() || "Pickup location",
      exchangeFor:
        form.listingType === "exchange"
          ? form.exchangeFor.trim() || undefined
          : undefined,
      tags: form.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      status: "available",
      viewCount: 0,
      createdAt: now,
      updatedAt: now,
    };
  }, [form]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const parsed = createProductSchema.safeParse(buildPayload(form));

    if (!parsed.success) {
      setErrors(zodIssuesToFieldErrors(parsed.error.issues));
      setFormError("Please fix the highlighted fields and try again.");
      toast({
        title: "Check the form",
        description: "Some details need your attention before this can be saved.",
        tone: "error",
      });
      return;
    }

    setErrors({});
    setSubmitting(true);

    // `parsed.data` is the normalised payload (BR-8/9 price zeroing, tag
    // normalisation), so the client sends exactly what the server validated.
    const body =
      mode === "edit"
        ? {
            ...parsed.data,
            // Editing a product away from `exchange` clears the field (BR-23).
            exchangeFor:
              parsed.data.listingType === "exchange"
                ? parsed.data.exchangeFor
                : null,
          }
        : parsed.data;

    try {
      if (mode === "create") {
        const created = await fetchJson<ApiProduct>("/api/products", {
          method: "POST",
          body: JSON.stringify(body),
        });
        toast({
          title: "Listing published",
          description: `“${created.title}” is now live in the marketplace.`,
        });
        router.push(`/marketplace/${created.id}`);
        router.refresh();
      } else {
        const updated = await fetchJson<ApiProduct>(
          `/api/products/${productId}`,
          { method: "PUT", body: JSON.stringify(body) },
        );
        toast({
          title: "Listing updated",
          description: `Your changes to “${updated.title}” have been saved.`,
        });
        router.push(`/marketplace/${updated.id}`);
        router.refresh();
      }
    } catch (error) {
      if (error instanceof ApiClientError) {
        setErrors((current) => ({ ...current, ...error.fieldErrors() }));
        setFormError(error.message);
        toast({
          title: mode === "create" ? "Could not publish" : "Could not save",
          description: error.message,
          tone: "error",
        });
      } else {
        setFormError("Something went wrong. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  const submitLabel = mode === "create" ? "Publish listing" : "Save changes";

  return (
    <form
      className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start"
      onSubmit={handleSubmit}
      noValidate
    >
      <div className="flex flex-col gap-6">
        <FormAlert message={formError} className="rounded-xl px-4 py-3" />

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <FieldGroup
            title="What are you listing?"
            description="Be specific — clear titles get replies much faster."
          >
            <Field
              htmlFor="listing-title"
              label="Title"
              required
              error={errors.title}
              labelAccessory={
                <span className="text-xs text-slate-400">
                  {form.title.length}/120
                </span>
              }
            >
              <Input
                id="listing-title"
                name="title"
                maxLength={120}
                value={form.title}
                onChange={(event) => update("title", event.target.value)}
                placeholder="e.g. Casio FX-991ES Plus Scientific Calculator"
              />
            </Field>

            <Field
              htmlFor="listing-description"
              label="Description"
              required
              error={errors.description}
              hint="Mention condition, age, what is included and any flaws."
              labelAccessory={
                <span className="text-xs text-slate-400">
                  {form.description.length}/4000
                </span>
              }
            >
              <Textarea
                id="listing-description"
                name="description"
                maxLength={4000}
                rows={6}
                value={form.description}
                onChange={(event) => update("description", event.target.value)}
                placeholder="Used for one semester. All keys work, cover included, small scratch on the lid."
              />
            </Field>
          </FieldGroup>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <FieldGroup
            title="Category and condition"
            description="This is how students will filter to find your item."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field htmlFor="listing-category" label="Category" required>
                <Select
                  id="listing-category"
                  name="category"
                  value={form.category}
                  onChange={(event) =>
                    update("category", event.target.value as Category)
                  }
                >
                  {CATEGORIES.map((category) => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field htmlFor="listing-condition" label="Condition" required>
                <Select
                  id="listing-condition"
                  name="condition"
                  value={form.condition}
                  onChange={(event) =>
                    update("condition", event.target.value as Condition)
                  }
                >
                  {CONDITIONS.map((condition) => (
                    <option key={condition.value} value={condition.value}>
                      {condition.label}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>

            <Field
              htmlFor="listing-location"
              label="Pickup location"
              required
              error={errors.location}
              hint="Keep it to a campus landmark — never a full address."
            >
              <Input
                id="listing-location"
                name="location"
                maxLength={120}
                value={form.location}
                onChange={(event) => update("location", event.target.value)}
                placeholder="e.g. Hostel B, Room 214"
              />
            </Field>
          </FieldGroup>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <FieldGroup
            title="Price"
            description="Selling, giving away or swapping — you decide."
          >
            <fieldset className="flex flex-col gap-2">
              <legend className="sr-only">Listing type</legend>
              {LISTING_TYPES.map((type) => (
                <label
                  key={type.value}
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-lg border p-3.5 transition-colors",
                    form.listingType === type.value
                      ? "border-brand-300 bg-brand-50/60"
                      : "border-slate-200 hover:bg-slate-50",
                  )}
                >
                  <input
                    type="radio"
                    name="listingType"
                    value={type.value}
                    checked={form.listingType === type.value}
                    onChange={() => update("listingType", type.value)}
                    className="mt-0.5 size-4 accent-brand-600"
                  />
                  <span className="flex flex-col">
                    <span className="text-sm font-medium text-slate-900">
                      {type.label}
                    </span>
                    <span className="text-xs text-slate-500">
                      {type.description}
                    </span>
                  </span>
                </label>
              ))}
            </fieldset>

            {form.listingType === "sale" ? (
              <Field
                htmlFor="listing-price"
                label="Price (₹)"
                required
                error={errors.price}
                hint={`Up to ₹${MARKETPLACE_LIMITS.maxPrice.toLocaleString("en-IN")}.`}
              >
                <Input
                  id="listing-price"
                  name="price"
                  inputMode="decimal"
                  value={form.price}
                  onChange={(event) => update("price", event.target.value)}
                  placeholder="650"
                />
              </Field>
            ) : null}

            {form.listingType === "exchange" ? (
              <Field
                htmlFor="listing-exchange"
                label="What would you like in return?"
                required
                error={errors.exchangeFor}
              >
                <Input
                  id="listing-exchange"
                  name="exchangeFor"
                  maxLength={200}
                  value={form.exchangeFor}
                  onChange={(event) => update("exchangeFor", event.target.value)}
                  placeholder="e.g. A working study lamp + ₹1,000"
                />
              </Field>
            ) : null}

            <Field
              htmlFor="listing-tags"
              label="Tags"
              optional
              error={errors.tags}
              hint="Comma separated, up to 8. They help your listing show up in search."
            >
              <Input
                id="listing-tags"
                name="tags"
                value={form.tags}
                onChange={(event) => update("tags", event.target.value)}
                placeholder="calculator, casio, engineering"
              />
            </Field>
          </FieldGroup>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <FieldGroup
            title="Photos"
            description={`Paste image URLs (up to ${MARKETPLACE_LIMITS.maxImages}). Leave empty to use the category tile.`}
          >
            <Field
              htmlFor="listing-image-0"
              label="Image URLs"
              optional
              error={errors.images}
            >
              <div className="flex flex-col gap-2">
                {form.images.map((url, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      id={`listing-image-${index}`}
                      name={`image-${index}`}
                      value={url}
                      onChange={(event) => updateImage(index, event.target.value)}
                      placeholder="https://example.com/photo.jpg"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeImage(index)}
                      aria-label={`Remove image ${index + 1}`}
                      className="shrink-0 text-slate-500"
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                    </Button>
                  </div>
                ))}

                {form.images.length < MARKETPLACE_LIMITS.maxImages ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addImage}
                    icon={<ImagePlus className="size-4" aria-hidden="true" />}
                    className="self-start"
                  >
                    Add image URL
                  </Button>
                ) : null}

                {form.images.length === 0 ? (
                  <p className="text-xs text-slate-500">
                    No photos yet — your card will show a category tile instead.
                  </p>
                ) : null}
              </div>
            </Field>
          </FieldGroup>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" size="lg" loading={submitting}>
            {submitLabel}
          </Button>
          <ButtonLink
            href={mode === "edit" && productId ? `/marketplace/${productId}` : "/dashboard/listings"}
            variant="ghost"
            size="lg"
          >
            Cancel
          </ButtonLink>
        </div>
      </div>

      <aside className="lg:sticky lg:top-24">
        <div className="flex items-center gap-2 pb-3">
          <Sparkles className="size-4 text-brand-600" aria-hidden="true" />
          <h2 className="text-sm font-semibold text-slate-900">Live preview</h2>
        </div>
        <ListingCard listing={preview} />
        <p className="mt-3 text-xs text-slate-500">
          This is exactly how your card will look in the marketplace grid.{" "}
          <Link href="/marketplace" className="font-medium text-brand-700 hover:underline">
            See live listings
          </Link>
          .
        </p>
      </aside>
    </form>
  );
}

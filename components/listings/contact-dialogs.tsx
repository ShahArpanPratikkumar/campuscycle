"use client";

import { CheckCircle2, HandCoins, MessageSquare } from "lucide-react";
import { useState } from "react";
import { InfoBanner } from "@/components/common/info-banner";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { FormAlert } from "@/components/ui/form-alert";
import { Input, Textarea } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/hooks/use-toast";
import { ApiClientError, fetchJson } from "@/lib/api/client";
import {
  buildEnquiryDraft,
  buildOfferDraft,
  CONTACT_ENDPOINTS,
  contactSchemas,
  parseAmount,
} from "@/lib/contact";
import type { ApiEnquiry, ApiOffer, ListingWithSeller } from "@/lib/types";
import { formatPrice } from "@/lib/utils";

/**
 * Enquiry + offer actions for the listing detail page.
 *
 * Both dialogs validate their draft with the same Zod schemas the server uses
 * (`lib/contact.ts`) and then POST it. The server response drives the feedback:
 * a success panel + toast on `201`, and the server's own error message inline on
 * failure (so a business-rule rejection reads exactly as the API phrased it).
 *
 * The buttons are hidden on your own listing (using the real viewer identity
 * from the session cookie) and disabled on listings that are no longer
 * available.
 */
export function ContactActions({
  listing,
  viewerId,
}: {
  listing: ListingWithSeller;
  viewerId: string | null;
}) {
  const [openDialog, setOpenDialog] = useState<"enquiry" | "offer" | null>(null);
  const isOwnListing = viewerId !== null && listing.sellerId === viewerId;
  const isAvailable = listing.status === "available";
  // BR-7: offers are only meaningful on a priced (for-sale) listing.
  const canOffer = listing.listingType === "sale";

  if (isOwnListing) {
    return (
      <InfoBanner title="This is your listing">
        Manage the enquiries and offers you receive from the Dashboard.
      </InfoBanner>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          onClick={() => setOpenDialog("enquiry")}
          disabled={!isAvailable}
          icon={<MessageSquare className="size-4" aria-hidden="true" />}
          className="flex-1"
        >
          Send an enquiry
        </Button>
        {canOffer ? (
          <Button
            variant="outline"
            onClick={() => setOpenDialog("offer")}
            disabled={!isAvailable}
            icon={<HandCoins className="size-4" aria-hidden="true" />}
            className="flex-1"
          >
            Make an offer
          </Button>
        ) : null}
      </div>

      {!isAvailable ? (
        <p className="text-xs text-slate-500">
          This item is {listing.status}, so enquiries and offers are closed.
        </p>
      ) : null}

      <EnquiryDialog
        listing={listing}
        viewerId={viewerId}
        open={openDialog === "enquiry"}
        onClose={() => setOpenDialog(null)}
      />
      {canOffer ? (
        <OfferDialog
          listing={listing}
          viewerId={viewerId}
          open={openDialog === "offer"}
          onClose={() => setOpenDialog(null)}
        />
      ) : null}
    </div>
  );
}

interface DialogProps {
  listing: ListingWithSeller;
  viewerId: string | null;
  open: boolean;
  onClose: () => void;
}

function EnquiryDialog({ listing, viewerId, open, onClose }: DialogProps) {
  const { toast } = useToast();
  const [message, setMessage] = useState("");
  const [price, setPrice] = useState("");
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function close() {
    onClose();
    setSent(false);
    setMessage("");
    setPrice("");
    setError(null);
    setSubmitting(false);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!viewerId) {
      setError("Set up your student profile before sending an enquiry.");
      return;
    }

    // Build and validate the exact body `POST /api/enquiries` accepts.
    const draft = buildEnquiryDraft(listing, viewerId, {
      message,
      offerPrice: parseAmount(price),
    });
    const parsed = contactSchemas.enquiry.safeParse(draft);

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Please check the form.");
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      await fetchJson<ApiEnquiry>(CONTACT_ENDPOINTS.enquiries, {
        method: "POST",
        body: JSON.stringify(parsed.data),
      });
      setSent(true);
      toast({
        title: "Enquiry sent",
        description: `${listing.seller.displayName} will see it in their dashboard.`,
      });
    } catch (caught) {
      setError(
        caught instanceof ApiClientError
          ? caught.message
          : "Could not send your enquiry. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={close}
      title="Send an enquiry"
      description={`Ask ${listing.seller.displayName} about this item.`}
      footer={
        sent ? (
          <Button onClick={close}>Close</Button>
        ) : (
          <>
            <Button variant="ghost" onClick={close} disabled={submitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              form="enquiry-form"
              loading={submitting}
              disabled={!viewerId}
            >
              Send enquiry
            </Button>
          </>
        )
      }
    >
      {sent ? (
        <SuccessPanel
          title="Enquiry sent"
          body={`Your question reached ${listing.seller.displayName}. They will reply from their dashboard.`}
        />
      ) : (
        <form
          id="enquiry-form"
          className="flex flex-col gap-4"
          onSubmit={handleSubmit}
          noValidate
        >
          <FormAlert message={error} />

          {!viewerId ? (
            <InfoBanner tone="info" title="No profile selected">
              Set up a student identity first — the server needs to know who is
              asking.
            </InfoBanner>
          ) : null}

          <Field
            htmlFor="enquiry-message"
            label="Your question"
            required
            labelAccessory={
              <span className="text-xs text-slate-400">{message.length}/1000</span>
            }
          >
            <Textarea
              id="enquiry-message"
              name="message"
              required
              maxLength={1000}
              rows={4}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder={`Hi! Is “${listing.title}” still available?`}
            />
          </Field>

          <Field
            htmlFor="enquiry-price"
            label="Your price"
            optional
            hint="Leave blank if you are only asking a question."
          >
            <Input
              id="enquiry-price"
              name="price"
              inputMode="numeric"
              value={price}
              onChange={(event) => setPrice(event.target.value)}
              placeholder={`Listed at ${formatPrice(listing.price, listing.listingType)}`}
            />
          </Field>
        </form>
      )}
    </Modal>
  );
}

function OfferDialog({ listing, viewerId, open, onClose }: DialogProps) {
  const { toast } = useToast();
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function close() {
    onClose();
    setSent(false);
    setAmount("");
    setMessage("");
    setError(null);
    setSubmitting(false);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!viewerId) {
      setError("Set up your student profile before making an offer.");
      return;
    }

    const parsedAmount = parseAmount(amount);
    if (parsedAmount === undefined) {
      setError("Enter the amount you would like to offer.");
      return;
    }

    // The exact body `POST /api/offers` accepts.
    const draft = buildOfferDraft(listing, viewerId, {
      offerPrice: parsedAmount,
      message,
    });
    const parsed = contactSchemas.offer.safeParse(draft);

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Please check the form.");
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      await fetchJson<ApiOffer>(CONTACT_ENDPOINTS.offers, {
        method: "POST",
        body: JSON.stringify(parsed.data),
      });
      setSent(true);
      toast({
        title: "Offer sent",
        description: `${listing.seller.displayName} can accept, decline or counter it.`,
      });
    } catch (caught) {
      setError(
        caught instanceof ApiClientError
          ? caught.message
          : "Could not send your offer. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={close}
      title="Make an offer"
      description={`Tell ${listing.seller.displayName} what you would like to pay.`}
      footer={
        sent ? (
          <Button onClick={close}>Close</Button>
        ) : (
          <>
            <Button variant="ghost" onClick={close} disabled={submitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              form="offer-form"
              loading={submitting}
              disabled={!viewerId}
            >
              Send offer
            </Button>
          </>
        )
      }
    >
      {sent ? (
        <SuccessPanel
          title="Offer sent"
          body={`Your offer is now pending with ${listing.seller.displayName}. Accepting it reserves the item for you.`}
        />
      ) : (
        <form
          id="offer-form"
          className="flex flex-col gap-4"
          onSubmit={handleSubmit}
          noValidate
        >
          <FormAlert message={error} />

          {!viewerId ? (
            <InfoBanner tone="info" title="No profile selected">
              Set up a student identity first — the server needs to know who is
              offering.
            </InfoBanner>
          ) : null}

          <Field
            htmlFor="offer-amount"
            label="Your offer"
            required
            hint={`Listed at ${formatPrice(listing.price, listing.listingType)}.`}
          >
            <Input
              id="offer-amount"
              name="amount"
              inputMode="numeric"
              required
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder="e.g. 500"
            />
          </Field>

          <Field
            htmlFor="offer-message"
            label="Message"
            optional
            labelAccessory={
              <span className="text-xs text-slate-400">{message.length}/500</span>
            }
          >
            <Textarea
              id="offer-message"
              name="message"
              maxLength={500}
              rows={3}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="When can you collect it?"
            />
          </Field>
        </form>
      )}
    </Modal>
  );
}

function SuccessPanel({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-6 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
        <CheckCircle2 className="size-6" aria-hidden="true" />
      </span>
      <div>
        <p className="font-semibold text-slate-900">{title}</p>
        <p className="mt-1 text-sm text-slate-500">{body}</p>
      </div>
    </div>
  );
}

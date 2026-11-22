"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { FormAlert } from "@/components/ui/form-alert";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/hooks/use-toast";
import { ApiClientError, fetchJson } from "@/lib/api/client";
import { parseAmount } from "@/lib/contact";
import type { ApiEnquiry, ApiOffer } from "@/lib/types";

/**
 * Seller/buyer action bars for the dashboard enquiry and offer cards.
 *
 * The buttons are a direct reflection of the server's state machine: a card only
 * offers the moves that are legal from the request's current status *and* for
 * the viewer's side. Every call goes through `fetchJson` (which attaches the
 * acting student id), shows the server's message on failure, and
 * `router.refresh()`es the list on success.
 */

export type ViewerRole = "seller" | "buyer";

/* -------------------------------------------------------------------------- */
/*  Enquiry                                                                    */
/* -------------------------------------------------------------------------- */

export function EnquiryActions({
  enquiry,
  viewerRole,
}: {
  enquiry: ApiEnquiry;
  viewerRole: ViewerRole;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, setPending] = useState<string | null>(null);

  const isPending = enquiry.status === "pending";
  const canRespond = isPending && viewerRole === "seller";
  const canCancel = isPending && viewerRole === "buyer";

  async function respond(
    action: "accept" | "reject" | "cancel",
    success: { title: string; description: string },
  ) {
    setPending(action);
    try {
      await fetchJson<ApiEnquiry>(`/api/enquiries/${enquiry.id}`, {
        method: "PUT",
        body: JSON.stringify({ action }),
      });
      toast(success);
      router.refresh();
    } catch (error) {
      toast({
        title: "Could not update enquiry",
        description:
          error instanceof ApiClientError
            ? error.message
            : "Something went wrong. Please try again.",
        tone: "error",
      });
    } finally {
      setPending(null);
    }
  }

  if (!canRespond && !canCancel) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {canRespond ? (
        <>
          <Button
            size="sm"
            loading={pending === "accept"}
            disabled={pending !== null}
            onClick={() =>
              respond("accept", {
                title: "Enquiry accepted",
                description: "The buyer has been told you can help.",
              })
            }
          >
            Accept
          </Button>
          <Button
            size="sm"
            variant="outline"
            loading={pending === "reject"}
            disabled={pending !== null}
            onClick={() =>
              respond("reject", {
                title: "Enquiry declined",
                description: "The enquiry has been closed.",
              })
            }
          >
            Decline
          </Button>
        </>
      ) : null}

      {canCancel ? (
        <Button
          size="sm"
          variant="outline"
          loading={pending === "cancel"}
          disabled={pending !== null}
          onClick={() =>
            respond("cancel", {
              title: "Enquiry cancelled",
              description: "You withdrew your enquiry.",
            })
          }
        >
          Cancel enquiry
        </Button>
      ) : null}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Offer                                                                      */
/* -------------------------------------------------------------------------- */

export function OfferActions({
  offer,
  viewerRole,
}: {
  offer: ApiOffer;
  viewerRole: ViewerRole;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, setPending] = useState<string | null>(null);
  const [counterOpen, setCounterOpen] = useState(false);
  const [counterPrice, setCounterPrice] = useState("");
  const [counterError, setCounterError] = useState<string | null>(null);

  // The seller decides a fresh offer; the buyer answers a counter. Either side's
  // buyer can always withdraw while the negotiation is live.
  const sellerDecides = offer.status === "pending" && viewerRole === "seller";
  const buyerAnswers = offer.status === "countered" && viewerRole === "buyer";
  const buyerCanWithdraw =
    (offer.status === "pending" || offer.status === "countered") &&
    viewerRole === "buyer";

  async function respond(
    body: Record<string, unknown>,
    success: { title: string; description: string },
    onSuccess?: () => void,
  ) {
    setPending(String(body.action));
    try {
      await fetchJson<ApiOffer>(`/api/offers/${offer.id}`, {
        method: "PUT",
        body: JSON.stringify(body),
      });
      toast(success);
      onSuccess?.();
      router.refresh();
    } catch (error) {
      const message =
        error instanceof ApiClientError
          ? error.message
          : "Something went wrong. Please try again.";
      if (body.action === "counter") {
        setCounterError(message);
      } else {
        toast({
          title: "Could not update offer",
          description: message,
          tone: "error",
        });
      }
    } finally {
      setPending(null);
    }
  }

  const accept = () =>
    respond(
      { action: "accept" },
      {
        title: "Offer accepted",
        description: "The item is now reserved for the buyer.",
      },
    );

  const reject = () =>
    respond(
      { action: "reject" },
      { title: "Offer declined", description: "The offer has been closed." },
    );

  const withdraw = () =>
    respond(
      { action: "withdraw" },
      { title: "Offer withdrawn", description: "You pulled your offer." },
    );

  function openCounter() {
    setCounterPrice("");
    setCounterError(null);
    setCounterOpen(true);
  }

  function submitCounter(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = parseAmount(counterPrice);
    if (value === undefined) {
      setCounterError("Enter the price you would like to counter with.");
      return;
    }
    setCounterError(null);
    respond(
      { action: "counter", counterPrice: value },
      {
        title: "Counter offer sent",
        description: "The buyer can now accept, decline or withdraw.",
      },
      () => setCounterOpen(false),
    );
  }

  if (!sellerDecides && !buyerAnswers && !buyerCanWithdraw) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {sellerDecides ? (
        <>
          <Button
            size="sm"
            loading={pending === "accept"}
            disabled={pending !== null}
            onClick={accept}
          >
            Accept offer
          </Button>
          <Button
            size="sm"
            variant="outline"
            loading={pending === "reject"}
            disabled={pending !== null}
            onClick={reject}
          >
            Decline
          </Button>
          <Button
            size="sm"
            variant="ghost"
            disabled={pending !== null}
            onClick={openCounter}
          >
            Counter
          </Button>
        </>
      ) : null}

      {buyerAnswers ? (
        <>
          <Button
            size="sm"
            loading={pending === "accept"}
            disabled={pending !== null}
            onClick={accept}
          >
            Accept counter
          </Button>
          <Button
            size="sm"
            variant="outline"
            loading={pending === "reject"}
            disabled={pending !== null}
            onClick={reject}
          >
            Decline
          </Button>
        </>
      ) : null}

      {buyerCanWithdraw ? (
        <Button
          size="sm"
          variant="outline"
          loading={pending === "withdraw"}
          disabled={pending !== null}
          onClick={withdraw}
        >
          Withdraw
        </Button>
      ) : null}

      <Modal
        open={counterOpen}
        onClose={() => (pending ? undefined : setCounterOpen(false))}
        title="Counter this offer"
        description={`The buyer offered an amount for this item. Suggest a price in between.`}
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => setCounterOpen(false)}
              disabled={pending !== null}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="counter-form"
              loading={pending === "counter"}
            >
              Send counter
            </Button>
          </>
        }
      >
        <form
          id="counter-form"
          className="flex flex-col gap-4"
          onSubmit={submitCounter}
          noValidate
        >
          <FormAlert message={counterError} />

          <Field
            htmlFor="counter-price"
            label="Your counter price"
            required
            hint={`Must be above the buyer's offer and no higher than the original asking price.`}
          >
            <Input
              id="counter-price"
              name="counterPrice"
              inputMode="numeric"
              required
              value={counterPrice}
              onChange={(event) => setCounterPrice(event.target.value)}
              placeholder="e.g. 600"
            />
          </Field>
        </form>
      </Modal>
    </div>
  );
}

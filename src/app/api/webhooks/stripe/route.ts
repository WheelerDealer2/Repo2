import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { createServiceClient } from "@/lib/supabase/service";
import { getStripe } from "@/lib/stripe/server";

// Source of truth for payment success. Per spec §5a: never activate a
// listing from the client-side success redirect — only from here, after
// Stripe's signature is verified, using the service role key (which is
// what lets this bypass the trigger that otherwise blocks anyone else
// from flipping a listing to `active`).
export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  const stripe = getStripe();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: `Signature verification failed: ${message}` }, { status: 400 });
  }

  const supabase = createServiceClient();

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const listingId = session.metadata?.listing_id;

    if (listingId) {
      await supabase
        .from("listing_payments")
        .update({
          status: "paid",
          stripe_payment_intent_id:
            typeof session.payment_intent === "string" ? session.payment_intent : null,
          amount_cents: session.amount_total ?? undefined,
          paid_at: new Date().toISOString(),
        })
        .eq("stripe_checkout_session_id", session.id);

      // Guarded by status so a duplicate webhook delivery (Stripe can
      // send the same event more than once) doesn't clobber a listing
      // that's since been marked sold/removed.
      await supabase
        .from("listings")
        .update({ status: "active" })
        .eq("id", listingId)
        .eq("status", "pending_payment");
    }
  }

  if (event.type === "checkout.session.expired") {
    const session = event.data.object as Stripe.Checkout.Session;

    await supabase
      .from("listing_payments")
      .update({ status: "failed" })
      .eq("stripe_checkout_session_id", session.id);
  }

  return NextResponse.json({ received: true });
}

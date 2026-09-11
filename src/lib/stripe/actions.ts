"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getStripe, LISTING_FEE_AUD_CENTS } from "@/lib/stripe/server";

async function getOrigin() {
  const h = await headers();
  const host = h.get("host")!;
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

// Starts a Stripe Checkout session for the flat per-listing fee. The
// listing stays `pending_payment` until the webhook (not this action, and
// not the success-page redirect) confirms payment and flips it live.
export async function createCheckoutSessionAction(listingId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: listing, error } = await supabase
    .from("listings")
    .select("id, make, model, year, seller_id, status")
    .eq("id", listingId)
    .single();

  if (error || !listing || listing.seller_id !== user.id) {
    redirect("/?error=listing_not_found");
  }

  if (listing.status !== "pending_payment") {
    redirect("/");
  }

  const origin = await getOrigin();
  const stripe = getStripe();

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "aud",
          unit_amount: LISTING_FEE_AUD_CENTS,
          product_data: {
            name: `Listing fee — ${listing.year} ${listing.make} ${listing.model}`,
          },
        },
        quantity: 1,
      },
    ],
    metadata: { listing_id: listing.id },
    success_url: `${origin}/post/success?listing_id=${listing.id}`,
    cancel_url: `${origin}/post/cancelled?listing_id=${listing.id}`,
  });

  if (!session.url) {
    redirect("/?error=checkout_failed");
  }

  // Recorded up front (not by the webhook) so a checkout.session.expired
  // event has a `pending` row to find and mark `failed` — service role
  // because listing_payments has no client-facing insert policy.
  const serviceClient = createServiceClient();
  await serviceClient.from("listing_payments").insert({
    listing_id: listing.id,
    seller_id: user.id,
    stripe_checkout_session_id: session.id,
    amount_cents: LISTING_FEE_AUD_CENTS,
    currency: "aud",
    status: "pending",
  });

  redirect(session.url);
}

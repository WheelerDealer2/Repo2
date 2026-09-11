import Stripe from "stripe";

export const LISTING_FEE_AUD_CENTS = 500;

export function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!);
}

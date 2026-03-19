import Stripe from "stripe";

let stripeInstance: Stripe | null = null;

export function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("Missing STRIPE_SECRET_KEY environment variable.");
  }

  if (!stripeInstance) {
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY);
  }

  return stripeInstance;
}

export async function getCheckoutSession(sessionId: string) {
  const stripe = getStripe();
  return stripe.checkout.sessions.retrieve(sessionId);
}

export async function getCheckoutSessionLineItems(sessionId: string) {
  const stripe = getStripe();
  const response = await stripe.checkout.sessions.listLineItems(sessionId, {
    limit: 100,
    expand: ["data.price"],
  });

  return response.data;
}

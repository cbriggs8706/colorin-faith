import { NextResponse } from "next/server";
import { getProducts } from "@/lib/store";
import { getSiteUrl } from "@/lib/supabase/env";
import { getStripe } from "@/lib/stripe";
import type { CartItem } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { slug?: string; variantId?: string; items?: CartItem[] };
    const requestedItems =
      body.items && body.items.length > 0
        ? body.items
        : body.slug
          ? [{ slug: body.slug, variantId: body.variantId ?? "standard", quantity: 1 }]
          : [];

    if (requestedItems.length === 0) {
      return NextResponse.json({ error: "Your cart is empty." }, { status: 400 });
    }

    const products = await getProducts();
    const productsBySlug = new Map(products.map((product) => [product.slug, product]));
    const lineItems = requestedItems.map((item) => {
      const product = productsBySlug.get(item.slug);
      const variant =
        product?.variants.find((entry) => entry.id === item.variantId) ?? product?.variants[0];

      if (!product) {
        throw new Error(`Product "${item.slug}" was not found.`);
      }

      if (!variant) {
        throw new Error(`Variant "${item.variantId}" was not found for "${product.name}".`);
      }

      if (!variant.stripePriceId) {
        throw new Error(
          `"${product.name}" (${variant.name}) is missing a Stripe price ID. Add one in the admin before selling it.`,
        );
      }

      return {
        price: variant.stripePriceId,
        quantity: Math.max(1, Math.floor(item.quantity)),
      };
    });

    const stripe = getStripe();
    const siteUrl = getSiteUrl();

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      success_url: `${siteUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/cancel`,
      line_items: lineItems,
      allow_promotion_codes: true,
      billing_address_collection: "auto",
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to create checkout session.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

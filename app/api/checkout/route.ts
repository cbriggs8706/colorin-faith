import { NextResponse } from "next/server";
import { getProductBySlug } from "@/lib/store";
import { getStripe } from "@/lib/stripe";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { slug?: string };

    if (!body.slug) {
      return NextResponse.json({ error: "Missing product slug." }, { status: 400 });
    }

    const product = await getProductBySlug(body.slug);

    if (!product) {
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }

    if (!product.stripePriceId) {
      return NextResponse.json(
        {
          error:
            "This product is missing a Stripe price ID. Add one in the admin JSON before selling it.",
        },
        { status: 400 },
      );
    }

    const stripe = getStripe();
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      success_url: `${siteUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/cancel`,
      line_items: [
        {
          price: product.stripePriceId,
          quantity: 1,
        },
      ],
      allow_promotion_codes: true,
      billing_address_collection: "auto",
      metadata: {
        productSlug: product.slug,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to create checkout session.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

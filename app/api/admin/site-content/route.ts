import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/auth";
import { getSiteContent, updateSiteContent } from "@/lib/store";
import type { VariantPricing } from "@/lib/types";

export async function PUT(request: Request) {
  const user = await getAdminUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = (await request.json()) as { variantPricing?: VariantPricing[] };
    const siteContent = await getSiteContent();
    const updated = await updateSiteContent({
      ...siteContent,
      variantPricing: body.variantPricing ?? siteContent.variantPricing,
    });

    return NextResponse.json(updated);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to update site content.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}

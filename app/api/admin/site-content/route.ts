import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/auth";
import { getSiteContent, updateSiteContent } from "@/lib/store";
import type { SiteContent } from "@/lib/types";

export async function PUT(request: Request) {
  const user = await getAdminUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = (await request.json()) as Partial<SiteContent>;
    const siteContent = await getSiteContent();
    const updated = await updateSiteContent({
      ...siteContent,
      ...body,
      homepage: {
        ...siteContent.homepage,
        ...(body.homepage ?? {}),
        shop: {
          ...siteContent.homepage.shop,
          ...(body.homepage?.shop ?? {}),
        },
        howItWorks: {
          ...siteContent.homepage.howItWorks,
          ...(body.homepage?.howItWorks ?? {}),
        },
        newsletter: {
          ...siteContent.homepage.newsletter,
          ...(body.homepage?.newsletter ?? {}),
        },
      },
      productPage: {
        ...siteContent.productPage,
        ...(body.productPage ?? {}),
      },
      contactPage: {
        ...siteContent.contactPage,
        ...(body.contactPage ?? {}),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to update site content.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}

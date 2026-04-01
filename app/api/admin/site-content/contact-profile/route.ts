import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/auth";
import { PRODUCT_IMAGE_BUCKET, createStoragePath } from "@/lib/product-assets";
import { getSiteContent, updateSiteContent } from "@/lib/store";
import { hasSupabaseDatabaseEnv } from "@/lib/supabase/env";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";

const contactProfileSlug = "contact-profile";

export async function POST(request: Request) {
  const user = await getAdminUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (!hasSupabaseDatabaseEnv()) {
    return NextResponse.json(
      { error: "Supabase storage is not configured for this environment." },
      { status: 400 },
    );
  }

  try {
    const siteContent = await getSiteContent();
    const formData = await request.formData();
    const file = formData.get("file");
    const alt = String(formData.get("alt") ?? "").trim();

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "File is required." }, { status: 400 });
    }

    const path = createStoragePath(contactProfileSlug, file.name);
    const supabase = createSupabaseServiceRoleClient();
    const arrayBuffer = await file.arrayBuffer();
    const upload = await supabase.storage.from(PRODUCT_IMAGE_BUCKET).upload(path, arrayBuffer, {
      contentType: file.type || undefined,
      upsert: false,
    });

    if (upload.error) {
      throw new Error(upload.error.message);
    }

    const updated = await updateSiteContent({
      ...siteContent,
      contactPage: {
        ...siteContent.contactPage,
        profileImagePath: path,
        profileImageAlt: alt || siteContent.contactPage.profileImageAlt,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to upload profile image.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  const user = await getAdminUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (!hasSupabaseDatabaseEnv()) {
    return NextResponse.json(
      { error: "Supabase storage is not configured for this environment." },
      { status: 400 },
    );
  }

  try {
    const body = (await request.json()) as { path?: string };
    const siteContent = await getSiteContent();

    if (!body.path) {
      return NextResponse.json({ error: "Image path is required." }, { status: 400 });
    }

    const supabase = createSupabaseServiceRoleClient();
    const removal = await supabase.storage.from(PRODUCT_IMAGE_BUCKET).remove([body.path]);

    if (removal.error) {
      throw new Error(removal.error.message);
    }

    const updated = await updateSiteContent({
      ...siteContent,
      contactPage: {
        ...siteContent.contactPage,
        profileImagePath: "",
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to remove profile image.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}

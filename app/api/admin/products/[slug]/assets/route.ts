import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/auth";
import {
  PRODUCT_DOWNLOAD_BUCKET,
  PRODUCT_IMAGE_BUCKET,
  createStoragePath,
} from "@/lib/product-assets";
import { hasSupabaseDatabaseEnv } from "@/lib/supabase/env";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import {
  getProductBySlug,
  updateProductImages,
  updateProductVariantDownloads,
} from "@/lib/store";
import type { ProductDownload, ProductImage } from "@/lib/types";

type ProductAssetRouteProps = {
  params: Promise<{
    slug: string;
  }>;
};

function getBucket(type: string) {
  return type === "download" ? PRODUCT_DOWNLOAD_BUCKET : PRODUCT_IMAGE_BUCKET;
}

export async function POST(request: Request, { params }: ProductAssetRouteProps) {
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
    const { slug } = await params;
    const product = await getProductBySlug(slug);

    if (!product) {
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const type = String(formData.get("type") ?? "");
    const label = String(formData.get("label") ?? "");
    const alt = String(formData.get("alt") ?? "");
    const variantId = String(formData.get("variantId") ?? "").trim();

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "File is required." }, { status: 400 });
    }

    if (type !== "image" && type !== "download") {
      return NextResponse.json({ error: "Invalid asset type." }, { status: 400 });
    }

    const bucket = getBucket(type);
    const path = createStoragePath(slug, file.name);
    const supabase = createSupabaseServiceRoleClient();
    const arrayBuffer = await file.arrayBuffer();
    const { error } = await supabase.storage
      .from(bucket)
      .upload(path, arrayBuffer, {
        contentType: file.type || undefined,
        upsert: false,
      });

    if (error) {
      throw new Error(error.message);
    }

    if (type === "image") {
      const nextImages: ProductImage[] = [
        ...product.images,
        {
          path,
          alt: alt.trim() || product.name,
        },
      ];
      const updatedProduct = await updateProductImages(slug, nextImages);
      return NextResponse.json(updatedProduct);
    }

    if (!variantId) {
      return NextResponse.json(
        { error: "Variant ID is required for download uploads." },
        { status: 400 },
      );
    }

    const variant = product.variants.find((entry) => entry.id === variantId);

    if (!variant) {
      return NextResponse.json({ error: "Variant not found." }, { status: 404 });
    }

    const nextDownloads: ProductDownload[] = [
      ...variant.downloads,
      {
        path,
        label: label.trim() || file.name,
      },
    ];
    const updatedProduct = await updateProductVariantDownloads(slug, variantId, nextDownloads);
    return NextResponse.json(updatedProduct);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to upload asset.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request: Request, { params }: ProductAssetRouteProps) {
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
    const { slug } = await params;
    const product = await getProductBySlug(slug);

    if (!product) {
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }

    const body = (await request.json()) as {
      type?: "image" | "download";
      path?: string;
      variantId?: string;
    };

    if (!body.path || (body.type !== "image" && body.type !== "download")) {
      return NextResponse.json({ error: "Asset type and path are required." }, { status: 400 });
    }

    const supabase = createSupabaseServiceRoleClient();
    const bucket = getBucket(body.type);
    const { error } = await supabase.storage.from(bucket).remove([body.path]);

    if (error) {
      throw new Error(error.message);
    }

    if (body.type === "image") {
      const updatedProduct = await updateProductImages(
        slug,
        product.images.filter((image) => image.path !== body.path),
      );
      return NextResponse.json(updatedProduct);
    }

    if (!body.variantId) {
      return NextResponse.json(
        { error: "Variant ID is required for download removal." },
        { status: 400 },
      );
    }

    const variant = product.variants.find((entry) => entry.id === body.variantId);

    if (!variant) {
      return NextResponse.json({ error: "Variant not found." }, { status: 404 });
    }

    const updatedProduct = await updateProductVariantDownloads(
      slug,
      body.variantId,
      variant.downloads.filter((download) => download.path !== body.path),
    );
    return NextResponse.json(updatedProduct);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to delete asset.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
